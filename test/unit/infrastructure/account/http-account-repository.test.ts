import { mocked } from 'ts-jest/utils';
import { BinanceClient } from '../../../../src/code/infrastructure/binance/binance-client';
import { HttpAccountRepository } from '../../../../src/code/infrastructure/account/http-account-repository';
import { BinanceAccount, BinanceAccountBalance } from '../../../../src/code/infrastructure/binance/model/binance-account';
import { buildBinanceAccount, buildBinanceBalance } from '../../../builders/infrastructure/binance/binance-account-test-builder';
import { AccountRepository } from '../../../../src/code/domain/account/account-repository';

const binanceClientMock = mocked(jest.genMockFromModule<BinanceClient>('../../../../src/code/infrastructure/binance/binance-client'), true);

let accountRepository: AccountRepository;
beforeEach(() => {
  binanceClientMock.getAccount = jest.fn();

  accountRepository = new HttpAccountRepository(binanceClientMock);
});

describe('HttpAccountRepository', () => {
  describe('Given an account to retrieve', () => {
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

    describe('When Binance account is found', () => {
      beforeEach(() => {
        binanceClientMock.getAccount.mockResolvedValue(binanceAccount);
      });

      it('Then account is returned with positive balances only', async () => {
        const result = await accountRepository.get();
        expect(result).toEqual({
          canTrade: binanceAccount.canTrade,
          accountType: binanceAccount.accountType,
          balances: [
            {
              asset: binanceBalance2.asset,
              availableQuantity: +binanceBalance2.free,
              lockedQuantity: +binanceBalance2.locked,
            },
            {
              asset: binanceBalance3.asset,
              availableQuantity: +binanceBalance3.free,
              lockedQuantity: +binanceBalance3.locked,
            },
          ],
          permissions: binanceAccount.permissions,
        });

        expect(binanceClientMock.getAccount).toHaveBeenCalledTimes(1);
        const getAccountParams = binanceClientMock.getAccount.mock.calls[0];
        expect(getAccountParams.length).toEqual(0);
      });
    });
  });
});
