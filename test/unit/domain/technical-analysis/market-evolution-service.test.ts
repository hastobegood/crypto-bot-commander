import { Point } from '../../../../src/code/domain/technical-analysis/model/point';
import { CalculateMarketEvolution } from '../../../../src/code/domain/technical-analysis/model/market-evolution';
import { buildCalculateMarketEvolution } from '../../../builders/domain/technical-analysis/market-evolution-test-builder';
import { MarketEvolutionService } from '../../../../src/code/domain/technical-analysis/market-evolution-service';

let marketEvolutionService: MarketEvolutionService;
beforeEach(() => {
  marketEvolutionService = new MarketEvolutionService();
});

describe('MarketEvolutionService', () => {
  let points: Point[];
  let calculateMarketEvolution: CalculateMarketEvolution;

  beforeEach(() => {
    points = [
      { timestamp: 1, value: 100 },
      { timestamp: 2, value: 95 },
      { timestamp: 3, value: 105 },
      { timestamp: 4, value: 110 },
      { timestamp: 5, value: 99 },
      { timestamp: 6, value: 100 },
    ];
  });

  describe('Given the technical analysis type to retrieve', () => {
    it('Then market evolution type is returned', async () => {
      expect(marketEvolutionService.getType()).toEqual('MarketEvolution');
    });
  });

  describe('Given a market evolution to calculate', () => {
    describe('When period is smaller than number of points', () => {
      it('Then market evolution percentage is calculated', async () => {
        calculateMarketEvolution = buildCalculateMarketEvolution(1, points);

        let result = await marketEvolutionService.calculate(calculateMarketEvolution);
        expect(result).toEqual({
          lastValue: 100,
          currentValue: 100,
          percentage: 0,
        });

        calculateMarketEvolution = buildCalculateMarketEvolution(2, points);

        result = await marketEvolutionService.calculate(calculateMarketEvolution);
        expect(result).toEqual({
          lastValue: 99,
          currentValue: 100,
          percentage: 0.0101,
        });

        calculateMarketEvolution = buildCalculateMarketEvolution(3, points);

        result = await marketEvolutionService.calculate(calculateMarketEvolution);
        expect(result).toEqual({
          lastValue: 110,
          currentValue: 100,
          percentage: -0.0909,
        });

        calculateMarketEvolution = buildCalculateMarketEvolution(4, points);

        result = await marketEvolutionService.calculate(calculateMarketEvolution);
        expect(result).toEqual({
          lastValue: 105,
          currentValue: 100,
          percentage: -0.0476,
        });

        calculateMarketEvolution = buildCalculateMarketEvolution(5, points);

        result = await marketEvolutionService.calculate(calculateMarketEvolution);
        expect(result).toEqual({
          lastValue: 95,
          currentValue: 100,
          percentage: 0.0526,
        });
      });
    });

    describe('When period is equal to number of points', () => {
      it('Then market evolution percentage is calculated', async () => {
        calculateMarketEvolution = buildCalculateMarketEvolution(6, points);

        const result = await marketEvolutionService.calculate(calculateMarketEvolution);
        expect(result).toEqual({
          lastValue: 100,
          currentValue: 100,
          percentage: 0,
        });
      });
    });

    describe('When period is bigger than number of points', () => {
      it('Then error is thrown', async () => {
        calculateMarketEvolution = buildCalculateMarketEvolution(7, points);

        try {
          await marketEvolutionService.calculate(calculateMarketEvolution);
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual('Not enough point to calculate market evolution');
        }
      });
    });
  });
});
