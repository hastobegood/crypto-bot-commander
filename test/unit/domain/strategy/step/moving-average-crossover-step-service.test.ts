import { Candlestick } from '@hastobegood/crypto-bot-artillery/candlestick';
import { buildDefaultCandlestick } from '@hastobegood/crypto-bot-artillery/test/builders';
import { mocked } from 'ts-jest/utils';

import { GetCandlestickService } from '../../../../../src/code/domain/candlestick/get-candlestick-service';
import { Strategy } from '../../../../../src/code/domain/strategy/model/strategy';
import { MovingAverageCrossover, MovingAverageCrossoverStepInput, MovingAverageSignal } from '../../../../../src/code/domain/strategy/model/strategy-step';
import { MovingAverageCrossoverStepService } from '../../../../../src/code/domain/strategy/step/moving-average-crossover-step-service';
import { MovingAverage } from '../../../../../src/code/domain/technical-analysis/model/moving-average';
import { MovingAverageService } from '../../../../../src/code/domain/technical-analysis/moving-average-service';
import { buildDefaultMovingAverageCrossoverStepInput } from '../../../../builders/domain/strategy/strategy-step-test-builder';
import { buildDefaultStrategy } from '../../../../builders/domain/strategy/strategy-test-builder';
import { buildDefaultMovingAverage, buildMovingAverage } from '../../../../builders/domain/technical-analysis/moving-average-test-builder';

const getCandlestickServiceMock = mocked(jest.genMockFromModule<GetCandlestickService>('../../../../../src/code/domain/candlestick/get-candlestick-service'), true);
const movingAverageServiceMock = mocked(jest.genMockFromModule<MovingAverageService>('../../../../../src/code/domain/technical-analysis/moving-average-service'), true);

let movingAverageCrossoverStepService: MovingAverageCrossoverStepService;
beforeEach(() => {
  getCandlestickServiceMock.getLastBySymbol = jest.fn();
  getCandlestickServiceMock.getAllLastBySymbol = jest.fn();
  movingAverageServiceMock.calculate = jest.fn();

  movingAverageCrossoverStepService = new MovingAverageCrossoverStepService(getCandlestickServiceMock, movingAverageServiceMock);
});

