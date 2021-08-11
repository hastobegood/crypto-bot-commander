import { mocked } from 'ts-jest/utils';
import { AccountRepository } from '../../../../src/code/domain/account/account-repository';
import { DefaultAccountService } from '../../../../src/code/domain/account/default-account-service';
import { Account } from '../../../../src/code/domain/account/model/account';
import { buildDefaultAccount } from '../../../builders/domain/account/account-test-builder';

const accountRepositoryMock = mocked(jest.genMockFromModule<AccountRepository>('../../../../src/code/domain/account/account-repository'), true);

let accountService: DefaultAccountService;
beforeEach(() => {
  accountService = new DefaultAccountService(accountRepositoryMock);
});

describe('DefaultAccountService', () => {
  describe('Given an account to retrieve', () => {
    describe('When account retrieval has succeeded and account has been found', () => {
      let account: Account;

      beforeEach(() => {
        account = buildDefaultAccount();
        accountRepositoryMock.getAccount = jest.fn().mockReturnValue(account);
      });

      afterEach(() => {
        expect(accountRepositoryMock.getAccount).toHaveBeenCalledTimes(1);
      });

      it('Then account is returned', async () => {
        const result = await accountService.getAccount();
        expect(result).toBeDefined();
        expect(result).toEqual(account);
      });
    });
  });
});
