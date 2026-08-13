use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("PresaLE11111111111111111111111111111111111");

#[program]
pub mod simple_presale {
    use super::*;

    /// Admin membuat konfigurasi presale.
    /// price_per_token = harga dalam lamports untuk 1 base-unit token.
    pub fn initialize_presale(
        ctx: Context<InitializePresale>,
        price_per_token: u64,
        sale_start: i64,
        sale_end: i64,
        cliff_duration: i64,   // detik dari saat user beli sampai cliff
        vesting_duration: i64, // detik dari cliff sampai fully vested
        hard_cap_tokens: u64,
    ) -> Result<()> {
        require!(sale_start < sale_end, PresaleError::InvalidTimeRange);
        require!(vesting_duration > 0, PresaleError::InvalidVestingParams);
        require!(cliff_duration >= 0, PresaleError::InvalidVestingParams);

        let presale = &mut ctx.accounts.presale;
        presale.authority = ctx.accounts.authority.key();
        presale.token_mint = ctx.accounts.token_mint.key();
        presale.token_vault = ctx.accounts.token_vault.key();
        presale.sol_vault = ctx.accounts.sol_vault.key();
        presale.price_per_token = price_per_token;
        presale.sale_start = sale_start;
        presale.sale_end = sale_end;
        presale.cliff_duration = cliff_duration;
        presale.vesting_duration = vesting_duration;
        presale.hard_cap_tokens = hard_cap_tokens;
        presale.tokens_sold = 0;
        presale.is_finalized = false;
        presale.bump = ctx.bumps.presale;

        Ok(())
    }

    /// User membeli token dengan SOL. Bisa dipanggil berkali-kali;
    /// pembelian berikutnya menambah total_amount pada schedule yang sama.
    pub fn buy_tokens(ctx: Context<BuyTokens>, sol_amount: u64) -> Result<()> {
        require!(sol_amount > 0, PresaleError::InvalidAmount);

        let now = Clock::get()?.unix_timestamp;
        let presale = &mut ctx.accounts.presale;

        require!(!presale.is_finalized, PresaleError::PresaleFinalized);
        require!(now >= presale.sale_start, PresaleError::SaleNotStarted);
        require!(now <= presale.sale_end, PresaleError::SaleEnded);

        let token_amount = sol_amount
            .checked_div(presale.price_per_token)
            .ok_or(PresaleError::MathOverflow)?;
        require!(token_amount > 0, PresaleError::InvalidAmount);

        let new_total_sold = presale
            .tokens_sold
            .checked_add(token_amount)
            .ok_or(PresaleError::MathOverflow)?;
        require!(
            new_total_sold <= presale.hard_cap_tokens,
            PresaleError::HardCapExceeded
        );

        // Transfer SOL dari buyer ke sol_vault (PDA milik System Program)
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.buyer.to_account_info(),
                to: ctx.accounts.sol_vault.to_account_info(),
            },
        );
        system_program::transfer(cpi_ctx, sol_amount)?;

        presale.tokens_sold = new_total_sold;

        let vesting = &mut ctx.accounts.vesting_account;

        if vesting.beneficiary == Pubkey::default() {
            // Pembelian pertama -> inisialisasi schedule
            let cliff_ts = now
                .checked_add(presale.cliff_duration)
                .ok_or(PresaleError::MathOverflow)?;
            let end_ts = cliff_ts
                .checked_add(presale.vesting_duration)
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
            // Pembelian tambahan -> jadwal waktu tetap, hanya total_amount bertambah
            vesting.schedule.total_amount = vesting
                .schedule
                .total_amount
                .checked_add(token_amount)
                .ok_or(PresaleError::MathOverflow)?;
        }

        Ok(())
    }

    /// User klaim token yang sudah vested sesuai schedule.
    pub fn claim_tokens(ctx: Context<ClaimTokens>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let vesting = &mut ctx.accounts.vesting_account;

        let claimable = calculate_claimable(&vesting.schedule, vesting.claimed_amount, now)?;
        require!(claimable > 0, PresaleError::NothingToClaim);

        vesting.claimed_amount = vesting
            .claimed_amount
            .checked_add(claimable)
            .ok_or(PresaleError::MathOverflow)?;

        let presale_key = ctx.accounts.presale.key();
        let bump = ctx.bumps.vault_authority;
        let seeds: &[&[u8]] = &[b"vault_authority", presale_key.as_ref(), &[bump]];
        let signer_seeds = &[seeds];

        let cpi_accounts = Transfer {
            from: ctx.accounts.token_vault.to_account_info(),
            to: ctx.accounts.beneficiary_token_account.to_account_info(),
            authority: ctx.accounts.vault_authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token::transfer(cpi_ctx, claimable)?;

        Ok(())
    }

    /// Admin menarik SOL yang terkumpul dari sol_vault.
    pub fn withdraw_sol(ctx: Context<WithdrawSol>, amount: u64) -> Result<()> {
        let presale_key = ctx.accounts.presale.key();
        let bump = ctx.bumps.sol_vault;
        let seeds: &[&[u8]] = &[b"sol_vault", presale_key.as_ref(), &[bump]];
        let signer_seeds = &[seeds];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.sol_vault.to_account_info(),
                to: ctx.accounts.authority.to_account_info(),
            },
            signer_seeds,
        );
        system_program::transfer(cpi_ctx, amount)?;

        Ok(())
    }

    /// Admin menutup masa presale (tidak bisa buy_tokens lagi).
    pub fn finalize_presale(ctx: Context<FinalizePresale>) -> Result<()> {
        ctx.accounts.presale.is_finalized = true;
        Ok(())
    }
}

