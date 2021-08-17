import { Point } from './model/point';

export type TechnicalAnalysisType = 'MovingAverage' | 'MarketEvolution';
export const sortPoints = (points: Point[]): Point[] => points.slice().sort((firstPoint, secondPoint) => secondPoint.timestamp - firstPoint.timestamp);

export interface TechnicalAnalysisService {
  getType(): TechnicalAnalysisType;
}
