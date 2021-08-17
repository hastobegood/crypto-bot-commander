import { Point } from '../../../../src/code/domain/technical-analysis/model/point';
import { randomNumber } from '../../random-test-builder';

export const buildDefaultPoints = (): Point[] => {
  return [buildDefaultPoint(), buildDefaultPoint(), buildDefaultPoint()];
};

export const buildDefaultPoint = (): Point => {
  return buildPoint(randomNumber(1, 1_000), randomNumber(10_000, 100_000));
};

export const buildPoint = (timestamp: number, value: number): Point => {
  return {
    timestamp: timestamp,
    value: value,
  };
};
