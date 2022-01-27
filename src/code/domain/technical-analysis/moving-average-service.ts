import { roundNumber } from '@hastobegood/crypto-bot-artillery/common';
import { Point } from './model/point';
import { CalculateMovingAverage, MovingAverage, MovingAverageType } from './model/moving-average';
import { sortPoints, TechnicalAnalysisService, TechnicalAnalysisType } from './technical-analysis-service';

export class MovingAverageService implements TechnicalAnalysisService<CalculateMovingAverage, MovingAverage> {
  getType(): TechnicalAnalysisType {
    return 'MovingAverage';
  }

  async calculate(calculateMovingAverage: CalculateMovingAverage): Promise<MovingAverage> {
    return {
      value: roundNumber(this.#calculate(calculateMovingAverage.type, calculateMovingAverage.period, sortPoints(calculateMovingAverage.points)), 8),
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
        throw new Error(`Unsupported '${type}' moving average type`);
    }
  }

  #calculateSimpleMovingAverage(period: number, points: Point[]): number {
    if (points.length < period + 1) {
      throw new Error(`Not enough point to calculate simple moving average (${period + 1} expected but found ${points.length})`);
    }

    const total = points
      .slice(1, period + 1)
      .map((point) => point.value)
      .reduce((total, current) => total + current);

    return total / period;
  }

  #calculateCumulativeMovingAverage(period: number, points: Point[]): number {
    if (points.length < period) {
      throw new Error(`Not enough point to calculate cumulative moving average (${period} expected but found ${points.length})`);
    }

    const total = points
      .slice(0, period)
      .map((point) => point.value)
      .reduce((total, current) => total + current);

    return total / period;
  }

  #calculateExponentialMovingAverage(period: number, points: Point[]): number {
    if (points.length < period * 3) {
      throw new Error(`Not enough point to calculate exponential moving average (${period * 3} expected but found ${points.length})`);
    }

    const alpha = 2 / (period + 1);

    return points
      .slice(0, period * 3)
      .map((point) => point.value)
      .reduceRight((previous, current) => current * alpha + previous * (1 - alpha));
  }
}
