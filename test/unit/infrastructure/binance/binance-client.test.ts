import { axiosInstance } from '../../../../src/code/configuration/http/axios';
import MockDate from 'mockdate';
import { mocked } from 'ts-jest/utils';
import { BinanceClient } from '../../../../src/code/infrastructure/binance/binance-client';
import SecretsManager from 'aws-sdk/clients/secretsmanager';
import { buildDefaultBinanceSecrets } from '../../../builders/infrastructure/binance/binance-secrets-test-builder';
import { BinanceSecrets } from '../../../../src/code/infrastructure/binance/model/binance-secret';
import { BinanceAccount } from '../../../../src/code/infrastructure/binance/model/binance-account';
import { buildDefaultBinanceAccount } from '../../../builders/infrastructure/binance/binance-account-test-builder';
import { BinanceOrder } from '../../../../src/code/infrastructure/binance/model/binance-order';
import { buildDefaultBinanceOrder } from '../../../builders/infrastructure/binance/binance-order-test-builder';
import { BinanceSymbolPrice } from '../../../../src/code/infrastructure/binance/model/binance-price';
import { buildDefaultBinanceSymbolPrice } from '../../../builders/infrastructure/binance/binance-symbol-price-test-builder';

jest.mock('../../../../src/code/configuration/http/axios');

const smClientMock = mocked(jest.genMockFromModule<SecretsManager>('aws-sdk/clients/secretsmanager'));
const axiosInstanceMock = mocked(axiosInstance, true);

let binanceClient: BinanceClient;
beforeEach(() => {
  axiosInstanceMock.get = jest.fn();
  axiosInstanceMock.post = jest.fn();
  binanceClient = new BinanceClient(smClientMock, 'my-secret-name', 'my-url');
});

