import { BotTrading } from './model/bot-trading';

export interface BotTradingRepository {
  save(botTrading: BotTrading): Promise<BotTrading>;

  getLast(): Promise<BotTrading | null>;
}
