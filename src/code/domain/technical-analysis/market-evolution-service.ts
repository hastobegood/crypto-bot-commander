import { CalculateMarketEvolution, MarketEvolution } from './model/market-evolution';
import { round } from '../../configuration/util/math';
import { sortPoints, TechnicalAnalysisService, TechnicalAnalysisType } from './technical-analysis-service';

export class MarketEvolutionService implements TechnicalAnalysisService<CalculateMarketEvolution, MarketEvolution> {
  getType(): TechnicalAnalysisType {
    return 'MarketEvolution';
  }

  async calculate(calculateMarketEvolution: CalculateMarketEvolution): Promise<MarketEvolution> {
    if (calculateMarketEvolution.points.length < calculateMarketEvolution.period) {
      throw new Error('Not enough point to calculate market evolution');
    }

    const sortedPoints = sortPoints(calculateMarketEvolution.points);
    const lastValue = sortedPoints[calculateMarketEvolution.period - 1].value;
    const currentValue = sortedPoints[0].value;

    return {
      lastValue: lastValue,
      currentValue: currentValue,
      percentage: round(currentValue / lastValue - 1, 4),
    };
  }
}
