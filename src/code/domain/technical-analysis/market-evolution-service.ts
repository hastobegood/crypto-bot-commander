import { CalculateMarketEvolution, MarketEvolution } from './model/market-evolution';
import { TechnicalAnalysisService } from './technical-analysis-service';

export interface MarketEvolutionService extends TechnicalAnalysisService {
  calculate(calculateMarketEvolution: CalculateMarketEvolution): MarketEvolution;
}
