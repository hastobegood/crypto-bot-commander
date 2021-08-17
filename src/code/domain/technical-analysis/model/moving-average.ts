import { Point } from './point';

export type MovingAverageType = 'SMA' | 'CMA' | 'EMA';

export interface CalculateMovingAverage {
  type: MovingAverageType;
  period: number;
  points: Point[];
}

export interface MovingAverage {
  type: MovingAverageType;
  period: number;
  value: number;
}
