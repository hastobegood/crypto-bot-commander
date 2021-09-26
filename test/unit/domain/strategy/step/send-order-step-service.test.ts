import { mocked } from 'ts-jest/utils';
import { StrategyStepRepository } from '../../../../../src/code/domain/strategy/step/strategy-step-repository';
import { Strategy, StrategyWallet } from '../../../../../src/code/domain/strategy/model/strategy';
import { CheckOrderStepOutput, SendOrderStepInput, StrategyStep } from '../../../../../src/code/domain/strategy/model/strategy-step';
import { buildDefaultStrategy, buildDefaultStrategyWallet } from '../../../../builders/domain/strategy/strategy-test-builder';
import { SendOrderStepService } from '../../../../../src/code/domain/strategy/step/send-order-step-service';
import { Order } from '../../../../../src/code/domain/order/model/order';
import { buildDefaultCheckOrderStepOutput, buildDefaultStrategyStepTemplate, buildSendOrderStepInput, buildStrategyStep } from '../../../../builders/domain/strategy/strategy-step-test-builder';
import { buildDefaultLimitOrder, buildDefaultOrder } from '../../../../builders/domain/order/order-test-builder';
import { CreateOrderService } from '../../../../../src/code/domain/order/create-order-service';
import { GetCandlestickService } from '../../../../../src/code/domain/candlestick/get-candlestick-service';
import { Candlestick } from '../../../../../src/code/domain/candlestick/model/candlestick';
import { buildDefaultCandlestick } from '../../../../builders/domain/candlestick/candlestick-test-builder';
import { GetStrategyService } from '../../../../../src/code/domain/strategy/get-strategy-service';

const createOrderServiceMock = mocked(jest.genMockFromModule<CreateOrderService>('../../../../../src/code/domain/order/create-order-service'), true);
const getStrategyServiceMock = mocked(jest.genMockFromModule<GetStrategyService>('../../../../../src/code/domain/strategy/get-strategy-service'), true);
const getCandlestickServiceMock = mocked(jest.genMockFromModule<GetCandlestickService>('../../../../../src/code/domain/candlestick/get-candlestick-service'), true);
const strategyStepRepositoryMock = mocked(jest.genMockFromModule<StrategyStepRepository>('../../../../../src/code/domain/strategy/step/strategy-step-repository'), true);

let sendOrderStepService: SendOrderStepService;
beforeEach(() => {
  getStrategyServiceMock.getWalletById = jest.fn();
  createOrderServiceMock.create = jest.fn();
  getCandlestickServiceMock.getLastBySymbol = jest.fn();
  strategyStepRepositoryMock.getLastByStrategyIdAndType = jest.fn();

  sendOrderStepService = new SendOrderStepService(getStrategyServiceMock, createOrderServiceMock, getCandlestickServiceMock, strategyStepRepositoryMock);
});

