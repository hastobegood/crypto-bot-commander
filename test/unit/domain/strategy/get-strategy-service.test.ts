import { mocked } from 'ts-jest/utils';
import { StrategyRepository } from '../../../../src/code/domain/strategy/strategy-repository';
import { GetStrategyService } from '../../../../src/code/domain/strategy/get-strategy-service';
import { Strategy } from '../../../../src/code/domain/strategy/model/strategy';
import { buildDefaultStrategy } from '../../../builders/domain/strategy/strategy-test-builder';

const strategyRepositoryMock = mocked(jest.genMockFromModule<StrategyRepository>('../../../../src/code/domain/strategy/strategy-repository'), true);

let getStrategyService: GetStrategyService;
beforeEach(() => {
  strategyRepositoryMock.getById = jest.fn();

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
});
