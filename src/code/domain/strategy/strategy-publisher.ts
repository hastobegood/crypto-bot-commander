export interface StrategyPublisher {
  publishWithStatusActive(strategyId: string): Promise<void>;
}
