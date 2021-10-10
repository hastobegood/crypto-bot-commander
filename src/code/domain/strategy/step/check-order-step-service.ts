import { CheckOrderStepInput, CheckOrderStepOutput, StrategyStepType } from '../model/strategy-step';
import { StrategyStepService } from './strategy-step-service';
import { Strategy } from '../model/strategy';
import { CheckOrderService } from '../../order/check-order-service';
import { UpdateStrategyService } from '../update-strategy-service';
import { UpdateOrderService } from '../../order/update-order-service';
import { OrderReview } from '../../order/model/order';

export class CheckOrderStepService implements StrategyStepService {
  constructor(private checkOrderService: CheckOrderService, private updateOrderService: UpdateOrderService, private updateStrategyService: UpdateStrategyService) {}

  getType(): StrategyStepType {
    return 'CheckOrder';
  }

  async process(strategy: Strategy, checkOrderStepInput: CheckOrderStepInput): Promise<CheckOrderStepOutput> {
    const review = await this.checkOrderService.check(strategy.symbol, checkOrderStepInput.externalId);
    const success = review.status === 'Filled' && !!review.executedAssetQuantity && !!review.executedPrice;

    if (success) {
      await Promise.all([this.#updateOrderStatus(checkOrderStepInput, review), this.#updateStrategyWallet(strategy, review)]);
    }

    return {
      success: success,
      id: checkOrderStepInput.id,
      status: review.status,
      externalId: checkOrderStepInput.externalId,
      externalStatus: review.externalStatus,
      quantity: review.executedAssetQuantity,
      price: review.executedPrice,
    };
  }

  async #updateOrderStatus(checkOrderStepInput: CheckOrderStepInput, review: OrderReview): Promise<void> {
    return this.updateOrderService.updateStatusById(checkOrderStepInput.id, review.status, review.externalStatus, review.executedAssetQuantity!, review.executedPrice!);
  }

  async #updateStrategyWallet(strategy: Strategy, review: OrderReview): Promise<void> {
    const consumedBaseAssetQuantity = review.side === 'Buy' ? review.executedAssetQuantity! : review.executedAssetQuantity! * -1;
    const consumedQuoteAssetQuantity = review.side === 'Buy' ? review.executedAssetQuantity! * review.executedPrice! * -1 : review.executedAssetQuantity! * review.executedPrice!;
    return this.updateStrategyService.updateWalletById(strategy.id, consumedBaseAssetQuantity, consumedQuoteAssetQuantity);
  }
}
