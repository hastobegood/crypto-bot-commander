import { Point } from '../../../../src/code/domain/technical-analysis/model/point';
import { CalculateMarketEvolution } from '../../../../src/code/domain/technical-analysis/model/market-evolution';
import { randomNumber } from '../../random-test-builder';
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
