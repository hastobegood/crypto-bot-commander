export interface CandlestickPublisher {
  publishUpdatedBySymbol(symbol: string): Promise<void>;
}
