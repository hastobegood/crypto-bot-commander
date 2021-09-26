import { StrategyStepTemplate } from './strategy-step';

export type StrategyStatus = 'Active' | 'Inactive' | 'Error';

export interface StrategyTemplate {
  [id: string]: StrategyStepTemplate;
}

export interface Strategy {
  id: string;
  symbol: string;
  status: StrategyStatus;
  template: StrategyTemplate;
}

export interface StrategyWallet {
  initialBaseAssetQuantity: number;
  availableBaseAssetQuantity: number;
  profitAndLossBaseAssetQuantity: number;
  initialQuoteAssetQuantity: number;
  availableQuoteAssetQuantity: number;
  profitAndLossQuoteAssetQuantity: number;
}

export const getStepTemplateById = (strategy: Strategy, stepTemplateId: string): StrategyStepTemplate => {
  const stepTemplate = strategy.template[stepTemplateId];
  if (!stepTemplate) {
    throw new Error(`Unable to find step template ${stepTemplateId} on strategy ${strategy.id}`);
  }
  return stepTemplate;
};
