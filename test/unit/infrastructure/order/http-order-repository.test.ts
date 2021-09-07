import { mocked } from 'ts-jest/utils';
import { BinanceClient } from '../../../../src/code/infrastructure/binance/binance-client';
import { BinanceOrder, BinanceOrderFill } from '../../../../src/code/infrastructure/binance/model/binance-order';
import { Order } from '../../../../src/code/domain/order/model/order';
import { buildDefaultOrder } from '../../../builders/domain/order/order-test-builder';
import { buildBinanceOrder, buildDefaultBinanceFill } from '../../../builders/infrastructure/binance/binance-order-test-builder';
import { HttpOrderRepository } from '../../../../src/code/infrastructure/order/http-order-repository';
import { fromBinanceOrderStatus, toBinanceSymbol } from '../../../../src/code/infrastructure/binance/binance-converter';

const binanceClientMock = mocked(jest.genMockFromModule<BinanceClient>('../../../../src/code/infrastructure/binance/binance-client'), true);

let orderRepository: HttpOrderRepository;
beforeEach(() => {
  binanceClientMock.sendMarketOrder = jest.fn();
  binanceClientMock.sendTakeProfitOrder = jest.fn();

  orderRepository = new HttpOrderRepository(binanceClientMock);
});

describe('HttpOrderRepository', () => {
  let order: Order;

  describe('Given a market order to save', () => {
    beforeEach(() => {
      order = { ...buildDefaultOrder(), type: 'Market' };
    });

    describe('When Binance order is sent', () => {
      let binanceFill1: BinanceOrderFill;
      let binanceFill2: BinanceOrderFill;
      let binanceOrder: BinanceOrder;

      beforeEach(() => {
        binanceFill1 = { ...buildDefaultBinanceFill(), price: '666' };
        binanceFill2 = { ...buildDefaultBinanceFill(), price: '777' };
        binanceOrder = buildBinanceOrder([binanceFill1, binanceFill2]);
        binanceClientMock.sendMarketOrder.mockResolvedValue(binanceOrder);
      });

      it('Then saved order is returned', async () => {
        const result = await orderRepository.save(order);
        expect(result).toEqual({
          ...order,
          externalId: binanceOrder.orderId.toString(),
          executedAssetQuantity: +binanceOrder.executedQty,
          executedPrice: (+binanceFill1.qty / +binanceOrder.executedQty) * 666 + (+binanceFill2.qty / +binanceOrder.executedQty) * 777,
          transactionDate: new Date(binanceOrder.transactTime),
          status: fromBinanceOrderStatus(binanceOrder.status),
          externalStatus: binanceOrder.status,
          fills: [
            {
              price: +binanceFill1.price,
              quantity: +binanceFill1.qty,
              commission: +binanceFill1.commission,
              commissionAsset: binanceFill1.commissionAsset,
            },
            {
              price: +binanceFill2.price,
              quantity: +binanceFill2.qty,
              commission: +binanceFill2.commission,
              commissionAsset: binanceFill2.commissionAsset,
            },
          ],
        });

        expect(binanceClientMock.sendMarketOrder).toHaveBeenCalledTimes(1);
        const sendOrderParams = binanceClientMock.sendMarketOrder.mock.calls[0];
        expect(sendOrderParams.length).toEqual(4);
        expect(sendOrderParams[0]).toEqual(toBinanceSymbol(order.symbol));
        expect(sendOrderParams[1]).toEqual(order.side.toUpperCase());
        expect(sendOrderParams[2]).toEqual(order.baseAssetQuantity || order.quoteAssetQuantity);
        expect(sendOrderParams[3]).toEqual(order.baseAssetQuantity ? 'BASE' : 'QUOTE');

        expect(binanceClientMock.sendTakeProfitOrder).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('Given a take profit order to save', () => {
    let order: Order;

    beforeEach(() => {
      order = { ...buildDefaultOrder(), type: 'TakeProfit' };
    });

    describe('When Binance order is sent', () => {
      let binanceOrder: BinanceOrder;

      beforeEach(() => {
        binanceOrder = { ...buildBinanceOrder([]), executedQty: '', fills: [] };
        binanceClientMock.sendTakeProfitOrder.mockResolvedValue(binanceOrder);
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
          fills: [],
        });

        expect(binanceClientMock.sendTakeProfitOrder).toHaveBeenCalledTimes(1);
        const sendTakeProfitOrderParams = binanceClientMock.sendTakeProfitOrder.mock.calls[0];
        expect(sendTakeProfitOrderParams.length).toEqual(4);
        expect(sendTakeProfitOrderParams[0]).toEqual(toBinanceSymbol(order.symbol));
        expect(sendTakeProfitOrderParams[1]).toEqual(order.side.toUpperCase());
        expect(sendTakeProfitOrderParams[2]).toEqual(order.baseAssetQuantity);
        expect(sendTakeProfitOrderParams[3]).toEqual(order.priceThreshold);

        expect(binanceClientMock.sendMarketOrder).toHaveBeenCalledTimes(0);
      });
    });
  });
});
