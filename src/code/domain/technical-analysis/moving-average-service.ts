import { CalculateMovingAverage, MovingAverage } from './model/moving-average';

export interface MovingAverageService {
  calculate(calculateMovingAverage: CalculateMovingAverage): MovingAverage;
}
