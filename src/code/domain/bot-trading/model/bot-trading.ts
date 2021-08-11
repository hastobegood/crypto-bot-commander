export interface BotTradingConfig {
  baseAsset: string;
  quoteAsset: string;
  quoteAssetQuantity: number;
  buyPercentage: number;
  sellPercentage: number;
  dumpPercentage: number;
}

export interface BotTrading {
  id: string;
  symbol: string;
  creationDate: Date;
  evaluation: BotTradingEvaluation;
  buyOrder: BotTradingOrder;
  sellOrder: BotTradingOrder;
}

export interface BotTradingOrder {
  id: string;
  quantity: number;
  price: number;
}

export interface BotTradingEvaluation {
  currentPrice: number;
  averagePrice: number;
  averagePriceChangePercentage: number;
  dumpFromAveragePrice: boolean;
  lastBuyPrice?: number;
  lastBuyPriceChangePercentage?: number;
  shouldBuy: boolean;
}
