import { Ticker } from './model/ticker';

export interface TickerRepository {
  getBySymbol(symbol: string): Promise<Ticker>;
}
