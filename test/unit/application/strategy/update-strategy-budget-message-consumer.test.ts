import { mocked } from 'ts-jest/utils';
import { UpdateStrategyService } from '../../../../src/code/domain/strategy/update-strategy-service';
import { SendOrderStepInput, SendOrderStepOutput, StrategyStep } from '../../../../src/code/domain/strategy/model/strategy-step';
import { buildDefaultSendOrderStepOutput, buildDefaultStrategyStep } from '../../../builders/domain/strategy/strategy-step-test-builder';
import { UpdateStrategyBudgetMessageConsumer } from '../../../../src/code/application/strategy/update-strategy-budget-message-consumer';
import { ProcessedStrategyStepMessage } from '../../../../src/code/infrastructure/strategy/step/sqs-strategy-step-publisher';
import { buildProcessedStrategyStepMessage } from '../../../builders/infrastructure/strategy/step/strategy-step-message-builder';

const updateStrategyServiceMock = mocked(jest.genMockFromModule<UpdateStrategyService>('../../../../src/code/domain/strategy/update-strategy-service'), true);

let updateStrategyBudgetMessageConsumer: UpdateStrategyBudgetMessageConsumer;
beforeEach(() => {
  updateStrategyServiceMock.updateBudgetById = jest.fn();

  updateStrategyBudgetMessageConsumer = new UpdateStrategyBudgetMessageConsumer(updateStrategyServiceMock);
});

describe('UpdateStrategyBudgetMessageConsumer', () => {
  let strategyStep: StrategyStep;
  let processedStrategyStepMessage: ProcessedStrategyStepMessage;

  describe('Given a market evolution strategy step to process', () => {
    beforeEach(() => {
      strategyStep = buildDefaultStrategyStep();
      strategyStep.type = 'MarketEvolution';
      strategyStep.output.success = true;

      processedStrategyStepMessage = buildProcessedStrategyStepMessage(strategyStep);
    });

    describe('When the strategy step is processed', () => {
      it('Then nothing is processed', async () => {
        await updateStrategyBudgetMessageConsumer.process(processedStrategyStepMessage);

        expect(updateStrategyServiceMock.updateBudgetById).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('Given a moving average crossover strategy step to process', () => {
    beforeEach(() => {
      strategyStep = buildDefaultStrategyStep();
      strategyStep.type = 'MovingAverageCrossover';
      strategyStep.output.success = true;

      processedStrategyStepMessage = buildProcessedStrategyStepMessage(strategyStep);
    });

    describe('When the strategy step is processed', () => {
      it('Then nothing is processed', async () => {
        await updateStrategyBudgetMessageConsumer.process(processedStrategyStepMessage);

        expect(updateStrategyServiceMock.updateBudgetById).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('Given a send order strategy step to process', () => {
    beforeEach(() => {
      strategyStep = buildDefaultStrategyStep();
      strategyStep.type = 'SendOrder';

      processedStrategyStepMessage = buildProcessedStrategyStepMessage(strategyStep);
    });

    describe('And the strategy step is not a success', () => {
      beforeEach(() => {
        strategyStep.output.success = false;
      });

      describe('When the strategy step is processed', () => {
        it('Then nothing is processed', async () => {
          await updateStrategyBudgetMessageConsumer.process(processedStrategyStepMessage);

          expect(updateStrategyServiceMock.updateBudgetById).toHaveBeenCalledTimes(0);
        });
      });
    });

    describe('And the strategy step is a success', () => {
      beforeEach(() => {
        strategyStep.output = { ...buildDefaultSendOrderStepOutput(true), quantity: 0.23, price: 532.18 } as SendOrderStepOutput;
      });

      describe('And the order is a buy order', () => {
        beforeEach(() => {
          (strategyStep.input as SendOrderStepInput).side = 'Buy';
        });

        describe('When the strategy step is processed', () => {
          it('Then the strategy budget is updated', async () => {
            await updateStrategyBudgetMessageConsumer.process(processedStrategyStepMessage);

            expect(updateStrategyServiceMock.updateBudgetById).toHaveBeenCalledTimes(1);
            const updateBudgetByIdParams = updateStrategyServiceMock.updateBudgetById.mock.calls[0];
            expect(updateBudgetByIdParams.length).toEqual(3);
            expect(updateBudgetByIdParams[0]).toEqual(strategyStep.strategyId);
            expect(updateBudgetByIdParams[1]).toEqual(0.23);
            expect(updateBudgetByIdParams[2]).toEqual(0.23 * 532.18 * -1);
          });
        });
      });

      describe('And the order is a sell order', () => {
        beforeEach(() => {
          (strategyStep.input as SendOrderStepInput).side = 'Sell';
        });

        describe('When the strategy step is processed', () => {
          it('Then the strategy budget is updated', async () => {
            await updateStrategyBudgetMessageConsumer.process(processedStrategyStepMessage);

            expect(updateStrategyServiceMock.updateBudgetById).toHaveBeenCalledTimes(1);
            const updateBudgetByIdParams = updateStrategyServiceMock.updateBudgetById.mock.calls[0];
            expect(updateBudgetByIdParams.length).toEqual(3);
            expect(updateBudgetByIdParams[0]).toEqual(strategyStep.strategyId);
            expect(updateBudgetByIdParams[1]).toEqual(0.23 * -1);
            expect(updateBudgetByIdParams[2]).toEqual(0.23 * 532.18);
          });
        });
      });
    });
  });
});
