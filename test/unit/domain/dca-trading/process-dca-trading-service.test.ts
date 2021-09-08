import { mocked } from 'ts-jest/utils';
import { DcaTradingRepository } from '../../../../src/code/domain/dca-trading/dca-trading-repository';
import { DcaTrading, DcaTradingConfig, DcaTradingConfigTradeAsset, DcaTradingOrder } from '../../../../src/code/domain/dca-trading/model/dca-trading';
import { CreateOrder } from '../../../../src/code/domain/order/model/order';
import { buildDcaTradingConfig, buildDcaTradingConfigTradeAsset, buildDefaultDcaTrading, buildDefaultDcaTradingOrder } from '../../../builders/domain/dca-trading/dca-trading-test-builder';
import { buildDefaultOrder } from '../../../builders/domain/order/order-test-builder';
import MockDate from 'mockdate';
import { CreateOrderService } from '../../../../src/code/domain/order/create-order-service';
import { ProcessDcaTradingService } from '../../../../src/code/domain/dca-trading/process-dca-trading-service';

const createOrderServiceMock = mocked(jest.genMockFromModule<CreateOrderService>('../../../../src/code/domain/order/create-order-service'), true);
const dcaTradingRepositoryMock = mocked(jest.genMockFromModule<DcaTradingRepository>('../../../../src/code/domain/dca-trading/dca-trading-repository'), true);

let processDcaTradingService: ProcessDcaTradingService;
beforeEach(() => {
  createOrderServiceMock.create = jest.fn();
  dcaTradingRepositoryMock.save = jest.fn();
  dcaTradingRepositoryMock.getLast = jest.fn();
  processDcaTradingService = new ProcessDcaTradingService(createOrderServiceMock, dcaTradingRepositoryMock);
});

