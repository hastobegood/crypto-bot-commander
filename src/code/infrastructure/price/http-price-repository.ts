import { BinanceClient } from '../binance/binance-client';
import { PriceRepository } from '../../domain/price/price-repository';
import { Price } from '../../domain/price/model/price';

export class HttpPriceRepository implements PriceRepository {
  constructor(private binanceClient: BinanceClient) {}

  async getBySymbol(symbol: string): Promise<Price> {
    const symbolPrices = await Promise.all([this.binanceClient.getSymbolAveragePrice(symbol), this.binanceClient.getSymbolCurrentPrice(symbol)]);

    return {
      symbol: symbol,
      averagePrice: +symbolPrices[0].price,
      currentPrice: +symbolPrices[1].price,
    };
  }
}
