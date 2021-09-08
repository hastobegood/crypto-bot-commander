import { Point } from '../../../../src/code/domain/technical-analysis/model/point';
import { CalculateMovingAverage, MovingAverage, MovingAverageType } from '../../../../src/code/domain/technical-analysis/model/moving-average';
import { randomFromList, randomNumber } from '../../random-test-builder';
import { buildDefaultPoints } from './point-test-builder';

export const buildDefaultCalculateMovingAverage = (): CalculateMovingAverage => {
  return buildCalculateMovingAverage(randomFromList(['SMA', 'CMA', 'EMA']), randomNumber(1, 30), buildDefaultPoints());
};

export const buildCalculateMovingAverage = (type: MovingAverageType, period: number, points: Point[]): CalculateMovingAverage => {
  return {
    type: type,
    period: period,
    points: points,
  };
};

export const buildDefaultMovingAverage = (): MovingAverage => {
  return buildMovingAverage(randomNumber(1, 1_000));
};

export const buildMovingAverage = (value: number): MovingAverage => {
  return {
    value: value,
  };
};
