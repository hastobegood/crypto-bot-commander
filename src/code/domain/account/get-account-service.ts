import { AccountRepository } from './account-repository';
import { Account } from './model/account';

export class GetAccountService {
  constructor(private accountRepository: AccountRepository) {}

  async get(): Promise<Account> {
    return this.accountRepository.get();
  }
}
