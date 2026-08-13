use crate::error::PresaleError;
use crate::*;
use anchor_spl::token::{Token};

#[derive(Accounts)]
pub struct DepositTokens<'info> {
    #[account(
        mut,
        address = config.authority @ PresaleError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED, config.authority.as_ref(), config.token_mint.as_ref()],
        bump = config.bump
    )]
    pub config: Account<'info, PresaleConfig>,

    /// CHECK: validated via CPI
    #[account(
        mut,
        seeds = [TOKEN_VAULT_SEED, config.key().as_ref()],
        bump
    )]
    pub token_vault: UncheckedAccount<'info>,

    /// CHECK: validated via CPI
    #[account(mut)]
    pub authority_token_account: UncheckedAccount<'info>,

    /// CHECK: validated via CPI
    pub token_mint: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}

pub fn handle_deposit_tokens(ctx: Context<DepositTokens>, amount: u64) -> Result<()> {
    require!(amount > 0, PresaleError::InvalidAmount);

    let cpi_accounts = anchor_spl::token::Transfer {
        from: ctx.accounts.authority_token_account.to_account_info(),
        to: ctx.accounts.token_vault.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.key(), cpi_accounts);
    anchor_spl::token::transfer(cpi_ctx, amount)?;

    Ok(())
}
