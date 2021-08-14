export interface DcaTradingConfig {
  baseAsset: string;
  quoteAsset: string;
  quoteAssetQuantity: number;
  tradeAssets: DcaTradingConfigTradeAsset[];
}

export interface DcaTradingConfigTradeAsset {
  asset: string;
  percentage: number;
}

export interface DcaTrading {
  id: string;
  success: boolean;
  creationDate: Date;
  orders: DcaTradingOrder[];
}

export interface DcaTradingOrder {
  id?: string;
  success: boolean;
  message?: string;
  baseAsset: string;
  quoteAsset: string;
  symbol: string;
  requestedQuantity: number;
  executedQuantity?: number;
  executedPrice?: number;
}
