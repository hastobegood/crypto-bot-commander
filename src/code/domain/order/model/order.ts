export type OrderSide = 'Buy' | 'Sell';
export type OrderType = 'Market' | 'TakeProfit';
export type OrderStatus = 'Waiting' | 'Filled' | 'Canceled' | 'Error' | 'Unknown';

export interface CreateOrder {
  symbol: string;
  side: OrderSide;
  type: OrderType;
  baseAssetQuantity?: number;
  quoteAssetQuantity?: number;
  priceThreshold?: number;
}

export interface Order {
  id: string;
  externalId?: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  creationDate: Date;
  transactionDate?: Date;
  baseAssetQuantity?: number;
  quoteAssetQuantity?: number;
  priceThreshold?: number;
  executedAssetQuantity?: number;
  executedPrice?: number;
  status: OrderStatus;
  externalStatus?: string;
  fills?: OrderFill[];
}

export interface OrderFill {
  price: number;
  quantity: number;
  commission: number;
  commissionAsset: string;
}
