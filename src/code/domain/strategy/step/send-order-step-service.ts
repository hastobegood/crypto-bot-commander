import { SendOrderStepInput, SendOrderStepOutput, StrategyStepType } from '../model/strategy-step';
import { StrategyStepService } from './strategy-step-service';
import { Strategy } from '../model/strategy';
import { StrategyStepRepository } from './strategy-step-repository';
import { CreateOrderService } from '../../order/create-order-service';

export class SendOrderStepService implements StrategyStepService {
  constructor(private createOrderService: CreateOrderService, private strategyStepRepository: StrategyStepRepository) {}

  getType(): StrategyStepType {
    return 'SendOrder';
  }

  async process(strategy: Strategy, sendOrderStepInput: SendOrderStepInput): Promise<SendOrderStepOutput> {
    const quantities = await this.#getQuantities(strategy, sendOrderStepInput);

    const createOrder = {
      symbol: strategy.symbol,
      side: sendOrderStepInput.side,
      type: sendOrderStepInput.type,
      ...quantities,
    };

    const order = await this.createOrderService.create(createOrder);

    return {
      success: order.status === 'Filled',
      id: order.id,
      externalId: order.externalId!,
      status: order.status,
      externalStatus: order.externalStatus!,
      quantity: order.executedAssetQuantity,
      price: order.executedPrice,
    };
  }

  async #getQuantities(strategy: Strategy, sendOrderStepInput: SendOrderStepInput): Promise<{ baseAssetQuantity: number | undefined; quoteAssetQuantity: number | undefined }> {
    switch (sendOrderStepInput.source) {
      case 'Budget':
        return this.#getQuantitiesFromBudget(strategy, sendOrderStepInput);
      case 'LastOrder':
        return this.#getQuantitiesFromLastSendOrderStep(strategy, sendOrderStepInput);
      default:
        throw new Error(`Unsupported '${sendOrderStepInput.source}' send order source`);
    }
  }

  async #getQuantitiesFromBudget(strategy: Strategy, sendOrderStepInput: SendOrderStepInput): Promise<{ baseAssetQuantity: number | undefined; quoteAssetQuantity: number | undefined }> {
    return {
      baseAssetQuantity: sendOrderStepInput.side === 'Sell' ? this.#getAssetQuantity(strategy.budget.availableBaseAssetQuantity, sendOrderStepInput.percentage) : undefined,
      quoteAssetQuantity: sendOrderStepInput.side === 'Buy' ? this.#getAssetQuantity(strategy.budget.availableQuoteAssetQuantity, sendOrderStepInput.percentage) : undefined,
    };
  }

  async #getQuantitiesFromLastSendOrderStep(strategy: Strategy, sendOrderStepInput: SendOrderStepInput): Promise<{ baseAssetQuantity: number; quoteAssetQuantity: undefined }> {
    if (sendOrderStepInput.side === 'Buy') {
      throw new Error('Unable to send buy order from last order source');
    }

    const lastSendOrderStep = await this.strategyStepRepository.getLastSendOrderByStrategyIdAndOrderSide(strategy.id, 'Buy');
    if (!lastSendOrderStep) {
      throw new Error(`Unable to calculate sell quantity without last order`);
    }

    return {
      baseAssetQuantity: this.#getAssetQuantity(sendOrderStepInput.percentage, (lastSendOrderStep.output as SendOrderStepOutput).quantity!),
      quoteAssetQuantity: undefined,
    };
  }

  #getAssetQuantity(percentage: number, quantity: number): number {
    return percentage * quantity;
  }
}
