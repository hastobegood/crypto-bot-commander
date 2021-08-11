export interface Account {
  canTrade: boolean;
  accountType: string;
  balances: AccountBalance[];
  permissions: string[];
}

export interface AccountBalance {
  asset: string;
  availableQuantity: number;
  lockedQuantity: number;
}
