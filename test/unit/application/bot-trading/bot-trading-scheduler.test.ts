import { mocked } from 'ts-jest/utils';
import { AccountService } from '../../../../src/code/domain/account/account-service';
import { BotTradingService } from '../../../../src/code/domain/bot-trading/bot-trading-service';
import { buildDefaultBotTradingConfig } from '../../../builders/domain/bot-trading/bot-trading-test-builder';
import { BotTradingScheduler } from '../../../../src/code/application/bot-trading/bot-trading-scheduler';
import { buildAccountBalance, buildDefaultAccount } from '../../../builders/domain/account/account-test-builder';
import { Account } from '../../../../src/code/domain/account/model/account';

const botTradingConfig = buildDefaultBotTradingConfig();
const accountServiceMock = mocked(jest.genMockFromModule<AccountService>('../../../../src/code/domain/account/account-service'), true);
const botTradingServiceMock = mocked(jest.genMockFromModule<BotTradingService>('../../../../src/code/domain/bot-trading/bot-trading-service'), true);

let botTradingScheduler: BotTradingScheduler;
beforeEach(() => {
  accountServiceMock.getAccount = jest.fn();
  botTradingServiceMock.trade = jest.fn();
  botTradingScheduler = new BotTradingScheduler(accountServiceMock, botTradingServiceMock, botTradingConfig);
});

describe('BotTradingScheduler', () => {
  describe('Given a BOT trading config to trade', () => {
    let account: Account;

    beforeEach(() => {
      accountServiceMock.getAccount = jest.fn();
    });

    afterEach(() => {
      expect(accountServiceMock.getAccount).toHaveBeenCalledTimes(1);
    });

    describe('When account balance is absent', () => {
      beforeEach(() => {
        account = { ...buildDefaultAccount(), balances: [] };
        accountServiceMock.getAccount.mockResolvedValue(account);
      });

      it('Then BOT trading is not processed', async () => {
        await botTradingScheduler.trade();

        expect(botTradingServiceMock.trade).toHaveBeenCalledTimes(0);
      });
    });

    describe('When account balance is too small', () => {
      beforeEach(() => {
        account = { ...buildDefaultAccount(), balances: [buildAccountBalance(botTradingConfig.quoteAsset, botTradingConfig.quoteAssetQuantity - 0.000001, 0)] };
        accountServiceMock.getAccount.mockResolvedValue(account);
      });

      it('Then BOT trading is not processed', async () => {
        await botTradingScheduler.trade();

        expect(botTradingServiceMock.trade).toHaveBeenCalledTimes(0);
      });
    });

    describe('When account balance is enough', () => {
      beforeEach(() => {
        account = { ...buildDefaultAccount(), balances: [buildAccountBalance(botTradingConfig.quoteAsset, botTradingConfig.quoteAssetQuantity, 0)] };
        accountServiceMock.getAccount.mockResolvedValue(account);
      });

      describe('And BOT trading has failed', () => {
        beforeEach(() => {
          botTradingServiceMock.trade.mockRejectedValue(new Error('Error occurred !'));
        });

        it('Then error is thrown', async () => {
          try {
            await botTradingScheduler.trade();
            fail('An error should have been thrown');
          } catch (error) {
            expect(error).toBeDefined();
            expect(error.message).toEqual('Error occurred !');
          }

          expect(botTradingServiceMock.trade).toHaveBeenCalledTimes(1);
          const tradeParams = botTradingServiceMock.trade.mock.calls[0][0];
          expect(tradeParams).toBeDefined();
          expect(tradeParams).toEqual(botTradingConfig);
        });
      });

      describe('And BOT trading has succeeded', () => {
        it('Then nothing is returned', async () => {
          await botTradingScheduler.trade();

          expect(botTradingServiceMock.trade).toHaveBeenCalledTimes(1);
          const tradeParams = botTradingServiceMock.trade.mock.calls[0][0];
          expect(tradeParams).toBeDefined();
          expect(tradeParams).toEqual(botTradingConfig);
        });
      });
    });
  });
});
