import MockDate from 'mockdate';

import { EvaluateStrategyService } from '../../../../src/code/domain/strategy/evaluate-strategy-service';
import { Strategy } from '../../../../src/code/domain/strategy/model/strategy';
import { CheckOrderStepOutput, MarketEvolutionStepOutput, OrConditionStepOutput, SendOrderStepOutput, StrategyStep } from '../../../../src/code/domain/strategy/model/strategy-step';
import { CheckOrderStepService } from '../../../../src/code/domain/strategy/step/check-order-step-service';
import { MarketEvolutionStepService } from '../../../../src/code/domain/strategy/step/market-evolution-step-service';
import { OrConditionStepService } from '../../../../src/code/domain/strategy/step/or-condition-step-service';
import { SendOrderStepService } from '../../../../src/code/domain/strategy/step/send-order-step-service';
import { StrategyStepPublisher } from '../../../../src/code/domain/strategy/step/strategy-step-publisher';
import { StrategyStepRepository } from '../../../../src/code/domain/strategy/step/strategy-step-repository';
import {
  buildDefaultCheckOrderStepOutput,
  buildDefaultMarketEvolutionStepInput,
  buildDefaultMarketEvolutionStepOutput,
  buildDefaultOrConditionStepInput,
  buildDefaultOrConditionStepOutput,
  buildDefaultSendOrderStepInput,
  buildDefaultSendOrderStepOutput,
  buildStrategyStep,
  buildStrategyStepTemplate,
} from '../../../builders/domain/strategy/strategy-step-test-builder';
import { buildDefaultStrategy } from '../../../builders/domain/strategy/strategy-test-builder';

const marketEvolutionStepServiceMock = jest.mocked(jest.genMockFromModule<MarketEvolutionStepService>('../../../../src/code/domain/strategy/step/market-evolution-step-service'), true);
const sendOrderStepServiceMock = jest.mocked(jest.genMockFromModule<SendOrderStepService>('../../../../src/code/domain/strategy/step/send-order-step-service'), true);
const checkOrderStepServiceMock = jest.mocked(jest.genMockFromModule<CheckOrderStepService>('../../../../src/code/domain/strategy/step/check-order-step-service'), true);
const orConditionStepServiceMock = jest.mocked(jest.genMockFromModule<OrConditionStepService>('../../../../src/code/domain/strategy/step/or-condition-step-service'), true);
const strategyStepServicesMocks = [marketEvolutionStepServiceMock, sendOrderStepServiceMock, checkOrderStepServiceMock, orConditionStepServiceMock];
const strategyStepRepositoryMock = jest.mocked(jest.genMockFromModule<StrategyStepRepository>('../../../../src/code/domain/strategy/step/strategy-step-repository'), true);
const strategyStepPublisherMock = jest.mocked(jest.genMockFromModule<StrategyStepPublisher>('../../../../src/code/domain/strategy/step/strategy-step-publisher'), true);

let evaluateStrategyService: EvaluateStrategyService;
beforeEach(() => {
  strategyStepRepositoryMock.getLastByStrategyId = jest.fn();
  strategyStepRepositoryMock.getLastByStrategyIdAndType = jest.fn();
  strategyStepRepositoryMock.save = jest.fn();

  strategyStepPublisherMock.publishProcessed = jest.fn();

  strategyStepServicesMocks.forEach((strategyStepServiceMock) => {
    strategyStepServiceMock.getType = jest.fn();
    strategyStepServiceMock.process = jest.fn();
  });

  evaluateStrategyService = new EvaluateStrategyService(strategyStepServicesMocks, strategyStepRepositoryMock, strategyStepPublisherMock);
});

