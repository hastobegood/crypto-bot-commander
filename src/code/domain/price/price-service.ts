import { Price } from './model/price';

export interface PriceService {
  getBySymbol(symbol: string): Promise<Price>;
}
