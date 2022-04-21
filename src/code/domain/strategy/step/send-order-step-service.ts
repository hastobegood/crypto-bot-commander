import { GetCandlestickService } from '../../candlestick/get-candlestick-service';
import { CreateOrderService } from '../../order/create-order-service';
import { CreateOrder } from '../../order/model/order';
import { GetStrategyService } from '../get-strategy-service';
import { Strategy, StrategyWallet } from '../model/strategy';
import { CheckOrderStepOutput, SendOrderStepInput, SendOrderStepOutput, StrategyStepType } from '../model/strategy-step';

import { StrategyStepRepository } from './strategy-step-repository';
import { StrategyStepService } from './strategy-step-service';

export class SendOrderStepService implements StrategyStepService {
  constructor(private getStrategyService: GetStrategyService, private createOrderService: CreateOrderService, private getCandlestickService: GetCandlestickService, private strategyStepRepository: StrategyStepRepository) {}

  getType(): StrategyStepType {
    return 'SendOrder';
  }

  async process(strategy: Strategy, sendOrderStepInput: SendOrderStepInput): Promise<SendOrderStepOutput> {
    if (sendOrderStepInput.type === 'Limit' && sendOrderStepInput.deviation === undefined) {
      throw new Error(`Unable to send limit order without deviation`);
    }

    const createOrder = await this.buildCreateOrder(strategy, sendOrderStepInput);
    const order = await this.createOrderService.create(createOrder);

    return {
      success: true,
      id: order.id,
      externalId: order.externalId,
      side: order.side,
      type: order.type,
      status: order.status,
      externalStatus: order.externalStatus,
      baseAssetQuantity: order.quote ? undefined : order.requestedQuantity,
      quoteAssetQuantity: order.quote ? order.requestedQuantity : undefined,
      priceLimit: order.requestedPrice,
    };
  }

  async buildCreateOrder(strategy: Strategy, sendOrderStepInput: SendOrderStepInput): Promise<CreateOrder> {
    const wallet = await this.getStrategyService.getWalletById(strategy.id);
    if (!wallet) {
      throw new Error(`Unable to send order without strategy wallet`);
    }

    return {
      exchange: strategy.exchange,
      symbol: strategy.symbol,
      side: sendOrderStepInput.side,
      type: sendOrderStepInput.type,
      ...(await this.#getQuantities(strategy, wallet, sendOrderStepInput)),
    };
  }

  async #getQuantities(strategy: Strategy, wallet: StrategyWallet, sendOrderStepInput: SendOrderStepInput): Promise<{ quote: boolean; requestedQuantity: number; requestedPrice?: number }> {
    switch (sendOrderStepInput.source) {
      case 'Wallet':
        return this.#getQuantitiesFromWallet(strategy, wallet, sendOrderStepInput);
      case 'LastOrder':
        return this.#getQuantitiesFromLastOrderStep(strategy, sendOrderStepInput);
      default:
        throw new Error(`Unsupported '${sendOrderStepInput.source}' send order source`);
    }
  }

  async #getQuantitiesFromWallet(strategy: Strategy, wallet: StrategyWallet, sendOrderStepInput: SendOrderStepInput): Promise<{ quote: boolean; requestedQuantity: number; requestedPrice?: number }> {
    if (sendOrderStepInput.type === 'Market') {
      return {
        quote: sendOrderStepInput.side === 'Buy',
        requestedQuantity: (sendOrderStepInput.side === 'Buy' ? wallet.availableQuoteAssetQuantity : wallet.availableBaseAssetQuantity) * sendOrderStepInput.percentage,
      };
    }

    const lastCandlestick = await this.getCandlestickService.getLastBySymbol(strategy.exchange, strategy.symbol);
    if (!lastCandlestick) {
      throw new Error('Unable to send limit order without last candlestick');
    }

    const priceLimit = (1 + sendOrderStepInput.deviation!) * lastCandlestick.closingPrice;
    const baseAssetQuantity = sendOrderStepInput.side === 'Buy' ? (wallet.availableQuoteAssetQuantity * sendOrderStepInput.percentage) / priceLimit : wallet.availableBaseAssetQuantity * sendOrderStepInput.percentage;

    return {
      quote: false,
      requestedQuantity: baseAssetQuantity,
      requestedPrice: priceLimit,
    };
  }

  async #getQuantitiesFromLastOrderStep(strategy: Strategy, sendOrderStepInput: SendOrderStepInput): Promise<{ quote: false; requestedQuantity: number; requestedPrice?: number }> {
    const lastCheckOrderStep = await this.strategyStepRepository.getLastByStrategyIdAndType(strategy.id, 'CheckOrder');
    if (!lastCheckOrderStep) {
      throw new Error(`Unable to calculate quantity without last order`);
    }

    return {
      quote: false,
      requestedQuantity: sendOrderStepInput.percentage * (lastCheckOrderStep.output as CheckOrderStepOutput).quantity!,
      requestedPrice: sendOrderStepInput.type === 'Limit' ? (1 + sendOrderStepInput.deviation!) * (lastCheckOrderStep.output as CheckOrderStepOutput).price! : undefined,
    };
  }
}
