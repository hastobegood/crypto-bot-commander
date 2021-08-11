import { logger } from '../../configuration/log/logger';
import { DcaTradingService } from '../../domain/dca-trading/dca-trading-service';
import { DcaTradingConfig } from '../../domain/dca-trading/model/dca-trading';
import { AccountService } from '../../domain/account/account-service';

export class DcaTradingScheduler {
  constructor(private accountService: AccountService, private dcaTradingService: DcaTradingService, private dcaTradingConfig: DcaTradingConfig) {}

  async trade(): Promise<void> {
    const accountBefore = await this.accountService.getAccount();
    logger.info(accountBefore, 'Account before');

    try {
      logger.info(this.dcaTradingConfig, 'Processing DCA trading');
      await this.dcaTradingService.trade(this.dcaTradingConfig);
      logger.info(this.dcaTradingConfig, 'DCA trading processed');
    } catch (error) {
      logger.error(this.dcaTradingConfig, 'Unable to process DCA trading');
      throw error;
    }

    const accountAfter = await this.accountService.getAccount();
    logger.info(accountAfter, 'Account after');
  }
}
