import { MarketEvolutionService } from './market-evolution-service';
import { Point } from './model/point';
import { CalculateMarketEvolution, MarketEvolution } from './model/market-evolution';
import { roundNumber } from '../../configuration/util/math';
import { sortPoints, TechnicalAnalysisType } from './technical-analysis-service';

export class DefaultMarketEvolutionService implements MarketEvolutionService {
  getType(): TechnicalAnalysisType {
    return 'MarketEvolution';
  }

  calculate(calculateMarketEvolution: CalculateMarketEvolution): MarketEvolution {
    return {
      period: calculateMarketEvolution.period,
      percentage: roundNumber(this.#calculate(calculateMarketEvolution.period, sortPoints(calculateMarketEvolution.points)), 4),
    };
  }

  #calculate(period: number, points: Point[]): number {
    if (points.length < period + 1) {
      throw new Error('Not enough point to calculate market evolution');
    }

    return points[0].value / points[period].value - 1;
  }
}
