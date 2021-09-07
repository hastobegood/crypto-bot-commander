import { mocked } from 'ts-jest/utils';
import { Strategy } from '../../../../src/code/domain/strategy/model/strategy';
import { buildDefaultStrategy } from '../../../builders/domain/strategy/strategy-test-builder';
import { MarketEvolutionStepService } from '../../../../src/code/domain/strategy/step/market-evolution-step-service';
import { SendOrderStepService } from '../../../../src/code/domain/strategy/step/send-order-step-service';
import { StrategyStepRepository } from '../../../../src/code/domain/strategy/step/strategy-step-repository';
import {
  buildDefaultMarketEvolutionStepInput,
  buildDefaultMarketEvolutionStepOutput,
  buildDefaultSendOrderStepInput,
  buildDefaultSendOrderStepOutput,
  buildStrategyStep,
  buildStrategyStepTemplate,
} from '../../../builders/domain/strategy/strategy-step-test-builder';
import { MarketEvolutionStepOutput, SendOrderStepOutput, StrategyStep } from '../../../../src/code/domain/strategy/model/strategy-step';
import MockDate from 'mockdate';
import { EvaluateStrategyService } from '../../../../src/code/domain/strategy/evaluate-strategy-service';
import { stringContaining } from 'expect/build/asymmetricMatchers';

const marketEvolutionStepServiceMock = mocked(jest.genMockFromModule<MarketEvolutionStepService>('../../../../src/code/domain/strategy/step/market-evolution-step-service'), true);
const sendOrderStepServiceMock = mocked(jest.genMockFromModule<SendOrderStepService>('../../../../src/code/domain/strategy/step/send-order-step-service'), true);
const strategyStepServicesMocks = [marketEvolutionStepServiceMock, sendOrderStepServiceMock];
const strategyStepRepositoryMock = mocked(jest.genMockFromModule<StrategyStepRepository>('../../../../src/code/domain/strategy/step/strategy-step-repository'), true);

let evaluateStrategyService: EvaluateStrategyService;
beforeEach(() => {
  strategyStepRepositoryMock.getLastByStrategyId = jest.fn();
  strategyStepRepositoryMock.getLastByStrategyIdAndType = jest.fn();
  strategyStepRepositoryMock.save = jest.fn();

  strategyStepServicesMocks.forEach((strategyStepServiceMock) => {
    strategyStepServiceMock.getType = jest.fn();
    strategyStepServiceMock.process = jest.fn();
  });

  evaluateStrategyService = new EvaluateStrategyService(strategyStepServicesMocks, strategyStepRepositoryMock);
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
              details: stringContaining(`Unsupported '${strategy.template['1'].type}' strategy step type`),
            },
            creationDate: date,
            lastExecutionDate: date,
          });

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
            '1': buildStrategyStepTemplate('1', '1', 'SendOrder', buildDefaultSendOrderStepInput()),
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
            lastExecutionDate: date,
          });

          expect(marketEvolutionStepServiceMock.process).toHaveBeenCalledTimes(0);
        });
      });

      describe('And there is a last step', () => {
        let lastStepOutput: SendOrderStepOutput;
        let lastStep: StrategyStep;

        beforeEach(() => {
          strategy.template = {
            '1': buildStrategyStepTemplate('1', '2', 'SendOrder', buildDefaultSendOrderStepInput()),
            '2': buildStrategyStepTemplate('1', '1', 'SendOrder', buildDefaultSendOrderStepInput()),
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
            lastExecutionDate: date,
          });

          expect(marketEvolutionStepServiceMock.process).toHaveBeenCalledTimes(0);
        });
      });

      describe('And there are multiple steps', () => {
        let step1Output1: MarketEvolutionStepOutput;
        let step1Output2: MarketEvolutionStepOutput;
        let step2Output1: SendOrderStepOutput;
        let step3Output1: MarketEvolutionStepOutput;
        let step4Output1: SendOrderStepOutput;

        beforeEach(() => {
          strategy.template = {
            '1': buildStrategyStepTemplate('1', '2', 'MarketEvolution', buildDefaultMarketEvolutionStepInput()),
            '2': buildStrategyStepTemplate('2', '3', 'SendOrder', buildDefaultSendOrderStepInput()),
            '3': buildStrategyStepTemplate('3', '4', 'MarketEvolution', buildDefaultMarketEvolutionStepInput()),
            '4': buildStrategyStepTemplate('4', '1', 'SendOrder', buildDefaultSendOrderStepInput()),
          };

          step1Output1 = buildDefaultMarketEvolutionStepOutput(true);
          step1Output2 = buildDefaultMarketEvolutionStepOutput(false);
          step2Output1 = buildDefaultSendOrderStepOutput(true);
          step3Output1 = buildDefaultMarketEvolutionStepOutput(true);
          step4Output1 = buildDefaultSendOrderStepOutput(true);

          strategyStepRepositoryMock.getLastByStrategyId.mockResolvedValue(null);
          strategyStepRepositoryMock.save.mockImplementation((step) => Promise.resolve(step));

          marketEvolutionStepServiceMock.getType.mockReturnValue('MarketEvolution');
          marketEvolutionStepServiceMock.process.mockResolvedValueOnce(step1Output1).mockResolvedValueOnce(step3Output1).mockResolvedValueOnce(step1Output2);

          sendOrderStepServiceMock.getType.mockReturnValue('SendOrder');
          sendOrderStepServiceMock.process.mockResolvedValueOnce(step2Output1).mockResolvedValueOnce(step4Output1);
        });

        it('Then strategy is evaluated until success output is false', async () => {
          const result = await evaluateStrategyService.evaluate(strategy);
          expect(result).toEqual({
            success: true,
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

          expect(strategyStepRepositoryMock.save).toHaveBeenCalledTimes(5);

          let saveParams = strategyStepRepositoryMock.save.mock.calls[0];
          expect(saveParams.length).toEqual(1);
          expect(saveParams[0]).toEqual({
            ...strategy.template['1'],
            strategyId: strategy.id,
            output: step1Output1,
            creationDate: date,
            lastExecutionDate: date,
          });
          saveParams = strategyStepRepositoryMock.save.mock.calls[1];
          expect(saveParams.length).toEqual(1);
          expect(saveParams[0]).toEqual({
            ...strategy.template['2'],
            strategyId: strategy.id,
            output: step2Output1,
            creationDate: date,
            lastExecutionDate: date,
          });
          saveParams = strategyStepRepositoryMock.save.mock.calls[2];
          expect(saveParams.length).toEqual(1);
          expect(saveParams[0]).toEqual({
            ...strategy.template['3'],
            strategyId: strategy.id,
            output: step3Output1,
            creationDate: date,
            lastExecutionDate: date,
          });
          saveParams = strategyStepRepositoryMock.save.mock.calls[3];
          expect(saveParams.length).toEqual(1);
          expect(saveParams[0]).toEqual({
            ...strategy.template['4'],
            strategyId: strategy.id,
            output: step4Output1,
            creationDate: date,
            lastExecutionDate: date,
          });
          saveParams = strategyStepRepositoryMock.save.mock.calls[4];
          expect(saveParams.length).toEqual(1);
          expect(saveParams[0]).toEqual({
            ...strategy.template['1'],
            strategyId: strategy.id,
            output: step1Output2,
            creationDate: date,
            lastExecutionDate: date,
          });
        });
      });
    });
  });
});