describe('EvaluateStrategyService', () => {
  describe('Given a strategy to evaluate', () => {
    let date: Date;
    let strategy: Strategy;

    beforeEach(() => {
      date = new Date();
      MockDate.set(date);

      strategy = buildDefaultStrategy();
    });

    describe('When strategy status is inactive', () => {
      beforeEach(() => {
        strategy.status = 'Inactive';
      });

      it('Then error is thrown', async () => {
        try {
          await evaluateStrategyService.evaluate(strategy);
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual(`Unable to evaluate a strategy with status '${strategy.status}'`);
        }

        expect(strategyStepRepositoryMock.getLastByStrategyId).toHaveBeenCalledTimes(0);
        expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(0);
        expect(strategyStepRepositoryMock.save).toHaveBeenCalledTimes(0);

        expect(strategyStepPublisherMock.publishProcessed).toHaveBeenCalledTimes(0);

        strategyStepServicesMocks.forEach((strategyStepServiceMock) => {
          expect(strategyStepServiceMock.process).toHaveBeenCalledTimes(0);
        });
      });
    });

    describe('When strategy status is active', () => {
      beforeEach(() => {
        strategy.status = 'Active';
      });

      describe('And strategy step type is unknown', () => {
        beforeEach(() => {
          strategyStepRepositoryMock.getLastByStrategyId.mockResolvedValue(null);
          strategyStepRepositoryMock.save.mockImplementation((step) => Promise.resolve(step));
        });

        it('Then strategy evaluation is not a success', async () => {
          const result = await evaluateStrategyService.evaluate(strategy);
          expect(result).toEqual({
            success: false,
            end: true,
          });

          expect(strategyStepRepositoryMock.getLastByStrategyId).toHaveBeenCalledTimes(1);
          const getLastByStrategyIdParams = strategyStepRepositoryMock.getLastByStrategyId.mock.calls[0];
          expect(getLastByStrategyIdParams.length).toEqual(1);
          expect(getLastByStrategyIdParams[0]).toEqual(strategy.id);

          expect(strategyStepRepositoryMock.save).toHaveBeenCalledTimes(1);
          const saveParams = strategyStepRepositoryMock.save.mock.calls[0];
          expect(saveParams.length).toEqual(1);
          expect(saveParams[0]).toEqual({
            ...strategy.template['1'],
            strategyId: strategy.id,
            output: {
              success: false,
            },
            error: {
              message: `Unsupported '${strategy.template['1'].type}' strategy step type`,
              details: expect.stringContaining(`Unsupported '${strategy.template['1'].type}' strategy step type`),
            },
            creationDate: date,
            executionStartDate: date,
            executionEndDate: date,
          });

          expect(strategyStepPublisherMock.publishProcessed).toHaveBeenCalledTimes(1);
          const publishProcessedParams = strategyStepPublisherMock.publishProcessed.mock.calls[0];
          expect(publishProcessedParams.length).toEqual(1);
          expect(publishProcessedParams[0]).toEqual(saveParams[0]);

          expect(strategyStepRepositoryMock.getLastByStrategyIdAndType).toHaveBeenCalledTimes(0);
          strategyStepServicesMocks.forEach((strategyStepServiceMock) => {
            expect(strategyStepServiceMock.process).toHaveBeenCalledTimes(0);
          });
        });
      });

      describe('And there is no last step', () => {
        let stepOutput: SendOrderStepOutput;

        beforeEach(() => {
          strategy.template = {
            '1': buildStrategyStepTemplate('1', 'SendOrder', buildDefaultSendOrderStepInput(), '1'),
          };

          strategyStepRepositoryMock.getLastByStrategyId.mockResolvedValue(null);
          strategyStepRepositoryMock.save.mockImplementation((step) => Promise.resolve(step));

          stepOutput = buildDefaultSendOrderStepOutput(false);
          sendOrderStepServiceMock.getType.mockReturnValue('SendOrder');
          sendOrderStepServiceMock.process.mockResolvedValue(stepOutput);
        });

        it('Then strategy is evaluated from first step', async () => {
          const result = await evaluateStrategyService.evaluate(strategy);
          expect(result).toEqual({
            success: true,
            end: false,
          });

          expect(strategyStepRepositoryMock.getLastByStrategyId).toHaveBeenCalledTimes(1);
          const getLastByStrategyIdParams = strategyStepRepositoryMock.getLastByStrategyId.mock.calls[0];
          expect(getLastByStrategyIdParams.length).toEqual(1);
          expect(getLastByStrategyIdParams[0]).toEqual(strategy.id);

          expect(sendOrderStepServiceMock.process).toHaveBeenCalledTimes(1);
          const processParams = sendOrderStepServiceMock.process.mock.calls[0];
          expect(processParams.length).toEqual(2);
          expect(processParams[0]).toEqual(strategy);
          expect(processParams[1]).toEqual(strategy.template['1'].input);

          expect(strategyStepRepositoryMock.save).toHaveBeenCalledTimes(1);
          const saveParams = strategyStepRepositoryMock.save.mock.calls[0];
          expect(saveParams.length).toEqual(1);
          expect(saveParams[0]).toEqual({
            ...strategy.template['1'],
            strategyId: strategy.id,
            output: stepOutput,
            creationDate: date,
            executionStartDate: date,
            executionEndDate: date,
          });

          expect(strategyStepPublisherMock.publishProcessed).toHaveBeenCalledTimes(1);
          const publishProcessedParams = strategyStepPublisherMock.publishProcessed.mock.calls[0];
          expect(publishProcessedParams.length).toEqual(1);
          expect(publishProcessedParams[0]).toEqual(saveParams[0]);

          expect(marketEvolutionStepServiceMock.process).toHaveBeenCalledTimes(0);
          expect(checkOrderStepServiceMock.process).toHaveBeenCalledTimes(0);
        });
      });

      describe('And there is a last step', () => {
        let lastStepOutput: SendOrderStepOutput;
        let lastStep: StrategyStep;

        beforeEach(() => {
          strategy.template = {
            '1': buildStrategyStepTemplate('1', 'SendOrder', buildDefaultSendOrderStepInput(), '2'),
            '2': buildStrategyStepTemplate('1', 'SendOrder', buildDefaultSendOrderStepInput(), '1'),
          };

          lastStepOutput = buildDefaultSendOrderStepOutput(false);
          lastStep = buildStrategyStep(strategy.template['2'], strategy.id, lastStepOutput);

          strategyStepRepositoryMock.getLastByStrategyId.mockResolvedValue(lastStep);
          strategyStepRepositoryMock.save.mockImplementation((step) => Promise.resolve(step));

          sendOrderStepServiceMock.getType.mockReturnValue('SendOrder');
          sendOrderStepServiceMock.process.mockResolvedValue(lastStepOutput);
        });

        it('Then strategy is evaluated from last step', async () => {
          const result = await evaluateStrategyService.evaluate(strategy);
          expect(result).toEqual({
            success: true,
            end: false,
          });

          expect(strategyStepRepositoryMock.getLastByStrategyId).toHaveBeenCalledTimes(1);
          const getLastByStrategyIdParams = strategyStepRepositoryMock.getLastByStrategyId.mock.calls[0];
          expect(getLastByStrategyIdParams.length).toEqual(1);
          expect(getLastByStrategyIdParams[0]).toEqual(strategy.id);

          expect(sendOrderStepServiceMock.process).toHaveBeenCalledTimes(1);
          const processParams = sendOrderStepServiceMock.process.mock.calls[0];
          expect(processParams.length).toEqual(2);
          expect(processParams[0]).toEqual(strategy);
          expect(processParams[1]).toEqual(strategy.template['2'].input);

          expect(strategyStepRepositoryMock.save).toHaveBeenCalledTimes(1);
          const saveParams = strategyStepRepositoryMock.save.mock.calls[0];
          expect(saveParams.length).toEqual(1);
          expect(saveParams[0]).toEqual({
            ...strategy.template['2'],
            strategyId: strategy.id,
            output: lastStepOutput,
            creationDate: date,
            executionStartDate: date,
            executionEndDate: date,
          });

          expect(strategyStepPublisherMock.publishProcessed).toHaveBeenCalledTimes(1);
          const publishProcessedParams = strategyStepPublisherMock.publishProcessed.mock.calls[0];
          expect(publishProcessedParams.length).toEqual(1);
          expect(publishProcessedParams[0]).toEqual(saveParams[0]);

          expect(marketEvolutionStepServiceMock.process).toHaveBeenCalledTimes(0);
          expect(checkOrderStepServiceMock.process).toHaveBeenCalledTimes(0);
        });
      });

      describe('And there are multiple steps', () => {
        let step1Output1: MarketEvolutionStepOutput;
        let step1Output2: MarketEvolutionStepOutput;
        let step2Output1: SendOrderStepOutput;
        let step2Output2: CheckOrderStepOutput;
        let step3Output1: MarketEvolutionStepOutput;
        let step4Output1: SendOrderStepOutput;
        let step4Output2: CheckOrderStepOutput;

        beforeEach(() => {
          strategy.template = {
            '1': buildStrategyStepTemplate('1', 'MarketEvolution', buildDefaultMarketEvolutionStepInput(), '2'),
            '2': buildStrategyStepTemplate('2', 'SendOrder', buildDefaultSendOrderStepInput(), '3'),
            '3': buildStrategyStepTemplate('3', 'MarketEvolution', buildDefaultMarketEvolutionStepInput(), '4'),
            '4': buildStrategyStepTemplate('4', 'SendOrder', buildDefaultSendOrderStepInput(), '1'),
          };

          step1Output1 = buildDefaultMarketEvolutionStepOutput(true);
          step1Output2 = buildDefaultMarketEvolutionStepOutput(false);
          step2Output1 = buildDefaultSendOrderStepOutput(true);
          step2Output2 = buildDefaultCheckOrderStepOutput(true);
          step3Output1 = buildDefaultMarketEvolutionStepOutput(true);
          step4Output1 = buildDefaultSendOrderStepOutput(true);
          step4Output2 = buildDefaultCheckOrderStepOutput(true);

          strategyStepRepositoryMock.getLastByStrategyId.mockResolvedValue(null);
          strategyStepRepositoryMock.save.mockImplementation((step) => Promise.resolve(step));

          marketEvolutionStepServiceMock.getType.mockReturnValue('MarketEvolution');
          marketEvolutionStepServiceMock.process.mockResolvedValueOnce(step1Output1).mockResolvedValueOnce(step3Output1).mockResolvedValueOnce(step1Output2);

          sendOrderStepServiceMock.getType.mockReturnValue('SendOrder');
          sendOrderStepServiceMock.process.mockResolvedValueOnce(step2Output1).mockResolvedValueOnce(step4Output1);

          checkOrderStepServiceMock.getType.mockReturnValue('CheckOrder');
          checkOrderStepServiceMock.process.mockResolvedValueOnce(step2Output2).mockResolvedValueOnce(step4Output2);
        });

        it('Then strategy is evaluated until success output is false', async () => {
          const result = await evaluateStrategyService.evaluate(strategy);
          expect(result).toEqual({
            success: true,
            end: false,
          });

          expect(strategyStepRepositoryMock.getLastByStrategyId).toHaveBeenCalledTimes(1);
          const getLastByStrategyIdParams = strategyStepRepositoryMock.getLastByStrategyId.mock.calls[0];
          expect(getLastByStrategyIdParams.length).toEqual(1);
          expect(getLastByStrategyIdParams[0]).toEqual(strategy.id);

          expect(marketEvolutionStepServiceMock.process).toHaveBeenCalledTimes(3);
          let marketEvolutionProcessParams = marketEvolutionStepServiceMock.process.mock.calls[0];
          expect(marketEvolutionProcessParams.length).toEqual(2);
          expect(marketEvolutionProcessParams[0]).toEqual(strategy);
          expect(marketEvolutionProcessParams[1]).toEqual(strategy.template['1'].input);
          marketEvolutionProcessParams = marketEvolutionStepServiceMock.process.mock.calls[1];
          expect(marketEvolutionProcessParams.length).toEqual(2);
          expect(marketEvolutionProcessParams[0]).toEqual(strategy);
          expect(marketEvolutionProcessParams[1]).toEqual(strategy.template['3'].input);
          marketEvolutionProcessParams = marketEvolutionStepServiceMock.process.mock.calls[2];
          expect(marketEvolutionProcessParams.length).toEqual(2);
          expect(marketEvolutionProcessParams[0]).toEqual(strategy);
          expect(marketEvolutionProcessParams[1]).toEqual(strategy.template['1'].input);

          expect(sendOrderStepServiceMock.process).toHaveBeenCalledTimes(2);
          let sendOrderProcessParams = sendOrderStepServiceMock.process.mock.calls[0];
          expect(sendOrderProcessParams.length).toEqual(2);
          expect(sendOrderProcessParams[0]).toEqual(strategy);
          expect(sendOrderProcessParams[1]).toEqual(strategy.template['2'].input);
          sendOrderProcessParams = sendOrderStepServiceMock.process.mock.calls[1];
          expect(sendOrderProcessParams.length).toEqual(2);
          expect(sendOrderProcessParams[0]).toEqual(strategy);
          expect(sendOrderProcessParams[1]).toEqual(strategy.template['4'].input);

          expect(checkOrderStepServiceMock.process).toHaveBeenCalledTimes(2);
          let checkOrderProcessParams = checkOrderStepServiceMock.process.mock.calls[0];
          expect(checkOrderProcessParams.length).toEqual(2);
          expect(checkOrderProcessParams[0]).toEqual(strategy);
          expect(checkOrderProcessParams[1]).toEqual({
            id: step2Output1.id,
            externalId: step2Output1.externalId,
            side: step2Output1.side,
            type: step2Output1.type,
          });
          checkOrderProcessParams = checkOrderStepServiceMock.process.mock.calls[1];
          expect(checkOrderProcessParams.length).toEqual(2);
          expect(checkOrderProcessParams[0]).toEqual(strategy);
          expect(checkOrderProcessParams[1]).toEqual({
            id: step4Output1.id,
            externalId: step4Output1.externalId,
            side: step4Output1.side,
            type: step4Output1.type,
          });

          expect(strategyStepRepositoryMock.save).toHaveBeenCalledTimes(7);

          let saveParams = strategyStepRepositoryMock.save.mock.calls[0];
          expect(saveParams.length).toEqual(1);
          expect(saveParams[0]).toEqual({
            ...strategy.template['1'],
            strategyId: strategy.id,
            output: step1Output1,
            creationDate: date,
            executionStartDate: date,
            executionEndDate: date,
          });
          saveParams = strategyStepRepositoryMock.save.mock.calls[1];
          expect(saveParams.length).toEqual(1);
          expect(saveParams[0]).toEqual({
            ...strategy.template['2'],
            strategyId: strategy.id,
            output: step2Output1,
            creationDate: date,
            executionStartDate: date,
            executionEndDate: date,
          });
          saveParams = strategyStepRepositoryMock.save.mock.calls[2];
          expect(saveParams.length).toEqual(1);
          expect(saveParams[0]).toEqual({
            id: `${strategy.template['2'].id}`,
            type: 'CheckOrder',
            input: {
              id: step2Output1.id,
              externalId: step2Output1.externalId,
              side: step2Output1.side,
              type: step2Output1.type,
            },
            nextId: strategy.template['2'].nextId,
            strategyId: strategy.id,
            output: step2Output2,
            creationDate: date,
            executionStartDate: date,
            executionEndDate: date,
          });
          saveParams = strategyStepRepositoryMock.save.mock.calls[3];
          expect(saveParams.length).toEqual(1);
          expect(saveParams[0]).toEqual({
            ...strategy.template['3'],
            strategyId: strategy.id,
            output: step3Output1,
            creationDate: date,
            executionStartDate: date,
            executionEndDate: date,
          });
          saveParams = strategyStepRepositoryMock.save.mock.calls[4];
          expect(saveParams.length).toEqual(1);
          expect(saveParams[0]).toEqual({
            ...strategy.template['4'],
            strategyId: strategy.id,
            output: step4Output1,
            creationDate: date,
            executionStartDate: date,
            executionEndDate: date,
          });
          saveParams = strategyStepRepositoryMock.save.mock.calls[5];
          expect(saveParams.length).toEqual(1);
          expect(saveParams[0]).toEqual({
            id: `${strategy.template['4'].id}`,
            type: 'CheckOrder',
            input: {
              id: step4Output1.id,
              externalId: step4Output1.externalId,
              side: step4Output1.side,
              type: step4Output1.type,
            },
            nextId: strategy.template['4'].nextId,
            strategyId: strategy.id,
            output: step4Output2,
            creationDate: date,
            executionStartDate: date,
            executionEndDate: date,
          });
          saveParams = strategyStepRepositoryMock.save.mock.calls[6];
          expect(saveParams.length).toEqual(1);
          expect(saveParams[0]).toEqual({
            ...strategy.template['1'],
            strategyId: strategy.id,
            output: step1Output2,
            creationDate: date,
            executionStartDate: date,
            executionEndDate: date,
          });
        });
      });

      describe('And there is an or condition step', () => {
        let step1Output: OrConditionStepOutput;
        let step5Output1: SendOrderStepOutput;
        let step5Output2: CheckOrderStepOutput;

        beforeEach(() => {
          strategy.template = {
            '1': buildStrategyStepTemplate('1', 'OrCondition', buildDefaultOrConditionStepInput()),
            '2': buildStrategyStepTemplate('2', 'MarketEvolution', buildDefaultMarketEvolutionStepInput()),
            '3': buildStrategyStepTemplate('3', 'MarketEvolution', buildDefaultMarketEvolutionStepInput()),
            '4': buildStrategyStepTemplate('4', 'SendOrder', buildDefaultSendOrderStepInput()),
            '5': buildStrategyStepTemplate('5', 'SendOrder', buildDefaultSendOrderStepInput()),
          };

          step1Output = { ...buildDefaultOrConditionStepOutput(true), nextId: '5' };
          step5Output1 = buildDefaultSendOrderStepOutput(true);
          step5Output2 = buildDefaultCheckOrderStepOutput(true);

          strategyStepRepositoryMock.getLastByStrategyId.mockResolvedValue(null);
          strategyStepRepositoryMock.save.mockImplementation((step) => Promise.resolve(step));

          orConditionStepServiceMock.getType.mockReturnValue('OrCondition');
          orConditionStepServiceMock.process.mockResolvedValueOnce(step1Output);

          sendOrderStepServiceMock.getType.mockReturnValue('SendOrder');
          sendOrderStepServiceMock.process.mockResolvedValueOnce(step5Output1);

          checkOrderStepServiceMock.getType.mockReturnValue('CheckOrder');
          checkOrderStepServiceMock.process.mockResolvedValueOnce(step5Output2);
        });

        it('Then strategy is evaluated until there is no next step', async () => {
          const result = await evaluateStrategyService.evaluate(strategy);
          expect(result).toEqual({
            success: true,
            end: true,
          });

          expect(strategyStepRepositoryMock.getLastByStrategyId).toHaveBeenCalledTimes(1);
          const getLastByStrategyIdParams = strategyStepRepositoryMock.getLastByStrategyId.mock.calls[0];
          expect(getLastByStrategyIdParams.length).toEqual(1);
          expect(getLastByStrategyIdParams[0]).toEqual(strategy.id);

          expect(marketEvolutionStepServiceMock.process).toHaveBeenCalledTimes(0);

          expect(sendOrderStepServiceMock.process).toHaveBeenCalledTimes(1);
          const sendOrderProcessParams = sendOrderStepServiceMock.process.mock.calls[0];
          expect(sendOrderProcessParams.length).toEqual(2);
          expect(sendOrderProcessParams[0]).toEqual(strategy);
          expect(sendOrderProcessParams[1]).toEqual(strategy.template['5'].input);

          expect(checkOrderStepServiceMock.process).toHaveBeenCalledTimes(1);
          const checkOrderProcessParams = checkOrderStepServiceMock.process.mock.calls[0];
          expect(checkOrderProcessParams.length).toEqual(2);
          expect(checkOrderProcessParams[0]).toEqual(strategy);
          expect(checkOrderProcessParams[1]).toEqual({
            id: step5Output1.id,
            externalId: step5Output1.externalId,
            side: step5Output1.side,
            type: step5Output1.type,
          });

          expect(strategyStepRepositoryMock.save).toHaveBeenCalledTimes(3);
          let saveParams = strategyStepRepositoryMock.save.mock.calls[0];
          expect(saveParams.length).toEqual(1);
          expect(saveParams[0]).toEqual({
            ...strategy.template['1'],
            nextId: '5',
            strategyId: strategy.id,
            output: step1Output,
            creationDate: date,
            executionStartDate: date,
            executionEndDate: date,
          });
          saveParams = strategyStepRepositoryMock.save.mock.calls[1];
          expect(saveParams.length).toEqual(1);
          expect(saveParams[0]).toEqual({
            ...strategy.template['5'],
            strategyId: strategy.id,
            output: step5Output1,
            creationDate: date,
            executionStartDate: date,
            executionEndDate: date,
          });
          saveParams = strategyStepRepositoryMock.save.mock.calls[2];
          expect(saveParams.length).toEqual(1);
          expect(saveParams[0]).toEqual({
            id: `${strategy.template['5'].id}`,
            type: 'CheckOrder',
            input: {
              id: step5Output1.id,
              externalId: step5Output1.externalId,
              side: step5Output1.side,
              type: step5Output1.type,
            },
            strategyId: strategy.id,
            output: step5Output2,
            creationDate: date,
            executionStartDate: date,
            executionEndDate: date,
          });
        });
      });
    });
  });
});
