import { BinanceClient } from '../binance/binance-client';
import { CandlestickRepository } from '../../domain/candlestick/candlestick-repository';
import { Candlestick, CandlestickInterval } from '../../domain/candlestick/model/candlestick';
import { convertToBinanceFormat } from '../../configuration/util/symbol';

export class HttpCandlestickRepository implements CandlestickRepository {
  constructor(private binanceClient: BinanceClient) {}

  async getAllBySymbol(symbol: string, period: number, interval: CandlestickInterval): Promise<Candlestick[]> {
    const symbolCandlesticks = await this.binanceClient.getSymbolCandlesticks(convertToBinanceFormat(symbol), interval, period);

    return symbolCandlesticks.map((symbolCandlestick) => ({
      openingDate: new Date(symbolCandlestick.openingDate),
      closingDate: new Date(symbolCandlestick.closingDate),
      openingPrice: +symbolCandlestick.openingPrice,
      closingPrice: +symbolCandlestick.closingPrice,
      lowestPrice: +symbolCandlestick.lowestPrice,
      highestPrice: +symbolCandlestick.highestPrice,
    }));
  }
}
