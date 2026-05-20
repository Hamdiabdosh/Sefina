export const formatEtb = (amount: number): string =>
  `${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ETB`;