describe('ProcessDcaTradingService', () => {
  let creationDate: Date;

  beforeEach(() => {
    creationDate = new Date();

    MockDate.set(creationDate);
  });

  describe('Given a DCA trading config to trade', () => {
    let dcaTradingConfigTradeAsset1: DcaTradingConfigTradeAsset;
    let dcaTradingConfigTradeAsset2: DcaTradingConfigTradeAsset;
    let dcaTradingConfigTradeAsset3: DcaTradingConfigTradeAsset;
    let dcaTradingConfig: DcaTradingConfig;

    beforeEach(() => {
      dcaTradingConfigTradeAsset1 = buildDcaTradingConfigTradeAsset('ASSET1', 0.2);
      dcaTradingConfigTradeAsset2 = buildDcaTradingConfigTradeAsset('ASSET2', 0.15);
      dcaTradingConfigTradeAsset3 = buildDcaTradingConfigTradeAsset('ASSET3', 0.1);
      dcaTradingConfig = buildDcaTradingConfig('BASE', 'QUOTE', 50, [dcaTradingConfigTradeAsset1, dcaTradingConfigTradeAsset2, dcaTradingConfigTradeAsset3]);
    });

    describe('When base order creation has failed', () => {
      it('Then base order is not a success and all trade orders are ignored', async () => {
        createOrderServiceMock.create.mockRejectedValue(new Error('Base order error !'));
        dcaTradingRepositoryMock.save.mockImplementation((dcaTrading) => Promise.resolve(dcaTrading));

        const result = await processDcaTradingService.process(dcaTradingConfig);
        expect(result).toBeDefined();
        expect(result.id).toEqual(`${dcaTradingConfig.baseAsset}#${dcaTradingConfig.quoteAsset}/${creationDate.valueOf()}`);
        expect(result.success).toEqual(false);
        expect(result.creationDate).toEqual(creationDate);
        expect(result.orders).toBeDefined();
        expect(result.orders).toHaveLength(1);
        expect(result.orders[0].id).toBeUndefined();
        expect(result.orders[0].externalId).toBeUndefined();
        expect(result.orders[0].success).toEqual(false);
        expect(result.orders[0].message).toEqual('Base order error !');
        expect(result.orders[0].baseAsset).toEqual('BASE');
        expect(result.orders[0].quoteAsset).toEqual('QUOTE');
        expect(result.orders[0].symbol).toEqual('BASE#QUOTE');
        expect(result.orders[0].requestedQuantity).toEqual(dcaTradingConfig.quoteAssetQuantity);
        expect(result.orders[0].executedQuantity).toBeUndefined();
        expect(result.orders[0].executedPrice).toBeUndefined();

        expect(createOrderServiceMock.create).toHaveBeenCalledTimes(1);
        const createOrderParams = createOrderServiceMock.create.mock.calls[0][0];
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams.symbol).toEqual('BASE#QUOTE');
        expect(createOrderParams.side).toEqual('Buy');
        expect(createOrderParams.type).toEqual('Market');
        expect(createOrderParams.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams.quoteAssetQuantity).toEqual(dcaTradingConfig.quoteAssetQuantity);
        expect(createOrderParams.priceThreshold).toBeUndefined();

        expect(dcaTradingRepositoryMock.getLast).toHaveBeenCalledTimes(0);

        expect(dcaTradingRepositoryMock.save).toHaveBeenCalledTimes(1);
        const saveDcaTradingParams = dcaTradingRepositoryMock.save.mock.calls[0][0];
        expect(saveDcaTradingParams).toBeDefined();
        expect(saveDcaTradingParams).toEqual(result);
      });
    });

    describe('When base order creation has succeeded but all trade orders creation have failed', () => {
      it('Then base order is a success but all trade orders are not', async () => {
        const baseOrder = buildDefaultOrder();

        createOrderServiceMock.create = jest.fn().mockImplementation((createOrder: CreateOrder) => {
          if (createOrder.symbol === 'BASE#QUOTE') {
            return baseOrder;
          } else {
            throw new Error(`Error on ${createOrder.symbol}`);
          }
        });

        dcaTradingRepositoryMock.save.mockImplementation((dcaTrading) => Promise.resolve(dcaTrading));

        const result = await processDcaTradingService.process(dcaTradingConfig);
        expect(result).toBeDefined();
        expect(result.id).toEqual(`${dcaTradingConfig.baseAsset}#${dcaTradingConfig.quoteAsset}/${creationDate.valueOf()}`);
        expect(result.success).toEqual(false);
        expect(result.creationDate).toEqual(creationDate);
        expect(result.orders).toBeDefined();
        expect(result.orders).toHaveLength(4);

        let resultOrder = getDcaTradingOrder(result.orders, 'BASE#QUOTE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toEqual(baseOrder.id);
        expect(resultOrder!.externalId).toEqual(baseOrder.externalId);
        expect(resultOrder!.success).toEqual(true);
        expect(resultOrder!.message).toBeUndefined();
        expect(resultOrder!.baseAsset).toEqual('BASE');
        expect(resultOrder!.quoteAsset).toEqual('QUOTE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfig.quoteAssetQuantity);
        expect(resultOrder!.executedQuantity).toEqual(baseOrder.executedAssetQuantity);
        expect(resultOrder!.executedPrice).toEqual(baseOrder.executedPrice);

        resultOrder = getDcaTradingOrder(result.orders, 'ASSET1#BASE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toBeUndefined();
        expect(resultOrder!.externalId).toBeUndefined();
        expect(resultOrder!.success).toEqual(false);
        expect(resultOrder!.message).toEqual('Error on ASSET1#BASE');
        expect(resultOrder!.baseAsset).toEqual('ASSET1');
        expect(resultOrder!.quoteAsset).toEqual('BASE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfigTradeAsset1.percentage * baseOrder.executedAssetQuantity!);
        expect(resultOrder!.executedQuantity).toBeUndefined();
        expect(resultOrder!.executedPrice).toBeUndefined();

        resultOrder = getDcaTradingOrder(result.orders, 'ASSET2#BASE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toBeUndefined();
        expect(resultOrder!.externalId).toBeUndefined();
        expect(resultOrder!.success).toEqual(false);
        expect(resultOrder!.message).toEqual('Error on ASSET2#BASE');
        expect(resultOrder!.baseAsset).toEqual('ASSET2');
        expect(resultOrder!.quoteAsset).toEqual('BASE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfigTradeAsset2.percentage * baseOrder.executedAssetQuantity!);
        expect(resultOrder!.executedQuantity).toBeUndefined();
        expect(resultOrder!.executedPrice).toBeUndefined();

        resultOrder = getDcaTradingOrder(result.orders, 'ASSET3#BASE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toBeUndefined();
        expect(resultOrder!.externalId).toBeUndefined();
        expect(resultOrder!.success).toEqual(false);
        expect(resultOrder!.message).toEqual('Error on ASSET3#BASE');
        expect(resultOrder!.baseAsset).toEqual('ASSET3');
        expect(resultOrder!.quoteAsset).toEqual('BASE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfigTradeAsset3.percentage * baseOrder.executedAssetQuantity!);
        expect(resultOrder!.executedQuantity).toBeUndefined();
        expect(resultOrder!.executedPrice).toBeUndefined();

        expect(createOrderServiceMock.create).toHaveBeenCalledTimes(4);
        const createOrdersParams = createOrderServiceMock.create.mock.calls.map((call) => call[0]);

        let createOrderParams = getCreateOrder(createOrdersParams, 'BASE#QUOTE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfig.quoteAssetQuantity);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        createOrderParams = getCreateOrder(createOrdersParams, 'ASSET1#BASE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfigTradeAsset1.percentage * baseOrder.executedAssetQuantity!);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        createOrderParams = getCreateOrder(createOrdersParams, 'ASSET2#BASE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfigTradeAsset2.percentage * baseOrder.executedAssetQuantity!);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        createOrderParams = getCreateOrder(createOrdersParams, 'ASSET3#BASE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfigTradeAsset3.percentage * baseOrder.executedAssetQuantity!);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        expect(dcaTradingRepositoryMock.getLast).toHaveBeenCalledTimes(0);

        expect(dcaTradingRepositoryMock.save).toHaveBeenCalledTimes(1);
        const saveDcaTradingParams = dcaTradingRepositoryMock.save.mock.calls[0][0];
        expect(saveDcaTradingParams).toBeDefined();
        expect(saveDcaTradingParams).toEqual(result);
      });
    });

    describe('When base order creation has succeeded but some trade orders creation have failed', () => {
      it('Then base order and successful trade orders are a success but failed trade orders are not', async () => {
        const baseOrder = buildDefaultOrder();
        const tradeOrder1 = buildDefaultOrder();
        const tradeOrder3 = buildDefaultOrder();

        createOrderServiceMock.create = jest.fn().mockImplementation((createOrder: CreateOrder) => {
          if (createOrder.symbol === 'BASE#QUOTE') {
            return baseOrder;
          } else if (createOrder.symbol === 'ASSET1#BASE') {
            return tradeOrder1;
          } else if (createOrder.symbol === 'ASSET3#BASE') {
            return tradeOrder3;
          } else {
            throw new Error(`Error on ${createOrder.symbol}`);
          }
        });

        dcaTradingRepositoryMock.save.mockImplementation((dcaTrading) => Promise.resolve(dcaTrading));

        const result = await processDcaTradingService.process(dcaTradingConfig);
        expect(result).toBeDefined();
        expect(result.id).toEqual(`${dcaTradingConfig.baseAsset}#${dcaTradingConfig.quoteAsset}/${creationDate.valueOf()}`);
        expect(result.success).toEqual(false);
        expect(result.creationDate).toEqual(creationDate);
        expect(result.orders).toBeDefined();
        expect(result.orders).toHaveLength(4);

        let resultOrder = getDcaTradingOrder(result.orders, 'BASE#QUOTE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toEqual(baseOrder.id);
        expect(resultOrder!.externalId).toEqual(baseOrder.externalId);
        expect(resultOrder!.success).toEqual(true);
        expect(resultOrder!.message).toBeUndefined();
        expect(resultOrder!.baseAsset).toEqual('BASE');
        expect(resultOrder!.quoteAsset).toEqual('QUOTE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfig.quoteAssetQuantity);
        expect(resultOrder!.executedQuantity).toEqual(baseOrder.executedAssetQuantity);
        expect(resultOrder!.executedPrice).toEqual(baseOrder.executedPrice);

        resultOrder = getDcaTradingOrder(result.orders, 'ASSET1#BASE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toEqual(tradeOrder1.id);
        expect(resultOrder!.externalId).toEqual(tradeOrder1.externalId);
        expect(resultOrder!.success).toEqual(true);
        expect(resultOrder!.message).toBeUndefined();
        expect(resultOrder!.baseAsset).toEqual('ASSET1');
        expect(resultOrder!.quoteAsset).toEqual('BASE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfigTradeAsset1.percentage * baseOrder.executedAssetQuantity!);
        expect(resultOrder!.executedQuantity).toEqual(tradeOrder1.executedAssetQuantity);
        expect(resultOrder!.executedPrice).toEqual(tradeOrder1.executedPrice);

        resultOrder = getDcaTradingOrder(result.orders, 'ASSET2#BASE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toBeUndefined();
        expect(resultOrder!.externalId).toBeUndefined();
        expect(resultOrder!.success).toEqual(false);
        expect(resultOrder!.message).toEqual('Error on ASSET2#BASE');
        expect(resultOrder!.baseAsset).toEqual('ASSET2');
        expect(resultOrder!.quoteAsset).toEqual('BASE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfigTradeAsset2.percentage * baseOrder.executedAssetQuantity!);
        expect(resultOrder!.executedQuantity).toBeUndefined();
        expect(resultOrder!.executedPrice).toBeUndefined();

        resultOrder = getDcaTradingOrder(result.orders, 'ASSET3#BASE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toEqual(tradeOrder3.id);
        expect(resultOrder!.externalId).toEqual(tradeOrder3.externalId);
        expect(resultOrder!.success).toEqual(true);
        expect(resultOrder!.message).toBeUndefined();
        expect(resultOrder!.baseAsset).toEqual('ASSET3');
        expect(resultOrder!.quoteAsset).toEqual('BASE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfigTradeAsset3.percentage * baseOrder.executedAssetQuantity!);
        expect(resultOrder!.executedQuantity).toEqual(tradeOrder3.executedAssetQuantity);
        expect(resultOrder!.executedPrice).toEqual(tradeOrder3.executedPrice);

        expect(createOrderServiceMock.create).toHaveBeenCalledTimes(4);
        const createOrdersParams = createOrderServiceMock.create.mock.calls.map((call) => call[0]);

        let createOrderParams = getCreateOrder(createOrdersParams, 'BASE#QUOTE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfig.quoteAssetQuantity);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        createOrderParams = getCreateOrder(createOrdersParams, 'ASSET1#BASE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfigTradeAsset1.percentage * baseOrder.executedAssetQuantity!);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        createOrderParams = getCreateOrder(createOrdersParams, 'ASSET2#BASE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfigTradeAsset2.percentage * baseOrder.executedAssetQuantity!);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        createOrderParams = getCreateOrder(createOrdersParams, 'ASSET3#BASE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfigTradeAsset3.percentage * baseOrder.executedAssetQuantity!);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        expect(dcaTradingRepositoryMock.getLast).toHaveBeenCalledTimes(0);

        expect(dcaTradingRepositoryMock.save).toHaveBeenCalledTimes(1);
        const saveDcaTradingParams = dcaTradingRepositoryMock.save.mock.calls[0][0];
        expect(saveDcaTradingParams).toBeDefined();
        expect(saveDcaTradingParams).toEqual(result);
      });
    });

    describe('When base order creation has succeeded and all trade orders creations have succeeded', () => {
      it('Then base order and trade orders are a success', async () => {
        const baseOrder = buildDefaultOrder();
        const tradeOrder1 = buildDefaultOrder();
        const tradeOrder2 = buildDefaultOrder();
        const tradeOrder3 = buildDefaultOrder();

        createOrderServiceMock.create = jest.fn().mockImplementation((createOrder: CreateOrder) => {
          if (createOrder.symbol === 'BASE#QUOTE') {
            return baseOrder;
          } else if (createOrder.symbol === 'ASSET1#BASE') {
            return tradeOrder1;
          } else if (createOrder.symbol === 'ASSET2#BASE') {
            return tradeOrder2;
          } else if (createOrder.symbol === 'ASSET3#BASE') {
            return tradeOrder3;
          } else {
            throw new Error(`Error on ${createOrder.symbol}`);
          }
        });

        dcaTradingRepositoryMock.save.mockImplementation((dcaTrading) => Promise.resolve(dcaTrading));

        const result = await processDcaTradingService.process(dcaTradingConfig);
        expect(result).toBeDefined();
        expect(result.id).toEqual(`${dcaTradingConfig.baseAsset}#${dcaTradingConfig.quoteAsset}/${creationDate.valueOf()}`);
        expect(result.success).toEqual(true);
        expect(result.creationDate).toEqual(creationDate);
        expect(result.orders).toBeDefined();
        expect(result.orders).toHaveLength(4);

        let resultOrder = getDcaTradingOrder(result.orders, 'BASE#QUOTE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toEqual(baseOrder.id);
        expect(resultOrder!.externalId).toEqual(baseOrder.externalId);
        expect(resultOrder!.success).toEqual(true);
        expect(resultOrder!.message).toBeUndefined();
        expect(resultOrder!.baseAsset).toEqual('BASE');
        expect(resultOrder!.quoteAsset).toEqual('QUOTE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfig.quoteAssetQuantity);
        expect(resultOrder!.executedQuantity).toEqual(baseOrder.executedAssetQuantity);
        expect(resultOrder!.executedPrice).toEqual(baseOrder.executedPrice);

        resultOrder = getDcaTradingOrder(result.orders, 'ASSET1#BASE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toEqual(tradeOrder1.id);
        expect(resultOrder!.externalId).toEqual(tradeOrder1.externalId);
        expect(resultOrder!.success).toEqual(true);
        expect(resultOrder!.message).toBeUndefined();
        expect(resultOrder!.baseAsset).toEqual('ASSET1');
        expect(resultOrder!.quoteAsset).toEqual('BASE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfigTradeAsset1.percentage * baseOrder.executedAssetQuantity!);
        expect(resultOrder!.executedQuantity).toEqual(tradeOrder1.executedAssetQuantity);
        expect(resultOrder!.executedPrice).toEqual(tradeOrder1.executedPrice);

        resultOrder = getDcaTradingOrder(result.orders, 'ASSET2#BASE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toEqual(tradeOrder2.id);
        expect(resultOrder!.externalId).toEqual(tradeOrder2.externalId);
        expect(resultOrder!.success).toEqual(true);
        expect(resultOrder!.message).toBeUndefined();
        expect(resultOrder!.baseAsset).toEqual('ASSET2');
        expect(resultOrder!.quoteAsset).toEqual('BASE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfigTradeAsset2.percentage * baseOrder.executedAssetQuantity!);
        expect(resultOrder!.executedQuantity).toEqual(tradeOrder2.executedAssetQuantity);
        expect(resultOrder!.executedPrice).toEqual(tradeOrder2.executedPrice);

        resultOrder = getDcaTradingOrder(result.orders, 'ASSET3#BASE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toEqual(tradeOrder3.id);
        expect(resultOrder!.externalId).toEqual(tradeOrder3.externalId);
        expect(resultOrder!.success).toEqual(true);
        expect(resultOrder!.message).toBeUndefined();
        expect(resultOrder!.baseAsset).toEqual('ASSET3');
        expect(resultOrder!.quoteAsset).toEqual('BASE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfigTradeAsset3.percentage * baseOrder.executedAssetQuantity!);
        expect(resultOrder!.executedQuantity).toEqual(tradeOrder3.executedAssetQuantity);
        expect(resultOrder!.executedPrice).toEqual(tradeOrder3.executedPrice);

        expect(createOrderServiceMock.create).toHaveBeenCalledTimes(4);
        const createOrdersParams = createOrderServiceMock.create.mock.calls.map((call) => call[0]);

        let createOrderParams = getCreateOrder(createOrdersParams, 'BASE#QUOTE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfig.quoteAssetQuantity);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        createOrderParams = getCreateOrder(createOrdersParams, 'ASSET1#BASE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfigTradeAsset1.percentage * baseOrder.executedAssetQuantity!);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        createOrderParams = getCreateOrder(createOrdersParams, 'ASSET2#BASE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfigTradeAsset2.percentage * baseOrder.executedAssetQuantity!);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        createOrderParams = getCreateOrder(createOrdersParams, 'ASSET3#BASE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfigTradeAsset3.percentage * baseOrder.executedAssetQuantity!);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        expect(dcaTradingRepositoryMock.getLast).toHaveBeenCalledTimes(0);

        expect(dcaTradingRepositoryMock.save).toHaveBeenCalledTimes(1);
        const saveDcaTradingParams = dcaTradingRepositoryMock.save.mock.calls[0][0];
        expect(saveDcaTradingParams).toBeDefined();
        expect(saveDcaTradingParams).toEqual(result);
      });
    });
  });

  describe('Given a DCA trading config with three conditional trade assets to trade', () => {
    let dcaTradingConfigTradeAsset: DcaTradingConfigTradeAsset;
    let dcaTradingConfig: DcaTradingConfig;

    beforeEach(() => {
      dcaTradingConfigTradeAsset = buildDcaTradingConfigTradeAsset('ASSET1|ASSET2|ASSET3', 0.5);
      dcaTradingConfig = buildDcaTradingConfig('BASE', 'QUOTE', 50, [dcaTradingConfigTradeAsset]);
    });

    describe('When there is no last dca trading', () => {
      beforeEach(() => {
        dcaTradingRepositoryMock.getLast.mockResolvedValue(null);
      });

      it('Then trade order is created with first trade asset', async () => {
        const baseOrder = buildDefaultOrder();
        const tradeOrder = buildDefaultOrder();

        createOrderServiceMock.create = jest.fn().mockImplementation((createOrder: CreateOrder) => {
          if (createOrder.symbol === 'BASE#QUOTE') {
            return baseOrder;
          } else if (createOrder.symbol === 'ASSET1#BASE') {
            return tradeOrder;
          } else {
            throw new Error(`Error on ${createOrder.symbol}`);
          }
        });

        dcaTradingRepositoryMock.save.mockImplementation((dcaTrading) => Promise.resolve(dcaTrading));

        const result = await processDcaTradingService.process(dcaTradingConfig);
        expect(result).toBeDefined();
        expect(result.id).toEqual(`${dcaTradingConfig.baseAsset}#${dcaTradingConfig.quoteAsset}/${creationDate.valueOf()}`);
        expect(result.success).toEqual(true);
        expect(result.creationDate).toEqual(creationDate);
        expect(result.orders).toBeDefined();
        expect(result.orders).toHaveLength(2);

        let resultOrder = getDcaTradingOrder(result.orders, 'BASE#QUOTE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toEqual(baseOrder.id);
        expect(resultOrder!.externalId).toEqual(baseOrder.externalId);
        expect(resultOrder!.success).toEqual(true);
        expect(resultOrder!.message).toBeUndefined();
        expect(resultOrder!.baseAsset).toEqual('BASE');
        expect(resultOrder!.quoteAsset).toEqual('QUOTE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfig.quoteAssetQuantity);
        expect(resultOrder!.executedQuantity).toEqual(baseOrder.executedAssetQuantity);
        expect(resultOrder!.executedPrice).toEqual(baseOrder.executedPrice);

        resultOrder = getDcaTradingOrder(result.orders, 'ASSET1#BASE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toEqual(tradeOrder.id);
        expect(resultOrder!.externalId).toEqual(tradeOrder.externalId);
        expect(resultOrder!.success).toEqual(true);
        expect(resultOrder!.message).toBeUndefined();
        expect(resultOrder!.baseAsset).toEqual('ASSET1');
        expect(resultOrder!.quoteAsset).toEqual('BASE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfigTradeAsset.percentage * baseOrder.executedAssetQuantity!);
        expect(resultOrder!.executedQuantity).toEqual(tradeOrder.executedAssetQuantity);
        expect(resultOrder!.executedPrice).toEqual(tradeOrder.executedPrice);

        expect(createOrderServiceMock.create).toHaveBeenCalledTimes(2);
        const createOrdersParams = createOrderServiceMock.create.mock.calls.map((call) => call[0]);

        let createOrderParams = getCreateOrder(createOrdersParams, 'BASE#QUOTE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfig.quoteAssetQuantity);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        createOrderParams = getCreateOrder(createOrdersParams, 'ASSET1#BASE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfigTradeAsset.percentage * baseOrder.executedAssetQuantity!);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        expect(dcaTradingRepositoryMock.getLast).toHaveBeenCalledTimes(1);

        expect(dcaTradingRepositoryMock.save).toHaveBeenCalledTimes(1);
        const saveDcaTradingParams = dcaTradingRepositoryMock.save.mock.calls[0][0];
        expect(saveDcaTradingParams).toBeDefined();
        expect(saveDcaTradingParams).toEqual(result);
      });
    });

    describe("When there is a last dca trading that doesn't contain any of the conditional trade assets", () => {
      let lastDcaTrading: DcaTrading;

      beforeEach(() => {
        lastDcaTrading = buildDefaultDcaTrading();
        dcaTradingRepositoryMock.getLast.mockResolvedValue(lastDcaTrading);
      });

      it('Then trade order is created with first trade asset', async () => {
        const baseOrder = buildDefaultOrder();
        const tradeOrder = buildDefaultOrder();

        createOrderServiceMock.create = jest.fn().mockImplementation((createOrder: CreateOrder) => {
          if (createOrder.symbol === 'BASE#QUOTE') {
            return baseOrder;
          } else if (createOrder.symbol === 'ASSET1#BASE') {
            return tradeOrder;
          } else {
            throw new Error(`Error on ${createOrder.symbol}`);
          }
        });

        dcaTradingRepositoryMock.save.mockImplementation((dcaTrading) => Promise.resolve(dcaTrading));

        const result = await processDcaTradingService.process(dcaTradingConfig);
        expect(result).toBeDefined();
        expect(result.id).toEqual(`${dcaTradingConfig.baseAsset}#${dcaTradingConfig.quoteAsset}/${creationDate.valueOf()}`);
        expect(result.success).toEqual(true);
        expect(result.creationDate).toEqual(creationDate);
        expect(result.orders).toBeDefined();
        expect(result.orders).toHaveLength(2);

        let resultOrder = getDcaTradingOrder(result.orders, 'BASE#QUOTE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toEqual(baseOrder.id);
        expect(resultOrder!.externalId).toEqual(baseOrder.externalId);
        expect(resultOrder!.success).toEqual(true);
        expect(resultOrder!.message).toBeUndefined();
        expect(resultOrder!.baseAsset).toEqual('BASE');
        expect(resultOrder!.quoteAsset).toEqual('QUOTE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfig.quoteAssetQuantity);
        expect(resultOrder!.executedQuantity).toEqual(baseOrder.executedAssetQuantity);
        expect(resultOrder!.executedPrice).toEqual(baseOrder.executedPrice);

        resultOrder = getDcaTradingOrder(result.orders, 'ASSET1#BASE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toEqual(tradeOrder.id);
        expect(resultOrder!.externalId).toEqual(tradeOrder.externalId);
        expect(resultOrder!.success).toEqual(true);
        expect(resultOrder!.message).toBeUndefined();
        expect(resultOrder!.baseAsset).toEqual('ASSET1');
        expect(resultOrder!.quoteAsset).toEqual('BASE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfigTradeAsset.percentage * baseOrder.executedAssetQuantity!);
        expect(resultOrder!.executedQuantity).toEqual(tradeOrder.executedAssetQuantity);
        expect(resultOrder!.executedPrice).toEqual(tradeOrder.executedPrice);

        expect(createOrderServiceMock.create).toHaveBeenCalledTimes(2);
        const createOrdersParams = createOrderServiceMock.create.mock.calls.map((call) => call[0]);

        let createOrderParams = getCreateOrder(createOrdersParams, 'BASE#QUOTE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfig.quoteAssetQuantity);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        createOrderParams = getCreateOrder(createOrdersParams, 'ASSET1#BASE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfigTradeAsset.percentage * baseOrder.executedAssetQuantity!);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        expect(dcaTradingRepositoryMock.getLast).toHaveBeenCalledTimes(1);

        expect(dcaTradingRepositoryMock.save).toHaveBeenCalledTimes(1);
        const saveDcaTradingParams = dcaTradingRepositoryMock.save.mock.calls[0][0];
        expect(saveDcaTradingParams).toBeDefined();
        expect(saveDcaTradingParams).toEqual(result);
      });
    });

    describe('When there is a last dca trading that contain the first conditional trade asset', () => {
      let lastDcaTrading: DcaTrading;

      beforeEach(() => {
        lastDcaTrading = buildDefaultDcaTrading();
        lastDcaTrading.orders.push({ ...buildDefaultDcaTradingOrder(true), baseAsset: 'ASSET1' });
        dcaTradingRepositoryMock.getLast.mockResolvedValue(lastDcaTrading);
      });

      it('Then trade order is created with second trade asset', async () => {
        const baseOrder = buildDefaultOrder();
        const tradeOrder = buildDefaultOrder();

        createOrderServiceMock.create = jest.fn().mockImplementation((createOrder: CreateOrder) => {
          if (createOrder.symbol === 'BASE#QUOTE') {
            return baseOrder;
          } else if (createOrder.symbol === 'ASSET2#BASE') {
            return tradeOrder;
          } else {
            throw new Error(`Error on ${createOrder.symbol}`);
          }
        });

        dcaTradingRepositoryMock.save.mockImplementation((dcaTrading) => Promise.resolve(dcaTrading));

        const result = await processDcaTradingService.process(dcaTradingConfig);
        expect(result).toBeDefined();
        expect(result.id).toEqual(`${dcaTradingConfig.baseAsset}#${dcaTradingConfig.quoteAsset}/${creationDate.valueOf()}`);
        expect(result.success).toEqual(true);
        expect(result.creationDate).toEqual(creationDate);
        expect(result.orders).toBeDefined();
        expect(result.orders).toHaveLength(2);

        let resultOrder = getDcaTradingOrder(result.orders, 'BASE#QUOTE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toEqual(baseOrder.id);
        expect(resultOrder!.externalId).toEqual(baseOrder.externalId);
        expect(resultOrder!.success).toEqual(true);
        expect(resultOrder!.message).toBeUndefined();
        expect(resultOrder!.baseAsset).toEqual('BASE');
        expect(resultOrder!.quoteAsset).toEqual('QUOTE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfig.quoteAssetQuantity);
        expect(resultOrder!.executedQuantity).toEqual(baseOrder.executedAssetQuantity);
        expect(resultOrder!.executedPrice).toEqual(baseOrder.executedPrice);

        resultOrder = getDcaTradingOrder(result.orders, 'ASSET2#BASE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toEqual(tradeOrder.id);
        expect(resultOrder!.externalId).toEqual(tradeOrder.externalId);
        expect(resultOrder!.success).toEqual(true);
        expect(resultOrder!.message).toBeUndefined();
        expect(resultOrder!.baseAsset).toEqual('ASSET2');
        expect(resultOrder!.quoteAsset).toEqual('BASE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfigTradeAsset.percentage * baseOrder.executedAssetQuantity!);
        expect(resultOrder!.executedQuantity).toEqual(tradeOrder.executedAssetQuantity);
        expect(resultOrder!.executedPrice).toEqual(tradeOrder.executedPrice);

        expect(createOrderServiceMock.create).toHaveBeenCalledTimes(2);
        const createOrdersParams = createOrderServiceMock.create.mock.calls.map((call) => call[0]);

        let createOrderParams = getCreateOrder(createOrdersParams, 'BASE#QUOTE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfig.quoteAssetQuantity);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        createOrderParams = getCreateOrder(createOrdersParams, 'ASSET2#BASE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfigTradeAsset.percentage * baseOrder.executedAssetQuantity!);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        expect(dcaTradingRepositoryMock.getLast).toHaveBeenCalledTimes(1);

        expect(dcaTradingRepositoryMock.save).toHaveBeenCalledTimes(1);
        const saveDcaTradingParams = dcaTradingRepositoryMock.save.mock.calls[0][0];
        expect(saveDcaTradingParams).toBeDefined();
        expect(saveDcaTradingParams).toEqual(result);
      });
    });

    describe('When there is a last dca trading that contain the second conditional trade asset', () => {
      let lastDcaTrading: DcaTrading;

      beforeEach(() => {
        lastDcaTrading = buildDefaultDcaTrading();
        lastDcaTrading.orders.push({ ...buildDefaultDcaTradingOrder(true), baseAsset: 'ASSET2' });
        dcaTradingRepositoryMock.getLast.mockResolvedValue(lastDcaTrading);
      });

      it('Then trade order is created with third trade asset', async () => {
        const baseOrder = buildDefaultOrder();
        const tradeOrder = buildDefaultOrder();

        createOrderServiceMock.create = jest.fn().mockImplementation((createOrder: CreateOrder) => {
          if (createOrder.symbol === 'BASE#QUOTE') {
            return baseOrder;
          } else if (createOrder.symbol === 'ASSET3#BASE') {
            return tradeOrder;
          } else {
            throw new Error(`Error on ${createOrder.symbol}`);
          }
        });

        dcaTradingRepositoryMock.save.mockImplementation((dcaTrading) => Promise.resolve(dcaTrading));

        const result = await processDcaTradingService.process(dcaTradingConfig);
        expect(result).toBeDefined();
        expect(result.id).toEqual(`${dcaTradingConfig.baseAsset}#${dcaTradingConfig.quoteAsset}/${creationDate.valueOf()}`);
        expect(result.success).toEqual(true);
        expect(result.creationDate).toEqual(creationDate);
        expect(result.orders).toBeDefined();
        expect(result.orders).toHaveLength(2);

        let resultOrder = getDcaTradingOrder(result.orders, 'BASE#QUOTE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toEqual(baseOrder.id);
        expect(resultOrder!.externalId).toEqual(baseOrder.externalId);
        expect(resultOrder!.success).toEqual(true);
        expect(resultOrder!.message).toBeUndefined();
        expect(resultOrder!.baseAsset).toEqual('BASE');
        expect(resultOrder!.quoteAsset).toEqual('QUOTE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfig.quoteAssetQuantity);
        expect(resultOrder!.executedQuantity).toEqual(baseOrder.executedAssetQuantity);
        expect(resultOrder!.executedPrice).toEqual(baseOrder.executedPrice);

        resultOrder = getDcaTradingOrder(result.orders, 'ASSET3#BASE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toEqual(tradeOrder.id);
        expect(resultOrder!.externalId).toEqual(tradeOrder.externalId);
        expect(resultOrder!.success).toEqual(true);
        expect(resultOrder!.message).toBeUndefined();
        expect(resultOrder!.baseAsset).toEqual('ASSET3');
        expect(resultOrder!.quoteAsset).toEqual('BASE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfigTradeAsset.percentage * baseOrder.executedAssetQuantity!);
        expect(resultOrder!.executedQuantity).toEqual(tradeOrder.executedAssetQuantity);
        expect(resultOrder!.executedPrice).toEqual(tradeOrder.executedPrice);

        expect(createOrderServiceMock.create).toHaveBeenCalledTimes(2);
        const createOrdersParams = createOrderServiceMock.create.mock.calls.map((call) => call[0]);

        let createOrderParams = getCreateOrder(createOrdersParams, 'BASE#QUOTE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfig.quoteAssetQuantity);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        createOrderParams = getCreateOrder(createOrdersParams, 'ASSET3#BASE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfigTradeAsset.percentage * baseOrder.executedAssetQuantity!);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        expect(dcaTradingRepositoryMock.getLast).toHaveBeenCalledTimes(1);

        expect(dcaTradingRepositoryMock.save).toHaveBeenCalledTimes(1);
        const saveDcaTradingParams = dcaTradingRepositoryMock.save.mock.calls[0][0];
        expect(saveDcaTradingParams).toBeDefined();
        expect(saveDcaTradingParams).toEqual(result);
      });
    });

    describe('When there is a last dca trading that contain the third conditional trade asset', () => {
      let lastDcaTrading: DcaTrading;

      beforeEach(() => {
        lastDcaTrading = buildDefaultDcaTrading();
        lastDcaTrading.orders.push({ ...buildDefaultDcaTradingOrder(true), baseAsset: 'ASSET3' });
        dcaTradingRepositoryMock.getLast.mockResolvedValue(lastDcaTrading);
      });

      it('Then trade order is created with first trade asset', async () => {
        const baseOrder = buildDefaultOrder();
        const tradeOrder = buildDefaultOrder();

        createOrderServiceMock.create = jest.fn().mockImplementation((createOrder: CreateOrder) => {
          if (createOrder.symbol === 'BASE#QUOTE') {
            return baseOrder;
          } else if (createOrder.symbol === 'ASSET1#BASE') {
            return tradeOrder;
          } else {
            throw new Error(`Error on ${createOrder.symbol}`);
          }
        });

        dcaTradingRepositoryMock.save.mockImplementation((dcaTrading) => Promise.resolve(dcaTrading));

        const result = await processDcaTradingService.process(dcaTradingConfig);
        expect(result).toBeDefined();
        expect(result.id).toEqual(`${dcaTradingConfig.baseAsset}#${dcaTradingConfig.quoteAsset}/${creationDate.valueOf()}`);
        expect(result.success).toEqual(true);
        expect(result.creationDate).toEqual(creationDate);
        expect(result.orders).toBeDefined();
        expect(result.orders).toHaveLength(2);

        let resultOrder = getDcaTradingOrder(result.orders, 'BASE#QUOTE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toEqual(baseOrder.id);
        expect(resultOrder!.externalId).toEqual(baseOrder.externalId);
        expect(resultOrder!.success).toEqual(true);
        expect(resultOrder!.message).toBeUndefined();
        expect(resultOrder!.baseAsset).toEqual('BASE');
        expect(resultOrder!.quoteAsset).toEqual('QUOTE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfig.quoteAssetQuantity);
        expect(resultOrder!.executedQuantity).toEqual(baseOrder.executedAssetQuantity);
        expect(resultOrder!.executedPrice).toEqual(baseOrder.executedPrice);

        resultOrder = getDcaTradingOrder(result.orders, 'ASSET1#BASE');
        expect(resultOrder).toBeDefined();
        expect(resultOrder!.id).toEqual(tradeOrder.id);
        expect(resultOrder!.externalId).toEqual(tradeOrder.externalId);
        expect(resultOrder!.success).toEqual(true);
        expect(resultOrder!.message).toBeUndefined();
        expect(resultOrder!.baseAsset).toEqual('ASSET1');
        expect(resultOrder!.quoteAsset).toEqual('BASE');
        expect(resultOrder!.requestedQuantity).toEqual(dcaTradingConfigTradeAsset.percentage * baseOrder.executedAssetQuantity!);
        expect(resultOrder!.executedQuantity).toEqual(tradeOrder.executedAssetQuantity);
        expect(resultOrder!.executedPrice).toEqual(tradeOrder.executedPrice);

        expect(createOrderServiceMock.create).toHaveBeenCalledTimes(2);
        const createOrdersParams = createOrderServiceMock.create.mock.calls.map((call) => call[0]);

        let createOrderParams = getCreateOrder(createOrdersParams, 'BASE#QUOTE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfig.quoteAssetQuantity);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        createOrderParams = getCreateOrder(createOrdersParams, 'ASSET1#BASE');
        expect(createOrderParams).toBeDefined();
        expect(createOrderParams!.side).toEqual('Buy');
        expect(createOrderParams!.type).toEqual('Market');
        expect(createOrderParams!.baseAssetQuantity).toBeUndefined();
        expect(createOrderParams!.quoteAssetQuantity).toEqual(dcaTradingConfigTradeAsset.percentage * baseOrder.executedAssetQuantity!);
        expect(createOrderParams!.priceThreshold).toBeUndefined();

        expect(dcaTradingRepositoryMock.getLast).toHaveBeenCalledTimes(1);

        expect(dcaTradingRepositoryMock.save).toHaveBeenCalledTimes(1);
        const saveDcaTradingParams = dcaTradingRepositoryMock.save.mock.calls[0][0];
        expect(saveDcaTradingParams).toBeDefined();
        expect(saveDcaTradingParams).toEqual(result);
      });
    });
  });
});

const getCreateOrder = (createOrders: CreateOrder[], symbol: string): CreateOrder | undefined => {
  return createOrders.find((createOrder) => createOrder.symbol === symbol);
};

const getDcaTradingOrder = (orders: DcaTradingOrder[], symbol: string): DcaTradingOrder | undefined => {
  return orders.find((order) => order.symbol === symbol);
};
