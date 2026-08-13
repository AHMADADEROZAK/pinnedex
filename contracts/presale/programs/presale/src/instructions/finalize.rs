use crate::error::PresaleError;
use crate::*;

#[derive(Accounts)]
pub struct FinalizePresale<'info> {
    #[account(
        address = config.authority @ PresaleError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED, config.authority.as_ref(), config.token_mint.as_ref()],
        bump = config.bump
    )]
    pub config: Account<'info, PresaleConfig>,
}

pub fn handle_finalize_presale(ctx: Context<FinalizePresale>) -> Result<()> {
    ctx.accounts.config.is_finalized = true;
    Ok(())
}
