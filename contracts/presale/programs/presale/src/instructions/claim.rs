use crate::error::PresaleError;
use crate::*;
use anchor_spl::token::{Token};

#[derive(Accounts)]
pub struct ClaimTokens<'info> {
    #[account(mut)]
    pub beneficiary: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED, config.authority.as_ref(), config.token_mint.as_ref()],
        bump = config.bump
    )]
    pub config: Account<'info, PresaleConfig>,

    #[account(
        mut,
        seeds = [VESTING_SEED, config.key().as_ref(), beneficiary.key().as_ref()],
        bump = vesting_account.bump,
        has_one = beneficiary
    )]
    pub vesting_account: Account<'info, VestingAccount>,

    /// CHECK: validated via CPI
    #[account(
        mut,
        seeds = [TOKEN_VAULT_SEED, config.key().as_ref()],
        bump
    )]
    pub token_vault: UncheckedAccount<'info>,

    /// CHECK: PDA authority for token_vault, signs via CPI seeds
    #[account(
        seeds = [VAULT_AUTHORITY_SEED, config.key().as_ref()],
        bump
    )]
    pub vault_authority: UncheckedAccount<'info>,

    /// CHECK: validated via CPI
    pub token_mint: UncheckedAccount<'info>,

    /// CHECK: validated via CPI
    #[account(mut)]
    pub beneficiary_token_account: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle_claim_tokens(ctx: Context<ClaimTokens>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let vesting = &mut ctx.accounts.vesting_account;

    let claimable = calculate_claimable(&vesting.schedule, vesting.claimed_amount, now)?;
    require!(claimable > 0, PresaleError::NothingToClaim);

    vesting.claimed_amount = vesting
        .claimed_amount
        .checked_add(claimable)
        .ok_or(PresaleError::MathOverflow)?;

    let config_key = ctx.accounts.config.key();
    let bump = ctx.bumps.vault_authority;
    let seeds: &[&[u8]] = &[VAULT_AUTHORITY_SEED, config_key.as_ref(), &[bump]];
    let signer_seeds = &[seeds];

    let cpi_accounts = anchor_spl::token::Transfer {
        from: ctx.accounts.token_vault.to_account_info(),
        to: ctx.accounts.beneficiary_token_account.to_account_info(),
        authority: ctx.accounts.vault_authority.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.key(),
        cpi_accounts,
        signer_seeds,
    );
    anchor_spl::token::transfer(cpi_ctx, claimable)?;

    emit!(ClaimEvent {
        beneficiary: ctx.accounts.beneficiary.key(),
        amount: claimable,
        timestamp: now,
    });

    Ok(())
}

fn calculate_claimable(schedule: &VestingSchedule, claimed: u64, now: i64) -> Result<u64> {
    if now < schedule.cliff_ts {
        return Ok(0);
    }
    if now >= schedule.end_ts {
        return Ok(schedule.total_amount.saturating_sub(claimed));
    }

    let elapsed = (now - schedule.start_ts) as u128;
    let duration = (schedule.end_ts - schedule.start_ts) as u128;
    require!(duration > 0, PresaleError::InvalidVestingParams);

    let vested = (schedule.total_amount as u128)
        .checked_mul(elapsed)
        .ok_or(PresaleError::MathOverflow)?
        .checked_div(duration)
        .ok_or(PresaleError::MathOverflow)? as u64;

    Ok(vested.saturating_sub(claimed))
}

#[event]
pub struct ClaimEvent {
    pub beneficiary: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}
