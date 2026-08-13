use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PresaleConfig {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct VestingSchedule {
    pub start_ts: i64,
    pub cliff_ts: i64,
    pub end_ts: i64,
    pub total_amount: u64,
}

#[account]
#[derive(InitSpace)]
pub struct VestingAccount {
    pub beneficiary: Pubkey,
    pub schedule: VestingSchedule,
    pub claimed_amount: u64,
    pub bump: u8,
}
