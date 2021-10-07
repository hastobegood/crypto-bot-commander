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

export interface Order extends OrderQuantities {
  id: string;
  externalId?: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  creationDate: Date;
  transactionDate?: Date;
  executedAssetQuantity?: number;
  executedPrice?: number;
  status: OrderStatus;
  externalStatus?: string;
}

export interface OrderQuantities {
  baseAssetQuantity?: number;
  quoteAssetQuantity?: number;
  priceLimit?: number;
}

export interface StatusOrder {
  side: OrderSide;
  status: OrderStatus;
  externalId: string;
  externalStatus: string;
  executedAssetQuantity?: number;
  executedPrice?: number;
}
