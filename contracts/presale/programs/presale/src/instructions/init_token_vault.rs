use crate::error::PresaleError;
use crate::*;
use anchor_spl::token::{self, Token};

#[derive(Accounts)]
pub struct InitTokenVault<'info> {
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

    /// CHECK: SPL token account, created + initialized via CPI in handler
    #[account(
        mut,
        seeds = [TOKEN_VAULT_SEED, config.key().as_ref()],
        bump
    )]
    pub token_vault: UncheckedAccount<'info>,

    /// CHECK: PDA authority for token_vault
    #[account(
        seeds = [VAULT_AUTHORITY_SEED, config.key().as_ref()],
        bump
    )]
    pub vault_authority: UncheckedAccount<'info>,

    /// CHECK: validated via CPI
    pub token_mint: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle_init_token_vault(ctx: Context<InitTokenVault>) -> Result<()> {
    let config_key = ctx.accounts.config.key();
    let token_vault_bump = ctx.bumps.token_vault;

    let rent = Rent::get()?;
    let space = anchor_spl::token::TokenAccount::LEN as u64;
    let lamports_needed = rent.minimum_balance(space as usize);

    let seeds: &[&[u8]] = &[TOKEN_VAULT_SEED, config_key.as_ref(), &[token_vault_bump]];
    let signer_seeds = &[seeds];

    anchor_lang::system_program::create_account(
        CpiContext::new_with_signer(
            ctx.accounts.system_program.key(),
            anchor_lang::system_program::CreateAccount {
                from: ctx.accounts.authority.to_account_info(),
                to: ctx.accounts.token_vault.to_account_info(),
            },
            signer_seeds,
        ),
        lamports_needed,
        space,
        &anchor_spl::token::ID,
    )?;

    let cpi_accounts = token::InitializeAccount3 {
        account: ctx.accounts.token_vault.to_account_info(),
        mint: ctx.accounts.token_mint.to_account_info(),
        authority: ctx.accounts.vault_authority.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.key(), cpi_accounts);
    token::initialize_account3(cpi_ctx)?;

    Ok(())
}
