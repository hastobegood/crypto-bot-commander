import { BotTradingService } from './bot-trading-service';
import { BotTradingConfig, BotTradingEvaluation, BotTradingOrder } from './model/bot-trading';
import { BotTradingRepository } from './bot-trading-repository';
import { PriceService } from '../price/price-service';
import { Price } from '../price/model/price';
import { CreateOrder, Order, OrderSide, OrderType } from '../order/model/order';
import { logger } from '../../configuration/log/logger';
import { roundNumber } from '../../configuration/util/math';
import { OrderService } from '../order/order-service';

export class DefaultBotTradingService implements BotTradingService {
  constructor(private priceService: PriceService, private orderService: OrderService, private botTradingRepository: BotTradingRepository) {}

  async trade(botTradingConfig: BotTradingConfig): Promise<void> {
    const symbolPrice = await this.#getSymbolPrice(`${botTradingConfig.baseAsset}${botTradingConfig.quoteAsset}`);
    const lastBuyPrice = await this.#getLastBuyPrice();

    await this.#trade(botTradingConfig, symbolPrice.symbol, symbolPrice.currentPrice, symbolPrice.averagePrice, lastBuyPrice);
  }

  async #getSymbolPrice(symbol: string): Promise<Price> {
    return await this.priceService.getBySymbol(symbol);
  }

  async #getLastBuyPrice(): Promise<number | null> {
    const lastBotTrading = await this.botTradingRepository.getLast();

    return lastBotTrading ? lastBotTrading.buyOrder.price : null;
  }

  async #trade(botTradingConfig: BotTradingConfig, symbol: string, currentPrice: number, averagePrice: number, lastBuyPrice: number | null): Promise<void> {
    const evaluation = this.#evaluate(botTradingConfig, currentPrice, averagePrice, lastBuyPrice);
    logger.info(evaluation, 'BOT trading evaluation done');

    if (evaluation.shouldBuy) {
      const buyOrder = await this.#buyOrder(symbol, botTradingConfig.quoteAssetQuantity);
      const sellOrder = await this.#sellOrder(symbol, buyOrder.quantity, this.#getSellPrice(buyOrder.price, botTradingConfig.sellPercentage));

      const creationDate = new Date();
      const id = `${symbol}/${creationDate.valueOf()}`;

      const botTrading = {
        id: id,
        symbol: symbol,
        creationDate: creationDate,
        evaluation: evaluation,
        buyOrder: buyOrder,
        sellOrder: sellOrder,
      };

      await this.botTradingRepository.save(botTrading);
    }
  }

  #evaluate(botTradingConfig: BotTradingConfig, currentPrice: number, averagePrice: number, lastBuyPrice: number | null): BotTradingEvaluation {
    const averagePriceChangePercentage = this.#getChangePercentage(currentPrice, averagePrice);
    const dumpFromAveragePrice = this.#isDumpFromAveragePrice(averagePriceChangePercentage, botTradingConfig.dumpPercentage);
    const lastBuyPriceChangePercentage = lastBuyPrice ? this.#getChangePercentage(currentPrice, lastBuyPrice) : undefined;

    let shouldBuy = false;
    if (!lastBuyPriceChangePercentage) {
      shouldBuy = dumpFromAveragePrice;
    } else if (lastBuyPriceChangePercentage <= botTradingConfig.buyPercentage) {
      shouldBuy = !dumpFromAveragePrice;
    } else if (lastBuyPriceChangePercentage >= botTradingConfig.sellPercentage) {
      shouldBuy = dumpFromAveragePrice;
    }

    return {
      currentPrice: currentPrice,
      averagePrice: averagePrice,
      averagePriceChangePercentage: averagePriceChangePercentage,
      dumpFromAveragePrice: dumpFromAveragePrice,
      lastBuyPrice: lastBuyPrice ? lastBuyPrice : undefined,
      lastBuyPriceChangePercentage: lastBuyPriceChangePercentage ? lastBuyPriceChangePercentage : undefined,
      shouldBuy: shouldBuy,
    };
  }

  #getChangePercentage(current: number, previous: number): number {
    return roundNumber(current / previous - 1, 4);
  }

  #isDumpFromAveragePrice(averagePriceChangePercentage: number, dumpPercentage: number): boolean {
    return averagePriceChangePercentage <= dumpPercentage;
  }

  #getSellPrice(current: number, percentage: number): number {
    return roundNumber(current * (1 + percentage), 2);
  }

  async #buyOrder(symbol: string, quantity: number): Promise<BotTradingOrder> {
    const createOrder = {
      symbol: symbol,
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      quoteAssetQuantity: quantity,
    };

    const order = await this.#order(createOrder);

    return {
      id: order.id,
      quantity: order.executedAssetQuantity!,
      price: order.executedPrice!,
    };
  }

  async #sellOrder(symbol: string, quantity: number, price: number): Promise<BotTradingOrder> {
    const createOrder = {
      symbol: symbol,
      side: OrderSide.SELL,
      type: OrderType.TAKE_PROFIT,
      baseAssetQuantity: quantity,
      priceThreshold: price,
    };

    const order = await this.#order(createOrder);

    return {
      id: order.id,
      quantity: quantity,
      price: price,
    };
  }

  async #order(createOrder: CreateOrder): Promise<Order> {
    try {
      return await this.orderService.create(createOrder);
    } catch (error) {
      logger.child({ err: error }).error(createOrder, 'Unable to trade symbol');
      throw error;
    }
  }
}
