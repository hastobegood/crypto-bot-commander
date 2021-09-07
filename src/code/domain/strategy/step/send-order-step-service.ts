import { extractAssets } from '../../../configuration/util/symbol';
import { Account } from '../../account/model/account';
import { SendOrderStepInput, SendOrderStepOutput, StrategyStepType } from '../model/strategy-step';
import { StrategyStepService } from './strategy-step-service';
import { Strategy } from '../model/strategy';
import { StrategyStepRepository } from './strategy-step-repository';
import { CreateOrderService } from '../../order/create-order-service';
import { GetAccountService } from '../../account/get-account-service';

export class SendOrderStepService implements StrategyStepService {
  constructor(private getAccountService: GetAccountService, private createOrderService: CreateOrderService, private strategyStepRepository: StrategyStepRepository) {}

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
      quantity: order.executedAssetQuantity,
      price: order.executedPrice,
    };
  }

  async #getQuantities(strategy: Strategy, sendOrderStepInput: SendOrderStepInput): Promise<{ baseAssetQuantity: number | undefined; quoteAssetQuantity: number | undefined }> {
    switch (sendOrderStepInput.source) {
      case 'Account':
        return this.#getQuantitiesFromAccount(strategy, sendOrderStepInput);
      case 'LastOrder':
        return this.#getQuantitiesFromLastSendOrderStep(strategy, sendOrderStepInput);
      default:
        throw new Error(`Unsupported '${sendOrderStepInput.source}' send order source`);
    }
  }

  async #getQuantitiesFromAccount(strategy: Strategy, sendOrderStepInput: SendOrderStepInput): Promise<{ baseAssetQuantity: number | undefined; quoteAssetQuantity: number | undefined }> {
    const account = await this.getAccountService.get();
    const assets = extractAssets(strategy.symbol);

    return {
      baseAssetQuantity: sendOrderStepInput.side === 'Sell' ? this.#getAssetAvailableQuantity(sendOrderStepInput.percentage, account, assets.baseAsset) : undefined,
      quoteAssetQuantity: sendOrderStepInput.side === 'Buy' ? this.#getAssetAvailableQuantity(sendOrderStepInput.percentage, account, assets.quoteAsset) : undefined,
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

  #getAssetAvailableQuantity(percentage: number, account: Account, asset: string): number {
    const quantity = account.balances.find((balance) => balance.asset === asset)?.availableQuantity;

    return quantity ? this.#getAssetQuantity(percentage, quantity) : 0;
  }

  #getAssetQuantity(percentage: number, quantity: number): number {
    return percentage * quantity;
  }
}
