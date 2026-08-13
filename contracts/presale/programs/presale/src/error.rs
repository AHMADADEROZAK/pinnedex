use anchor_lang::prelude::*;

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
