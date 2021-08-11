import { Account } from './model/account';

export interface AccountService {
  getAccount(): Promise<Account>;
}
