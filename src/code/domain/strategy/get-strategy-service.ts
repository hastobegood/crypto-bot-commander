import { Strategy, StrategyWallet } from './model/strategy';
import { StrategyRepository } from './strategy-repository';

export class GetStrategyService {
  constructor(private strategyRepository: StrategyRepository) {}

  async getById(id: string): Promise<Strategy | null> {
    return this.strategyRepository.getById(id);
  }

  async getWalletById(id: string): Promise<StrategyWallet | null> {
    return this.strategyRepository.getWalletById(id);
  }
}
