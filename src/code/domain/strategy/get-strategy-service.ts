import { StrategyRepository } from './strategy-repository';
import { Strategy } from './model/strategy';

export class GetStrategyService {
  constructor(private strategyRepository: StrategyRepository) {}

  async getById(id: string): Promise<Strategy | null> {
    return this.strategyRepository.getById(id);
  }
}
