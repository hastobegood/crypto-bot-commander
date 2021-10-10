import { CheckOrderStepOutput, SendOrderStepInput, SendOrderStepOutput, StrategyStepType } from '../model/strategy-step';
import { StrategyStepService } from './strategy-step-service';
import { Strategy, StrategyWallet } from '../model/strategy';
import { StrategyStepRepository } from './strategy-step-repository';
import { CreateOrderService } from '../../order/create-order-service';
import { GetCandlestickService } from '../../candlestick/get-candlestick-service';
import { GetStrategyService } from '../get-strategy-service';
import { OrderQuantities } from '../../order/model/order';

export class SendOrderStepService implements StrategyStepService {
  constructor(private getStrategyService: GetStrategyService, private createOrderService: CreateOrderService, private getCandlestickService: GetCandlestickService, private strategyStepRepository: StrategyStepRepository) {}

  getType(): StrategyStepType {
    return 'SendOrder';
  }

  async process(strategy: Strategy, sendOrderStepInput: SendOrderStepInput): Promise<SendOrderStepOutput> {
    if (sendOrderStepInput.type === 'Limit' && !sendOrderStepInput.deviation) {
      throw new Error(`Unable to send limit order without deviation`);
    }

    const wallet = await this.getStrategyService.getWalletById(strategy.id);
    if (!wallet) {
      throw new Error(`Unable to send order without strategy wallet`);
    }

    const createOrder = {
      symbol: strategy.symbol,
      side: sendOrderStepInput.side,
      type: sendOrderStepInput.type,
      ...(await this.#getQuantities(strategy, wallet, sendOrderStepInput)),
    };

    const order = await this.createOrderService.create(createOrder);

    return {
      success: true,
      id: order.id,
      externalId: order.externalId,
      status: order.status,
      externalStatus: order.externalStatus,
      baseAssetQuantity: order.baseAssetQuantity,
      quoteAssetQuantity: order.quoteAssetQuantity,
      priceLimit: order.priceLimit,
    };
  }

  async #getQuantities(strategy: Strategy, wallet: StrategyWallet, sendOrderStepInput: SendOrderStepInput): Promise<OrderQuantities> {
    switch (sendOrderStepInput.source) {
      case 'Wallet':
        return this.#getQuantitiesFromWallet(strategy, wallet, sendOrderStepInput);
      case 'LastOrder':
        return this.#getQuantitiesFromLastOrderStep(strategy, sendOrderStepInput);
      default:
        throw new Error(`Unsupported '${sendOrderStepInput.source}' send order source`);
    }
  }

  async #getQuantitiesFromWallet(strategy: Strategy, wallet: StrategyWallet, sendOrderStepInput: SendOrderStepInput): Promise<OrderQuantities> {
    if (sendOrderStepInput.type === 'Market') {
      return {
        baseAssetQuantity: sendOrderStepInput.side === 'Sell' ? wallet.availableBaseAssetQuantity * sendOrderStepInput.percentage : undefined,
        quoteAssetQuantity: sendOrderStepInput.side === 'Buy' ? wallet.availableQuoteAssetQuantity * sendOrderStepInput.percentage : undefined,
      };
    }

    const lastCandlestick = await this.getCandlestickService.getLastBySymbol(strategy.symbol);
    if (!lastCandlestick) {
      throw new Error('Unable to send limit order without last candlestick');
    }

    const priceLimit = (1 + sendOrderStepInput.deviation!) * lastCandlestick.closingPrice;
    const baseAssetQuantity = sendOrderStepInput.side === 'Buy' ? (wallet.availableQuoteAssetQuantity * sendOrderStepInput.percentage) / priceLimit : wallet.availableBaseAssetQuantity * sendOrderStepInput.percentage;

    return {
      baseAssetQuantity: baseAssetQuantity,
      priceLimit: priceLimit,
    };
  }

  async #getQuantitiesFromLastOrderStep(strategy: Strategy, sendOrderStepInput: SendOrderStepInput): Promise<{ baseAssetQuantity: number; priceLimit?: number }> {
    const lastCheckOrderStep = await this.strategyStepRepository.getLastByStrategyIdAndType(strategy.id, 'CheckOrder');
    if (!lastCheckOrderStep) {
      throw new Error(`Unable to calculate quantity without last order`);
    }

    return {
      baseAssetQuantity: sendOrderStepInput.percentage * (lastCheckOrderStep.output as CheckOrderStepOutput).quantity!,
      priceLimit: sendOrderStepInput.type === 'Limit' ? (1 + sendOrderStepInput.deviation!) * (lastCheckOrderStep.output as CheckOrderStepOutput).price! : undefined,
    };
  }
}
