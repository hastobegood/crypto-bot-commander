import { BinanceAccount, BinanceAccountBalance } from '../../../../src/code/infrastructure/binance/model/binance-account';
import { randomNumber, randomString } from '../../random-test-builder';

export const buildDefaultBinanceAccount = (): BinanceAccount => {
  return buildBinanceAccount([buildDefaultBinanceBalance(), buildDefaultBinanceBalance()]);
};

export const buildBinanceAccount = (balances: BinanceAccountBalance[]): BinanceAccount => {
  return {
    canTrade: true,
    accountType: 'SPOT',
    balances: balances,
    permissions: ['SPOT'],
  };
};

export const buildDefaultBinanceBalance = (): BinanceAccountBalance => {
  return buildBinanceBalance(randomNumber(100, 1_000).toString(), randomNumber(0, 10).toString());
};

export const buildBinanceBalance = (free: string, locked: string): BinanceAccountBalance => {
  return {
    asset: randomString(5).toUpperCase(),
    free: free,
    locked: locked,
  };
};
