import { mocked } from 'ts-jest/utils';
import { BinanceClient } from '../../../../src/code/infrastructure/binance/binance-client';
import { BinanceOrder, BinanceOrderFill } from '../../../../src/code/infrastructure/binance/model/binance-order';
import { Order, OrderType } from '../../../../src/code/domain/order/model/order';
import { buildDefaultLimitOrder, buildDefaultMarketOrder, buildDefaultOrder } from '../../../builders/domain/order/order-test-builder';
import { buildDefaultBinanceLimitOrder, buildDefaultBinanceMarketOrder, buildDefaultBinanceOrderFill } from '../../../builders/infrastructure/binance/binance-order-test-builder';
import { HttpOrderRepository } from '../../../../src/code/infrastructure/order/http-order-repository';
import { fromBinanceOrderSide, fromBinanceOrderStatus, toBinanceSymbol } from '../../../../src/code/infrastructure/binance/binance-converter';
import { extractAssets } from '../../../../src/code/configuration/util/symbol';
import { BinanceTrade } from '../../../../src/code/infrastructure/binance/model/binance-trade';
import { buildDefaultBinanceTrade } from '../../../builders/infrastructure/binance/binance-trade-test-builder';

const binanceClientMock = mocked(jest.genMockFromModule<BinanceClient>('../../../../src/code/infrastructure/binance/binance-client'), true);

let orderRepository: HttpOrderRepository;
beforeEach(() => {
  binanceClientMock.sendMarketOrder = jest.fn();
  binanceClientMock.sendLimitOrder = jest.fn();
  binanceClientMock.queryOrder = jest.fn();
  binanceClientMock.getTrades = jest.fn();

  orderRepository = new HttpOrderRepository(binanceClientMock);
});

