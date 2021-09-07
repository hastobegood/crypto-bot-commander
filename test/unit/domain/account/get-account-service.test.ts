import { mocked } from 'ts-jest/utils';
import { AccountRepository } from '../../../../src/code/domain/account/account-repository';
import { GetAccountService } from '../../../../src/code/domain/account/get-account-service';
import { Account } from '../../../../src/code/domain/account/model/account';
import { buildDefaultAccount } from '../../../builders/domain/account/account-test-builder';

const accountRepositoryMock = mocked(jest.genMockFromModule<AccountRepository>('../../../../src/code/domain/account/account-repository'), true);

let getAccountService: GetAccountService;
beforeEach(() => {
  accountRepositoryMock.get = jest.fn();

  getAccountService = new GetAccountService(accountRepositoryMock);
});

describe('GetAccountService', () => {
  describe('Given an account to retrieve', () => {
    describe('When account is found', () => {
      let account: Account;

      beforeEach(() => {
        account = buildDefaultAccount();
        accountRepositoryMock.get.mockResolvedValue(account);
      });

      it('Then account is returned', async () => {
        const result = await getAccountService.get();
        expect(result).toEqual(account);

        expect(accountRepositoryMock.get).toHaveBeenCalledTimes(1);
        const getParams = accountRepositoryMock.get.mock.calls[0];
        expect(getParams.length).toEqual(0);
      });
    });
  });
});
