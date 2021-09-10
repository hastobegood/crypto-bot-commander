export type StrategyStepType = 'SendOrder' | 'MarketEvolution' | 'MovingAverageCrossover';

export interface StrategyStepTemplate {
  id: string;
  type: StrategyStepType;
  input: StrategyStepInput;
  nextId: string;
}

export interface StrategyStep extends StrategyStepTemplate {
  strategyId: string;
  output: StrategyStepOutput;
  error?: StrategyStepError;
  creationDate: Date;
  executionStartDate: Date;
  executionEndDate: Date;
}

export interface StrategyStepInput {
  wait?: number;
}

export interface StrategyStepOutput {
  success: boolean;
}

export interface StrategyStepError {
  message: string;
  details: string;
}

export type MarketEvolutionSource = 'Market' | 'LastOrder';
export type MarketEvolutionInterval = '1m' | '5m' | '15m' | '30m' | '1h' | '6h' | '12h' | '1d';

export interface MarketEvolutionStepInput extends StrategyStepInput {
  source: MarketEvolutionSource;
  interval?: MarketEvolutionInterval;
  period?: number;
  percentageThreshold: number;
}

export interface MarketEvolutionStepOutput extends StrategyStepOutput {
  lastPrice: number;
  currentPrice: number;
  percentage: number;
}

export type MovingAverageType = 'SMA' | 'CMA' | 'EMA';
export type MovingAverageCrossover = 'CurrentPrice' | 'ShortTermPrice';
export type MovingAverageSignal = 'Buy' | 'Sell';

export interface MovingAverageCrossoverStepInput extends StrategyStepInput {
  type: MovingAverageType;
  crossover: MovingAverageCrossover;
  signal: MovingAverageSignal;
  shortTermPeriod: number;
  longTermPeriod: number;
}

export interface MovingAverageCrossoverStepOutput extends StrategyStepOutput {
  currentPrice: number;
  shortTermPrice: number;
  longTermPrice: number;
}

export type SendOrderSource = 'Budget' | 'LastOrder';
export type SendOrderSide = 'Buy' | 'Sell';
export type SendOrderType = 'Market';

export interface SendOrderStepInput extends StrategyStepInput {
  source: SendOrderSource;
  side: SendOrderSide;
  type: SendOrderType;
  percentage: number;
}

export interface SendOrderStepOutput extends StrategyStepOutput {
  id: string;
  externalId: string;
  status: string;
  externalStatus: string;
  quantity?: number;
  price?: number;
}
