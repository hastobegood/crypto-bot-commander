import { Strategy, StrategyStatus, StrategyWallet } from './model/strategy';

export interface StrategyRepository {
  getById(id: string): Promise<Strategy | null>;

  getAllIdsBySymbolAndActiveStatus(symbol: string): Promise<string[]>;

  updateStatusById(id: string, status: StrategyStatus): Promise<Strategy>;

  getWalletById(id: string): Promise<StrategyWallet | null>;

  updateWalletById(id: string, consumedBaseAssetQuantity: number, consumedQuoteAssetQuantity: number): Promise<Strategy>;
}
