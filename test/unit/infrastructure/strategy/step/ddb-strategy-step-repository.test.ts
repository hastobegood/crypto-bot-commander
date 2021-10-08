import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { mocked } from 'ts-jest/utils';
import { StrategyStepRepository } from '../../../../../src/code/domain/strategy/step/strategy-step-repository';
import { DdbStrategyStepRepository } from '../../../../../src/code/infrastructure/strategy/step/ddb-strategy-step-repository';
import { StrategyStep } from '../../../../../src/code/domain/strategy/model/strategy-step';
import { buildDefaultMarketEvolutionStep, buildDefaultSendOrderStep, buildDefaultStrategyStep } from '../../../../builders/domain/strategy/strategy-step-test-builder';

const ddbClientMock = mocked(jest.genMockFromModule<DynamoDBDocumentClient>('@aws-sdk/lib-dynamodb'), true);

let strategyStepRepository: StrategyStepRepository;
beforeEach(() => {
  ddbClientMock.send = jest.fn();

  strategyStepRepository = new DdbStrategyStepRepository('my-table', ddbClientMock);
});

describe('DdbStrategyStepRepository', () => {
  let step: StrategyStep;

  describe('Given a market evolution strategy step to save', () => {
    beforeEach(() => {
      step = buildDefaultMarketEvolutionStep();
    });

    describe('When strategy is saved', () => {
      it('Then saved strategy step is returned', async () => {
        const result = await strategyStepRepository.save(step);
        expect(result).toEqual(step);

        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          RequestItems: {
            'my-table': [
              {
                PutRequest: {
                  Item: {
                    pk: `Strategy::${step.strategyId}::Step::${step.creationDate.valueOf()}::${step.type}::${step.id}`,
                    sk: 'Details',
                    type: 'StrategyStep',
                    stepsListPk: `Strategy::${step.strategyId}::Steps`,
                    stepsListSk: step.creationDate.valueOf(),
                    data: {
                      ...step,
                      creationDate: step.creationDate.toISOString(),
                      executionStartDate: step.executionStartDate.toISOString(),
                      executionEndDate: step.executionEndDate.toISOString(),
                    },
                  },
                },
              },
              {
                PutRequest: {
                  Item: {
                    pk: `Strategy::${step.strategyId}::Step::Last`,
                    sk: 'Details',
                    type: 'StrategyStep',
                    data: {
                      ...step,
                      creationDate: step.creationDate.toISOString(),
                      executionStartDate: step.executionStartDate.toISOString(),
                      executionEndDate: step.executionEndDate.toISOString(),
                    },
                  },
                },
              },
              {
                PutRequest: {
                  Item: {
                    pk: `Strategy::${step.strategyId}::Step::Last::MarketEvolution`,
                    sk: 'Details',
                    type: 'StrategyStep',
                    data: {
                      ...step,
                      creationDate: step.creationDate.toISOString(),
                      executionStartDate: step.executionStartDate.toISOString(),
                      executionEndDate: step.executionEndDate.toISOString(),
                    },
                  },
                },
              },
            ],
          },
        });
      });
    });
  });

  describe('Given a send order strategy step to save', () => {
    beforeEach(() => {
      step = buildDefaultSendOrderStep();
    });

    describe('When strategy is saved', () => {
      it('Then saved strategy step is returned', async () => {
        const result = await strategyStepRepository.save(step);
        expect(result).toEqual(step);

        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          RequestItems: {
            'my-table': [
              {
                PutRequest: {
                  Item: {
                    pk: `Strategy::${step.strategyId}::Step::${step.creationDate.valueOf()}::${step.type}::${step.id}`,
                    sk: 'Details',
                    type: 'StrategyStep',
                    stepsListPk: `Strategy::${step.strategyId}::Steps`,
                    stepsListSk: step.creationDate.valueOf(),
                    data: {
                      ...step,
                      creationDate: step.creationDate.toISOString(),
                      executionStartDate: step.executionStartDate.toISOString(),
                      executionEndDate: step.executionEndDate.toISOString(),
                    },
                  },
                },
              },
              {
                PutRequest: {
                  Item: {
                    pk: `Strategy::${step.strategyId}::Step::Last`,
                    sk: 'Details',
                    type: 'StrategyStep',
                    data: {
                      ...step,
                      creationDate: step.creationDate.toISOString(),
                      executionStartDate: step.executionStartDate.toISOString(),
                      executionEndDate: step.executionEndDate.toISOString(),
                    },
                  },
                },
              },
              {
                PutRequest: {
                  Item: {
                    pk: `Strategy::${step.strategyId}::Step::Last::SendOrder`,
                    sk: 'Details',
                    type: 'StrategyStep',
                    data: {
                      ...step,
                      creationDate: step.creationDate.toISOString(),
                      executionStartDate: step.executionStartDate.toISOString(),
                      executionEndDate: step.executionEndDate.toISOString(),
                    },
                  },
                },
              },
            ],
          },
        });
      });
    });
  });

  describe('Given last strategy step to retrieve by its strategy ID', () => {
    beforeEach(() => {
      step = buildDefaultStrategyStep();
    });

    describe('When strategy step is not found', () => {
      beforeEach(() => {
        ddbClientMock.send.mockImplementation(() => ({
          Item: undefined,
        }));
      });

      it('Then null is returned', async () => {
        const result = await strategyStepRepository.getLastByStrategyId('123');
        expect(result).toBeNull();

        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Key: {
            pk: 'Strategy::123::Step::Last',
            sk: 'Details',
          },
        });
      });
    });

    describe('When strategy step is found', () => {
      beforeEach(() => {
        ddbClientMock.send.mockImplementation(() => ({
          Item: {
            data: {
              ...step,
              creationDate: step.creationDate.toISOString(),
              executionStartDate: step.executionStartDate.toISOString(),
              executionEndDate: step.executionEndDate.toISOString(),
            },
          },
        }));
      });

      it('Then strategy step is returned', async () => {
        const result = await strategyStepRepository.getLastByStrategyId('123');
        expect(result).toEqual(step);

        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Key: {
            pk: 'Strategy::123::Step::Last',
            sk: 'Details',
          },
        });
      });
    });
  });

  describe('Given last strategy step to retrieve by its strategy ID and step type', () => {
    beforeEach(() => {
      step = buildDefaultStrategyStep();
    });

    describe('When strategy step is not found', () => {
      beforeEach(() => {
        ddbClientMock.send.mockImplementation(() => ({
          Item: undefined,
        }));
      });

      it('Then null is returned', async () => {
        const result = await strategyStepRepository.getLastByStrategyIdAndType('123', 'MarketEvolution');
        expect(result).toBeNull();

        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Key: {
            pk: 'Strategy::123::Step::Last::MarketEvolution',
            sk: 'Details',
          },
        });
      });
    });

    describe('When strategy step is found', () => {
      beforeEach(() => {
        ddbClientMock.send.mockImplementation(() => ({
          Item: {
            data: {
              ...step,
              creationDate: step.creationDate.toISOString(),
              executionStartDate: step.executionStartDate.toISOString(),
              executionEndDate: step.executionEndDate.toISOString(),
            },
          },
        }));
      });

      it('Then strategy step is returned', async () => {
        const result = await strategyStepRepository.getLastByStrategyIdAndType('123', 'MarketEvolution');
        expect(result).toEqual(step);

        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Key: {
            pk: 'Strategy::123::Step::Last::MarketEvolution',
            sk: 'Details',
          },
        });
      });
    });
  });
});
