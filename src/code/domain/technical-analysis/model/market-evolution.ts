import { Point } from './point';

export interface CalculateMarketEvolution {
  period: number;
  points: Point[];
}

export interface MarketEvolution {
  period: number;
  percentage: number;
}
