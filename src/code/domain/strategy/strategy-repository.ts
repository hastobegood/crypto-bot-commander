import { Strategy, StrategyStatus } from './model/strategy';

export interface StrategyRepository {
  getById(id: string): Promise<Strategy | null>;

  getAllIdsWithStatusActive(): Promise<string[]>;

  updateStatusById(id: string, status: StrategyStatus): Promise<Strategy>;
}
