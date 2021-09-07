import { Account } from './model/account';

export interface AccountRepository {
  get(): Promise<Account>;
}
