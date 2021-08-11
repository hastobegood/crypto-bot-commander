import { mocked } from 'ts-jest/utils';
import { BinanceClient } from '../../../../src/code/infrastructure/binance/binance-client';
import { BinanceOrder, BinanceOrderFill } from '../../../../src/code/infrastructure/binance/model/binance-order';
import { Order, OrderFill, OrderType } from '../../../../src/code/domain/order/model/order';
import { buildDefaultOrder } from '../../../builders/domain/order/order-test-builder';
import { buildBinanceOrder, buildDefaultBinanceFill } from '../../../builders/infrastructure/binance/binance-order-test-builder';
import { HttpOrderRepository } from '../../../../src/code/infrastructure/order/http-order-repository';

const binanceClientMock = mocked(jest.genMockFromModule<BinanceClient>('../../../../src/code/infrastructure/binance/binance-client'), true);

let orderRepository: HttpOrderRepository;
beforeEach(() => {
  orderRepository = new HttpOrderRepository(binanceClientMock);
});

describe('HttpOrderRepository', () => {
  describe('Given a market order to save', () => {
    let order: Order;

    beforeEach(() => {
      order = { ...buildDefaultOrder(), type: OrderType.MARKET };
      binanceClientMock.sendMarketOrder = jest.fn();
    });

    describe('When order transaction has succeeded', () => {
      let binanceFill1: BinanceOrderFill;
      let binanceFill2: BinanceOrderFill;
      let binanceOrder: BinanceOrder;

      beforeEach(() => {
        binanceFill1 = { ...buildDefaultBinanceFill(), price: '666' };
        binanceFill2 = { ...buildDefaultBinanceFill(), price: '777' };
        binanceOrder = buildBinanceOrder([binanceFill1, binanceFill2]);

        binanceClientMock.sendMarketOrder.mockResolvedValue(binanceOrder);
      });

      afterEach(() => {
        expect(binanceClientMock.sendMarketOrder).toHaveBeenCalledTimes(1);
        const sendOrderParams = binanceClientMock.sendMarketOrder.mock.calls[0];
        expect(sendOrderParams).toBeDefined();
        expect(sendOrderParams[0]).toEqual(order.symbol);
        expect(sendOrderParams[1]).toEqual(order.side);
        expect(sendOrderParams[2]).toEqual(order.quoteAssetQuantity);
      });

      it('Then order is returned data updated', async () => {
        const result = await orderRepository.save(order);
        expect(result).toBeDefined();
        expect(result.id).toEqual(order.id);
        expect(result.symbol).toEqual(order.symbol);
        expect(result.side).toEqual(order.side);
        expect(result.type).toEqual(order.type);
        expect(result.creationDate).toEqual(order.creationDate);
        expect(result.transactionDate).toEqual(new Date(binanceOrder.transactTime));
        expect(result.baseAssetQuantity).toEqual(order.baseAssetQuantity);
        expect(result.quoteAssetQuantity).toEqual(order.quoteAssetQuantity);
        expect(result.priceThreshold).toEqual(order.priceThreshold);
        expect(result.executedAssetQuantity).toEqual(+binanceOrder.executedQty);
        expect(result.executedPrice).toEqual(+binanceFill2.price);
        expect(result.status).toEqual(binanceOrder.status);
        expect(result.fills).toBeDefined();
        expect(result.fills!.length).toEqual(binanceOrder.fills.length);

        let fill = getFillByCommissionAsset(result.fills!, binanceFill1.commissionAsset);
        expect(fill).toBeDefined();
        expect(fill!.price).toEqual(+binanceFill1.price);
        expect(fill!.quantity).toEqual(+binanceFill1.qty);
        expect(fill!.commission).toEqual(+binanceFill1.commission);

        fill = getFillByCommissionAsset(result.fills!, binanceFill2.commissionAsset);
        expect(fill).toBeDefined();
        expect(fill!.price).toEqual(+binanceFill2.price);
        expect(fill!.quantity).toEqual(+binanceFill2.qty);
        expect(fill!.commission).toEqual(+binanceFill2.commission);
      });
    });
  });

  describe('Given a take profit order to save', () => {
    let order: Order;

    beforeEach(() => {
      order = { ...buildDefaultOrder(), type: OrderType.TAKE_PROFIT };
      binanceClientMock.sendTakeProfitOrder = jest.fn();
    });

    describe('When order transaction has succeeded', () => {
      let binanceFill1: BinanceOrderFill;
      let binanceFill2: BinanceOrderFill;
      let binanceOrder: BinanceOrder;

      beforeEach(() => {
        binanceFill1 = { ...buildDefaultBinanceFill(), price: '777' };
        binanceFill2 = { ...buildDefaultBinanceFill(), price: '666' };
        binanceOrder = buildBinanceOrder([binanceFill1, binanceFill2]);

        binanceClientMock.sendTakeProfitOrder.mockResolvedValue(binanceOrder);
      });

      afterEach(() => {
        expect(binanceClientMock.sendTakeProfitOrder).toHaveBeenCalledTimes(1);
        const sendOrderParams = binanceClientMock.sendTakeProfitOrder.mock.calls[0];
        expect(sendOrderParams).toBeDefined();
        expect(sendOrderParams[0]).toEqual(order.symbol);
        expect(sendOrderParams[1]).toEqual(order.side);
        expect(sendOrderParams[2]).toEqual(order.baseAssetQuantity);
        expect(sendOrderParams[3]).toEqual(order.priceThreshold);
      });

      it('Then order is returned data updated', async () => {
        const result = await orderRepository.save(order);
        expect(result).toBeDefined();
        expect(result.id).toEqual(order.id);
        expect(result.symbol).toEqual(order.symbol);
        expect(result.side).toEqual(order.side);
        expect(result.type).toEqual(order.type);
        expect(result.creationDate).toEqual(order.creationDate);
        expect(result.transactionDate).toEqual(new Date(binanceOrder.transactTime));
        expect(result.baseAssetQuantity).toEqual(order.baseAssetQuantity);
        expect(result.quoteAssetQuantity).toEqual(order.quoteAssetQuantity);
        expect(result.priceThreshold).toEqual(order.priceThreshold);
        expect(result.executedAssetQuantity).toEqual(+binanceOrder.executedQty);
        expect(result.executedPrice).toEqual(+binanceFill1.price);
        expect(result.status).toEqual(binanceOrder.status);
        expect(result.fills).toBeDefined();
        expect(result.fills!.length).toEqual(binanceOrder.fills.length);

        let fill = getFillByCommissionAsset(result.fills!, binanceFill1.commissionAsset);
        expect(fill).toBeDefined();
        expect(fill!.price).toEqual(+binanceFill1.price);
        expect(fill!.quantity).toEqual(+binanceFill1.qty);
        expect(fill!.commission).toEqual(+binanceFill1.commission);

        fill = getFillByCommissionAsset(result.fills!, binanceFill2.commissionAsset);
        expect(fill).toBeDefined();
        expect(fill!.price).toEqual(+binanceFill2.price);
        expect(fill!.quantity).toEqual(+binanceFill2.qty);
        expect(fill!.commission).toEqual(+binanceFill2.commission);
      });
    });
  });
});

const getFillByCommissionAsset = (fills: OrderFill[], commissionAsset: string): OrderFill | undefined => {
  return fills.find((fill) => fill.commissionAsset === commissionAsset);
};