describe('SendOrderStepService', () => {
  let strategy: Strategy;
  let wallet: StrategyWallet;
  let sendOrderStepInput: SendOrderStepInput;
  let order: Order;

  beforeEach(() => {
    strategy = buildDefaultStrategy();
    wallet = { ...buildDefaultStrategyWallet(), availableBaseAssetQuantity: 10, availableQuoteAssetQuantity: 100 };
  });

  describe('Given the strategy step type to retrieve', () => {
    it('Then send order type is returned', async () => {
      expect(sendOrderStepService.getType()).toEqual('SendOrder');
    });
  });

  describe('Given a send market order step to process', () => {
    afterEach(() => {
      expect(getCandlestickServiceMock.getLastBySymbol).toHaveBeenCalledTimes(0);
    });

    describe('When strategy wallet is missing', () => {
      beforeEach(() => {
        sendOrderStepInput = buildSendOrderStepInput('Wallet', 0.8, 'Buy', 'Market');
      });

      it('Then error is thrown', async () => {
        try {
          await sendOrderStepService.process(strategy, sendOrderStepInput);
          fail();
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual('Unable to send order without strategy wallet');
        }

        expect(getStrategyServiceMock.getWalletById).toHaveBeenCalledTimes(1);
        const getWalletByIdParams = getStrategyServiceMock.getWalletById.mock.calls[0];
        expect(getWalletByIdParams.length).toEqual(1);
        expect(getWalletByIdParams[0]).toEqual(strategy.id);

        expect(getCandlestickServiceMock.getLastBySymbol).toHaveBeenCalledTimes(0);
        expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(0);
        expect(createOrderServiceMock.create).toHaveBeenCalledTimes(0);
      });
    });

    describe('When source is from wallet', () => {
      beforeEach(() => {
        getStrategyServiceMock.getWalletById.mockResolvedValue(wallet);
      });

      afterEach(() => {
        expect(getStrategyServiceMock.getWalletById).toHaveBeenCalledTimes(1);
        const getWalletByIdParams = getStrategyServiceMock.getWalletById.mock.calls[0];
        expect(getWalletByIdParams.length).toEqual(1);
        expect(getWalletByIdParams[0]).toEqual(strategy.id);
      });

      describe('And buy order is filled', () => {
        beforeEach(() => {
          sendOrderStepInput = buildSendOrderStepInput('Wallet', 0.8, 'Buy', 'Market');

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
            baseAssetQuantity: order.baseAssetQuantity,
            quoteAssetQuantity: order.quoteAssetQuantity,
            priceLimit: order.priceLimit,
          });

          expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(0);

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
          sendOrderStepInput = buildSendOrderStepInput('Wallet', 0.8, 'Buy', 'Market');

          order = {
            ...buildDefaultOrder(),
            externalId: undefined,
            status: 'Error',
            executedAssetQuantity: undefined,
            executedPrice: undefined,
          };
          createOrderServiceMock.create.mockResolvedValue(order);
        });

        it('Then send order step is a success', async () => {
          const result = await sendOrderStepService.process(strategy, sendOrderStepInput);
          expect(result).toEqual({
            success: true,
            id: order.id,
            status: order.status,
            externalStatus: order.externalStatus!,
            baseAssetQuantity: order.baseAssetQuantity,
            quoteAssetQuantity: order.quoteAssetQuantity,
            priceLimit: order.priceLimit,
          });

          expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(0);

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
          sendOrderStepInput = buildSendOrderStepInput('Wallet', 0.5, 'Sell', 'Market');

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
            baseAssetQuantity: order.baseAssetQuantity,
            quoteAssetQuantity: order.quoteAssetQuantity,
            priceLimit: order.priceLimit,
          });

          expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(0);

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
          sendOrderStepInput = buildSendOrderStepInput('Wallet', 0.5, 'Sell', 'Market');

          order = {
            ...buildDefaultOrder(),
            externalId: undefined,
            status: 'Error',
            executedAssetQuantity: undefined,
            executedPrice: undefined,
          };
          createOrderServiceMock.create.mockResolvedValue(order);
        });

        it('Then send order step is a success', async () => {
          const result = await sendOrderStepService.process(strategy, sendOrderStepInput);
          expect(result).toEqual({
            success: true,
            id: order.id,
            status: order.status,
            externalStatus: order.externalStatus!,
            baseAssetQuantity: order.baseAssetQuantity,
            quoteAssetQuantity: order.quoteAssetQuantity,
            priceLimit: order.priceLimit,
          });

          expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(0);

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

      beforeEach(() => {
        getStrategyServiceMock.getWalletById.mockResolvedValue(wallet);
      });

      afterEach(() => {
        expect(getStrategyServiceMock.getWalletById).toHaveBeenCalledTimes(1);
        const getWalletByIdParams = getStrategyServiceMock.getWalletById.mock.calls[0];
        expect(getWalletByIdParams.length).toEqual(1);
        expect(getWalletByIdParams[0]).toEqual(strategy.id);
      });

      describe('And buy order is filled', () => {
        beforeEach(() => {
          sendOrderStepInput = buildSendOrderStepInput('LastOrder', 0.9, 'Buy', 'Market');

          order = buildDefaultOrder();
          createOrderServiceMock.create.mockResolvedValue(order);
        });

        describe('And last order step is missing', () => {
          beforeEach(() => {
            strategyStepRepositoryMock.getLastByStrategyIdAndType.mockResolvedValue(null);
          });

          it('Then error is thrown', async () => {
            try {
              await sendOrderStepService.process(strategy, sendOrderStepInput);
              fail();
            } catch (error) {
              expect(error).toBeDefined();
              expect((error as Error).message).toEqual('Unable to calculate quantity without last order');
            }

            expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(1);
            const getLastByStrategyIdAndTypeParams = strategyStepRepositoryMock.getLastByStrategyIdAndType.mock.calls[0];
            expect(getLastByStrategyIdAndTypeParams.length).toEqual(2);
            expect(getLastByStrategyIdAndTypeParams[0]).toEqual(strategy.id);
            expect(getLastByStrategyIdAndTypeParams[1]).toEqual('CheckOrder');

            expect(createOrderServiceMock.create).toHaveBeenCalledTimes(0);
          });
        });

        describe('And last order step is not missing', () => {
          beforeEach(() => {
            lastOrderStep = buildStrategyStep(buildDefaultStrategyStepTemplate(), strategy.id, buildDefaultCheckOrderStepOutput(true));
            strategyStepRepositoryMock.getLastByStrategyIdAndType.mockResolvedValue(lastOrderStep);
          });

          it('Then send order step is a success', async () => {
            const result = await sendOrderStepService.process(strategy, sendOrderStepInput);
            expect(result).toEqual({
              success: true,
              id: order.id,
              status: order.status,
              externalId: order.externalId!,
              externalStatus: order.externalStatus!,
              baseAssetQuantity: order.baseAssetQuantity,
              quoteAssetQuantity: order.quoteAssetQuantity,
              priceLimit: order.priceLimit,
            });

            expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(1);
            const getLastByStrategyIdAndTypeParams = strategyStepRepositoryMock.getLastByStrategyIdAndType.mock.calls[0];
            expect(getLastByStrategyIdAndTypeParams.length).toEqual(2);
            expect(getLastByStrategyIdAndTypeParams[0]).toEqual(strategy.id);
            expect(getLastByStrategyIdAndTypeParams[1]).toEqual('CheckOrder');

            expect(createOrderServiceMock.create).toHaveBeenCalledTimes(1);
            const createParams = createOrderServiceMock.create.mock.calls[0];
            expect(createParams.length).toEqual(1);
            expect(createParams[0]).toEqual({
              symbol: strategy.symbol,
              side: 'Buy',
              type: 'Market',
              baseAssetQuantity: (lastOrderStep.output as CheckOrderStepOutput).quantity! * sendOrderStepInput.percentage,
              quoteAssetQuantity: undefined,
            });
          });
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
            strategyStepRepositoryMock.getLastByStrategyIdAndType.mockResolvedValue(null);
          });

          it('Then error is thrown', async () => {
            try {
              await sendOrderStepService.process(strategy, sendOrderStepInput);
              fail();
            } catch (error) {
              expect(error).toBeDefined();
              expect((error as Error).message).toEqual('Unable to calculate quantity without last order');
            }

            expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(1);
            const getLastByStrategyIdAndTypeParams = strategyStepRepositoryMock.getLastByStrategyIdAndType.mock.calls[0];
            expect(getLastByStrategyIdAndTypeParams.length).toEqual(2);
            expect(getLastByStrategyIdAndTypeParams[0]).toEqual(strategy.id);
            expect(getLastByStrategyIdAndTypeParams[1]).toEqual('CheckOrder');

            expect(createOrderServiceMock.create).toHaveBeenCalledTimes(0);
          });
        });

        describe('And last order step is not missing', () => {
          beforeEach(() => {
            lastOrderStep = buildStrategyStep(buildDefaultStrategyStepTemplate(), strategy.id, buildDefaultCheckOrderStepOutput(true));
            strategyStepRepositoryMock.getLastByStrategyIdAndType.mockResolvedValue(lastOrderStep);
          });

          it('Then send order step is a success', async () => {
            const result = await sendOrderStepService.process(strategy, sendOrderStepInput);
            expect(result).toEqual({
              success: true,
              id: order.id,
              status: order.status,
              externalId: order.externalId!,
              externalStatus: order.externalStatus!,
              baseAssetQuantity: order.baseAssetQuantity,
              quoteAssetQuantity: order.quoteAssetQuantity,
              priceLimit: order.priceLimit,
            });

            expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(1);
            const getLastByStrategyIdAndTypeParams = strategyStepRepositoryMock.getLastByStrategyIdAndType.mock.calls[0];
            expect(getLastByStrategyIdAndTypeParams.length).toEqual(2);
            expect(getLastByStrategyIdAndTypeParams[0]).toEqual(strategy.id);
            expect(getLastByStrategyIdAndTypeParams[1]).toEqual('CheckOrder');

            expect(createOrderServiceMock.create).toHaveBeenCalledTimes(1);
            const createParams = createOrderServiceMock.create.mock.calls[0];
            expect(createParams.length).toEqual(1);
            expect(createParams[0]).toEqual({
              symbol: strategy.symbol,
              side: 'Sell',
              type: 'Market',
              baseAssetQuantity: (lastOrderStep.output as CheckOrderStepOutput).quantity! * sendOrderStepInput.percentage,
              quoteAssetQuantity: undefined,
            });
          });
        });
      });
    });
  });

  describe('Given a send limit order step to process', () => {
    describe('When deviation is missing', () => {
      beforeEach(() => {
        sendOrderStepInput = buildSendOrderStepInput('Wallet', 0.8, 'Buy', 'Limit');
      });

      it('Then error is thrown', async () => {
        try {
          await sendOrderStepService.process(strategy, sendOrderStepInput);
          fail();
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual('Unable to send limit order without deviation');
        }

        expect(getStrategyServiceMock.getWalletById).toHaveBeenCalledTimes(0);
        expect(getCandlestickServiceMock.getLastBySymbol).toHaveBeenCalledTimes(0);
        expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(0);
        expect(createOrderServiceMock.create).toHaveBeenCalledTimes(0);
      });
    });

    describe('When strategy wallet is missing', () => {
      beforeEach(() => {
        sendOrderStepInput = buildSendOrderStepInput('Wallet', 0.8, 'Buy', 'Limit', 0.1);
      });

      it('Then error is thrown', async () => {
        try {
          await sendOrderStepService.process(strategy, sendOrderStepInput);
          fail();
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual('Unable to send order without strategy wallet');
        }

        expect(getStrategyServiceMock.getWalletById).toHaveBeenCalledTimes(1);
        const getWalletByIdParams = getStrategyServiceMock.getWalletById.mock.calls[0];
        expect(getWalletByIdParams.length).toEqual(1);
        expect(getWalletByIdParams[0]).toEqual(strategy.id);

        expect(getCandlestickServiceMock.getLastBySymbol).toHaveBeenCalledTimes(0);
        expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(0);
        expect(createOrderServiceMock.create).toHaveBeenCalledTimes(0);
      });
    });

    describe('When source is from wallet', () => {
      let lastCandlestick: Candlestick;

      beforeEach(() => {
        getStrategyServiceMock.getWalletById.mockResolvedValue(wallet);
      });

      afterEach(() => {
        expect(getStrategyServiceMock.getWalletById).toHaveBeenCalledTimes(1);
        const getWalletByIdParams = getStrategyServiceMock.getWalletById.mock.calls[0];
        expect(getWalletByIdParams.length).toEqual(1);
        expect(getWalletByIdParams[0]).toEqual(strategy.id);
      });

      describe('And last candlestick is missing', () => {
        beforeEach(() => {
          sendOrderStepInput = buildSendOrderStepInput('Wallet', 0.8, 'Buy', 'Limit', 0.1);
        });

        it('Then error is thrown', async () => {
          try {
            await sendOrderStepService.process(strategy, sendOrderStepInput);
            fail();
          } catch (error) {
            expect(error).toBeDefined();
            expect((error as Error).message).toEqual('Unable to send limit order without last candlestick');
          }

          expect(getCandlestickServiceMock.getLastBySymbol).toHaveBeenCalledTimes(1);
          const getLastBySymbolParams = getCandlestickServiceMock.getLastBySymbol.mock.calls[0];
          expect(getLastBySymbolParams.length).toEqual(1);
          expect(getLastBySymbolParams[0]).toEqual(strategy.symbol);

          expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(0);
          expect(createOrderServiceMock.create).toHaveBeenCalledTimes(0);
        });
      });

      describe('And buy order is filled', () => {
        beforeEach(() => {
          sendOrderStepInput = buildSendOrderStepInput('Wallet', 0.8, 'Buy', 'Limit', -0.1);

          lastCandlestick = buildDefaultCandlestick();
          getCandlestickServiceMock.getLastBySymbol.mockResolvedValue(lastCandlestick);

          order = buildDefaultLimitOrder();
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
            baseAssetQuantity: order.baseAssetQuantity,
            quoteAssetQuantity: order.quoteAssetQuantity,
            priceLimit: order.priceLimit,
          });

          expect(getCandlestickServiceMock.getLastBySymbol).toHaveBeenCalledTimes(1);
          const getLastBySymbolParams = getCandlestickServiceMock.getLastBySymbol.mock.calls[0];
          expect(getLastBySymbolParams.length).toEqual(1);
          expect(getLastBySymbolParams[0]).toEqual(strategy.symbol);

          expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(0);

          expect(createOrderServiceMock.create).toHaveBeenCalledTimes(1);
          const createParams = createOrderServiceMock.create.mock.calls[0];
          expect(createParams.length).toEqual(1);
          expect(createParams[0]).toEqual({
            symbol: strategy.symbol,
            side: 'Buy',
            type: 'Limit',
            baseAssetQuantity: 80 / (lastCandlestick.closingPrice * (1 + sendOrderStepInput.deviation!)),
            priceLimit: lastCandlestick.closingPrice * (1 + sendOrderStepInput.deviation!),
          });
        });
      });

      describe('And buy order is not filled', () => {
        beforeEach(() => {
          sendOrderStepInput = buildSendOrderStepInput('Wallet', 0.8, 'Buy', 'Limit', -0.2);

          lastCandlestick = buildDefaultCandlestick();
          getCandlestickServiceMock.getLastBySymbol.mockResolvedValue(lastCandlestick);

          order = {
            ...buildDefaultLimitOrder(),
            status: 'Waiting',
            executedAssetQuantity: undefined,
            executedPrice: undefined,
          };
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
            baseAssetQuantity: order.baseAssetQuantity,
            quoteAssetQuantity: order.quoteAssetQuantity,
            priceLimit: order.priceLimit,
          });

          expect(getCandlestickServiceMock.getLastBySymbol).toHaveBeenCalledTimes(1);
          const getLastBySymbolParams = getCandlestickServiceMock.getLastBySymbol.mock.calls[0];
          expect(getLastBySymbolParams.length).toEqual(1);
          expect(getLastBySymbolParams[0]).toEqual(strategy.symbol);

          expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(0);

          expect(createOrderServiceMock.create).toHaveBeenCalledTimes(1);
          const createParams = createOrderServiceMock.create.mock.calls[0];
          expect(createParams.length).toEqual(1);
          expect(createParams[0]).toEqual({
            symbol: strategy.symbol,
            side: 'Buy',
            type: 'Limit',
            baseAssetQuantity: 80 / (lastCandlestick.closingPrice * (1 + sendOrderStepInput.deviation!)),
            priceLimit: lastCandlestick.closingPrice * (1 + sendOrderStepInput.deviation!),
          });
        });
      });

      describe('And sell order is filled', () => {
        beforeEach(() => {
          sendOrderStepInput = buildSendOrderStepInput('Wallet', 0.5, 'Sell', 'Limit', 0.15);

          lastCandlestick = buildDefaultCandlestick();
          getCandlestickServiceMock.getLastBySymbol.mockResolvedValue(lastCandlestick);

          order = buildDefaultLimitOrder();
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
            baseAssetQuantity: order.baseAssetQuantity,
            quoteAssetQuantity: order.quoteAssetQuantity,
            priceLimit: order.priceLimit,
          });

          expect(getCandlestickServiceMock.getLastBySymbol).toHaveBeenCalledTimes(1);
          const getLastBySymbolParams = getCandlestickServiceMock.getLastBySymbol.mock.calls[0];
          expect(getLastBySymbolParams.length).toEqual(1);
          expect(getLastBySymbolParams[0]).toEqual(strategy.symbol);

          expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(0);

          expect(createOrderServiceMock.create).toHaveBeenCalledTimes(1);
          const createParams = createOrderServiceMock.create.mock.calls[0];
          expect(createParams.length).toEqual(1);
          expect(createParams[0]).toEqual({
            symbol: strategy.symbol,
            side: 'Sell',
            type: 'Limit',
            baseAssetQuantity: 5,
            quoteAssetQuantity: undefined,
            priceLimit: lastCandlestick.closingPrice * (1 + sendOrderStepInput.deviation!),
          });
        });
      });

      describe('And sell order is not filled', () => {
        beforeEach(() => {
          sendOrderStepInput = buildSendOrderStepInput('Wallet', 0.5, 'Sell', 'Limit', 0.5);

          lastCandlestick = buildDefaultCandlestick();
          getCandlestickServiceMock.getLastBySymbol.mockResolvedValue(lastCandlestick);

          order = {
            ...buildDefaultOrder(),
            status: 'Waiting',
            executedAssetQuantity: undefined,
            executedPrice: undefined,
          };
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
            baseAssetQuantity: order.baseAssetQuantity,
            quoteAssetQuantity: order.quoteAssetQuantity,
            priceLimit: order.priceLimit,
          });

          expect(getCandlestickServiceMock.getLastBySymbol).toHaveBeenCalledTimes(1);
          const getLastBySymbolParams = getCandlestickServiceMock.getLastBySymbol.mock.calls[0];
          expect(getLastBySymbolParams.length).toEqual(1);
          expect(getLastBySymbolParams[0]).toEqual(strategy.symbol);

          expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(0);

          expect(createOrderServiceMock.create).toHaveBeenCalledTimes(1);
          const createParams = createOrderServiceMock.create.mock.calls[0];
          expect(createParams.length).toEqual(1);
          expect(createParams[0]).toEqual({
            symbol: strategy.symbol,
            side: 'Sell',
            type: 'Limit',
            baseAssetQuantity: 5,
            quoteAssetQuantity: undefined,
            priceLimit: lastCandlestick.closingPrice * (1 + sendOrderStepInput.deviation!),
          });
        });
      });
    });

    describe('When source is from last order', () => {
      let lastOrderStep: StrategyStep;

      beforeEach(() => {
        getStrategyServiceMock.getWalletById.mockResolvedValue(wallet);
      });

      afterEach(() => {
        expect(getStrategyServiceMock.getWalletById).toHaveBeenCalledTimes(1);
        const getWalletByIdParams = getStrategyServiceMock.getWalletById.mock.calls[0];
        expect(getWalletByIdParams.length).toEqual(1);
        expect(getWalletByIdParams[0]).toEqual(strategy.id);

        expect(getCandlestickServiceMock.getLastBySymbol).toHaveBeenCalledTimes(0);
      });

      describe('And buy order is filled', () => {
        beforeEach(() => {
          sendOrderStepInput = buildSendOrderStepInput('LastOrder', 0.9, 'Buy', 'Limit', -0.05);

          order = buildDefaultLimitOrder();
          createOrderServiceMock.create.mockResolvedValue(order);
        });

        describe('And last order step is missing', () => {
          beforeEach(() => {
            strategyStepRepositoryMock.getLastByStrategyIdAndType.mockResolvedValue(null);
          });

          it('Then error is thrown', async () => {
            try {
              await sendOrderStepService.process(strategy, sendOrderStepInput);
              fail();
            } catch (error) {
              expect(error).toBeDefined();
              expect((error as Error).message).toEqual('Unable to calculate quantity without last order');
            }

            expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(1);
            const getLastByStrategyIdAndTypeParams = strategyStepRepositoryMock.getLastByStrategyIdAndType.mock.calls[0];
            expect(getLastByStrategyIdAndTypeParams.length).toEqual(2);
            expect(getLastByStrategyIdAndTypeParams[0]).toEqual(strategy.id);
            expect(getLastByStrategyIdAndTypeParams[1]).toEqual('CheckOrder');

            expect(createOrderServiceMock.create).toHaveBeenCalledTimes(0);
          });
        });

        describe('And last order step is not missing', () => {
          beforeEach(() => {
            lastOrderStep = buildStrategyStep(buildDefaultStrategyStepTemplate(), strategy.id, buildDefaultCheckOrderStepOutput(true));
            strategyStepRepositoryMock.getLastByStrategyIdAndType.mockResolvedValue(lastOrderStep);
          });

          it('Then send order step is a success', async () => {
            const result = await sendOrderStepService.process(strategy, sendOrderStepInput);
            expect(result).toEqual({
              success: true,
              id: order.id,
              status: order.status,
              externalId: order.externalId!,
              externalStatus: order.externalStatus!,
              baseAssetQuantity: order.baseAssetQuantity,
              quoteAssetQuantity: order.quoteAssetQuantity,
              priceLimit: order.priceLimit,
            });

            expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(1);
            const getLastByStrategyIdAndTypeParams = strategyStepRepositoryMock.getLastByStrategyIdAndType.mock.calls[0];
            expect(getLastByStrategyIdAndTypeParams.length).toEqual(2);
            expect(getLastByStrategyIdAndTypeParams[0]).toEqual(strategy.id);
            expect(getLastByStrategyIdAndTypeParams[1]).toEqual('CheckOrder');

            expect(createOrderServiceMock.create).toHaveBeenCalledTimes(1);
            const createParams = createOrderServiceMock.create.mock.calls[0];
            expect(createParams.length).toEqual(1);
            expect(createParams[0]).toEqual({
              symbol: strategy.symbol,
              side: 'Buy',
              type: 'Limit',
              baseAssetQuantity: (lastOrderStep.output as CheckOrderStepOutput).quantity! * sendOrderStepInput.percentage,
              quoteAssetQuantity: undefined,
              priceLimit: (lastOrderStep.output as CheckOrderStepOutput).price! * (1 + sendOrderStepInput.deviation!),
            });
          });
        });
      });

      describe('And sell order is filled', () => {
        beforeEach(() => {
          sendOrderStepInput = buildSendOrderStepInput('LastOrder', 0.9, 'Sell', 'Limit', 0.12);

          order = buildDefaultLimitOrder();
          createOrderServiceMock.create.mockResolvedValue(order);
        });

        describe('And last order step is missing', () => {
          beforeEach(() => {
            strategyStepRepositoryMock.getLastByStrategyIdAndType.mockResolvedValue(null);
          });

          it('Then error is thrown', async () => {
            try {
              await sendOrderStepService.process(strategy, sendOrderStepInput);
              fail();
            } catch (error) {
              expect(error).toBeDefined();
              expect((error as Error).message).toEqual('Unable to calculate quantity without last order');
            }

            expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(1);
            const getLastByStrategyIdAndTypeParams = strategyStepRepositoryMock.getLastByStrategyIdAndType.mock.calls[0];
            expect(getLastByStrategyIdAndTypeParams.length).toEqual(2);
            expect(getLastByStrategyIdAndTypeParams[0]).toEqual(strategy.id);
            expect(getLastByStrategyIdAndTypeParams[1]).toEqual('CheckOrder');

            expect(createOrderServiceMock.create).toHaveBeenCalledTimes(0);
          });
        });

        describe('And last order step is not missing', () => {
          beforeEach(() => {
            lastOrderStep = buildStrategyStep(buildDefaultStrategyStepTemplate(), strategy.id, buildDefaultCheckOrderStepOutput(true));
            strategyStepRepositoryMock.getLastByStrategyIdAndType.mockResolvedValue(lastOrderStep);
          });

          it('Then send order step is a success', async () => {
            const result = await sendOrderStepService.process(strategy, sendOrderStepInput);
            expect(result).toEqual({
              success: true,
              id: order.id,
              status: order.status,
              externalId: order.externalId!,
              externalStatus: order.externalStatus!,
              baseAssetQuantity: order.baseAssetQuantity,
              quoteAssetQuantity: order.quoteAssetQuantity,
              priceLimit: order.priceLimit,
            });

            expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(1);
            const getLastByStrategyIdAndTypeParams = strategyStepRepositoryMock.getLastByStrategyIdAndType.mock.calls[0];
            expect(getLastByStrategyIdAndTypeParams.length).toEqual(2);
            expect(getLastByStrategyIdAndTypeParams[0]).toEqual(strategy.id);
            expect(getLastByStrategyIdAndTypeParams[1]).toEqual('CheckOrder');

            expect(createOrderServiceMock.create).toHaveBeenCalledTimes(1);
            const createParams = createOrderServiceMock.create.mock.calls[0];
            expect(createParams.length).toEqual(1);
            expect(createParams[0]).toEqual({
              symbol: strategy.symbol,
              side: 'Sell',
              type: 'Limit',
              baseAssetQuantity: (lastOrderStep.output as CheckOrderStepOutput).quantity! * sendOrderStepInput.percentage,
              quoteAssetQuantity: undefined,
              priceLimit: (lastOrderStep.output as CheckOrderStepOutput).price! * (1 + sendOrderStepInput.deviation!),
            });
          });
        });
      });
    });
  });
});
