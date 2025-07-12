export function getUrlParameter(name: string): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

export function getBetAmount(): number | null {
  const betAmount = getUrlParameter('bet');
  if (betAmount) {
    const parsed = parseFloat(betAmount);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function getRoomId(): string | null {
  return getUrlParameter('room');
} 