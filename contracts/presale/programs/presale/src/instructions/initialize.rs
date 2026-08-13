use crate::error::PresaleError;
use crate::*;
use anchor_spl::token::{self, Token};

#[derive(Accounts)]
pub struct InitializePresale<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + PresaleConfig::INIT_SPACE,
        seeds = [CONFIG_SEED, authority.key().as_ref(), token_mint.key().as_ref()],
        bump
    )]
    pub config: Account<'info, PresaleConfig>,

    /// CHECK: verified via CPI
    pub token_mint: UncheckedAccount<'info>,

    /// CHECK: SPL token account initialized manually via CPI in handler
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

    /// CHECK: PDA for SOL collection
    #[account(
        seeds = [SOL_VAULT_SEED, config.key().as_ref()],
        bump
    )]
    pub sol_vault: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handle_initialize_presale(
    ctx: Context<InitializePresale>,
    price_per_token: u64,
    sale_start: i64,
    sale_end: i64,
    cliff_duration: i64,
    vesting_duration: i64,
    hard_cap_tokens: u64,
) -> Result<()> {
    require!(sale_start < sale_end, PresaleError::InvalidTimeRange);
    require!(vesting_duration > 0, PresaleError::InvalidVestingParams);
    require!(cliff_duration >= 0, PresaleError::InvalidVestingParams);

    let config = &mut ctx.accounts.config;
    config.authority = ctx.accounts.authority.key();
    config.token_mint = ctx.accounts.token_mint.key();
    config.price_per_token = price_per_token;
    config.sale_start = sale_start;
    config.sale_end = sale_end;
    config.cliff_duration = cliff_duration;
    config.vesting_duration = vesting_duration;
    config.hard_cap_tokens = hard_cap_tokens;
    config.tokens_sold = 0;
    config.is_finalized = false;
    config.bump = ctx.bumps.config;

    // Initialize token_vault as SPL Token Account via CPI
    let config_key = ctx.accounts.config.key();
    let vault_bump = ctx.bumps.vault_authority;
    let token_vault_bump = ctx.bumps.token_vault;

    // Create the account with rent-exempt balance
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

    // Initialize the token account
    let cpi_accounts = token::InitializeAccount3 {
        account: ctx.accounts.token_vault.to_account_info(),
        mint: ctx.accounts.token_mint.to_account_info(),
        authority: ctx.accounts.vault_authority.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.key(), cpi_accounts);
    token::initialize_account3(cpi_ctx)?;

    Ok(())
}
