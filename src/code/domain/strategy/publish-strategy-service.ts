import { logger } from '../../configuration/log/logger';
import { StrategyRepository } from './strategy-repository';
import { StrategyPublisher } from './strategy-publisher';

export class PublishStrategyService {
  constructor(private strategyRepository: StrategyRepository, private strategyPublisher: StrategyPublisher) {}

  async publishAllWithStatusActive(): Promise<void> {
    const ids = await this.strategyRepository.getAllIdsWithStatusActive();
    logger.info(`Found ${ids.length} active strategy(ies)`);

    await Promise.all(ids.map((id) => this.strategyPublisher.publishWithStatusActive(id)));
  }
}
