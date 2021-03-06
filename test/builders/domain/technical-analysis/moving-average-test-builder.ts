import { randomFromList, randomNumber } from '@hastobegood/crypto-bot-artillery/test/builders';

import { CalculateMovingAverage, MovingAverage, MovingAverageType } from '../../../../src/code/domain/technical-analysis/model/moving-average';
import { Point } from '../../../../src/code/domain/technical-analysis/model/point';

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
  return buildMovingAverage(randomNumber());
};

export const buildMovingAverage = (value: number): MovingAverage => {
  return {
    value: value,
  };
};
