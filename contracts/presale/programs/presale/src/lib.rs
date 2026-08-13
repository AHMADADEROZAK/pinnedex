use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("6t8hLg3DvTYzXkm3gfNhMfgqh2x1akjjM2zwv8SMprA3");

#[program]
pub mod presale {
    use super::*;

    pub fn initialize_presale(
        ctx: Context<InitializePresale>,
        price_per_token: u64,
        sale_start: i64,
        sale_end: i64,
        cliff_duration: i64,
        vesting_duration: i64,
        hard_cap_tokens: u64,
    ) -> Result<()> {
        instructions::initialize::handle_initialize_presale(
            ctx,
            price_per_token,
            sale_start,
            sale_end,
            cliff_duration,
            vesting_duration,
            hard_cap_tokens,
        )
    }

    pub fn deposit_tokens(ctx: Context<DepositTokens>, amount: u64) -> Result<()> {
        instructions::deposit_tokens::handle_deposit_tokens(ctx, amount)
    }

    pub fn buy_tokens(ctx: Context<BuyTokens>, sol_amount: u64) -> Result<()> {
        instructions::buy::handle_buy_tokens(ctx, sol_amount)
    }

    pub fn claim_tokens(ctx: Context<ClaimTokens>) -> Result<()> {
        instructions::claim::handle_claim_tokens(ctx)
    }

    pub fn withdraw_sol(ctx: Context<WithdrawSol>, amount: u64) -> Result<()> {
        instructions::withdraw::handle_withdraw_sol(ctx, amount)
    }

    pub fn finalize_presale(ctx: Context<FinalizePresale>) -> Result<()> {
        instructions::finalize::handle_finalize_presale(ctx)
    }

    pub fn init_token_vault(ctx: Context<InitTokenVault>) -> Result<()> {
        instructions::init_token_vault::handle_init_token_vault(ctx)
    }
}
