import { Candlestick } from '@hastobegood/crypto-bot-artillery/candlestick';
import { buildDefaultCandlestick, buildDefaultCandlesticks } from '@hastobegood/crypto-bot-artillery/test/builders';

import { GetCandlestickService } from '../../../../../src/code/domain/candlestick/get-candlestick-service';
import { Strategy } from '../../../../../src/code/domain/strategy/model/strategy';
import { CheckOrderStepOutput, MarketEvolutionStepInput, StrategyStep } from '../../../../../src/code/domain/strategy/model/strategy-step';
import { MarketEvolutionStepService } from '../../../../../src/code/domain/strategy/step/market-evolution-step-service';
import { StrategyStepRepository } from '../../../../../src/code/domain/strategy/step/strategy-step-repository';
import { MarketEvolutionService } from '../../../../../src/code/domain/technical-analysis/market-evolution-service';
import { MarketEvolution } from '../../../../../src/code/domain/technical-analysis/model/market-evolution';
import { buildDefaultCheckOrderStepOutput, buildDefaultStrategyStepTemplate, buildMarketEvolutionStepInput, buildStrategyStep } from '../../../../builders/domain/strategy/strategy-step-test-builder';
import { buildDefaultStrategy } from '../../../../builders/domain/strategy/strategy-test-builder';
import { buildMarketEvolution } from '../../../../builders/domain/technical-analysis/market-evolution-test-builder';

const getCandlestickServiceMock = jest.mocked(jest.genMockFromModule<GetCandlestickService>('../../../../../src/code/domain/candlestick/get-candlestick-service'), true);
const marketEvolutionServiceMock = jest.mocked(jest.genMockFromModule<MarketEvolutionService>('../../../../../src/code/domain/technical-analysis/market-evolution-service'), true);
const strategyStepRepositoryMock = jest.mocked(jest.genMockFromModule<StrategyStepRepository>('../../../../../src/code/domain/strategy/step/strategy-step-repository'), true);

let marketEvolutionStepService: MarketEvolutionStepService;
beforeEach(() => {
  getCandlestickServiceMock.getLastBySymbol = jest.fn();
  getCandlestickServiceMock.getAllLastBySymbol = jest.fn();
  marketEvolutionServiceMock.calculate = jest.fn();
  strategyStepRepositoryMock.getLastByStrategyIdAndType = jest.fn();

  marketEvolutionStepService = new MarketEvolutionStepService(getCandlestickServiceMock, marketEvolutionServiceMock, strategyStepRepositoryMock);
});

