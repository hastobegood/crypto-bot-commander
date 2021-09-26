export interface BinanceExchange {
  symbols: BinanceExchangeSymbol[];
}

export interface BinanceExchangeSymbol {
  baseAssetPrecision: number;
  quoteAssetPrecision: number;
  filters: BinanceExchangeFilter[];
}

export interface BinanceExchangeFilter {
  filterType: string;
  tickSize?: string;
  stepSize?: string;
}
