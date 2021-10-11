export type OrderSide = 'Buy' | 'Sell';
export type OrderType = 'Market' | 'Limit';
export type OrderStatus = 'Waiting' | 'PartiallyFilled' | 'Filled' | 'Canceled' | 'Error' | 'Unknown';

export interface CreateOrder {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  baseAssetQuantity?: number;
  quoteAssetQuantity?: number;
  priceLimit?: number;
}

export interface BaseOrder extends OrderQuantities {
  id: string;
  symbol: string;
  status: OrderStatus;
  side: OrderSide;
  type: OrderType;
  creationDate: Date;
}

export interface Order extends BaseOrder {
  externalId: string;
  externalStatus: string;
  transactionDate: Date;
  executedAssetQuantity?: number;
  executedPrice?: number;
}

export interface OrderQuantities {
  baseAssetQuantity?: number;
  quoteAssetQuantity?: number;
  priceLimit?: number;
}

export interface OrderReview {
  side: OrderSide;
  status: OrderStatus;
  externalId: string;
  externalStatus: string;
  executedAssetQuantity?: number;
  executedPrice?: number;
}