describe('MarketEvolutionStepService', () => {
  let strategy: Strategy;
  let marketEvolutionStepInput: MarketEvolutionStepInput;
  let marketEvolution: MarketEvolution;
  let candlesticks: Candlestick[];

  beforeEach(() => {
    strategy = buildDefaultStrategy();
  });

  afterEach(() => {
    expect(getCandlestickServiceMock.getLastBySymbol).toHaveBeenCalledTimes(0);
  });

  describe('Given the strategy step type to retrieve', () => {
    it('Then market evolution type is returned', async () => {
      expect(marketEvolutionStepService.getType()).toEqual('MarketEvolution');
    });
  });

  describe('Given a market evolution step to process', () => {
    describe('When source is from market', () => {
      beforeEach(() => {
        marketEvolutionStepInput = buildMarketEvolutionStepInput('Market', -0.05, '1h', 24);

        candlesticks = buildDefaultCandlesticks().values;
        getCandlestickServiceMock.getAllLastBySymbol.mockResolvedValue(candlesticks);
      });

      describe('And interval is missing', () => {
        beforeEach(() => {
          marketEvolutionStepInput.interval = undefined;
        });

        it('Then error is thrown', async () => {
          try {
            await marketEvolutionStepService.process(strategy, marketEvolutionStepInput);
            fail('An error should have been thrown');
          } catch (error) {
            expect(error).toBeDefined();
            expect((error as Error).message).toEqual('Unable to calculate market evolution without interval');
          }

          expect(getCandlestickServiceMock.getAllLastBySymbol).toHaveBeenCalledTimes(0);
          expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(0);
          expect(marketEvolutionServiceMock.calculate).toHaveBeenCalledTimes(0);
        });
      });

      describe('And period is missing', () => {
        beforeEach(() => {
          marketEvolutionStepInput.period = undefined;
        });

        it('Then error is thrown', async () => {
          try {
            await marketEvolutionStepService.process(strategy, marketEvolutionStepInput);
            fail('An error should have been thrown');
          } catch (error) {
            expect(error).toBeDefined();
            expect((error as Error).message).toEqual('Unable to calculate market evolution without period');
          }

          expect(getCandlestickServiceMock.getAllLastBySymbol).toHaveBeenCalledTimes(0);
          expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(0);
          expect(marketEvolutionServiceMock.calculate).toHaveBeenCalledTimes(0);
        });
      });

      describe('And market evolution percentage is bigger than percentage threshold', () => {
        beforeEach(() => {
          marketEvolution = buildMarketEvolution(1, 2, -0.0501);
          marketEvolutionServiceMock.calculate.mockResolvedValue(marketEvolution);
        });

        it('Then market evolution step is a success', async () => {
          const result = await marketEvolutionStepService.process(strategy, marketEvolutionStepInput);
          expect(result).toEqual({
            success: true,
            lastPrice: marketEvolution.lastValue,
            currentPrice: marketEvolution.currentValue,
            percentage: marketEvolution.percentage,
          });

          expect(getCandlestickServiceMock.getAllLastBySymbol).toHaveBeenCalledTimes(1);
          const getAllLastBySymbolParams = getCandlestickServiceMock.getAllLastBySymbol.mock.calls[0];
          expect(getAllLastBySymbolParams.length).toEqual(4);
          expect(getAllLastBySymbolParams[0]).toEqual(strategy.exchange);
          expect(getAllLastBySymbolParams[1]).toEqual(strategy.symbol);
          expect(getAllLastBySymbolParams[2]).toEqual(marketEvolutionStepInput.interval);
          expect(getAllLastBySymbolParams[3]).toEqual(marketEvolutionStepInput.period);

          expect(marketEvolutionServiceMock.calculate).toHaveBeenCalledTimes(1);
          const calculateParams = marketEvolutionServiceMock.calculate.mock.calls[0];
          expect(calculateParams.length).toEqual(1);
          expect(calculateParams[0].period).toEqual(candlesticks.length);
          expect(calculateParams[0].points).toEqual(
            candlesticks.map((candlestick) => ({
              timestamp: candlestick.openingDate.valueOf(),
              value: candlestick.closingPrice,
            })),
          );

          expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(0);
        });
      });

      describe('And market evolution percentage is smaller than percentage threshold ', () => {
        beforeEach(() => {
          marketEvolution = buildMarketEvolution(1, 2, -0.0499);
          marketEvolutionServiceMock.calculate.mockResolvedValue(marketEvolution);
        });

        it('Then market evolution step is a not success', async () => {
          const result = await marketEvolutionStepService.process(strategy, marketEvolutionStepInput);
          expect(result).toEqual({
            success: false,
            lastPrice: marketEvolution.lastValue,
            currentPrice: marketEvolution.currentValue,
            percentage: marketEvolution.percentage,
          });

          expect(getCandlestickServiceMock.getAllLastBySymbol).toHaveBeenCalledTimes(1);
          const getAllLastBySymbolParams = getCandlestickServiceMock.getAllLastBySymbol.mock.calls[0];
          expect(getAllLastBySymbolParams.length).toEqual(4);
          expect(getAllLastBySymbolParams[0]).toEqual(strategy.exchange);
          expect(getAllLastBySymbolParams[1]).toEqual(strategy.symbol);
          expect(getAllLastBySymbolParams[2]).toEqual(marketEvolutionStepInput.interval);
          expect(getAllLastBySymbolParams[3]).toEqual(marketEvolutionStepInput.period);

          expect(marketEvolutionServiceMock.calculate).toHaveBeenCalledTimes(1);
          const calculateParams = marketEvolutionServiceMock.calculate.mock.calls[0];
          expect(calculateParams.length).toEqual(1);
          expect(calculateParams[0].period).toEqual(candlesticks.length);
          expect(calculateParams[0].points).toEqual(
            candlesticks.map((candlestick) => ({
              timestamp: candlestick.openingDate.valueOf(),
              value: candlestick.closingPrice,
            })),
          );

          expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(0);
        });
      });

      describe('And market evolution percentage is equal to percentage threshold ', () => {
        beforeEach(() => {
          marketEvolution = buildMarketEvolution(1, 2, -0.05);
          marketEvolutionServiceMock.calculate.mockResolvedValue(marketEvolution);
        });

        it('Then market evolution step is a success', async () => {
          const result = await marketEvolutionStepService.process(strategy, marketEvolutionStepInput);
          expect(result).toEqual({
            success: true,
            lastPrice: marketEvolution.lastValue,
            currentPrice: marketEvolution.currentValue,
            percentage: marketEvolution.percentage,
          });

          expect(getCandlestickServiceMock.getAllLastBySymbol).toHaveBeenCalledTimes(1);
          const getAllLastBySymbolParams = getCandlestickServiceMock.getAllLastBySymbol.mock.calls[0];
          expect(getAllLastBySymbolParams.length).toEqual(4);
          expect(getAllLastBySymbolParams[0]).toEqual(strategy.exchange);
          expect(getAllLastBySymbolParams[1]).toEqual(strategy.symbol);
          expect(getAllLastBySymbolParams[2]).toEqual(marketEvolutionStepInput.interval);
          expect(getAllLastBySymbolParams[3]).toEqual(marketEvolutionStepInput.period);
          const calculateParams = marketEvolutionServiceMock.calculate.mock.calls[0];
          expect(calculateParams.length).toEqual(1);
          expect(calculateParams[0].period).toEqual(candlesticks.length);
          expect(calculateParams[0].points).toEqual(
            candlesticks.map((candlestick) => ({
              timestamp: candlestick.openingDate.valueOf(),
              value: candlestick.closingPrice,
            })),
          );

          expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(0);
        });
      });
    });

    describe('When source is from last order', () => {
      let lastOrderStep: StrategyStep;

      beforeEach(() => {
        marketEvolutionStepInput = buildMarketEvolutionStepInput('LastOrder', -0.05);

        candlesticks = [buildDefaultCandlestick()];
        getCandlestickServiceMock.getAllLastBySymbol.mockResolvedValue(candlesticks);
      });

      describe('And last order step is missing', () => {
        beforeEach(() => {
          strategyStepRepositoryMock.getLastByStrategyIdAndType.mockResolvedValue(null);
        });

        it('Then error is thrown', async () => {
          try {
            await marketEvolutionStepService.process(strategy, marketEvolutionStepInput);
            fail('An error should have been thrown');
          } catch (error) {
            expect(error).toBeDefined();
            expect((error as Error).message).toEqual('Unable to calculate market evolution without last order');
          }

          expect(getCandlestickServiceMock.getAllLastBySymbol).toHaveBeenCalledTimes(1);
          const getAllLastBySymbolParams = getCandlestickServiceMock.getAllLastBySymbol.mock.calls[0];
          expect(getAllLastBySymbolParams.length).toEqual(4);
          expect(getAllLastBySymbolParams[0]).toEqual(strategy.exchange);
          expect(getAllLastBySymbolParams[1]).toEqual(strategy.symbol);
          expect(getAllLastBySymbolParams[2]).toEqual('1m');
          expect(getAllLastBySymbolParams[3]).toEqual(1);

          expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(1);
          const getLastByStrategyIdAndTypeParams = strategyStepRepositoryMock.getLastByStrategyIdAndType.mock.calls[0];
          expect(getLastByStrategyIdAndTypeParams.length).toEqual(2);
          expect(getLastByStrategyIdAndTypeParams[0]).toEqual(strategy.id);
          expect(getLastByStrategyIdAndTypeParams[1]).toEqual('CheckOrder');

          expect(marketEvolutionServiceMock.calculate).toHaveBeenCalledTimes(0);
        });
      });

      describe('And last order step is not missing', () => {
        describe('And market evolution percentage is bigger than percentage threshold ', () => {
          beforeEach(() => {
            lastOrderStep = buildStrategyStep(buildDefaultStrategyStepTemplate(), strategy.id, buildDefaultCheckOrderStepOutput(true));
            strategyStepRepositoryMock.getLastByStrategyIdAndType.mockResolvedValue(lastOrderStep);

            marketEvolution = buildMarketEvolution(1, 2, -0.0501);
            marketEvolutionServiceMock.calculate.mockResolvedValue(marketEvolution);
          });

          it('Then market evolution step is a success', async () => {
            const result = await marketEvolutionStepService.process(strategy, marketEvolutionStepInput);
            expect(result).toEqual({
              success: true,
              lastPrice: marketEvolution.lastValue,
              currentPrice: marketEvolution.currentValue,
              percentage: marketEvolution.percentage,
            });

            expect(getCandlestickServiceMock.getAllLastBySymbol).toHaveBeenCalledTimes(1);
            const getAllLastBySymbolParams = getCandlestickServiceMock.getAllLastBySymbol.mock.calls[0];
            expect(getAllLastBySymbolParams.length).toEqual(4);
            expect(getAllLastBySymbolParams[0]).toEqual(strategy.exchange);
            expect(getAllLastBySymbolParams[1]).toEqual(strategy.symbol);
            expect(getAllLastBySymbolParams[2]).toEqual('1m');
            expect(getAllLastBySymbolParams[3]).toEqual(1);

            expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(1);
            const getLastByStrategyIdAndTypeParams = strategyStepRepositoryMock.getLastByStrategyIdAndType.mock.calls[0];
            expect(getLastByStrategyIdAndTypeParams.length).toEqual(2);
            expect(getLastByStrategyIdAndTypeParams[0]).toEqual(strategy.id);
            expect(getLastByStrategyIdAndTypeParams[1]).toEqual('CheckOrder');

            expect(marketEvolutionServiceMock.calculate).toHaveBeenCalledTimes(1);
            const calculateParams = marketEvolutionServiceMock.calculate.mock.calls[0];
            expect(calculateParams.length).toEqual(1);
            expect(calculateParams[0].period).toEqual(2);
            expect(calculateParams[0].points).toEqual([
              { timestamp: candlesticks[0].openingDate.valueOf(), value: candlesticks[0].closingPrice },
              {
                timestamp: lastOrderStep.executionEndDate.valueOf(),
                value: (lastOrderStep.output as CheckOrderStepOutput).price,
              },
            ]);
          });
        });

        describe('And market evolution percentage is smaller than percentage threshold ', () => {
          beforeEach(() => {
            lastOrderStep = buildStrategyStep(buildDefaultStrategyStepTemplate(), strategy.id, buildDefaultCheckOrderStepOutput(true));
            strategyStepRepositoryMock.getLastByStrategyIdAndType.mockResolvedValue(lastOrderStep);

            marketEvolution = buildMarketEvolution(1, 2, -0.0499);
            marketEvolutionServiceMock.calculate.mockResolvedValue(marketEvolution);
          });

          it('Then market evolution step is a not success', async () => {
            const result = await marketEvolutionStepService.process(strategy, marketEvolutionStepInput);
            expect(result).toEqual({
              success: false,
              lastPrice: marketEvolution.lastValue,
              currentPrice: marketEvolution.currentValue,
              percentage: marketEvolution.percentage,
            });

            expect(getCandlestickServiceMock.getAllLastBySymbol).toHaveBeenCalledTimes(1);
            const getAllLastBySymbolParams = getCandlestickServiceMock.getAllLastBySymbol.mock.calls[0];
            expect(getAllLastBySymbolParams.length).toEqual(4);
            expect(getAllLastBySymbolParams[0]).toEqual(strategy.exchange);
            expect(getAllLastBySymbolParams[1]).toEqual(strategy.symbol);
            expect(getAllLastBySymbolParams[2]).toEqual('1m');
            expect(getAllLastBySymbolParams[3]).toEqual(1);

            expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(1);
            const getLastByStrategyIdAndTypeParams = strategyStepRepositoryMock.getLastByStrategyIdAndType.mock.calls[0];
            expect(getLastByStrategyIdAndTypeParams.length).toEqual(2);
            expect(getLastByStrategyIdAndTypeParams[0]).toEqual(strategy.id);
            expect(getLastByStrategyIdAndTypeParams[1]).toEqual('CheckOrder');

            expect(marketEvolutionServiceMock.calculate).toHaveBeenCalledTimes(1);
            const calculateParams = marketEvolutionServiceMock.calculate.mock.calls[0];
            expect(calculateParams.length).toEqual(1);
            expect(calculateParams[0].period).toEqual(2);
            expect(calculateParams[0].points).toEqual([
              { timestamp: candlesticks[0].openingDate.valueOf(), value: candlesticks[0].closingPrice },
              {
                timestamp: lastOrderStep.executionEndDate.valueOf(),
                value: (lastOrderStep.output as CheckOrderStepOutput).price,
              },
            ]);
          });
        });

        describe('And market evolution percentage is equal to percentage threshold ', () => {
          beforeEach(() => {
            lastOrderStep = buildStrategyStep(buildDefaultStrategyStepTemplate(), strategy.id, buildDefaultCheckOrderStepOutput(true));
            strategyStepRepositoryMock.getLastByStrategyIdAndType.mockResolvedValue(lastOrderStep);

            marketEvolution = buildMarketEvolution(1, 2, -0.05);
            marketEvolutionServiceMock.calculate.mockResolvedValue(marketEvolution);
          });

          it('Then market evolution step is a success', async () => {
            const result = await marketEvolutionStepService.process(strategy, marketEvolutionStepInput);
            expect(result).toEqual({
              success: true,
              lastPrice: marketEvolution.lastValue,
              currentPrice: marketEvolution.currentValue,
              percentage: marketEvolution.percentage,
            });

            expect(getCandlestickServiceMock.getAllLastBySymbol).toHaveBeenCalledTimes(1);
            const getAllLastBySymbolParams = getCandlestickServiceMock.getAllLastBySymbol.mock.calls[0];
            expect(getAllLastBySymbolParams.length).toEqual(4);
            expect(getAllLastBySymbolParams[0]).toEqual(strategy.exchange);
            expect(getAllLastBySymbolParams[1]).toEqual(strategy.symbol);
            expect(getAllLastBySymbolParams[2]).toEqual('1m');
            expect(getAllLastBySymbolParams[3]).toEqual(1);

            expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(1);
            const getLastByStrategyIdAndTypeParams = strategyStepRepositoryMock.getLastByStrategyIdAndType.mock.calls[0];
            expect(getLastByStrategyIdAndTypeParams.length).toEqual(2);
            expect(getLastByStrategyIdAndTypeParams[0]).toEqual(strategy.id);
            expect(getLastByStrategyIdAndTypeParams[1]).toEqual('CheckOrder');

            expect(marketEvolutionServiceMock.calculate).toHaveBeenCalledTimes(1);
            const calculateParams = marketEvolutionServiceMock.calculate.mock.calls[0];
            expect(calculateParams.length).toEqual(1);
            expect(calculateParams[0].period).toEqual(2);
            expect(calculateParams[0].points).toEqual([
              { timestamp: candlesticks[0].openingDate.valueOf(), value: candlesticks[0].closingPrice },
              {
                timestamp: lastOrderStep.executionEndDate.valueOf(),
                value: (lastOrderStep.output as CheckOrderStepOutput).price,
              },
            ]);
          });
        });
      });
    });
  });
});
