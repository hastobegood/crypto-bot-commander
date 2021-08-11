import { AccountRepository } from './account-repository';
import { AccountService } from './account-service';
import { Account } from './model/account';

export class DefaultAccountService implements AccountService {
  constructor(private accountRepository: AccountRepository) {}

  async getAccount(): Promise<Account> {
    return await this.accountRepository.getAccount();
  }
}
