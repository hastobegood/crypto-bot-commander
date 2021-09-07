import { Point } from '../../../../src/code/domain/technical-analysis/model/point';
import { CalculateMarketEvolution, MarketEvolution } from '../../../../src/code/domain/technical-analysis/model/market-evolution';
import { randomNumber, randomPercentage } from '../../random-test-builder';
import { buildDefaultPoints } from './point-test-builder';

export const buildDefaultCalculateMarketEvolution = (): CalculateMarketEvolution => {
  return buildCalculateMarketEvolution(randomNumber(1, 30), buildDefaultPoints());
};

export const buildCalculateMarketEvolution = (period: number, points: Point[]): CalculateMarketEvolution => {
  return {
    period: period,
    points: points,
  };
};

export const buildDefaultMarketEvolution = (): MarketEvolution => {
  return buildMarketEvolution(randomNumber(100, 1_000), randomNumber(100, 1_000), randomPercentage());
};

export const buildMarketEvolution = (lastValue: number, currentValue: number, percentage: number): MarketEvolution => {
  return {
    lastValue: lastValue,
    currentValue: currentValue,
    percentage: percentage,
  };
};