describe('MovingAverageCrossoverStepService', () => {
  let strategy: Strategy;
  let movingAverageCrossoverStepInput: MovingAverageCrossoverStepInput;
  let candlesticks: Candlestick[];
  let shortTermMovingAverage: MovingAverage;
  let longTermMovingAverage: MovingAverage;

  beforeEach(() => {
    strategy = buildDefaultStrategy();

    candlesticks = [
      { ...buildDefaultCandlestick(), openingDate: new Date(new Date().getDate() - 1).valueOf(), closingPrice: 90 },
      { ...buildDefaultCandlestick(), openingDate: new Date().valueOf(), closingPrice: 100 },
    ];
    getCandlestickServiceMock.getAllLastBySymbol.mockResolvedValue(candlesticks);
  });

  afterEach(() => {
    expect(getCandlestickServiceMock.getLastBySymbol).toHaveBeenCalledTimes(0);
  });

  describe('Given the strategy step type to retrieve', () => {
    it('Then moving average crossover type is returned', async () => {
      expect(movingAverageCrossoverStepService.getType()).toEqual('MovingAverageCrossover');
    });
  });

  describe('Given a moving average crossover step to process', () => {
    describe('When short term period is greater than long term period', () => {
      beforeEach(() => {
        movingAverageCrossoverStepInput = {
          ...buildDefaultMovingAverageCrossoverStepInput(),
          shortTermPeriod: 5,
          longTermPeriod: 4,
        };
      });

      it('Then error is thrown', async () => {
        try {
          await movingAverageCrossoverStepService.process(strategy, movingAverageCrossoverStepInput);
          fail();
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual('Unable to calculate moving average when short term period is greater than long term period');
        }

        expect(getCandlestickServiceMock.getAllLastBySymbol).toHaveBeenCalledTimes(0);
        expect(movingAverageServiceMock.calculate).toHaveBeenCalledTimes(0);
      });
    });

    describe('When moving average crossover is unknown', () => {
      beforeEach(() => {
        movingAverageCrossoverStepInput = {
          ...buildDefaultMovingAverageCrossoverStepInput(),
          crossover: 'Unknown' as MovingAverageCrossover,
        };

        shortTermMovingAverage = buildDefaultMovingAverage();
        longTermMovingAverage = buildDefaultMovingAverage();
        movingAverageServiceMock.calculate.mockResolvedValueOnce(shortTermMovingAverage).mockResolvedValueOnce(longTermMovingAverage);
      });

      it('Then error is thrown', async () => {
        try {
          await movingAverageCrossoverStepService.process(strategy, movingAverageCrossoverStepInput);
          fail();
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual("Unsupported 'Unknown' moving average crossover");
        }

        expect(getCandlestickServiceMock.getAllLastBySymbol).toHaveBeenCalledTimes(1);
        expect(movingAverageServiceMock.calculate).toHaveBeenCalledTimes(2);
      });
    });

    describe('When moving average signal is unknown', () => {
      beforeEach(() => {
        movingAverageCrossoverStepInput = {
          ...buildDefaultMovingAverageCrossoverStepInput(),
          signal: 'Hodl' as MovingAverageSignal,
        };

        shortTermMovingAverage = buildDefaultMovingAverage();
        longTermMovingAverage = buildDefaultMovingAverage();
        movingAverageServiceMock.calculate.mockResolvedValueOnce(shortTermMovingAverage).mockResolvedValueOnce(longTermMovingAverage);
      });

      it('Then error is thrown', async () => {
        try {
          await movingAverageCrossoverStepService.process(strategy, movingAverageCrossoverStepInput);
          fail();
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual("Unsupported 'Hodl' moving average signal");
        }

        expect(getCandlestickServiceMock.getAllLastBySymbol).toHaveBeenCalledTimes(1);
        expect(movingAverageServiceMock.calculate).toHaveBeenCalledTimes(2);
      });
    });

    describe('When crossover is from current price', () => {
      beforeEach(() => {
        movingAverageCrossoverStepInput = {
          ...buildDefaultMovingAverageCrossoverStepInput(),
          crossover: 'CurrentPrice',
        };
      });

      afterEach(() => {
        expect(getCandlestickServiceMock.getAllLastBySymbol).toHaveBeenCalledTimes(1);
        const getAllLastBySymbolParams = getCandlestickServiceMock.getAllLastBySymbol.mock.calls[0];
        expect(getAllLastBySymbolParams.length).toEqual(4);
        expect(getAllLastBySymbolParams[0]).toEqual(strategy.exchange);
        expect(getAllLastBySymbolParams[1]).toEqual(strategy.symbol);
        expect(getAllLastBySymbolParams[2]).toEqual('1d');
        expect(getAllLastBySymbolParams[3]).toEqual(movingAverageCrossoverStepInput.longTermPeriod * (movingAverageCrossoverStepInput.type === 'EMA' ? 3 : 1));

        expect(movingAverageServiceMock.calculate).toHaveBeenCalledTimes(2);
        let calculateParams = movingAverageServiceMock.calculate.mock.calls[0];
        expect(calculateParams.length).toEqual(1);
        expect(calculateParams[0]).toEqual({
          type: movingAverageCrossoverStepInput.type,
          period: movingAverageCrossoverStepInput.shortTermPeriod,
          points: [
            { timestamp: candlesticks[0].openingDate.valueOf(), value: 90 },
            { timestamp: candlesticks[1].openingDate.valueOf(), value: 100 },
          ],
        });
        calculateParams = movingAverageServiceMock.calculate.mock.calls[1];
        expect(calculateParams.length).toEqual(1);
        expect(calculateParams[0]).toEqual({
          type: movingAverageCrossoverStepInput.type,
          period: movingAverageCrossoverStepInput.longTermPeriod,
          points: [
            { timestamp: candlesticks[0].openingDate.valueOf(), value: 90 },
            { timestamp: candlesticks[1].openingDate.valueOf(), value: 100 },
          ],
        });
      });

      describe('And current price is greater than long term price', () => {
        beforeEach(() => {
          shortTermMovingAverage = buildDefaultMovingAverage();
          longTermMovingAverage = buildMovingAverage(99);
          movingAverageServiceMock.calculate.mockResolvedValueOnce(shortTermMovingAverage).mockResolvedValueOnce(longTermMovingAverage);
        });

        describe('And buy signal', () => {
          beforeEach(() => {
            movingAverageCrossoverStepInput.signal = 'Buy';
          });

          it('Then moving average crossover step is a success', async () => {
            const result = await movingAverageCrossoverStepService.process(strategy, movingAverageCrossoverStepInput);
            expect(result).toEqual({
              success: true,
              currentPrice: 100,
              shortTermPrice: shortTermMovingAverage.value,
              longTermPrice: longTermMovingAverage.value,
            });
          });
        });

        describe('And sell signal', () => {
          beforeEach(() => {
            movingAverageCrossoverStepInput.signal = 'Sell';
          });

          it('Then moving average crossover step is not a success', async () => {
            const result = await movingAverageCrossoverStepService.process(strategy, movingAverageCrossoverStepInput);
            expect(result).toEqual({
              success: false,
              currentPrice: 100,
              shortTermPrice: shortTermMovingAverage.value,
              longTermPrice: longTermMovingAverage.value,
            });
          });
        });
      });

      describe('And current price is equal to long term price', () => {
        beforeEach(() => {
          shortTermMovingAverage = buildDefaultMovingAverage();
          longTermMovingAverage = buildMovingAverage(100);
          movingAverageServiceMock.calculate.mockResolvedValueOnce(shortTermMovingAverage).mockResolvedValueOnce(longTermMovingAverage);
        });

        describe('And buy signal', () => {
          beforeEach(() => {
            movingAverageCrossoverStepInput.signal = 'Buy';
          });

          it('Then moving average crossover step is not a success', async () => {
            const result = await movingAverageCrossoverStepService.process(strategy, movingAverageCrossoverStepInput);
            expect(result).toEqual({
              success: false,
              currentPrice: 100,
              shortTermPrice: shortTermMovingAverage.value,
              longTermPrice: longTermMovingAverage.value,
            });
          });
        });

        describe('And sell signal', () => {
          beforeEach(() => {
            movingAverageCrossoverStepInput.signal = 'Sell';
          });

          it('Then moving average crossover step is not a success', async () => {
            const result = await movingAverageCrossoverStepService.process(strategy, movingAverageCrossoverStepInput);
            expect(result).toEqual({
              success: false,
              currentPrice: 100,
              shortTermPrice: shortTermMovingAverage.value,
              longTermPrice: longTermMovingAverage.value,
            });
          });
        });
      });

      describe('And current price is lower than long term price', () => {
        beforeEach(() => {
          shortTermMovingAverage = buildDefaultMovingAverage();
          longTermMovingAverage = buildMovingAverage(101);
          movingAverageServiceMock.calculate.mockResolvedValueOnce(shortTermMovingAverage).mockResolvedValueOnce(longTermMovingAverage);
        });

        describe('And buy signal', () => {
          beforeEach(() => {
            movingAverageCrossoverStepInput.signal = 'Buy';
          });

          it('Then moving average crossover step is not a success', async () => {
            const result = await movingAverageCrossoverStepService.process(strategy, movingAverageCrossoverStepInput);
            expect(result).toEqual({
              success: false,
              currentPrice: 100,
              shortTermPrice: shortTermMovingAverage.value,
              longTermPrice: longTermMovingAverage.value,
            });
          });
        });

        describe('And sell signal', () => {
          beforeEach(() => {
            movingAverageCrossoverStepInput.signal = 'Sell';
          });

          it('Then moving average crossover step is a success', async () => {
            const result = await movingAverageCrossoverStepService.process(strategy, movingAverageCrossoverStepInput);
            expect(result).toEqual({
              success: true,
              currentPrice: 100,
              shortTermPrice: shortTermMovingAverage.value,
              longTermPrice: longTermMovingAverage.value,
            });
          });
        });
      });
    });

    describe('When crossover is from short term price', () => {
      beforeEach(() => {
        movingAverageCrossoverStepInput = {
          ...buildDefaultMovingAverageCrossoverStepInput(),
          crossover: 'ShortTermPrice',
        };
      });

      afterEach(() => {
        expect(getCandlestickServiceMock.getAllLastBySymbol).toHaveBeenCalledTimes(1);
        const getAllLastBySymbolParams = getCandlestickServiceMock.getAllLastBySymbol.mock.calls[0];
        expect(getAllLastBySymbolParams.length).toEqual(4);
        expect(getAllLastBySymbolParams[0]).toEqual(strategy.exchange);
        expect(getAllLastBySymbolParams[1]).toEqual(strategy.symbol);
        expect(getAllLastBySymbolParams[2]).toEqual('1d');
        expect(getAllLastBySymbolParams[3]).toEqual(movingAverageCrossoverStepInput.longTermPeriod * (movingAverageCrossoverStepInput.type === 'EMA' ? 3 : 1));

        expect(movingAverageServiceMock.calculate).toHaveBeenCalledTimes(2);
        let calculateParams = movingAverageServiceMock.calculate.mock.calls[0];
        expect(calculateParams.length).toEqual(1);
        expect(calculateParams[0]).toEqual({
          type: movingAverageCrossoverStepInput.type,
          period: movingAverageCrossoverStepInput.shortTermPeriod,
          points: [
            { timestamp: candlesticks[0].openingDate.valueOf(), value: 90 },
            { timestamp: candlesticks[1].openingDate.valueOf(), value: 100 },
          ],
        });
        calculateParams = movingAverageServiceMock.calculate.mock.calls[1];
        expect(calculateParams.length).toEqual(1);
        expect(calculateParams[0]).toEqual({
          type: movingAverageCrossoverStepInput.type,
          period: movingAverageCrossoverStepInput.longTermPeriod,
          points: [
            { timestamp: candlesticks[0].openingDate.valueOf(), value: 90 },
            { timestamp: candlesticks[1].openingDate.valueOf(), value: 100 },
          ],
        });
      });

      describe('And short term price is greater than long term price', () => {
        beforeEach(() => {
          shortTermMovingAverage = buildMovingAverage(101);
          longTermMovingAverage = buildMovingAverage(100);
          movingAverageServiceMock.calculate.mockResolvedValueOnce(shortTermMovingAverage).mockResolvedValueOnce(longTermMovingAverage);
        });

        describe('And buy signal', () => {
          beforeEach(() => {
            movingAverageCrossoverStepInput.signal = 'Buy';
          });

          it('Then moving average crossover step is a success', async () => {
            const result = await movingAverageCrossoverStepService.process(strategy, movingAverageCrossoverStepInput);
            expect(result).toEqual({
              success: true,
              currentPrice: 100,
              shortTermPrice: shortTermMovingAverage.value,
              longTermPrice: longTermMovingAverage.value,
            });
          });
        });

        describe('And sell signal', () => {
          beforeEach(() => {
            movingAverageCrossoverStepInput.signal = 'Sell';
          });

          it('Then moving average crossover step is not a success', async () => {
            const result = await movingAverageCrossoverStepService.process(strategy, movingAverageCrossoverStepInput);
            expect(result).toEqual({
              success: false,
              currentPrice: 100,
              shortTermPrice: shortTermMovingAverage.value,
              longTermPrice: longTermMovingAverage.value,
            });
          });
        });
      });

      describe('And short term price is equal to long term price', () => {
        beforeEach(() => {
          shortTermMovingAverage = buildMovingAverage(100);
          longTermMovingAverage = buildMovingAverage(100);
          movingAverageServiceMock.calculate.mockResolvedValueOnce(shortTermMovingAverage).mockResolvedValueOnce(longTermMovingAverage);
        });

        describe('And buy signal', () => {
          beforeEach(() => {
            movingAverageCrossoverStepInput.signal = 'Buy';
          });

          it('Then moving average crossover step is not a success', async () => {
            const result = await movingAverageCrossoverStepService.process(strategy, movingAverageCrossoverStepInput);
            expect(result).toEqual({
              success: false,
              currentPrice: 100,
              shortTermPrice: shortTermMovingAverage.value,
              longTermPrice: longTermMovingAverage.value,
            });
          });
        });

        describe('And sell signal', () => {
          beforeEach(() => {
            movingAverageCrossoverStepInput.signal = 'Sell';
          });

          it('Then moving average crossover step is not a success', async () => {
            const result = await movingAverageCrossoverStepService.process(strategy, movingAverageCrossoverStepInput);
            expect(result).toEqual({
              success: false,
              currentPrice: 100,
              shortTermPrice: shortTermMovingAverage.value,
              longTermPrice: longTermMovingAverage.value,
            });
          });
        });
      });

      describe('And short term price is lower than long term price', () => {
        beforeEach(() => {
          shortTermMovingAverage = buildMovingAverage(99);
          longTermMovingAverage = buildMovingAverage(100);
          movingAverageServiceMock.calculate.mockResolvedValueOnce(shortTermMovingAverage).mockResolvedValueOnce(longTermMovingAverage);
        });

        describe('And buy signal', () => {
          beforeEach(() => {
            movingAverageCrossoverStepInput.signal = 'Buy';
          });

          it('Then moving average crossover step is not a success', async () => {
            const result = await movingAverageCrossoverStepService.process(strategy, movingAverageCrossoverStepInput);
            expect(result).toEqual({
              success: false,
              currentPrice: 100,
              shortTermPrice: shortTermMovingAverage.value,
              longTermPrice: longTermMovingAverage.value,
            });
          });
        });

        describe('And sell signal', () => {
          beforeEach(() => {
            movingAverageCrossoverStepInput.signal = 'Sell';
          });

          it('Then moving average crossover step is a success', async () => {
            const result = await movingAverageCrossoverStepService.process(strategy, movingAverageCrossoverStepInput);
            expect(result).toEqual({
              success: true,
              currentPrice: 100,
              shortTermPrice: shortTermMovingAverage.value,
              longTermPrice: longTermMovingAverage.value,
            });
          });
        });
      });
    });
  });
});
