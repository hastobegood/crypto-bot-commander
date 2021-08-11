import { logger } from '../../configuration/log/logger';
import { BotTradingService } from '../../domain/bot-trading/bot-trading-service';
import { BotTradingConfig } from '../../domain/bot-trading/model/bot-trading';
import { AccountService } from '../../domain/account/account-service';

export class BotTradingScheduler {
  constructor(private accountService: AccountService, private botTradingService: BotTradingService, private botTradingConfig: BotTradingConfig) {}

  async trade(): Promise<void> {
    const account = await this.accountService.getAccount();
    const balance = account.balances.find((balance) => balance.asset === this.botTradingConfig.quoteAsset);
    if (!balance || balance.availableQuantity < this.botTradingConfig.quoteAssetQuantity) {
      logger.info('Skipping BOT trading, balance is too small');
      return;
    }

    try {
      logger.info(this.botTradingConfig, 'Processing BOT trading');
      await this.botTradingService.trade(this.botTradingConfig);
      logger.info(this.botTradingConfig, 'BOT trading processed');
    } catch (error) {
      logger.error(this.botTradingConfig, 'Unable to process BOT trading');
      throw error;
    }
  }
}
