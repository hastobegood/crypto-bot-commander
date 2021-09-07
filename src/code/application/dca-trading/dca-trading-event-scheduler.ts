import { logger } from '../../configuration/log/logger';
import { DcaTradingConfig } from '../../domain/dca-trading/model/dca-trading';
import { ProcessDcaTradingService } from '../../domain/dca-trading/process-dca-trading-service';

export class DcaTradingEventScheduler {
  constructor(private processDcaTradingService: ProcessDcaTradingService, private dcaTradingConfig: DcaTradingConfig) {}

  async process(): Promise<void> {
    try {
      logger.info(this.dcaTradingConfig, 'Processing DCA trading');
      await this.processDcaTradingService.process(this.dcaTradingConfig);
      logger.info(this.dcaTradingConfig, 'DCA trading processed');
    } catch (error) {
      logger.error(this.dcaTradingConfig, 'Unable to process DCA trading');
      throw error;
    }
  }
}
