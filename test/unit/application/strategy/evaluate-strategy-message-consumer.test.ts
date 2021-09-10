import { mocked } from 'ts-jest/utils';
import { GetStrategyService } from '../../../../src/code/domain/strategy/get-strategy-service';
import { UpdateStrategyService } from '../../../../src/code/domain/strategy/update-strategy-service';
import { EvaluateStrategyService } from '../../../../src/code/domain/strategy/evaluate-strategy-service';
import { buildDefaultActiveStrategyMessage } from '../../../builders/infrastructure/strategy/strategy-message-builder';
import { Strategy } from '../../../../src/code/domain/strategy/model/strategy';
import { buildDefaultStrategy } from '../../../builders/domain/strategy/strategy-test-builder';
import { StrategyEvaluation } from '../../../../src/code/domain/strategy/model/strategy-evaluation';
import { buildStrategyEvaluation } from '../../../builders/domain/strategy/strategy-evaluation-test-builder';
import { EvaluateStrategyMessageConsumer } from '../../../../src/code/application/strategy/evaluate-strategy-message-consumer';
import { ActiveStrategyMessage } from '../../../../src/code/infrastructure/strategy/sqs-strategy-publisher';

const getStrategyServiceMock = mocked(jest.genMockFromModule<GetStrategyService>('../../../../src/code/domain/strategy/get-strategy-service'), true);
const updateStrategyServiceMock = mocked(jest.genMockFromModule<UpdateStrategyService>('../../../../src/code/domain/strategy/update-strategy-service'), true);
const evaluateStrategyServiceMock = mocked(jest.genMockFromModule<EvaluateStrategyService>('../../../../src/code/domain/strategy/evaluate-strategy-service'), true);

let evaluateStrategyMessageConsumer: EvaluateStrategyMessageConsumer;
beforeEach(() => {
  getStrategyServiceMock.getById = jest.fn();
  evaluateStrategyServiceMock.evaluate = jest.fn();
  updateStrategyServiceMock.updateStatusById = jest.fn();

  evaluateStrategyMessageConsumer = new EvaluateStrategyMessageConsumer(getStrategyServiceMock, updateStrategyServiceMock, evaluateStrategyServiceMock);
});

