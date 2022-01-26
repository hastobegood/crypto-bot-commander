import { CandlestickExchange } from '@hastobegood/crypto-bot-artillery/candlestick';

export interface CandlestickPublisher {
  publishUpdatedBySymbol(exchange: CandlestickExchange, symbol: string): Promise<void>;
}
