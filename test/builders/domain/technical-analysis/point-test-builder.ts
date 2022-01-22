import { randomNumber } from '@hastobegood/crypto-bot-artillery/test/builders';
import { Point } from '../../../../src/code/domain/technical-analysis/model/point';

export const buildDefaultPoints = (): Point[] => {
  return [buildDefaultPoint(), buildDefaultPoint(), buildDefaultPoint()];
};

export const buildDefaultPoint = (): Point => {
  return buildPoint(new Date().valueOf(), randomNumber());
};

export const buildPoint = (timestamp: number, value: number): Point => {
  return {
    timestamp: timestamp,
    value: value,
  };
};
