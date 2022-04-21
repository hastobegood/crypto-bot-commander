import { logger } from '@hastobegood/crypto-bot-artillery/common';

import { StrategyPublisher } from './strategy-publisher';
import { StrategyRepository } from './strategy-repository';

export class PublishStrategyService {
  constructor(private strategyRepository: StrategyRepository, private strategyPublisher: StrategyPublisher) {}

  async publishAllBySymbolAndActiveStatus(symbol: string): Promise<void> {
    const ids = await this.strategyRepository.getAllIdsBySymbolAndActiveStatus(symbol);
    logger.info(`Found ${ids.length} active strategy(ies) for symbol ${symbol}`);

    await Promise.all(ids.map((id) => this.strategyPublisher.publishWithStatusActive(id)));
  }
}
