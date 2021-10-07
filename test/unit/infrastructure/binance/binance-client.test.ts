import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { axiosInstance } from '../../../../src/code/configuration/http/axios';
import MockDate from 'mockdate';
import { mocked } from 'ts-jest/utils';
import { BinanceClient } from '../../../../src/code/infrastructure/binance/binance-client';
import { buildDefaultBinanceSecrets } from '../../../builders/infrastructure/binance/binance-secrets-test-builder';
import { BinanceSecrets } from '../../../../src/code/infrastructure/binance/model/binance-secret';
import { BinanceAccount } from '../../../../src/code/infrastructure/binance/model/binance-account';
import { buildDefaultBinanceAccount } from '../../../builders/infrastructure/binance/binance-account-test-builder';
import { BinanceOrder } from '../../../../src/code/infrastructure/binance/model/binance-order';
import { buildDefaultBinanceOrder } from '../../../builders/infrastructure/binance/binance-order-test-builder';
import { BinanceSymbolCandlestick } from '../../../../src/code/infrastructure/binance/model/binance-candlestick';
import { buildDefaultBinanceSymbolCandlesticks } from '../../../builders/infrastructure/binance/binance-symbol-candlestick-test-builder';
import { BinanceExchange } from '../../../../src/code/infrastructure/binance/model/binance-exchange';
import { buildDefaultBinanceExchange } from '../../../builders/infrastructure/binance/binance-exchange-test-builder';
import { BinanceTrade } from '../../../../src/code/infrastructure/binance/model/binance-trade';
import { buildDefaultBinanceTrades } from '../../../builders/infrastructure/binance/binance-trade-test-builder';

jest.mock('../../../../src/code/configuration/http/axios');

const smClientMock = mocked(jest.genMockFromModule<SecretsManagerClient>('@aws-sdk/client-secrets-manager'), true);
const axiosInstanceMock = mocked(axiosInstance, true);

let binanceClient: BinanceClient;
beforeEach(() => {
  smClientMock.send = jest.fn();
  axiosInstanceMock.get = jest.fn();
  axiosInstanceMock.post = jest.fn();
  binanceClient = new BinanceClient(smClientMock, 'my-secret-name', 'my-url');
});

