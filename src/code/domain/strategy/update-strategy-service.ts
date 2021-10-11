import { StrategyRepository } from './strategy-repository';
import { StrategyStatus } from './model/strategy';

export class UpdateStrategyService {
  constructor(private strategyRepository: StrategyRepository) {}

  async updateStatusById(id: string, status: StrategyStatus): Promise<void> {
    return this.strategyRepository.updateStatusById(id, status);
  }

  async updateWalletById(id: string, consumedBaseAssetQuantity: number, consumedQuoteAssetQuantity: number): Promise<void> {
    return this.strategyRepository.updateWalletById(id, consumedBaseAssetQuantity, consumedQuoteAssetQuantity);
  }
}
