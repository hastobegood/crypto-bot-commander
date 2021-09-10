import { mocked } from 'ts-jest/utils';
import { StrategyStepRepository } from '../../../../../src/code/domain/strategy/step/strategy-step-repository';
import { Strategy } from '../../../../../src/code/domain/strategy/model/strategy';
import { SendOrderStepInput, SendOrderStepOutput, StrategyStep } from '../../../../../src/code/domain/strategy/model/strategy-step';
import { buildDefaultStrategy } from '../../../../builders/domain/strategy/strategy-test-builder';
import { SendOrderStepService } from '../../../../../src/code/domain/strategy/step/send-order-step-service';
import { Order } from '../../../../../src/code/domain/order/model/order';
import { buildDefaultSendOrderStepOutput, buildDefaultStrategyStepTemplate, buildSendOrderStepInput, buildStrategyStep } from '../../../../builders/domain/strategy/strategy-step-test-builder';
import { buildDefaultOrder } from '../../../../builders/domain/order/order-test-builder';
import { CreateOrderService } from '../../../../../src/code/domain/order/create-order-service';

const createOrderServiceMock = mocked(jest.genMockFromModule<CreateOrderService>('../../../../../src/code/domain/order/create-order-service'), true);
const strategyStepRepositoryMock = mocked(jest.genMockFromModule<StrategyStepRepository>('../../../../../src/code/domain/strategy/step/strategy-step-repository'), true);

let sendOrderStepService: SendOrderStepService;
beforeEach(() => {
  createOrderServiceMock.create = jest.fn();
  strategyStepRepositoryMock.getLastSendOrderByStrategyIdAndOrderSide = jest.fn();

  sendOrderStepService = new SendOrderStepService(createOrderServiceMock, strategyStepRepositoryMock);
});