describe('HttpOrderRepository', () => {
  let order: Order;

  describe('Given an unknown order to save', () => {
    beforeEach(() => {
      order = { ...buildDefaultOrder(), type: 'XXX' as OrderType };
    });

    it('Then error is thrown', async () => {
      try {
        await orderRepository.save(order);
        fail();
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toEqual("Unsupported 'XXX' order type");
      }
    });
  });

  describe('Given a market order to save', () => {
    beforeEach(() => {
      order = buildDefaultMarketOrder();
    });

    describe('When Binance order is sent', () => {
      let binanceOrder: BinanceOrder;
      let binanceOrderFill1: BinanceOrderFill;
      let binanceOrderFill2: BinanceOrderFill;

      describe('And commission asset is base asset', () => {
        beforeEach(() => {
          const baseAsset = extractAssets(order.symbol).baseAsset;
          binanceOrderFill1 = { ...buildDefaultBinanceOrderFill(), commissionAsset: baseAsset };
          binanceOrderFill2 = { ...buildDefaultBinanceOrderFill(), commissionAsset: baseAsset };
          binanceOrder = { ...buildDefaultBinanceMarketOrder(), fills: [binanceOrderFill1, binanceOrderFill2] };
          binanceClientMock.sendMarketOrder.mockResolvedValue(binanceOrder);
        });

        it('Then saved order with commission deducted from executed quantity is returned', async () => {
          const result = await orderRepository.save(order);
          expect(result).toEqual({
            ...order,
            externalId: binanceOrder.orderId.toString(),
            executedAssetQuantity: +binanceOrder.executedQty - (+binanceOrderFill1.commission + +binanceOrderFill2.commission),
            executedPrice: +binanceOrder.cummulativeQuoteQty / +binanceOrder.executedQty,
            transactionDate: new Date(binanceOrder.transactTime),
            status: fromBinanceOrderStatus(binanceOrder.status),
            externalStatus: binanceOrder.status,
          });

          expect(binanceClientMock.sendMarketOrder).toHaveBeenCalledTimes(1);
          const sendOrderParams = binanceClientMock.sendMarketOrder.mock.calls[0];
          expect(sendOrderParams.length).toEqual(4);
          expect(sendOrderParams[0]).toEqual(toBinanceSymbol(order.symbol));
          expect(sendOrderParams[1]).toEqual(order.side.toUpperCase());
          expect(sendOrderParams[2]).toEqual(order.baseAssetQuantity || order.quoteAssetQuantity);
          expect(sendOrderParams[3]).toEqual(order.baseAssetQuantity ? 'BASE' : 'QUOTE');

          expect(binanceClientMock.sendLimitOrder).toHaveBeenCalledTimes(0);
        });
      });

      describe('And commission asset is quote asset', () => {
        beforeEach(() => {
          const quoteAsset = extractAssets(order.symbol).quoteAsset;
          binanceOrderFill1 = { ...buildDefaultBinanceOrderFill(), commissionAsset: quoteAsset };
          binanceOrderFill2 = { ...buildDefaultBinanceOrderFill(), commissionAsset: quoteAsset };
          binanceOrder = { ...buildDefaultBinanceMarketOrder(), fills: [binanceOrderFill1, binanceOrderFill2] };
          binanceClientMock.sendMarketOrder.mockResolvedValue(binanceOrder);
        });

        it('Then saved order without commission deducted from executed quantity is returned', async () => {
          const result = await orderRepository.save(order);
          expect(result).toEqual({
            ...order,
            externalId: binanceOrder.orderId.toString(),
            executedAssetQuantity: +binanceOrder.executedQty,
            executedPrice: +binanceOrder.cummulativeQuoteQty / +binanceOrder.executedQty,
            transactionDate: new Date(binanceOrder.transactTime),
            status: fromBinanceOrderStatus(binanceOrder.status),
            externalStatus: binanceOrder.status,
          });

          expect(binanceClientMock.sendMarketOrder).toHaveBeenCalledTimes(1);
          const sendOrderParams = binanceClientMock.sendMarketOrder.mock.calls[0];
          expect(sendOrderParams.length).toEqual(4);
          expect(sendOrderParams[0]).toEqual(toBinanceSymbol(order.symbol));
          expect(sendOrderParams[1]).toEqual(order.side.toUpperCase());
          expect(sendOrderParams[2]).toEqual(order.baseAssetQuantity || order.quoteAssetQuantity);
          expect(sendOrderParams[3]).toEqual(order.baseAssetQuantity ? 'BASE' : 'QUOTE');

          expect(binanceClientMock.sendLimitOrder).toHaveBeenCalledTimes(0);
        });
      });
    });
  });

  describe('Given a limit order to save', () => {
    beforeEach(() => {
      order = buildDefaultLimitOrder();
    });

    describe('When Binance order is sent', () => {
      let binanceOrder: BinanceOrder;

      beforeEach(() => {
        binanceOrder = buildDefaultBinanceLimitOrder();
        binanceClientMock.sendLimitOrder.mockResolvedValue(binanceOrder);
      });

      it('Then saved order is returned', async () => {
        const result = await orderRepository.save(order);
        expect(result).toEqual({
          ...order,
          externalId: binanceOrder.orderId.toString(),
          executedAssetQuantity: undefined,
          executedPrice: undefined,
          transactionDate: new Date(binanceOrder.transactTime),
          status: fromBinanceOrderStatus(binanceOrder.status),
          externalStatus: binanceOrder.status,
        });

        expect(binanceClientMock.sendLimitOrder).toHaveBeenCalledTimes(1);
        const sendOrderParams = binanceClientMock.sendLimitOrder.mock.calls[0];
        expect(sendOrderParams.length).toEqual(4);
        expect(sendOrderParams[0]).toEqual(toBinanceSymbol(order.symbol));
        expect(sendOrderParams[1]).toEqual(order.side.toUpperCase());
        expect(sendOrderParams[2]).toEqual(order.baseAssetQuantity);
        expect(sendOrderParams[3]).toEqual(order.priceLimit);

        expect(binanceClientMock.sendMarketOrder).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('Given a status order to check', () => {
    describe('When Binance order is checked', () => {
      let binanceOrder: BinanceOrder;
      let binanceTrade1: BinanceTrade;
      let binanceTrade2: BinanceTrade;
      let binanceTrade3: BinanceTrade;

      beforeEach(() => {
        binanceOrder = { ...buildDefaultBinanceLimitOrder(), price: '123', executedQty: '666' };
        binanceClientMock.queryOrder.mockResolvedValue(binanceOrder);

        binanceTrade1 = { ...buildDefaultBinanceTrade(), commissionAsset: 'ABC' };
        binanceTrade2 = { ...buildDefaultBinanceTrade(), commissionAsset: 'DEF' };
        binanceTrade3 = { ...buildDefaultBinanceTrade(), commissionAsset: 'ABC' };
        binanceClientMock.getTrades.mockResolvedValue([binanceTrade1, binanceTrade2, binanceTrade3]);
      });

      it('Then status order is returned', async () => {
        const result = await orderRepository.check('ABC#DEF', '123');
        expect(result).toEqual({
          side: fromBinanceOrderSide(binanceOrder.side),
          status: fromBinanceOrderStatus(binanceOrder.status),
          externalId: '123',
          externalStatus: binanceOrder.status,
          executedAssetQuantity: +binanceOrder.executedQty - (+binanceTrade1.commission + +binanceTrade3.commission),
          executedPrice: +binanceOrder.price,
        });

        expect(binanceClientMock.queryOrder).toHaveBeenCalledTimes(1);
        const queryOrderParams = binanceClientMock.queryOrder.mock.calls[0];
        expect(queryOrderParams.length).toEqual(2);
        expect(queryOrderParams[0]).toEqual('ABCDEF');
        expect(queryOrderParams[1]).toEqual('123');
      });
    });
  });
});
