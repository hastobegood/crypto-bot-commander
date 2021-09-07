import { mocked } from 'ts-jest/utils';
import { StrategyRepository } from '../../../../src/code/domain/strategy/strategy-repository';
import { StrategyPublisher } from '../../../../src/code/domain/strategy/strategy-publisher';
import { PublishStrategyService } from '../../../../src/code/domain/strategy/publish-strategy-service';

const strategyRepositoryMock = mocked(jest.genMockFromModule<StrategyRepository>('../../../../src/code/domain/strategy/strategy-repository'), true);
const strategyPublisherMock = mocked(jest.genMockFromModule<StrategyPublisher>('../../../../src/code/domain/strategy/strategy-publisher'), true);

let publishStrategyService: PublishStrategyService;
beforeEach(() => {
  strategyRepositoryMock.getAllIdsWithStatusActive = jest.fn();
  strategyPublisherMock.publishWithStatusActive = jest.fn();

  publishStrategyService = new PublishStrategyService(strategyRepositoryMock, strategyPublisherMock);
});

describe('PublishStrategyService', () => {
  describe('Given all active strategies to publish', () => {
    describe('When active strategies are not found', () => {
      beforeEach(() => {
        strategyRepositoryMock.getAllIdsWithStatusActive.mockResolvedValue([]);
      });

      it('Then nothing is published', async () => {
        await publishStrategyService.publishAllWithStatusActive();

        expect(strategyRepositoryMock.getAllIdsWithStatusActive).toHaveBeenCalledTimes(1);
        const getAllIdsWithStatusActiveParams = strategyRepositoryMock.getAllIdsWithStatusActive.mock.calls[0];
        expect(getAllIdsWithStatusActiveParams.length).toEqual(0);

        expect(strategyPublisherMock.publishWithStatusActive).toHaveBeenCalledTimes(0);
      });
    });

    describe('When active strategies are found', () => {
      beforeEach(() => {
        strategyRepositoryMock.getAllIdsWithStatusActive.mockResolvedValue(['1', '2', '3']);
      });

      it('Then active strategies IDs are published one by one', async () => {
        await publishStrategyService.publishAllWithStatusActive();

        expect(strategyRepositoryMock.getAllIdsWithStatusActive).toHaveBeenCalledTimes(1);
        const getAllIdsWithStatusActiveParams = strategyRepositoryMock.getAllIdsWithStatusActive.mock.calls[0];
        expect(getAllIdsWithStatusActiveParams.length).toEqual(0);

        expect(strategyPublisherMock.publishWithStatusActive).toHaveBeenCalledTimes(3);
        let publishWithStatusActiveParams = strategyPublisherMock.publishWithStatusActive.mock.calls[0];
        expect(publishWithStatusActiveParams.length).toEqual(1);
        expect(publishWithStatusActiveParams[0]).toEqual('1');
        publishWithStatusActiveParams = strategyPublisherMock.publishWithStatusActive.mock.calls[1];
        expect(publishWithStatusActiveParams.length).toEqual(1);
        expect(publishWithStatusActiveParams[0]).toEqual('2');
        publishWithStatusActiveParams = strategyPublisherMock.publishWithStatusActive.mock.calls[2];
        expect(publishWithStatusActiveParams.length).toEqual(1);
        expect(publishWithStatusActiveParams[0]).toEqual('3');
      });
    });
  });
});
