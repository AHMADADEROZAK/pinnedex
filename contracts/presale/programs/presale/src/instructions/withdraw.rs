use crate::error::PresaleError;
use crate::*;

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(
        mut,
        address = config.authority @ PresaleError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED, config.authority.as_ref(), config.token_mint.as_ref()],
        bump = config.bump
    )]
    pub config: Account<'info, PresaleConfig>,

    /// CHECK: PDA for SOL collection
    #[account(
        mut,
        seeds = [SOL_VAULT_SEED, config.key().as_ref()],
        bump
    )]
    pub sol_vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_withdraw_sol(ctx: Context<WithdrawSol>, amount: u64) -> Result<()> {
    let config_key = ctx.accounts.config.key();
    let bump = ctx.bumps.sol_vault;
    let seeds: &[&[u8]] = &[SOL_VAULT_SEED, config_key.as_ref(), &[bump]];
    let signer_seeds = &[seeds];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.system_program.key(),
        anchor_lang::system_program::Transfer {
            from: ctx.accounts.sol_vault.to_account_info(),
            to: ctx.accounts.authority.to_account_info(),
        },
        signer_seeds,
    );
    anchor_lang::system_program::transfer(cpi_ctx, amount)?;

    Ok(())
}
