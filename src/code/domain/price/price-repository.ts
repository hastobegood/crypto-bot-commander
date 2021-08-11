import { Price } from './model/price';

export interface PriceRepository {
  getBySymbol(symbol: string): Promise<Price>;
}
