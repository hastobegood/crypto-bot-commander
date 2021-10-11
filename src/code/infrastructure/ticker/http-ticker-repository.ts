import { BinanceClient } from '../binance/binance-client';
import { TickerRepository } from '../../domain/ticker/ticker-repository';
import { Ticker } from '../../domain/ticker/model/ticker';
import { toBinanceSymbol } from '../binance/binance-converter';

export class HttpTickerRepository implements TickerRepository {
  constructor(private binanceClient: BinanceClient) {}

  async getBySymbol(symbol: string): Promise<Ticker> {
    const binanceExchange = await this.binanceClient.getExchange(toBinanceSymbol(symbol));
    const binanceSymbol = binanceExchange.symbols[0];

    return {
      symbol: symbol,
      baseAssetPrecision: binanceSymbol.baseAssetPrecision,
      quoteAssetPrecision: binanceSymbol.quoteAssetPrecision,
      quantityPrecision: this.#extractPrecision(binanceSymbol.filters.find((filter) => filter.filterType === 'LOT_SIZE')!.stepSize!),
      pricePrecision: this.#extractPrecision(binanceSymbol.filters.find((filter) => filter.filterType === 'PRICE_FILTER')!.tickSize!),
    };
  }

  #extractPrecision(value: string): number {
    return (+value).toString().split('.')[1]?.length || 0;
  }
}
