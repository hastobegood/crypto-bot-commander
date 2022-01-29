import { Candlestick, CandlestickExchange, CandlestickInterval, Candlesticks } from '@hastobegood/crypto-bot-artillery/candlestick';

export interface CandlestickRepository {
  save(candlesticks: Candlesticks): Promise<void>;

  getLastBySymbol(exchange: CandlestickExchange, symbol: string, interval: CandlestickInterval): Promise<Candlestick | null>;

  getAllBySymbol(exchange: CandlestickExchange, symbol: string, interval: CandlestickInterval, startDate: number, endDate: number): Promise<Candlestick[]>;
}