describe('EvaluateStrategyMessageConsumer', () => {
  let activeStrategyMessage: ActiveStrategyMessage;

  beforeEach(() => {
    activeStrategyMessage = buildDefaultActiveStrategyMessage();
  });

  describe('Given a strategy message to process', () => {
    describe('When strategy is not found', () => {
      beforeEach(() => {
        getStrategyServiceMock.getById.mockResolvedValue(null);
      });

      it('Then error is thrown', async () => {
        try {
          await evaluateStrategyMessageConsumer.process(activeStrategyMessage);
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual(`Unable to find strategy with ID '${activeStrategyMessage.content.id}'`);
        }

        expect(getStrategyServiceMock.getById).toHaveBeenCalledTimes(1);
        const getByIdParams = getStrategyServiceMock.getById.mock.calls[0];
        expect(getByIdParams.length).toEqual(1);
        expect(getByIdParams[0]).toEqual(activeStrategyMessage.content.id);

        expect(updateStrategyServiceMock.updateStatusById).toHaveBeenCalledTimes(1);
        const updateStatusByIdParams = updateStrategyServiceMock.updateStatusById.mock.calls[0];
        expect(updateStatusByIdParams.length).toEqual(2);
        expect(updateStatusByIdParams[0]).toEqual(activeStrategyMessage.content.id);
        expect(updateStatusByIdParams[1]).toEqual('Error');

        expect(evaluateStrategyServiceMock.evaluate).toHaveBeenCalledTimes(0);
      });
    });

    describe('When strategy is found', () => {
      let strategy: Strategy;

      beforeEach(() => {
        strategy = buildDefaultStrategy();
        getStrategyServiceMock.getById.mockResolvedValue(strategy);
      });

      describe('And evaluation has failed', () => {
        beforeEach(() => {
          evaluateStrategyServiceMock.evaluate.mockRejectedValue(new Error('Evaluation failed !'));
        });

        it('Then strategy status is updated and error is thrown', async () => {
          try {
            await evaluateStrategyMessageConsumer.process(activeStrategyMessage);
            fail('An error should have been thrown');
          } catch (error) {
            expect(error).toBeDefined();
            expect((error as Error).message).toEqual('Evaluation failed !');
          }

          expect(getStrategyServiceMock.getById).toHaveBeenCalledTimes(1);
          const getByIdParams = getStrategyServiceMock.getById.mock.calls[0];
          expect(getByIdParams.length).toEqual(1);
          expect(getByIdParams[0]).toEqual(activeStrategyMessage.content.id);

          expect(evaluateStrategyServiceMock.evaluate).toHaveBeenCalledTimes(1);
          const evaluateParams = evaluateStrategyServiceMock.evaluate.mock.calls[0];
          expect(evaluateParams.length).toEqual(1);
          expect(evaluateParams[0]).toEqual(strategy);

          expect(updateStrategyServiceMock.updateStatusById).toHaveBeenCalledTimes(1);
          const updateStatusByIdParams = updateStrategyServiceMock.updateStatusById.mock.calls[0];
          expect(updateStatusByIdParams.length).toEqual(2);
          expect(updateStatusByIdParams[0]).toEqual(activeStrategyMessage.content.id);
          expect(updateStatusByIdParams[1]).toEqual('Error');
        });
      });

      describe('And evaluation has succeeded', () => {
        let strategyEvaluation: StrategyEvaluation;

        describe('And evaluation is a success', () => {
          beforeEach(() => {
            strategyEvaluation = buildStrategyEvaluation(true);
            evaluateStrategyServiceMock.evaluate.mockResolvedValue(strategyEvaluation);
          });

          it('Then strategy status is not updated', async () => {
            await evaluateStrategyMessageConsumer.process(activeStrategyMessage);

            expect(getStrategyServiceMock.getById).toHaveBeenCalledTimes(1);
            const getByIdParams = getStrategyServiceMock.getById.mock.calls[0];
            expect(getByIdParams.length).toEqual(1);
            expect(getByIdParams[0]).toEqual(activeStrategyMessage.content.id);

            expect(evaluateStrategyServiceMock.evaluate).toHaveBeenCalledTimes(1);
            const evaluateParams = evaluateStrategyServiceMock.evaluate.mock.calls[0];
            expect(evaluateParams.length).toEqual(1);
            expect(evaluateParams[0]).toEqual(strategy);

            expect(updateStrategyServiceMock.updateStatusById).toHaveBeenCalledTimes(0);
          });
        });

        describe('And evaluation is not a success', () => {
          beforeEach(() => {
            strategyEvaluation = buildStrategyEvaluation(false);
            evaluateStrategyServiceMock.evaluate.mockResolvedValue(strategyEvaluation);
          });

          it('Then strategy status is updated', async () => {
            await evaluateStrategyMessageConsumer.process(activeStrategyMessage);

            expect(getStrategyServiceMock.getById).toHaveBeenCalledTimes(1);
            const getByIdParams = getStrategyServiceMock.getById.mock.calls[0];
            expect(getByIdParams.length).toEqual(1);
            expect(getByIdParams[0]).toEqual(activeStrategyMessage.content.id);

            expect(evaluateStrategyServiceMock.evaluate).toHaveBeenCalledTimes(1);
            const evaluateParams = evaluateStrategyServiceMock.evaluate.mock.calls[0];
            expect(evaluateParams.length).toEqual(1);
            expect(evaluateParams[0]).toEqual(strategy);

            expect(updateStrategyServiceMock.updateStatusById).toHaveBeenCalledTimes(1);
            const updateStatusByIdParams = updateStrategyServiceMock.updateStatusById.mock.calls[0];
            expect(updateStatusByIdParams.length).toEqual(2);
            expect(updateStatusByIdParams[0]).toEqual(activeStrategyMessage.content.id);
            expect(updateStatusByIdParams[1]).toEqual('Error');
          });
        });
      });
    });
  });
});
