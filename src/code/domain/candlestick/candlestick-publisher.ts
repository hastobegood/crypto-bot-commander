import { CandlestickExchange } from '@hastobegood/crypto-bot-artillery/candlestick';

export interface CandlestickPublisher {
  publishTriggeredBySymbol(exchange: CandlestickExchange, symbol: string): Promise<void>;

  publishUpdatedBySymbol(exchange: CandlestickExchange, symbol: string): Promise<void>;
}
