import { DcaTrading, DcaTradingConfig } from './model/dca-trading';

export interface DcaTradingService {
  trade(dcaTradingConfig: DcaTradingConfig): Promise<DcaTrading>;
}
