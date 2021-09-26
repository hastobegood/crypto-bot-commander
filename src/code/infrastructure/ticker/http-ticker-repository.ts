import { BinanceClient } from '../binance/binance-client';
import { TickerRepository } from '../../domain/ticker/ticker-repository';
import { Ticker } from '../../domain/ticker/model/ticker';
import { toBinanceSymbol } from '../binance/binance-converter';

export class HttpTickerRepository implements TickerRepository {
  constructor(private binanceClient: BinanceClient) {}

  async getBySymbol(symbol: string): Promise<Ticker> {
    const binanceExchange = await this.binanceClient.getExchange(toBinanceSymbol(symbol));

    return {
      symbol: symbol,
      baseAssetPrecision: binanceExchange.symbols[0].baseAssetPrecision,
      quoteAssetPrecision: binanceExchange.symbols[0].quoteAssetPrecision,
      quantityPrecision: this.#extractPrecision(binanceExchange.symbols[0].filters.find((filter) => filter.filterType === 'LOT_SIZE')!.stepSize!),
      pricePrecision: this.#extractPrecision(binanceExchange.symbols[0].filters.find((filter) => filter.filterType === 'PRICE_FILTER')!.tickSize!),
    };
  }

  #extractPrecision(value: string): number {
    return (+value).toString().split('.')[1].length;
  }
}
