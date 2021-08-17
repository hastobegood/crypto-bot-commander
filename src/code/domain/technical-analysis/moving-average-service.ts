import { CalculateMovingAverage, MovingAverage } from './model/moving-average';
import { TechnicalAnalysisService } from './technical-analysis-service';

export interface MovingAverageService extends TechnicalAnalysisService {
  calculate(calculateMovingAverage: CalculateMovingAverage): MovingAverage;
}
