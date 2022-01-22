import { CheckOrder, CheckOrderClient, OrderCheckup, OrderExchange } from '@hastobegood/crypto-bot-artillery/order';

export class CheckOrderService {
  constructor(private checkOrderClient: CheckOrderClient) {}

  async check(exchange: OrderExchange, symbol: string, externalId: string): Promise<OrderCheckup> {
    const checkOrder = this.#buildCheckOrder(exchange, symbol, externalId);

    return this.checkOrderClient.check(checkOrder);
  }

  #buildCheckOrder(exchange: OrderExchange, symbol: string, externalId: string): CheckOrder {
    return {
      exchange: exchange,
      symbol: symbol,
      externalId: externalId,
    };
  }
}
