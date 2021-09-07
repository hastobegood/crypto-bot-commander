import { logger } from '../../configuration/log/logger';
import { PublishStrategyService } from '../../domain/strategy/publish-strategy-service';

export class PublishAllActiveStrategiesEventScheduler {
  constructor(private publishStrategyService: PublishStrategyService) {}

  async process(): Promise<void> {
    try {
      logger.info('Publishing all active strategies');
      await this.publishStrategyService.publishAllWithStatusActive();
      logger.info('All active strategies published');
    } catch (error) {
      logger.error('Unable to publish all active strategies');
      throw error;
    }
  }
}