describe('BinanceClient', () => {
  let binanceSecrets: BinanceSecrets;
  let date: Date;

  beforeEach(() => {
    binanceSecrets = buildDefaultBinanceSecrets();
    smClientMock.getSecretValue = jest.fn().mockReturnValue({
      promise: jest.fn(() =>
        Promise.resolve({
          SecretString: JSON.stringify(binanceSecrets),
        }),
      ),
    });

    date = new Date();
    MockDate.set(date);
  });

  describe('Given a Binance account to retrieve', () => {
    describe('When account retrieval has succeeded', () => {
      let account: BinanceAccount;

      beforeEach(() => {
        account = buildDefaultBinanceAccount();
        axiosInstanceMock.get.mockResolvedValue({
          data: account,
        });
      });

      it('Then secrets are loaded only once', async () => {
        await binanceClient.getAccount();
        await binanceClient.getAccount();
        await binanceClient.getAccount();

        expect(smClientMock.getSecretValue).toHaveBeenCalledTimes(1);
      });

      it('Then account is returned', async () => {
        const result = await binanceClient.getAccount();
        expect(result).toBeDefined();
        expect(result).toEqual(account);

        expect(axiosInstanceMock.get).toHaveBeenCalledTimes(1);
        const axiosGetParams = axiosInstanceMock.get.mock.calls[0];
        expect(axiosGetParams).toBeDefined();
        expect(axiosGetParams[0]).toContain(`/v3/account?timestamp=${date.valueOf()}&signature=`);
      });
    });

    describe('When account retrieval has failed', () => {
      beforeEach(() => {
        axiosInstanceMock.get.mockRejectedValue(new Error('Error'));
      });

      it('Then error is thrown', async () => {
        try {
          await binanceClient.getAccount();
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect(error.message).toEqual('Error');
        }
      });
    });
  });

  describe('Given a Binance symbol current price to retrieve', () => {
    describe('When symbol current price retrieval has succeeded', () => {
      let symbolPrice: BinanceSymbolPrice;

      beforeEach(() => {
        symbolPrice = buildDefaultBinanceSymbolPrice();
        axiosInstanceMock.get.mockResolvedValue({
          data: symbolPrice,
        });
      });

      it('Then secrets are loaded only once', async () => {
        await binanceClient.getSymbolCurrentPrice('A');
        await binanceClient.getSymbolCurrentPrice('B');
        await binanceClient.getSymbolCurrentPrice('C');

        expect(smClientMock.getSecretValue).toHaveBeenCalledTimes(1);
      });

      it('Then symbol current price is returned', async () => {
        const result = await binanceClient.getSymbolCurrentPrice('A');
        expect(result).toBeDefined();
        expect(result).toEqual(symbolPrice);

        expect(axiosInstanceMock.get).toHaveBeenCalledTimes(1);
        const axiosGetParams = axiosInstanceMock.get.mock.calls[0];
        expect(axiosGetParams).toBeDefined();
        expect(axiosGetParams[0]).toEqual('/v3/ticker/price?symbol=A');
      });
    });

    describe('When symbol current price retrieval has failed', () => {
      beforeEach(() => {
        axiosInstanceMock.get.mockRejectedValue(new Error('Error'));
      });

      it('Then error is thrown', async () => {
        try {
          await binanceClient.getSymbolCurrentPrice('A');
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect(error.message).toEqual('Error');
        }
      });
    });
  });

  describe('Given a Binance symbol average price to retrieve', () => {
    describe('When symbol average price retrieval has succeeded', () => {
      let symbolPrice: BinanceSymbolPrice;

      beforeEach(() => {
        symbolPrice = buildDefaultBinanceSymbolPrice();
        axiosInstanceMock.get.mockResolvedValue({
          data: symbolPrice,
        });
      });

      it('Then secrets are loaded only once', async () => {
        await binanceClient.getSymbolCurrentPrice('A');
        await binanceClient.getSymbolCurrentPrice('B');
        await binanceClient.getSymbolCurrentPrice('C');

        expect(smClientMock.getSecretValue).toHaveBeenCalledTimes(1);
      });

      it('Then symbol average price is returned', async () => {
        const result = await binanceClient.getSymbolAveragePrice('A');
        expect(result).toBeDefined();
        expect(result).toEqual(symbolPrice);

        expect(axiosInstanceMock.get).toHaveBeenCalledTimes(1);
        const axiosGetParams = axiosInstanceMock.get.mock.calls[0];
        expect(axiosGetParams).toBeDefined();
        expect(axiosGetParams[0]).toEqual('/v3/avgPrice?symbol=A');
      });
    });

    describe('When symbol average price retrieval has failed', () => {
      beforeEach(() => {
        axiosInstanceMock.get.mockRejectedValue(new Error('Error'));
      });

      it('Then error is thrown', async () => {
        try {
          await binanceClient.getSymbolAveragePrice('A');
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect(error.message).toEqual('Error');
        }
      });
    });
  });

  describe('Given a Binance market order to send', () => {
    let order: BinanceOrder;

    beforeEach(() => {
      order = buildDefaultBinanceOrder();
      axiosInstanceMock.post.mockResolvedValue({
        data: order,
      });
    });

    describe('When order transmission has succeeded', () => {
      it('Then secrets are loaded only once', async () => {
        await binanceClient.sendMarketOrder('SYMBOL1', 'BUY', 1);
        await binanceClient.sendMarketOrder('SYMBOL2', 'BUY', 2);

        expect(smClientMock.getSecretValue).toHaveBeenCalledTimes(1);
      });

      it('Then order is returned', async () => {
        const result = await binanceClient.sendMarketOrder('SYMBOL', 'BUY', 1);
        expect(result).toBeDefined();
        expect(result).toEqual(order);

        expect(axiosInstanceMock.post).toHaveBeenCalledTimes(1);
        const axiosPostParams = axiosInstanceMock.post.mock.calls[0];
        expect(axiosPostParams).toBeDefined();
        expect(axiosPostParams[0]).toContain(`/v3/order?symbol=SYMBOL&side=BUY&type=MARKET&quoteOrderQty=1&newOrderRespType=FULL&timestamp=${date.valueOf()}&signature=`);
        expect(axiosPostParams[1]).toBeNull();
      });
    });

    describe('When order transmission has failed', () => {
      beforeEach(() => {
        axiosInstanceMock.post.mockRejectedValue(new Error('Error'));
      });

      it('Then error is thrown', async () => {
        try {
          await binanceClient.sendMarketOrder('SYMBOL', 'BUY', 1);
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect(error.message).toEqual('Error');
        }
      });
    });
  });

  describe('Given a Binance take profit order to send', () => {
    let order: BinanceOrder;

    beforeEach(() => {
      order = buildDefaultBinanceOrder();
      axiosInstanceMock.post.mockResolvedValue({
        data: order,
      });
    });

    describe('When order transmission has succeeded', () => {
      it('Then secrets are loaded only once', async () => {
        await binanceClient.sendTakeProfitOrder('SYMBOL1', 'BUY', 1, 10);
        await binanceClient.sendTakeProfitOrder('SYMBOL2', 'BUY', 2, 20);

        expect(smClientMock.getSecretValue).toHaveBeenCalledTimes(1);
      });

      it('Then order is returned', async () => {
        const result = await binanceClient.sendTakeProfitOrder('SYMBOL', 'BUY', 1, 10);
        expect(result).toBeDefined();
        expect(result).toEqual(order);

        expect(axiosInstanceMock.post).toHaveBeenCalledTimes(1);
        const axiosPostParams = axiosInstanceMock.post.mock.calls[0];
        expect(axiosPostParams).toBeDefined();
        expect(axiosPostParams[0]).toContain(`/v3/order?symbol=SYMBOL&side=BUY&type=TAKE_PROFIT_LIMIT&quantity=1&stopPrice=10&price=10&timeInForce=GTC&newOrderRespType=FULL&timestamp=${date.valueOf()}&signature=`);
        expect(axiosPostParams[1]).toBeNull();
      });
    });

    describe('When order transmission has failed', () => {
      beforeEach(() => {
        axiosInstanceMock.post.mockRejectedValue(new Error('Error'));
      });

      it('Then error is thrown', async () => {
        try {
          await binanceClient.sendMarketOrder('SYMBOL', 'BUY', 1);
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect(error.message).toEqual('Error');
        }
      });
    });
  });
});
