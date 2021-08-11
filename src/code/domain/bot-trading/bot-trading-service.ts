import { BotTradingConfig } from './model/bot-trading';

export interface BotTradingService {
  trade(botTradingConfig: BotTradingConfig): Promise<void>;
}
