import { Strategy } from '../../../../../src/code/domain/strategy/model/strategy';
import { MarketEvolutionStepOutput, OrConditionStep, OrConditionStepInput } from '../../../../../src/code/domain/strategy/model/strategy-step';
import { MarketEvolutionStepService } from '../../../../../src/code/domain/strategy/step/market-evolution-step-service';
import { OrConditionStepService } from '../../../../../src/code/domain/strategy/step/or-condition-step-service';
import { buildDefaultMarketEvolutionStepInput, buildDefaultMarketEvolutionStepOutput, buildOrConditionStepInput, buildStrategyStepTemplate } from '../../../../builders/domain/strategy/strategy-step-test-builder';
import { buildDefaultStrategy } from '../../../../builders/domain/strategy/strategy-test-builder';

const marketEvolutionStepServiceMock = jest.mocked(jest.genMockFromModule<MarketEvolutionStepService>('../../../../../src/code/domain/strategy/step/market-evolution-step-service'), true);
const strategyStepServicesMocks = [marketEvolutionStepServiceMock];

let orConditionStepService: OrConditionStepService;
beforeEach(() => {
  strategyStepServicesMocks.forEach((strategyStepServiceMock) => {
    strategyStepServiceMock.getType = jest.fn();
    strategyStepServiceMock.process = jest.fn();
  });

  orConditionStepService = new OrConditionStepService(strategyStepServicesMocks);
});

