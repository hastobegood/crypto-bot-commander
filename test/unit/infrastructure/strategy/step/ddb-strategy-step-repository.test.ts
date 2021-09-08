import DynamoDB from 'aws-sdk/clients/dynamodb';
import { mocked } from 'ts-jest/utils';
import { StrategyStepRepository } from '../../../../../src/code/domain/strategy/step/strategy-step-repository';
import { DdbStrategyStepRepository } from '../../../../../src/code/infrastructure/strategy/step/ddb-strategy-step-repository';
import { SendOrderStepInput, StrategyStep } from '../../../../../src/code/domain/strategy/model/strategy-step';
import { buildDefaultMarketEvolutionStep, buildDefaultSendOrderStep, buildDefaultStrategyStep } from '../../../../builders/domain/strategy/strategy-step-test-builder';

const ddbClientMock = mocked(jest.genMockFromModule<DynamoDB.DocumentClient>('aws-sdk/clients/dynamodb'), true);

let strategyStepRepository: StrategyStepRepository;
beforeEach(() => {
  ddbClientMock.batchWrite = jest.fn();
  ddbClientMock.get = jest.fn();

  strategyStepRepository = new DdbStrategyStepRepository('my-table', ddbClientMock);
});

describe('DdbStrategyStepRepository', () => {
  let step: StrategyStep;

  describe('Given a market evolution strategy step to save', () => {
    beforeEach(() => {
      step = buildDefaultMarketEvolutionStep();

      ddbClientMock.batchWrite = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue(null),
      });
    });

    describe('When strategy is saved', () => {
      it('Then saved strategy step is returned', async () => {
        const result = await strategyStepRepository.save(step);
        expect(result).toEqual(step);

        expect(ddbClientMock.batchWrite).toHaveBeenCalledTimes(1);
        const batchWriteParams = ddbClientMock.batchWrite.mock.calls[0];
        expect(batchWriteParams.length).toEqual(1);
        expect(batchWriteParams[0]).toEqual({
          RequestItems: {
            'my-table': [
              {
                PutRequest: {
                  Item: {
                    pk: `Strategy::${step.strategyId}::Step::${step.creationDate.valueOf()}-${step.id}`,
                    sk: 'Details',
                    type: 'StrategyStep',
                    data: { ...step, creationDate: step.creationDate.toISOString(), lastExecutionDate: step.lastExecutionDate.toISOString() },
                  },
                },
              },
              {
                PutRequest: {
                  Item: {
                    pk: `Strategy::${step.strategyId}::Step::Last`,
                    sk: 'Details',
                    type: 'StrategyStep',
                    data: { ...step, creationDate: step.creationDate.toISOString(), lastExecutionDate: step.lastExecutionDate.toISOString() },
                  },
                },
              },
              {
                PutRequest: {
                  Item: {
                    pk: `Strategy::${step.strategyId}::Step::Last::MarketEvolution`,
                    sk: 'Details',
                    type: 'StrategyStep',
                    data: { ...step, creationDate: step.creationDate.toISOString(), lastExecutionDate: step.lastExecutionDate.toISOString() },
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

      ddbClientMock.batchWrite = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue(null),
      });
    });

    describe('When strategy is saved', () => {
      it('Then saved strategy step is returned', async () => {
        const result = await strategyStepRepository.save(step);
        expect(result).toEqual(step);

        expect(ddbClientMock.batchWrite).toHaveBeenCalledTimes(1);
        const batchWriteParams = ddbClientMock.batchWrite.mock.calls[0];
        expect(batchWriteParams.length).toEqual(1);
        expect(batchWriteParams[0]).toEqual({
          RequestItems: {
            'my-table': [
              {
                PutRequest: {
                  Item: {
                    pk: `Strategy::${step.strategyId}::Step::${step.creationDate.valueOf()}-${step.id}`,
                    sk: 'Details',
                    type: 'StrategyStep',
                    data: { ...step, creationDate: step.creationDate.toISOString(), lastExecutionDate: step.lastExecutionDate.toISOString() },
                  },
                },
              },
              {
                PutRequest: {
                  Item: {
                    pk: `Strategy::${step.strategyId}::Step::Last`,
                    sk: 'Details',
                    type: 'StrategyStep',
                    data: { ...step, creationDate: step.creationDate.toISOString(), lastExecutionDate: step.lastExecutionDate.toISOString() },
                  },
                },
              },
              {
                PutRequest: {
                  Item: {
                    pk: `Strategy::${step.strategyId}::Step::Last::SendOrder`,
                    sk: 'Details',
                    type: 'StrategyStep',
                    data: { ...step, creationDate: step.creationDate.toISOString(), lastExecutionDate: step.lastExecutionDate.toISOString() },
                  },
                },
              },
              {
                PutRequest: {
                  Item: {
                    pk: `Strategy::${step.strategyId}::Step::Last::SendOrder::${(step.input as SendOrderStepInput).side}`,
                    sk: 'Details',
                    type: 'StrategyStep',
                    data: { ...step, creationDate: step.creationDate.toISOString(), lastExecutionDate: step.lastExecutionDate.toISOString() },
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
        ddbClientMock.get = jest.fn().mockReturnValue({
          promise: jest.fn().mockResolvedValue({
            Item: undefined,
          }),
        });
      });

      it('Then null is returned', async () => {
        const result = await strategyStepRepository.getLastByStrategyId('123');
        expect(result).toBeNull();

        expect(ddbClientMock.get).toHaveBeenCalledTimes(1);
        const getParams = ddbClientMock.get.mock.calls[0];
        expect(getParams.length).toEqual(1);
        expect(getParams[0]).toEqual({
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
        ddbClientMock.get = jest.fn().mockReturnValue({
          promise: jest.fn().mockResolvedValue({
            Item: {
              data: { ...step, creationDate: step.creationDate.toISOString(), lastExecutionDate: step.lastExecutionDate.toISOString() },
            },
          }),
        });
      });

      it('Then strategy step is returned', async () => {
        const result = await strategyStepRepository.getLastByStrategyId('123');
        expect(result).toEqual(step);

        expect(ddbClientMock.get).toHaveBeenCalledTimes(1);
        const getParams = ddbClientMock.get.mock.calls[0];
        expect(getParams.length).toEqual(1);
        expect(getParams[0]).toEqual({
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
        ddbClientMock.get = jest.fn().mockReturnValue({
          promise: jest.fn().mockResolvedValue({
            Item: undefined,
          }),
        });
      });

      it('Then null is returned', async () => {
        const result = await strategyStepRepository.getLastByStrategyIdAndType('123', 'MarketEvolution');
        expect(result).toBeNull();

        expect(ddbClientMock.get).toHaveBeenCalledTimes(1);
        const getParams = ddbClientMock.get.mock.calls[0];
        expect(getParams.length).toEqual(1);
        expect(getParams[0]).toEqual({
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
        ddbClientMock.get = jest.fn().mockReturnValue({
          promise: jest.fn().mockResolvedValue({
            Item: {
              data: { ...step, creationDate: step.creationDate.toISOString(), lastExecutionDate: step.lastExecutionDate.toISOString() },
            },
          }),
        });
      });

      it('Then strategy step is returned', async () => {
        const result = await strategyStepRepository.getLastByStrategyIdAndType('123', 'MarketEvolution');
        expect(result).toEqual(step);

        expect(ddbClientMock.get).toHaveBeenCalledTimes(1);
        const getParams = ddbClientMock.get.mock.calls[0];
        expect(getParams.length).toEqual(1);
        expect(getParams[0]).toEqual({
          TableName: 'my-table',
          Key: {
            pk: 'Strategy::123::Step::Last::MarketEvolution',
            sk: 'Details',
          },
        });
      });
    });
  });

  describe('Given last send order step to retrieve by its strategy ID and order side', () => {
    beforeEach(() => {
      step = buildDefaultSendOrderStep();
    });

    describe('When strategy step is not found', () => {
      beforeEach(() => {
        ddbClientMock.get = jest.fn().mockReturnValue({
          promise: jest.fn().mockResolvedValue({
            Item: undefined,
          }),
        });
      });

      it('Then null is returned', async () => {
        const result = await strategyStepRepository.getLastSendOrderByStrategyIdAndOrderSide('123', 'Buy');
        expect(result).toBeNull();

        expect(ddbClientMock.get).toHaveBeenCalledTimes(1);
        const getParams = ddbClientMock.get.mock.calls[0];
        expect(getParams.length).toEqual(1);
        expect(getParams[0]).toEqual({
          TableName: 'my-table',
          Key: {
            pk: 'Strategy::123::Step::Last::SendOrder::Buy',
            sk: 'Details',
          },
        });
      });
    });

    describe('When strategy step is found', () => {
      beforeEach(() => {
        ddbClientMock.get = jest.fn().mockReturnValue({
          promise: jest.fn().mockResolvedValue({
            Item: {
              data: { ...step, creationDate: step.creationDate.toISOString(), lastExecutionDate: step.lastExecutionDate.toISOString() },
            },
          }),
        });
      });

      it('Then strategy step is returned', async () => {
        const result = await strategyStepRepository.getLastSendOrderByStrategyIdAndOrderSide('123', 'Sell');
        expect(result).toEqual(step);

        expect(ddbClientMock.get).toHaveBeenCalledTimes(1);
        const getParams = ddbClientMock.get.mock.calls[0];
        expect(getParams.length).toEqual(1);
        expect(getParams[0]).toEqual({
          TableName: 'my-table',
          Key: {
            pk: 'Strategy::123::Step::Last::SendOrder::Sell',
            sk: 'Details',
          },
        });
      });
    });
  });
});
