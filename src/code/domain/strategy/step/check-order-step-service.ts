import { OrderCheckup } from '@hastobegood/crypto-bot-artillery/order';
import { CheckOrderStepInput, CheckOrderStepOutput, StrategyStepType } from '../model/strategy-step';
import { StrategyStepService } from './strategy-step-service';
import { Strategy } from '../model/strategy';
import { CheckOrderService } from '../../order/check-order-service';
import { UpdateStrategyService } from '../update-strategy-service';
import { UpdateOrderService } from '../../order/update-order-service';

export class CheckOrderStepService implements StrategyStepService {
  constructor(private checkOrderService: CheckOrderService, private updateOrderService: UpdateOrderService, private updateStrategyService: UpdateStrategyService) {}

  getType(): StrategyStepType {
    return 'CheckOrder';
  }

  async process(strategy: Strategy, checkOrderStepInput: CheckOrderStepInput): Promise<CheckOrderStepOutput> {
    const orderCheckup = await this.checkOrderService.check(strategy.exchange, strategy.symbol, checkOrderStepInput.externalId);
    const success = orderCheckup.status === 'Filled' && !!orderCheckup.executedQuantity && !!orderCheckup.executedPrice;

    if (success) {
      await Promise.all([this.#updateOrderStatus(checkOrderStepInput, orderCheckup), this.#updateStrategyWallet(strategy, checkOrderStepInput, orderCheckup)]);
    }

    return {
      success: success,
      id: checkOrderStepInput.id,
      status: orderCheckup.status,
      externalId: checkOrderStepInput.externalId,
      externalStatus: orderCheckup.externalStatus,
      quantity: orderCheckup.executedQuantity,
      price: orderCheckup.executedPrice,
    };
  }

  async #updateOrderStatus(checkOrderStepInput: CheckOrderStepInput, orderCheckup: OrderCheckup): Promise<void> {
    return this.updateOrderService.updateStatusById(checkOrderStepInput.id, orderCheckup.status, orderCheckup.externalStatus, orderCheckup.executedQuantity!, orderCheckup.executedPrice!);
  }

  async #updateStrategyWallet(strategy: Strategy, checkOrderStepInput: CheckOrderStepInput, orderCheckup: OrderCheckup): Promise<void> {
    const consumedBaseAssetQuantity = checkOrderStepInput.side === 'Buy' ? orderCheckup.executedQuantity! : orderCheckup.executedQuantity! * -1;
    const consumedQuoteAssetQuantity = checkOrderStepInput.side === 'Buy' ? orderCheckup.executedQuantity! * orderCheckup.executedPrice! * -1 : orderCheckup.executedQuantity! * orderCheckup.executedPrice!;
    return this.updateStrategyService.updateWalletById(strategy.id, consumedBaseAssetQuantity, consumedQuoteAssetQuantity);
  }
}
