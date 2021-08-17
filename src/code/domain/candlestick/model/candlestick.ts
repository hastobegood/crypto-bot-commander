export type CandlestickInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '6h' | '12h' | '1d';

export interface Candlestick {
  openingDate: Date;
  closingDate: Date;
  openingPrice: number;
  closingPrice: number;
  lowestPrice: number;
  highestPrice: number;
}
