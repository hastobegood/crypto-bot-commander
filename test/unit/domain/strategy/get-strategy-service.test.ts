import { mocked } from 'ts-jest/utils';
import { StrategyRepository } from '../../../../src/code/domain/strategy/strategy-repository';
import { GetStrategyService } from '../../../../src/code/domain/strategy/get-strategy-service';
import { Strategy, StrategyWallet } from '../../../../src/code/domain/strategy/model/strategy';
import { buildDefaultStrategy, buildDefaultStrategyWallet } from '../../../builders/domain/strategy/strategy-test-builder';

const strategyRepositoryMock = mocked(jest.genMockFromModule<StrategyRepository>('../../../../src/code/domain/strategy/strategy-repository'), true);

let getStrategyService: GetStrategyService;
beforeEach(() => {
  strategyRepositoryMock.getById = jest.fn();
  strategyRepositoryMock.getWalletById = jest.fn();

  getStrategyService = new GetStrategyService(strategyRepositoryMock);
});

describe('GetStrategyService', () => {
  describe('Given a strategy to retrieve by its ID', () => {
    describe('When strategy is found', () => {
      let strategy: Strategy;

      beforeEach(() => {
        strategy = buildDefaultStrategy();
        strategyRepositoryMock.getById.mockResolvedValue(strategy);
      });

      it('Then strategy is returned', async () => {
        const result = await getStrategyService.getById('666');
        expect(result).toEqual(strategy);

        expect(strategyRepositoryMock.getById).toHaveBeenCalledTimes(1);
        const getByIdParams = strategyRepositoryMock.getById.mock.calls[0];
        expect(getByIdParams.length).toEqual(1);
        expect(getByIdParams[0]).toEqual('666');
      });
    });
  });

  describe('Given a strategy wallet to retrieve by its ID', () => {
    describe('When strategy wallet is found', () => {
      let wallet: StrategyWallet;

      beforeEach(() => {
        wallet = buildDefaultStrategyWallet();
        strategyRepositoryMock.getWalletById.mockResolvedValue(wallet);
      });

      it('Then strategy wallet is returned', async () => {
        const result = await getStrategyService.getWalletById('666');
        expect(result).toEqual(wallet);

        expect(strategyRepositoryMock.getWalletById).toHaveBeenCalledTimes(1);
        const getWalletByIdParams = strategyRepositoryMock.getWalletById.mock.calls[0];
        expect(getWalletByIdParams.length).toEqual(1);
        expect(getWalletByIdParams[0]).toEqual('666');
      });
    });
  });
});
