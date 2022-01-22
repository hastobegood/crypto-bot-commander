import { Candlestick, CandlestickExchange } from '@hastobegood/crypto-bot-artillery/candlestick';

export interface CandlestickRepository {
  saveAllBySymbol(exchange: CandlestickExchange, symbol: string, candlesticks: Candlestick[]): Promise<void>;

  getAllBySymbol(exchange: CandlestickExchange, symbol: string, startDate: number, endDate: number): Promise<Candlestick[]>;
}
