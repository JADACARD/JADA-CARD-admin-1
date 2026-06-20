
export const WALLET = {
  balance: 0,
  dailyClaims: {},
  referrals: 0,
  level: 1
};

export function addBalance(amount) {
  WALLET.balance += amount;
  return WALLET.balance;
}

export function canClaimDaily(cardId) {
  const lastClaim = WALLET.dailyClaims[cardId];
  if (!lastClaim) return true;
  const now = new Date().getTime();
  const day = 24 * 60 * 60 * 1000;
  return now - lastClaim > day;
}

export function claimDaily(cardId, amount) {
  if (canClaimDaily(cardId)) {
    WALLET.dailyClaims[cardId] = new Date().getTime();
    addBalance(amount);
    return true;
  }
  return false;
}
