import { Account } from './model/account';

export interface AccountRepository {
  getAccount(): Promise<Account>;
}