describe('OrConditionStepService', () => {
  let strategy: Strategy;
  let orConditionStepInput: OrConditionStepInput;

  beforeEach(() => {
    strategy = buildDefaultStrategy();
  });

  describe('Given the strategy step type to retrieve', () => {
    it('Then or condition type is returned', async () => {
      expect(orConditionStepService.getType()).toEqual('OrCondition');
    });
  });

  describe('Given an or condition step to process', () => {
    let marketEvolutionStepOutput1: MarketEvolutionStepOutput;
    let marketEvolutionStepOutput2: MarketEvolutionStepOutput;
    let marketEvolutionStepOutput3: MarketEvolutionStepOutput;

    let orConditionStep1: OrConditionStep;
    let orConditionStep2: OrConditionStep;
    let orConditionStep3: OrConditionStep;

    beforeEach(() => {
      strategy.template = {
        '1': buildStrategyStepTemplate('1', 'MarketEvolution', buildDefaultMarketEvolutionStepInput(), '10'),
        '2': buildStrategyStepTemplate('2', 'MarketEvolution', buildDefaultMarketEvolutionStepInput(), '20'),
        '3': buildStrategyStepTemplate('3', 'MarketEvolution', buildDefaultMarketEvolutionStepInput(), '30'),
      };

      orConditionStep1 = { id: '1', priority: 3 };
      orConditionStep2 = { id: '2', priority: 1 };
      orConditionStep3 = { id: '3', priority: 2 };

      orConditionStepInput = buildOrConditionStepInput([orConditionStep1, orConditionStep2, orConditionStep3]);

      marketEvolutionStepServiceMock.getType.mockReturnValue('MarketEvolution');
    });

    afterEach(() => {
      expect(marketEvolutionStepServiceMock.getType).toHaveBeenCalledTimes(3);

      expect(marketEvolutionStepServiceMock.process).toHaveBeenCalledTimes(3);
      let processParams = marketEvolutionStepServiceMock.process.mock.calls[0];
      expect(processParams.length).toEqual(2);
      expect(processParams[0]).toEqual(strategy);
      expect(processParams[1]).toEqual(strategy.template['1'].input);
      processParams = marketEvolutionStepServiceMock.process.mock.calls[1];
      expect(processParams.length).toEqual(2);
      expect(processParams[0]).toEqual(strategy);
      expect(processParams[1]).toEqual(strategy.template['2'].input);
      processParams = marketEvolutionStepServiceMock.process.mock.calls[2];
      expect(processParams.length).toEqual(2);
      expect(processParams[0]).toEqual(strategy);
      expect(processParams[1]).toEqual(strategy.template['3'].input);
    });

    describe('When no success', () => {
      beforeEach(() => {
        marketEvolutionStepOutput1 = buildDefaultMarketEvolutionStepOutput(false);
        marketEvolutionStepOutput2 = buildDefaultMarketEvolutionStepOutput(false);
        marketEvolutionStepOutput3 = buildDefaultMarketEvolutionStepOutput(false);

        marketEvolutionStepServiceMock.process.mockImplementation((strategy, marketEvolutionStepInput) => {
          if (marketEvolutionStepInput === strategy.template['1'].input) {
            return Promise.resolve(marketEvolutionStepOutput1);
          } else if (marketEvolutionStepInput === strategy.template['2'].input) {
            return Promise.resolve(marketEvolutionStepOutput2);
          } else if (marketEvolutionStepInput === strategy.template['3'].input) {
            return Promise.resolve(marketEvolutionStepOutput3);
          } else {
            throw new Error('Unsupported case');
          }
        });
      });

      it('Then or condition step is not a success', async () => {
        const result = await orConditionStepService.process(strategy, orConditionStepInput);
        expect(result).toEqual({
          success: false,
          steps: [
            { ...orConditionStep1, ...marketEvolutionStepOutput1 },
            { ...orConditionStep2, ...marketEvolutionStepOutput2 },
            { ...orConditionStep3, ...marketEvolutionStepOutput3 },
          ],
        });
      });
    });

    describe('When single success', () => {
      beforeEach(() => {
        marketEvolutionStepOutput1 = buildDefaultMarketEvolutionStepOutput(false);
        marketEvolutionStepOutput2 = buildDefaultMarketEvolutionStepOutput(false);
        marketEvolutionStepOutput3 = buildDefaultMarketEvolutionStepOutput(true);

        marketEvolutionStepServiceMock.process.mockImplementation((strategy, marketEvolutionStepInput) => {
          if (marketEvolutionStepInput === strategy.template['1'].input) {
            return Promise.resolve(marketEvolutionStepOutput1);
          } else if (marketEvolutionStepInput === strategy.template['2'].input) {
            return Promise.resolve(marketEvolutionStepOutput2);
          } else if (marketEvolutionStepInput === strategy.template['3'].input) {
            return Promise.resolve(marketEvolutionStepOutput3);
          } else {
            throw new Error('Unsupported case');
          }
        });
      });

      it('Then or condition step is a success', async () => {
        const result = await orConditionStepService.process(strategy, orConditionStepInput);
        expect(result).toEqual({
          success: true,
          id: strategy.template['3'].id,
          nextId: strategy.template['3'].nextId,
          steps: [
            { ...orConditionStep1, ...marketEvolutionStepOutput1 },
            { ...orConditionStep2, ...marketEvolutionStepOutput2 },
            { ...orConditionStep3, ...marketEvolutionStepOutput3 },
          ],
        });
      });
    });

    describe('When multiple success', () => {
      beforeEach(() => {
        marketEvolutionStepOutput1 = buildDefaultMarketEvolutionStepOutput(true);
        marketEvolutionStepOutput2 = buildDefaultMarketEvolutionStepOutput(true);
        marketEvolutionStepOutput3 = buildDefaultMarketEvolutionStepOutput(true);

        marketEvolutionStepServiceMock.process.mockImplementation((strategy, marketEvolutionStepInput) => {
          if (marketEvolutionStepInput === strategy.template['1'].input) {
            return Promise.resolve(marketEvolutionStepOutput1);
          } else if (marketEvolutionStepInput === strategy.template['2'].input) {
            return Promise.resolve(marketEvolutionStepOutput2);
          } else if (marketEvolutionStepInput === strategy.template['3'].input) {
            return Promise.resolve(marketEvolutionStepOutput3);
          } else {
            throw new Error('Unsupported case');
          }
        });
      });

      it('Then or condition step is a success', async () => {
        const result = await orConditionStepService.process(strategy, orConditionStepInput);
        expect(result).toEqual({
          success: true,
          id: strategy.template['2'].id,
          nextId: strategy.template['2'].nextId,
          steps: [
            { ...orConditionStep1, ...marketEvolutionStepOutput1 },
            { ...orConditionStep2, ...marketEvolutionStepOutput2 },
            { ...orConditionStep3, ...marketEvolutionStepOutput3 },
          ],
        });
      });
    });
  });
});
