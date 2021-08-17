import { MovingAverageService } from './moving-average-service';
import { Point } from './model/point';
import { CalculateMovingAverage, MovingAverage, MovingAverageType } from './model/moving-average';
import { roundNumber } from '../../configuration/util/math';

export class DefaultMovingAverageService implements MovingAverageService {
  calculate(calculateMovingAverage: CalculateMovingAverage): MovingAverage {
    const sortedPoints = calculateMovingAverage.points.slice().sort((firstPoint, secondPoint) => secondPoint.timestamp - firstPoint.timestamp);

    return {
      type: calculateMovingAverage.type,
      period: calculateMovingAverage.period,
      value: roundNumber(this.#calculate(calculateMovingAverage.type, calculateMovingAverage.period, sortedPoints), 8),
    };
  }

  #calculate(type: MovingAverageType, period: number, points: Point[]): number {
    switch (type) {
      case 'SMA':
        return this.#calculateSimpleMovingAverage(period, points);
      case 'CMA':
        return this.#calculateCumulativeMovingAverage(period, points);
      case 'EMA':
        return this.#calculateExponentialMovingAverage(period, points);
      default:
        throw new Error(`Unsupported ${type} moving average type`);
    }
  }

  #calculateSimpleMovingAverage(period: number, points: Point[]): number {
    if (points.length < period + 1) {
      throw new Error('Not enough point to calculate simple moving average');
    }

    const total = points
      .slice(1, period + 1)
      .map((point) => point.value)
      .reduce((total, current) => total + current);

    return total / period;
  }

  #calculateCumulativeMovingAverage(period: number, points: Point[]): number {
    if (points.length < period) {
      throw new Error('Not enough point to calculate cumulative moving average');
    }

    const total = points
      .slice(0, period)
      .map((point) => point.value)
      .reduce((total, current) => total + current);

    return total / period;
  }

  #calculateExponentialMovingAverage(period: number, points: Point[]): number {
    if (points.length < period) {
      throw new Error('Not enough point to calculate exponential moving average');
    }

    const alpha = 2 / (period + 1);

    return points
      .slice(0, period)
      .map((point) => point.value)
      .reduceRight((previous, current) => (previous === 0 ? current : current * alpha + previous * (1 - alpha)));
  }
}
