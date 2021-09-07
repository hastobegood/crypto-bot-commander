import DynamoDB from 'aws-sdk/clients/dynamodb';
import { mocked } from 'ts-jest/utils';
import { DdbStrategyRepository } from '../../../../src/code/infrastructure/strategy/ddb-strategy-repository';
import { StrategyRepository } from '../../../../src/code/domain/strategy/strategy-repository';
import { Strategy } from '../../../../src/code/domain/strategy/model/strategy';
import { buildDefaultStrategy } from '../../../builders/domain/strategy/strategy-test-builder';

const ddbClientMock = mocked(jest.genMockFromModule<DynamoDB.DocumentClient>('aws-sdk/clients/dynamodb'), true);

let strategyRepository: StrategyRepository;
beforeEach(() => {
  ddbClientMock.get = jest.fn();
  ddbClientMock.query = jest.fn();
  ddbClientMock.update = jest.fn();

  strategyRepository = new DdbStrategyRepository('my-table', ddbClientMock);
});

describe('DdbStrategyRepository', () => {
  describe('Given a strategy to retrieve by its ID', () => {
    describe('When strategy is not found', () => {
      beforeEach(() => {
        ddbClientMock.get = jest.fn().mockReturnValue({
          promise: jest.fn().mockResolvedValue({
            Item: undefined,
          }),
        });
      });

      it('Then null is returned', async () => {
        const result = await strategyRepository.getById('123');
        expect(result).toBeNull();

        expect(ddbClientMock.get).toHaveBeenCalledTimes(1);
        const getParams = ddbClientMock.get.mock.calls[0];
        expect(getParams.length).toEqual(1);
        expect(getParams[0]).toEqual({
          TableName: 'my-table',
          Key: {
            pk: 'Strategy::123',
            sk: 'Details',
          },
        });
      });
    });

    describe('When strategy is found', () => {
      let strategy: Strategy;

      beforeEach(() => {
        strategy = buildDefaultStrategy();
        ddbClientMock.get = jest.fn().mockReturnValue({
          promise: jest.fn().mockResolvedValue({
            Item: {
              data: { ...strategy },
            },
          }),
        });
      });

      it('Then strategy is returned', async () => {
        const result = await strategyRepository.getById('123');
        expect(result).toEqual(strategy);

        expect(ddbClientMock.get).toHaveBeenCalledTimes(1);
        const getParams = ddbClientMock.get.mock.calls[0];
        expect(getParams.length).toEqual(1);
        expect(getParams[0]).toEqual({
          TableName: 'my-table',
          Key: {
            pk: 'Strategy::123',
            sk: 'Details',
          },
        });
      });
    });
  });

  describe('Given all active strategies IDs to retrieve', () => {
    describe('When active strategies IDs are not found', () => {
      beforeEach(() => {
        ddbClientMock.query = jest.fn().mockReturnValue({
          promise: jest.fn().mockResolvedValue({
            Items: undefined,
          }),
        });
      });

      it('Then empty list is returned', async () => {
        const result = await strategyRepository.getAllIdsWithStatusActive();
        expect(result).toEqual([]);

        expect(ddbClientMock.query).toHaveBeenCalledTimes(1);
        const queryParams = ddbClientMock.query.mock.calls[0];
        expect(queryParams.length).toEqual(1);
        expect(queryParams[0]).toEqual({
          TableName: 'my-table',
          IndexName: 'ActiveStrategies-Index',
          KeyConditionExpression: '#gsiPk = :gsiPk',
          ExpressionAttributeNames: {
            '#gsiPk': 'activeStrategiesPk',
          },
          ExpressionAttributeValues: {
            ':gsiPk': 'Strategy::Active',
          },
        });
      });
    });

    describe('When active strategies IDs are found', () => {
      let strategy1: Strategy;
      let strategy2: Strategy;
      let strategy3: Strategy;

      beforeEach(() => {
        strategy1 = buildDefaultStrategy();
        strategy2 = buildDefaultStrategy();
        strategy3 = buildDefaultStrategy();
        ddbClientMock.query = jest
          .fn()
          .mockReturnValueOnce({
            promise: jest.fn().mockResolvedValue({
              Items: [
                { data: { ...strategy1 }, activeStrategiesSk: strategy1.id },
                { data: { ...strategy2 }, activeStrategiesSk: strategy2.id },
              ],
              LastEvaluatedKey: '888',
            }),
          })
          .mockReturnValueOnce({
            promise: jest.fn().mockResolvedValue({
              Items: [{ data: { ...strategy3 }, activeStrategiesSk: strategy3.id }],
            }),
          });
      });

      it('Then active strategies IDs are returned', async () => {
        const result = await strategyRepository.getAllIdsWithStatusActive();
        expect(result).toEqual([strategy1.id, strategy2.id, strategy3.id]);

        expect(ddbClientMock.query).toHaveBeenCalledTimes(2);
        let queryParams = ddbClientMock.query.mock.calls[0];
        expect(queryParams.length).toEqual(1);
        expect(queryParams[0]).toEqual({
          TableName: 'my-table',
          IndexName: 'ActiveStrategies-Index',
          KeyConditionExpression: '#gsiPk = :gsiPk',
          ExpressionAttributeNames: {
            '#gsiPk': 'activeStrategiesPk',
          },
          ExpressionAttributeValues: {
            ':gsiPk': 'Strategy::Active',
          },
        });
        queryParams = ddbClientMock.query.mock.calls[1];
        expect(queryParams.length).toEqual(1);
        expect(queryParams[0]).toEqual({
          TableName: 'my-table',
          IndexName: 'ActiveStrategies-Index',
          KeyConditionExpression: '#gsiPk = :gsiPk',
          ExpressionAttributeNames: {
            '#gsiPk': 'activeStrategiesPk',
          },
          ExpressionAttributeValues: {
            ':gsiPk': 'Strategy::Active',
          },
        });
      });
    });
  });

  describe('Given a strategy status to update by its ID', () => {
    describe('When strategy is not found', () => {
      beforeEach(() => {
        ddbClientMock.update = jest.fn().mockReturnValue({
          promise: jest.fn().mockRejectedValue(new Error('Error !')),
        });
      });

      it('Then error is thrown', async () => {
        try {
          await strategyRepository.updateStatusById('123', 'Active');
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual(`Unable to update strategy '123' with status 'Active': Error !`);
        }

        expect(ddbClientMock.update).toHaveBeenCalledTimes(1);
        const updateParams = ddbClientMock.update.mock.calls[0];
        expect(updateParams.length).toEqual(1);
        expect(updateParams[0]).toEqual({
          TableName: 'my-table',
          Key: {
            pk: `Strategy::123`,
            sk: 'Details',
          },
          UpdateExpression: 'SET #data.#status = :status, #gsiPk = :gsiPk, #gsiSk = :gsiSk',
          ExpressionAttributeNames: {
            '#data': 'data',
            '#status': 'status',
            '#gsiPk': 'activeStrategiesPk',
            '#gsiSk': 'activeStrategiesSk',
          },
          ExpressionAttributeValues: {
            ':status': 'Active',
            ':gsiPk': 'Strategy::Active',
            ':gsiSk': '123',
          },
          ReturnValues: 'ALL_NEW',
        });
      });
    });

    describe('When strategy is found', () => {
      let strategy: Strategy;

      beforeEach(() => {
        strategy = buildDefaultStrategy();
        ddbClientMock.update = jest.fn().mockReturnValue({
          promise: jest.fn().mockResolvedValue({
            Attributes: {
              data: { ...strategy },
            },
          }),
        });
      });

      it('Then updated strategy is returned', async () => {
        const result = await strategyRepository.updateStatusById('123', 'Inactive');
        expect(result).toEqual(strategy);

        expect(ddbClientMock.update).toHaveBeenCalledTimes(1);
        const updateParams = ddbClientMock.update.mock.calls[0];
        expect(updateParams.length).toEqual(1);
        expect(updateParams[0]).toEqual({
          TableName: 'my-table',
          Key: {
            pk: `Strategy::123`,
            sk: 'Details',
          },
          UpdateExpression: 'SET #data.#status = :status REMOVE #gsiPk, #gsiSk',
          ExpressionAttributeNames: {
            '#data': 'data',
            '#status': 'status',
            '#gsiPk': 'activeStrategiesPk',
            '#gsiSk': 'activeStrategiesSk',
          },
          ExpressionAttributeValues: {
            ':status': 'Inactive',
          },
          ReturnValues: 'ALL_NEW',
        });
      });
    });
  });
});