/// Hitung jumlah token yang sudah vested pada waktu `now`, dikurangi yang sudah diklaim.
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

// ================= State =================

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VestingSchedule {
    pub start_ts: i64,
    pub cliff_ts: i64,
    pub end_ts: i64,
    pub total_amount: u64,
}

#[account]
pub struct VestingAccount {
    pub beneficiary: Pubkey,
    pub schedule: VestingSchedule,
    pub claimed_amount: u64,
    pub bump: u8,
}

impl VestingAccount {
    // discriminator(8) + beneficiary(32) + schedule(8*3+8=32) + claimed_amount(8) + bump(1)
    pub const LEN: usize = 8 + 32 + 32 + 8 + 1;
}

#[account]
pub struct PresaleConfig {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub token_vault: Pubkey,
    pub sol_vault: Pubkey,
    pub price_per_token: u64,
    pub sale_start: i64,
    pub sale_end: i64,
    pub cliff_duration: i64,
    pub vesting_duration: i64,
    pub hard_cap_tokens: u64,
    pub tokens_sold: u64,
    pub is_finalized: bool,
    pub bump: u8,
}

impl PresaleConfig {
    // discriminator(8) + 4 pubkeys(32*4) + price(8) + sale_start(8) + sale_end(8)
    // + cliff_duration(8) + vesting_duration(8) + hard_cap(8) + tokens_sold(8) + is_finalized(1) + bump(1)
    pub const LEN: usize = 8 + 32 * 4 + 8 * 7 + 1 + 1;
}

// ================= Contexts =================

#[derive(Accounts)]
pub struct InitializePresale<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = PresaleConfig::LEN,
        seeds = [b"presale", authority.key().as_ref(), token_mint.key().as_ref()],
        bump
    )]
    pub presale: Account<'info, PresaleConfig>,

    pub token_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        token::mint = token_mint,
        token::authority = vault_authority,
        seeds = [b"token_vault", presale.key().as_ref()],
        bump
    )]
    pub token_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA otoritas token_vault, tidak menyimpan data
    #[account(
        seeds = [b"vault_authority", presale.key().as_ref()],
        bump
    )]
    pub vault_authority: UncheckedAccount<'info>,

    /// CHECK: PDA penampung SOL, dibuat otomatis saat pertama menerima transfer
    #[account(
        seeds = [b"sol_vault", presale.key().as_ref()],
        bump
    )]
    pub sol_vault: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BuyTokens<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"presale", presale.authority.as_ref(), presale.token_mint.as_ref()],
        bump = presale.bump
    )]
    pub presale: Account<'info, PresaleConfig>,

    #[account(
        init_if_needed,
        payer = buyer,
        space = VestingAccount::LEN,
        seeds = [b"vesting", presale.key().as_ref(), buyer.key().as_ref()],
        bump
    )]
    pub vesting_account: Account<'info, VestingAccount>,

    /// CHECK: PDA penampung SOL
    #[account(
        mut,
        seeds = [b"sol_vault", presale.key().as_ref()],
        bump
    )]
    pub sol_vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimTokens<'info> {
    #[account(mut)]
    pub beneficiary: Signer<'info>,

    #[account(
        seeds = [b"presale", presale.authority.as_ref(), presale.token_mint.as_ref()],
        bump = presale.bump
    )]
    pub presale: Account<'info, PresaleConfig>,

    #[account(
        mut,
        seeds = [b"vesting", presale.key().as_ref(), beneficiary.key().as_ref()],
        bump = vesting_account.bump,
        has_one = beneficiary
    )]
    pub vesting_account: Account<'info, VestingAccount>,

    #[account(
        mut,
        seeds = [b"token_vault", presale.key().as_ref()],
        bump
    )]
    pub token_vault: Account<'info, TokenAccount>,

    /// CHECK: PDA otoritas token_vault, sign lewat seeds saat CPI transfer
    #[account(
        seeds = [b"vault_authority", presale.key().as_ref()],
        bump
    )]
    pub vault_authority: UncheckedAccount<'info>,

    pub token_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = beneficiary,
        associated_token::mint = token_mint,
        associated_token::authority = beneficiary
    )]
    pub beneficiary_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct WithdrawSol<'info> {
    #[account(mut, address = presale.authority @ PresaleError::Unauthorized)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [b"presale", presale.authority.as_ref(), presale.token_mint.as_ref()],
        bump = presale.bump
    )]
    pub presale: Account<'info, PresaleConfig>,

    /// CHECK: PDA penampung SOL
    #[account(
        mut,
        seeds = [b"sol_vault", presale.key().as_ref()],
        bump
    )]
    pub sol_vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizePresale<'info> {
    #[account(address = presale.authority @ PresaleError::Unauthorized)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"presale", presale.authority.as_ref(), presale.token_mint.as_ref()],
        bump = presale.bump
    )]
    pub presale: Account<'info, PresaleConfig>,
}

// ================= Errors =================

#[error_code]
pub enum PresaleError {
    #[msg("Invalid time range for the presale")]
    InvalidTimeRange,
    #[msg("Invalid vesting parameters")]
    InvalidVestingParams,
    #[msg("Sale has not started yet")]
    SaleNotStarted,
    #[msg("Sale has already ended")]
    SaleEnded,
    #[msg("Presale has been finalized")]
    PresaleFinalized,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Hard cap exceeded")]
    HardCapExceeded,
    #[msg("Math overflow")]
    MathOverflow,
    #[msg("Nothing to claim yet")]
    NothingToClaim,
    #[msg("Unauthorized")]
    Unauthorized,
}
