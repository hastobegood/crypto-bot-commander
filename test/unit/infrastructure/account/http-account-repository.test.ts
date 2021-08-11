import { mocked } from 'ts-jest/utils';
import { BinanceClient } from '../../../../src/code/infrastructure/binance/binance-client';
import { HttpAccountRepository } from '../../../../src/code/infrastructure/account/http-account-repository';
import { BinanceAccount, BinanceAccountBalance } from '../../../../src/code/infrastructure/binance/model/binance-account';
import { buildBinanceAccount, buildBinanceBalance } from '../../../builders/infrastructure/binance/binance-account-test-builder';
import { AccountBalance } from '../../../../src/code/domain/account/model/account';

const binanceClientMock = mocked(jest.genMockFromModule<BinanceClient>('../../../../src/code/infrastructure/binance/binance-client'), true);

let accountRepository: HttpAccountRepository;
beforeEach(() => {
  accountRepository = new HttpAccountRepository(binanceClientMock);
});

describe('HttpAccountRepository', () => {
  describe('Given a Binance account to retrieve', () => {
    let binanceBalance1: BinanceAccountBalance;
    let binanceBalance2: BinanceAccountBalance;
    let binanceBalance3: BinanceAccountBalance;
    let binanceBalance4: BinanceAccountBalance;
    let binanceBalance5: BinanceAccountBalance;
    let binanceAccount: BinanceAccount;

    beforeEach(() => {
      binanceBalance1 = buildBinanceBalance('0', '0');
      binanceBalance2 = buildBinanceBalance('1', '0');
      binanceBalance3 = buildBinanceBalance('0', '1');
      binanceBalance4 = buildBinanceBalance('-1', '0');
      binanceBalance5 = buildBinanceBalance('0', '-1');
      binanceAccount = buildBinanceAccount([binanceBalance1, binanceBalance2, binanceBalance3, binanceBalance4, binanceBalance5]);
    });

    describe('When account retrieval has succeeded', () => {
      beforeEach(() => {
        binanceClientMock.getAccount = jest.fn().mockReturnValue(binanceAccount);
      });

      afterEach(() => {
        expect(binanceClientMock.getAccount).toHaveBeenCalledTimes(1);
      });

      it('Then account is returned with positive balances only', async () => {
        const result = await accountRepository.getAccount();
        expect(result).toBeDefined();
        expect(result.canTrade).toEqual(binanceAccount.canTrade);
        expect(result.accountType).toEqual(binanceAccount.accountType);
        expect(result.permissions).toEqual(binanceAccount.permissions);
        expect(result.balances.length).toEqual(2);

        let balance = getBalanceByAsset(result.balances, binanceBalance2.asset);
        expect(balance).toBeDefined();
        expect(balance!.availableQuantity).toEqual(+binanceBalance2.free);
        expect(balance!.lockedQuantity).toEqual(+binanceBalance2.locked);

        balance = getBalanceByAsset(result.balances, binanceBalance3.asset);
        expect(balance).toBeDefined();
        expect(balance!.availableQuantity).toEqual(+binanceBalance3.free);
        expect(balance!.lockedQuantity).toEqual(+binanceBalance3.locked);
      });
    });
  });
});

const getBalanceByAsset = (balances: AccountBalance[], asset: string): AccountBalance | undefined => {
  return balances.find((balance) => balance.asset === asset);
};
