import { AccountRepository } from '../../domain/account/account-repository';
import { Account } from '../../domain/account/model/account';
import { BinanceClient } from '../binance/binance-client';

export class HttpAccountRepository implements AccountRepository {
  constructor(private binanceClient: BinanceClient) {}

  async getAccount(): Promise<Account> {
    const binanceAccount = await this.binanceClient.getAccount();

    return {
      canTrade: binanceAccount.canTrade,
      accountType: binanceAccount.accountType,
      balances: binanceAccount.balances
        .filter((binanceBalance) => +binanceBalance.free > 0 || +binanceBalance.locked > 0)
        .map((binanceBalance) => {
          return {
            asset: binanceBalance.asset,
            availableQuantity: +binanceBalance.free,
            lockedQuantity: +binanceBalance.locked,
          };
        }),
      permissions: binanceAccount.permissions,
    };
  }
}
