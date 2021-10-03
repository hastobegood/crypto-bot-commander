import { CheckOrderStepInput, CheckOrderStepOutput, StrategyStepType } from '../model/strategy-step';
import { StrategyStepService } from './strategy-step-service';
import { Strategy } from '../model/strategy';
import { StatusOrderService } from '../../order/status-order-service';
import { UpdateStrategyService } from '../update-strategy-service';

export class CheckOrderStepService implements StrategyStepService {
  constructor(private statusOrderService: StatusOrderService, private updateStrategyService: UpdateStrategyService) {}

  getType(): StrategyStepType {
    return 'CheckOrder';
  }

  async process(strategy: Strategy, checkOrderStepInput: CheckOrderStepInput): Promise<CheckOrderStepOutput> {
    const status = await this.statusOrderService.check(strategy.symbol, checkOrderStepInput.externalId);
    const success = status.status === 'Filled' && !!status.executedAssetQuantity && !!status.executedPrice;

    if (success) {
      const consumedBaseAssetQuantity = status.side === 'Buy' ? status.executedAssetQuantity! : status.executedAssetQuantity! * -1;
      const consumedQuoteAssetQuantity = status.side === 'Buy' ? status.executedAssetQuantity! * status.executedPrice! * -1 : status.executedAssetQuantity! * status.executedPrice!;
      await this.updateStrategyService.updateWalletById(strategy.id, consumedBaseAssetQuantity, consumedQuoteAssetQuantity);
    }

    return {
      success: success,
      id: checkOrderStepInput.id,
      side: status.side,
      status: status.status,
      externalId: checkOrderStepInput.externalId,
      externalStatus: status.externalStatus,
      quantity: status.executedAssetQuantity,
      price: status.executedPrice,
    };
  }
}
