import { Point } from './point';

export interface CalculateMarketEvolution {
  period: number;
  points: Point[];
}

export interface MarketEvolution {
  lastValue: number;
  currentValue: number;
  percentage: number;
}
