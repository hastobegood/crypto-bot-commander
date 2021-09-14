import { Candlestick } from './model/candlestick';

export interface CandlestickRepository {
  saveAllBySymbol(symbol: string, candlesticks: Candlestick[]): Promise<void>;

  getAllBySymbol(symbol: string, startDate: number, endDate: number): Promise<Candlestick[]>;
}
