import { Account, AccountBalance } from '../../../../src/code/domain/account/model/account';
import { randomNumber, randomString } from '../../random-test-builder';

export const buildDefaultAccount = (): Account => {
  return {
    canTrade: true,
    accountType: 'SPOT',
    balances: [
      {
        asset: randomString(5).toUpperCase(),
        availableQuantity: randomNumber(100, 1_000),
        lockedQuantity: randomNumber(0, 100),
      },
      {
        asset: randomString(5).toUpperCase(),
        availableQuantity: randomNumber(100, 1_000),
        lockedQuantity: randomNumber(0, 100),
      },
    ],
    permissions: ['SPOT'],
  };
};

export const buildAccountBalance = (asset: string, availableQuantity: number, lockedQuantity: number): AccountBalance => {
  return {
    asset: asset,
    availableQuantity: availableQuantity,
    lockedQuantity: lockedQuantity,
  };
};
