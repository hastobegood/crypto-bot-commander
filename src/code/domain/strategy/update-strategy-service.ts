import { StrategyRepository } from './strategy-repository';
import { Strategy, StrategyStatus } from './model/strategy';

export class UpdateStrategyService {
  constructor(private strategyRepository: StrategyRepository) {}

  async updateStatusById(id: string, status: StrategyStatus): Promise<Strategy> {
    return this.strategyRepository.updateStatusById(id, status);
  }

  async updateBudgetById(id: string, consumedBaseAssetQuantity: number, consumedQuoteAssetQuantity: number): Promise<Strategy> {
    return await this.strategyRepository.updateBudgetById(id, consumedBaseAssetQuantity, consumedQuoteAssetQuantity);
  }
}