describe('BinanceClient', () => {
  let binanceSecrets: BinanceSecrets;
  let date: Date;

  beforeEach(() => {
    binanceSecrets = buildDefaultBinanceSecrets();
    smClientMock.send.mockImplementation(() => ({
      SecretString: JSON.stringify(binanceSecrets),
    }));

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

        expect(smClientMock.send).toHaveBeenCalledTimes(1);
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
          fail();
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual('Error');
        }
      });
    });
  });

  describe('Given a Binance exchange to retrieve', () => {
    describe('When exchange retrieval has succeeded', () => {
      let exchange: BinanceExchange;

      beforeEach(() => {
        exchange = buildDefaultBinanceExchange();
        axiosInstanceMock.get.mockResolvedValue({
          data: exchange,
        });
      });

      it('Then secrets are loaded only once', async () => {
        await binanceClient.getExchange('ABC');
        await binanceClient.getExchange('ABC');
        await binanceClient.getExchange('ABC');

        expect(smClientMock.send).toHaveBeenCalledTimes(1);
      });

      it('Then exchange is returned', async () => {
        const result = await binanceClient.getExchange('ABC');
        expect(result).toBeDefined();
        expect(result).toEqual(exchange);

        expect(axiosInstanceMock.get).toHaveBeenCalledTimes(1);
        const axiosGetParams = axiosInstanceMock.get.mock.calls[0];
        expect(axiosGetParams).toBeDefined();
        expect(axiosGetParams[0]).toEqual(`/v3/exchangeInfo?symbol=ABC`);
      });
    });

    describe('When exchange retrieval has failed', () => {
      beforeEach(() => {
        axiosInstanceMock.get.mockRejectedValue(new Error('Error'));
      });

      it('Then error is thrown', async () => {
        try {
          await binanceClient.getExchange('ABC');
          fail();
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual('Error');
        }
      });
    });
  });

  describe('Given a Binance symbol candlesticks to retrieve', () => {
    describe('When symbol candlesticks retrieval has succeeded', () => {
      let symbolCandlesticks: BinanceSymbolCandlestick[];

      beforeEach(() => {
        symbolCandlesticks = buildDefaultBinanceSymbolCandlesticks();
        axiosInstanceMock.get.mockResolvedValue({
          data: symbolCandlesticks.map((symbolCandlestick) => [
            symbolCandlestick.openingDate,
            symbolCandlestick.openingPrice,
            symbolCandlestick.highestPrice,
            symbolCandlestick.lowestPrice,
            symbolCandlestick.closingPrice,
            'baseAssetVolume',
            symbolCandlestick.closingDate,
            'quoteAssetVolume',
            'numberOfTrades',
            'takerBuyBaseAssetVolume',
            'takerBuyQuoteAssetVolume',
            undefined,
          ]),
        });
      });

      it('Then secrets are loaded only once', async () => {
        await binanceClient.getSymbolCandlesticks('A', 123, 456, 'IA', 1);
        await binanceClient.getSymbolCandlesticks('B', 123, 456, 'IB', 2);
        await binanceClient.getSymbolCandlesticks('C', 123, 456, 'IC', 3);

        expect(smClientMock.send).toHaveBeenCalledTimes(1);
      });

      it('Then symbol candlesticks are returned', async () => {
        const result = await binanceClient.getSymbolCandlesticks('A', 123, 456, 'I', 1);
        expect(result).toBeDefined();
        expect(result).toEqual(symbolCandlesticks);

        expect(axiosInstanceMock.get).toHaveBeenCalledTimes(1);
        const axiosGetParams = axiosInstanceMock.get.mock.calls[0];
        expect(axiosGetParams).toBeDefined();
        expect(axiosGetParams[0]).toEqual('/v3/klines?symbol=A&startTime=123&endTime=456&interval=I&limit=1');
      });
    });

    describe('When symbol symbol candlesticks retrieval has failed', () => {
      beforeEach(() => {
        axiosInstanceMock.get.mockRejectedValue(new Error('Error'));
      });

      it('Then error is thrown', async () => {
        try {
          await binanceClient.getSymbolCandlesticks('A', 123, 456, 'I', 1);
          fail();
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual('Error');
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
        await binanceClient.sendMarketOrder('SYMBOL1', 'BUY', 1, 'BASE');
        await binanceClient.sendMarketOrder('SYMBOL2', 'BUY', 2, 'QUOTE');

        expect(smClientMock.send).toHaveBeenCalledTimes(1);
      });

      it('Then order is returned', async () => {
        const result = await binanceClient.sendMarketOrder('SYMBOL', 'BUY', 1, 'QUOTE');
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
          await binanceClient.sendMarketOrder('SYMBOL', 'BUY', 1, 'BASE');
          fail();
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual('Error');
        }
      });
    });
  });

  describe('Given a Binance limit order to send', () => {
    let order: BinanceOrder;

    beforeEach(() => {
      order = buildDefaultBinanceOrder();
      axiosInstanceMock.post.mockResolvedValue({
        data: order,
      });
    });

    describe('When order transmission has succeeded', () => {
      it('Then secrets are loaded only once', async () => {
        await binanceClient.sendLimitOrder('SYMBOL1', 'BUY', 1, 10);
        await binanceClient.sendLimitOrder('SYMBOL2', 'BUY', 2, 20);

        expect(smClientMock.send).toHaveBeenCalledTimes(1);
      });

      it('Then order is returned', async () => {
        const result = await binanceClient.sendLimitOrder('SYMBOL', 'BUY', 1, 10);
        expect(result).toBeDefined();
        expect(result).toEqual(order);

        expect(axiosInstanceMock.post).toHaveBeenCalledTimes(1);
        const axiosPostParams = axiosInstanceMock.post.mock.calls[0];
        expect(axiosPostParams).toBeDefined();
        expect(axiosPostParams[0]).toContain(`/v3/order?symbol=SYMBOL&side=BUY&type=LIMIT&quantity=1&price=10&timeInForce=GTC&newOrderRespType=FULL&timestamp=${date.valueOf()}&signature=`);
        expect(axiosPostParams[1]).toBeNull();
      });
    });

    describe('When order transmission has failed', () => {
      beforeEach(() => {
        axiosInstanceMock.post.mockRejectedValue(new Error('Error'));
      });

      it('Then error is thrown', async () => {
        try {
          await binanceClient.sendLimitOrder('SYMBOL', 'BUY', 1, 10);
          fail();
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual('Error');
        }
      });
    });
  });

  describe('Given a Binance order to query', () => {
    describe('When order query has succeeded', () => {
      let order: BinanceOrder;

      beforeEach(() => {
        order = buildDefaultBinanceOrder();
        axiosInstanceMock.get.mockResolvedValue({
          data: order,
        });
      });

      it('Then secrets are loaded only once', async () => {
        await binanceClient.queryOrder('ABC', '123');
        await binanceClient.queryOrder('ABC', '123');
        await binanceClient.queryOrder('ABC', '123');

        expect(smClientMock.send).toHaveBeenCalledTimes(1);
      });

      it('Then order is returned', async () => {
        const result = await binanceClient.queryOrder('ABC', '123');
        expect(result).toEqual(order);

        expect(axiosInstanceMock.get).toHaveBeenCalledTimes(1);
        const axiosGetParams = axiosInstanceMock.get.mock.calls[0];
        expect(axiosGetParams[0]).toContain(`/v3/order?symbol=ABC&orderId=123&timestamp=${date.valueOf()}&signature=`);
        expect(axiosGetParams[1]).toEqual({
          baseURL: 'my-url',
          headers: {
            'X-MBX-APIKEY': binanceSecrets.apiKey,
          },
        });
      });
    });

    describe('When order query has failed', () => {
      beforeEach(() => {
        axiosInstanceMock.get.mockRejectedValue(new Error('Error'));
      });

      it('Then error is thrown', async () => {
        try {
          await binanceClient.queryOrder('ABC', '123');
          fail();
        } catch (error) {
          expect((error as Error).message).toEqual('Error');
        }

        expect(axiosInstanceMock.get).toHaveBeenCalledTimes(1);
        const axiosGetParams = axiosInstanceMock.get.mock.calls[0];
        expect(axiosGetParams[0]).toContain(`/v3/order?symbol=ABC&orderId=123&timestamp=${date.valueOf()}&signature=`);
        expect(axiosGetParams[1]).toEqual({
          baseURL: 'my-url',
          headers: {
            'X-MBX-APIKEY': binanceSecrets.apiKey,
          },
        });
      });
    });
  });

  describe('Given Binance trades to retrieve', () => {
    describe('When trades are found', () => {
      let trades: BinanceTrade[];

      beforeEach(() => {
        trades = buildDefaultBinanceTrades();
        axiosInstanceMock.get.mockResolvedValue({
          data: trades,
        });
      });

      it('Then secrets are loaded only once', async () => {
        await binanceClient.getTrades('ABC', '123');
        await binanceClient.getTrades('ABC', '123');
        await binanceClient.getTrades('ABC', '123');

        expect(smClientMock.send).toHaveBeenCalledTimes(1);
      });

      it('Then trades are returned', async () => {
        const result = await binanceClient.getTrades('ABC', '123');
        expect(result).toEqual(trades);

        expect(axiosInstanceMock.get).toHaveBeenCalledTimes(1);
        const axiosGetParams = axiosInstanceMock.get.mock.calls[0];
        expect(axiosGetParams[0]).toContain(`/v3/myTrades?symbol=ABC&orderId=123&timestamp=${date.valueOf()}&signature=`);
        expect(axiosGetParams[1]).toEqual({
          baseURL: 'my-url',
          headers: {
            'X-MBX-APIKEY': binanceSecrets.apiKey,
          },
        });
      });
    });

    describe('When trades are not found', () => {
      beforeEach(() => {
        axiosInstanceMock.get.mockResolvedValue({
          data: [],
        });
      });

      it('Then secrets are loaded only once', async () => {
        await binanceClient.getTrades('ABC', '123');
        await binanceClient.getTrades('ABC', '123');
        await binanceClient.getTrades('ABC', '123');

        expect(smClientMock.send).toHaveBeenCalledTimes(1);
      });

      it('Then empty list is returned', async () => {
        const result = await binanceClient.getTrades('ABC', '123');
        expect(result).toEqual([]);

        expect(axiosInstanceMock.get).toHaveBeenCalledTimes(1);
        const axiosGetParams = axiosInstanceMock.get.mock.calls[0];
        expect(axiosGetParams[0]).toContain(`/v3/myTrades?symbol=ABC&orderId=123&timestamp=${date.valueOf()}&signature=`);
        expect(axiosGetParams[1]).toEqual({
          baseURL: 'my-url',
          headers: {
            'X-MBX-APIKEY': binanceSecrets.apiKey,
          },
        });
      });
    });

    describe('When trades retrieval has failed', () => {
      beforeEach(() => {
        axiosInstanceMock.get.mockRejectedValue(new Error('Error'));
      });

      it('Then error is thrown', async () => {
        try {
          await binanceClient.getTrades('ABC', '123');
          fail();
        } catch (error) {
          expect((error as Error).message).toEqual('Error');
        }

        expect(axiosInstanceMock.get).toHaveBeenCalledTimes(1);
        const axiosGetParams = axiosInstanceMock.get.mock.calls[0];
        expect(axiosGetParams[0]).toContain(`/v3/myTrades?symbol=ABC&orderId=123&timestamp=${date.valueOf()}&signature=`);
        expect(axiosGetParams[1]).toEqual({
          baseURL: 'my-url',
          headers: {
            'X-MBX-APIKEY': binanceSecrets.apiKey,
          },
        });
      });
    });
  });
});
