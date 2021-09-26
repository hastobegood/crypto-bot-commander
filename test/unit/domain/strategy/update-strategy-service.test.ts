import { mocked } from 'ts-jest/utils';
import { StrategyRepository } from '../../../../src/code/domain/strategy/strategy-repository';
import { Strategy } from '../../../../src/code/domain/strategy/model/strategy';
import { buildDefaultStrategy } from '../../../builders/domain/strategy/strategy-test-builder';
import { UpdateStrategyService } from '../../../../src/code/domain/strategy/update-strategy-service';

const strategyRepositoryMock = mocked(jest.genMockFromModule<StrategyRepository>('../../../../src/code/domain/strategy/strategy-repository'), true);

let updateStrategyService: UpdateStrategyService;
beforeEach(() => {
  strategyRepositoryMock.updateStatusById = jest.fn();
  strategyRepositoryMock.updateWalletById = jest.fn();

  updateStrategyService = new UpdateStrategyService(strategyRepositoryMock);
});

describe('UpdateStrategyService', () => {
  describe('Given a strategy status to update by its ID', () => {
    describe('When strategy status is updated', () => {
      let strategy: Strategy;

      beforeEach(() => {
        strategy = buildDefaultStrategy();
        strategyRepositoryMock.updateStatusById.mockResolvedValue(strategy);
      });

      it('Then updated strategy is returned', async () => {
        const result = await updateStrategyService.updateStatusById('666', 'Active');
        expect(result).toEqual(strategy);

        expect(strategyRepositoryMock.updateStatusById).toHaveBeenCalledTimes(1);
        const updateStatusByIdParams = strategyRepositoryMock.updateStatusById.mock.calls[0];
        expect(updateStatusByIdParams.length).toEqual(2);
        expect(updateStatusByIdParams[0]).toEqual('666');
        expect(updateStatusByIdParams[1]).toEqual('Active');
      });
    });
  });

  describe('Given a strategy wallet to update by its ID', () => {
    describe('When strategy wallet is updated', () => {
      let strategy: Strategy;

      beforeEach(() => {
        strategy = buildDefaultStrategy();
        strategyRepositoryMock.updateWalletById.mockResolvedValue(strategy);
      });

      it('Then updated strategy is returned', async () => {
        const result = await updateStrategyService.updateWalletById('666', 10, -20);
        expect(result).toEqual(strategy);

        expect(strategyRepositoryMock.updateWalletById).toHaveBeenCalledTimes(1);
        const updateWalletByIdParams = strategyRepositoryMock.updateWalletById.mock.calls[0];
        expect(updateWalletByIdParams.length).toEqual(3);
        expect(updateWalletByIdParams[0]).toEqual('666');
        expect(updateWalletByIdParams[1]).toEqual(10);
        expect(updateWalletByIdParams[2]).toEqual(-20);
      });
    });
  });
});
