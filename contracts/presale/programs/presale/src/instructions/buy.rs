use crate::error::PresaleError;
use crate::*;

#[derive(Accounts)]
pub struct BuyTokens<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED, config.authority.as_ref(), config.token_mint.as_ref()],
        bump = config.bump
    )]
    pub config: Account<'info, PresaleConfig>,

    #[account(
        init_if_needed,
        payer = buyer,
        space = 8 + VestingAccount::INIT_SPACE,
        seeds = [VESTING_SEED, config.key().as_ref(), buyer.key().as_ref()],
        bump
    )]
    pub vesting_account: Account<'info, VestingAccount>,

    /// CHECK: PDA for SOL collection
    #[account(
        mut,
        seeds = [SOL_VAULT_SEED, config.key().as_ref()],
        bump
    )]
    pub sol_vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_buy_tokens(ctx: Context<BuyTokens>, sol_amount: u64) -> Result<()> {
    require!(sol_amount > 0, PresaleError::InvalidAmount);

    let now = Clock::get()?.unix_timestamp;
    let config = &mut ctx.accounts.config;

    require!(!config.is_finalized, PresaleError::PresaleFinalized);
    require!(now >= config.sale_start, PresaleError::SaleNotStarted);
    require!(now <= config.sale_end, PresaleError::SaleEnded);

    let token_amount = sol_amount
        .checked_div(config.price_per_token)
        .ok_or(PresaleError::MathOverflow)?;
    require!(token_amount > 0, PresaleError::InvalidAmount);

    let new_total_sold = config
        .tokens_sold
        .checked_add(token_amount)
        .ok_or(PresaleError::MathOverflow)?;
    require!(
        new_total_sold <= config.hard_cap_tokens,
        PresaleError::HardCapExceeded
    );

    let cpi_ctx = CpiContext::new(
        ctx.accounts.system_program.key(),
        anchor_lang::system_program::Transfer {
            from: ctx.accounts.buyer.to_account_info(),
            to: ctx.accounts.sol_vault.to_account_info(),
        },
    );
    anchor_lang::system_program::transfer(cpi_ctx, sol_amount)?;

    config.tokens_sold = new_total_sold;

    let vesting = &mut ctx.accounts.vesting_account;

    if vesting.beneficiary == Pubkey::default() {
        let cliff_ts = now
            .checked_add(config.cliff_duration)
            .ok_or(PresaleError::MathOverflow)?;
        let end_ts = cliff_ts
            .checked_add(config.vesting_duration)
            .ok_or(PresaleError::MathOverflow)?;

        vesting.beneficiary = ctx.accounts.buyer.key();
        vesting.schedule = VestingSchedule {
            start_ts: now,
            cliff_ts,
            end_ts,
            total_amount: token_amount,
        };
        vesting.claimed_amount = 0;
        vesting.bump = ctx.bumps.vesting_account;
    } else {
        vesting.schedule.total_amount = vesting
            .schedule
            .total_amount
            .checked_add(token_amount)
            .ok_or(PresaleError::MathOverflow)?;
    }

    emit!(BuyEvent {
        buyer: ctx.accounts.buyer.key(),
        sol_amount,
        token_amount,
        timestamp: now,
    });

    Ok(())
}

#[event]
pub struct BuyEvent {
    pub buyer: Pubkey,
    pub sol_amount: u64,
    pub token_amount: u64,
    pub timestamp: i64,
}