describe('SendOrderStepService', () => {
  let strategy: Strategy;
  let sendOrderStepInput: SendOrderStepInput;
  let order: Order;

  beforeEach(() => {
    strategy = buildDefaultStrategy();
  });

  describe('Given the strategy step type to retrieve', () => {
    it('Then send order type is returned', async () => {
      expect(sendOrderStepService.getType()).toEqual('SendOrder');
    });
  });

  describe('Given a send order step to process', () => {
    describe('When source is from budget', () => {
      beforeEach(() => {
        strategy.budget.availableBaseAssetQuantity = 10;
        strategy.budget.availableQuoteAssetQuantity = 100;
      });

      describe('And buy order is filled', () => {
        beforeEach(() => {
          sendOrderStepInput = buildSendOrderStepInput('Budget', 0.8, 'Buy', 'Market');

          order = buildDefaultOrder();
          createOrderServiceMock.create.mockResolvedValue(order);
        });

        it('Then send order step is a success', async () => {
          const result = await sendOrderStepService.process(strategy, sendOrderStepInput);
          expect(result).toEqual({
            success: true,
            id: order.id,
            status: order.status,
            externalId: order.externalId!,
            externalStatus: order.externalStatus!,
            quantity: order.executedAssetQuantity,
            price: order.executedPrice,
          });

          expect(strategyStepRepositoryMock.getLastSendOrderByStrategyIdAndOrderSide).toHaveBeenCalledTimes(0);

          expect(createOrderServiceMock.create).toHaveBeenCalledTimes(1);
          const createParams = createOrderServiceMock.create.mock.calls[0];
          expect(createParams.length).toEqual(1);
          expect(createParams[0]).toEqual({
            symbol: strategy.symbol,
            side: 'Buy',
            type: 'Market',
            baseAssetQuantity: undefined,
            quoteAssetQuantity: 80,
          });
        });
      });

      describe('And buy order is not filled', () => {
        beforeEach(() => {
          sendOrderStepInput = buildSendOrderStepInput('Budget', 0.8, 'Buy', 'Market');

          order = { ...buildDefaultOrder(), externalId: undefined, status: 'Error', executedAssetQuantity: undefined, executedPrice: undefined };
          createOrderServiceMock.create.mockResolvedValue(order);
        });

        it('Then send order step is not a success', async () => {
          const result = await sendOrderStepService.process(strategy, sendOrderStepInput);
          expect(result).toEqual({
            success: false,
            id: order.id,
            status: order.status,
            externalStatus: order.externalStatus!,
          });

          expect(strategyStepRepositoryMock.getLastSendOrderByStrategyIdAndOrderSide).toHaveBeenCalledTimes(0);

          expect(createOrderServiceMock.create).toHaveBeenCalledTimes(1);
          const createParams = createOrderServiceMock.create.mock.calls[0];
          expect(createParams.length).toEqual(1);
          expect(createParams[0]).toEqual({
            symbol: strategy.symbol,
            side: 'Buy',
            type: 'Market',
            baseAssetQuantity: undefined,
            quoteAssetQuantity: 80,
          });
        });
      });

      describe('And sell order is filled', () => {
        beforeEach(() => {
          sendOrderStepInput = buildSendOrderStepInput('Budget', 0.5, 'Sell', 'Market');

          order = buildDefaultOrder();
          createOrderServiceMock.create.mockResolvedValue(order);
        });

        it('Then send order step is a success', async () => {
          const result = await sendOrderStepService.process(strategy, sendOrderStepInput);
          expect(result).toEqual({
            success: true,
            id: order.id,
            status: order.status,
            externalId: order.externalId!,
            externalStatus: order.externalStatus!,
            quantity: order.executedAssetQuantity,
            price: order.executedPrice,
          });

          expect(strategyStepRepositoryMock.getLastSendOrderByStrategyIdAndOrderSide).toHaveBeenCalledTimes(0);

          expect(createOrderServiceMock.create).toHaveBeenCalledTimes(1);
          const createParams = createOrderServiceMock.create.mock.calls[0];
          expect(createParams.length).toEqual(1);
          expect(createParams[0]).toEqual({
            symbol: strategy.symbol,
            side: 'Sell',
            type: 'Market',
            baseAssetQuantity: 5,
            quoteAssetQuantity: undefined,
          });
        });
      });

      describe('And sell order is not filled', () => {
        beforeEach(() => {
          sendOrderStepInput = buildSendOrderStepInput('Budget', 0.5, 'Sell', 'Market');

          order = { ...buildDefaultOrder(), externalId: undefined, status: 'Error', executedAssetQuantity: undefined, executedPrice: undefined };
          createOrderServiceMock.create.mockResolvedValue(order);
        });

        it('Then send order step is not a success', async () => {
          const result = await sendOrderStepService.process(strategy, sendOrderStepInput);
          expect(result).toEqual({
            success: false,
            id: order.id,
            status: order.status,
            externalStatus: order.externalStatus!,
          });

          expect(strategyStepRepositoryMock.getLastSendOrderByStrategyIdAndOrderSide).toHaveBeenCalledTimes(0);

          expect(createOrderServiceMock.create).toHaveBeenCalledTimes(1);
          const createParams = createOrderServiceMock.create.mock.calls[0];
          expect(createParams.length).toEqual(1);
          expect(createParams[0]).toEqual({
            symbol: strategy.symbol,
            side: 'Sell',
            type: 'Market',
            baseAssetQuantity: 5,
            quoteAssetQuantity: undefined,
          });
        });
      });
    });

    describe('When source is from last order', () => {
      let lastOrderStep: StrategyStep;

      describe('And buy order is filled', () => {
        beforeEach(() => {
          sendOrderStepInput = buildSendOrderStepInput('LastOrder', 0.9, 'Buy', 'Market');
        });

        it('Then error is thrown', async () => {
          try {
            await sendOrderStepService.process(strategy, sendOrderStepInput);
            fail('An error should have been thrown');
          } catch (error) {
            expect(error).toBeDefined();
            expect((error as Error).message).toEqual('Unable to send buy order from last order source');
          }

          expect(strategyStepRepositoryMock.getLastSendOrderByStrategyIdAndOrderSide).toHaveBeenCalledTimes(0);
          expect(createOrderServiceMock.create).toHaveBeenCalledTimes(0);
        });
      });

      describe('And sell order is filled', () => {
        beforeEach(() => {
          sendOrderStepInput = buildSendOrderStepInput('LastOrder', 0.9, 'Sell', 'Market');

          order = buildDefaultOrder();
          createOrderServiceMock.create.mockResolvedValue(order);
        });

        describe('And last order step is missing', () => {
          beforeEach(() => {
            strategyStepRepositoryMock.getLastSendOrderByStrategyIdAndOrderSide.mockResolvedValue(null);
          });

          it('Then error is thrown', async () => {
            try {
              await sendOrderStepService.process(strategy, sendOrderStepInput);
              fail('An error should have been thrown');
            } catch (error) {
              expect(error).toBeDefined();
              expect((error as Error).message).toEqual('Unable to calculate sell quantity without last order');
            }

            expect(strategyStepRepositoryMock.getLastSendOrderByStrategyIdAndOrderSide).toHaveBeenCalledTimes(1);
            const getLastSendOrderByStrategyIdAndOrderSideParams = strategyStepRepositoryMock.getLastSendOrderByStrategyIdAndOrderSide.mock.calls[0];
            expect(getLastSendOrderByStrategyIdAndOrderSideParams.length).toEqual(2);
            expect(getLastSendOrderByStrategyIdAndOrderSideParams[0]).toEqual(strategy.id);
            expect(getLastSendOrderByStrategyIdAndOrderSideParams[1]).toEqual('Buy');

            expect(createOrderServiceMock.create).toHaveBeenCalledTimes(0);
          });
        });

        describe('And last order step is not missing', () => {
          beforeEach(() => {
            lastOrderStep = buildStrategyStep(buildDefaultStrategyStepTemplate(), strategy.id, buildDefaultSendOrderStepOutput(true));
            strategyStepRepositoryMock.getLastSendOrderByStrategyIdAndOrderSide.mockResolvedValue(lastOrderStep);
          });

          it('Then send order step is a success', async () => {
            const result = await sendOrderStepService.process(strategy, sendOrderStepInput);
            expect(result).toEqual({
              success: true,
              id: order.id,
              status: order.status,
              externalId: order.externalId!,
              externalStatus: order.externalStatus!,
              quantity: order.executedAssetQuantity,
              price: order.executedPrice,
            });

            expect(strategyStepRepositoryMock.getLastSendOrderByStrategyIdAndOrderSide).toHaveBeenCalledTimes(1);
            const getLastSendOrderByStrategyIdAndOrderSideParams = strategyStepRepositoryMock.getLastSendOrderByStrategyIdAndOrderSide.mock.calls[0];
            expect(getLastSendOrderByStrategyIdAndOrderSideParams.length).toEqual(2);
            expect(getLastSendOrderByStrategyIdAndOrderSideParams[0]).toEqual(strategy.id);
            expect(getLastSendOrderByStrategyIdAndOrderSideParams[1]).toEqual('Buy');

            expect(createOrderServiceMock.create).toHaveBeenCalledTimes(1);
            const createParams = createOrderServiceMock.create.mock.calls[0];
            expect(createParams.length).toEqual(1);
            expect(createParams[0]).toEqual({
              symbol: strategy.symbol,
              side: 'Sell',
              type: 'Market',
              baseAssetQuantity: (lastOrderStep.output as SendOrderStepOutput).quantity! * sendOrderStepInput.percentage,
              quoteAssetQuantity: undefined,
            });
          });
        });
      });
    });
  });
});
