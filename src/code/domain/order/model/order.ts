import { OrderExchange, OrderSide, OrderType } from '@hastobegood/crypto-bot-artillery/order';

export interface CreateOrder {
  exchange: OrderExchange;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  quote: boolean;
  requestedQuantity: number;
  requestedPrice?: number;
}
