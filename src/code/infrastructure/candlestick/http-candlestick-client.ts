import { BinanceClient } from '../binance/binance-client';
import { Candlestick, CandlestickInterval } from '../../domain/candlestick/model/candlestick';
import { toBinanceSymbol } from '../binance/binance-converter';
import { CandlestickClient } from '../../domain/candlestick/candlestick-client';

export class HttpCandlestickClient implements CandlestickClient {
  constructor(private binanceClient: BinanceClient) {}

  async getAllBySymbol(symbol: string, startDate: number, endDate: number, period: number, interval: CandlestickInterval): Promise<Candlestick[]> {
    const symbolCandlesticks = await this.binanceClient.getSymbolCandlesticks(toBinanceSymbol(symbol), startDate, endDate, interval, period);

    return symbolCandlesticks.map((symbolCandlestick) => ({
      openingDate: symbolCandlestick.openingDate,
      closingDate: symbolCandlestick.closingDate + 1,
      openingPrice: +symbolCandlestick.openingPrice,
      closingPrice: +symbolCandlestick.closingPrice,
      lowestPrice: +symbolCandlestick.lowestPrice,
      highestPrice: +symbolCandlestick.highestPrice,
    }));
  }
}
