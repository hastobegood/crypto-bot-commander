import { DcaTrading } from './model/dca-trading';

export interface DcaTradingRepository {
  save(dcaTrading: DcaTrading): Promise<DcaTrading>;

  getLast(): Promise<DcaTrading | null>;
}
