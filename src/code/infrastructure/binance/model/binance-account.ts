export interface BinanceAccount {
  canTrade: boolean;
  accountType: string;
  balances: BinanceAccountBalance[];
  permissions: string[];
}

export interface BinanceAccountBalance {
  asset: string;
  free: string;
  locked: string;
}
