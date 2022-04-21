import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { mocked } from 'ts-jest/utils';

import { Strategy, StrategyWallet } from '../../../../src/code/domain/strategy/model/strategy';
import { StrategyRepository } from '../../../../src/code/domain/strategy/strategy-repository';
import { DdbStrategyRepository } from '../../../../src/code/infrastructure/strategy/ddb-strategy-repository';
import { buildDefaultStrategy, buildDefaultStrategyWallet } from '../../../builders/domain/strategy/strategy-test-builder';

const ddbClientMock = mocked(jest.genMockFromModule<DynamoDBDocumentClient>('@aws-sdk/lib-dynamodb'), true);

let strategyRepository: StrategyRepository;
beforeEach(() => {
  ddbClientMock.send = jest.fn();

  strategyRepository = new DdbStrategyRepository('my-table', ddbClientMock);
});

describe('DdbStrategyRepository', () => {
  describe('Given a strategy to retrieve by its ID', () => {
    describe('When strategy is not found', () => {
      beforeEach(() => {
        ddbClientMock.send.mockImplementation(() => ({
          Item: undefined,
        }));
      });

      it('Then null is returned', async () => {
        const result = await strategyRepository.getById('123');
        expect(result).toBeNull();

        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
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
        ddbClientMock.send.mockImplementation(() => ({
          Item: {
            data: { ...strategy },
          },
        }));
      });

      it('Then strategy is returned', async () => {
        const result = await strategyRepository.getById('123');
        expect(result).toEqual(strategy);

        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Key: {
            pk: 'Strategy::123',
            sk: 'Details',
          },
        });
      });
    });
  });

  describe('Given all active strategies IDs to retrieve by symbol', () => {
    describe('When active strategies IDs are not found', () => {
      beforeEach(() => {
        ddbClientMock.send.mockImplementation(() => ({
          Items: undefined,
        }));
      });

      it('Then empty list is returned', async () => {
        const result = await strategyRepository.getAllIdsBySymbolAndActiveStatus('ABC');
        expect(result).toEqual([]);

        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          IndexName: 'SymbolStatus-Index',
          KeyConditionExpression: '#gsiPk = :gsiPk',
          ExpressionAttributeNames: {
            '#gsiPk': 'symbolStatusPk',
          },
          ExpressionAttributeValues: {
            ':gsiPk': 'Strategy::ABC::Active',
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
        ddbClientMock.send
          .mockImplementationOnce(() => ({
            Items: [
              { data: { ...strategy1 }, symbolStatusSk: strategy1.id },
              { data: { ...strategy2 }, symbolStatusSk: strategy2.id },
            ],
            LastEvaluatedKey: '888',
          }))
          .mockImplementationOnce(() => ({
            Items: [{ data: { ...strategy3 }, symbolStatusSk: strategy3.id }],
            LastEvaluatedKey: '999',
          }))
          .mockImplementationOnce(() => ({
            Items: undefined,
          }));
      });

      it('Then active strategies IDs are returned', async () => {
        const result = await strategyRepository.getAllIdsBySymbolAndActiveStatus('ABC');
        expect(result).toEqual([strategy1.id, strategy2.id, strategy3.id]);

        expect(ddbClientMock.send).toHaveBeenCalledTimes(3);
        let sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          IndexName: 'SymbolStatus-Index',
          KeyConditionExpression: '#gsiPk = :gsiPk',
          ExpressionAttributeNames: {
            '#gsiPk': 'symbolStatusPk',
          },
          ExpressionAttributeValues: {
            ':gsiPk': 'Strategy::ABC::Active',
          },
        });
        sendParams = ddbClientMock.send.mock.calls[1];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          IndexName: 'SymbolStatus-Index',
          KeyConditionExpression: '#gsiPk = :gsiPk',
          ExpressionAttributeNames: {
            '#gsiPk': 'symbolStatusPk',
          },
          ExpressionAttributeValues: {
            ':gsiPk': 'Strategy::ABC::Active',
          },
        });
        sendParams = ddbClientMock.send.mock.calls[2];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          IndexName: 'SymbolStatus-Index',
          KeyConditionExpression: '#gsiPk = :gsiPk',
          ExpressionAttributeNames: {
            '#gsiPk': 'symbolStatusPk',
          },
          ExpressionAttributeValues: {
            ':gsiPk': 'Strategy::ABC::Active',
          },
        });
      });
    });
  });

  describe('Given a strategy status to update by its ID', () => {
    describe('When strategy is not found', () => {
      beforeEach(() => {
        ddbClientMock.send.mockImplementation(() => ({
          Item: undefined,
        }));
      });

      it('Then error is thrown', async () => {
        try {
          await strategyRepository.updateStatusById('123', 'Inactive');
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual(`Unable to find strategy with ID '123'`);
        }

        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Key: {
            pk: 'Strategy::123',
            sk: 'Details',
          },
          ProjectionExpression: '#data.symbol',
          ExpressionAttributeNames: {
            '#data': 'data',
          },
        });
      });
    });

    describe('When strategy is found', () => {
      let strategy: Strategy;

      beforeEach(() => {
        strategy = buildDefaultStrategy();
        ddbClientMock.send.mockImplementationOnce(() => ({
          Item: {
            data: { ...strategy },
          },
        }));
        ddbClientMock.send.mockImplementationOnce(() => ({
          Attributes: {
            data: { ...strategy },
          },
        }));
      });

      it('Then updated strategy is returned', async () => {
        await strategyRepository.updateStatusById('123', 'Inactive');

        expect(ddbClientMock.send).toHaveBeenCalledTimes(2);
        let sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Key: {
            pk: 'Strategy::123',
            sk: 'Details',
          },
          ProjectionExpression: '#data.symbol',
          ExpressionAttributeNames: {
            '#data': 'data',
          },
        });
        sendParams = ddbClientMock.send.mock.calls[1];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Key: {
            pk: `Strategy::123`,
            sk: 'Details',
          },
          UpdateExpression: 'SET #data.#status = :status, #gsiPk = :gsiPk, #gsiSk = :gsiSk',
          ExpressionAttributeNames: {
            '#data': 'data',
            '#status': 'status',
            '#gsiPk': 'symbolStatusPk',
            '#gsiSk': 'symbolStatusSk',
          },
          ExpressionAttributeValues: {
            ':status': 'Inactive',
            ':gsiPk': `Strategy::${strategy.symbol}::Inactive`,
            ':gsiSk': '123',
          },
        });
      });
    });
  });

  describe('Given a strategy wallet to retrieve by its ID', () => {
    let wallet: StrategyWallet;

    describe('When strategy wallet is not found', () => {
      beforeEach(() => {
        ddbClientMock.send.mockImplementation(() => ({
          Item: undefined,
        }));
      });

      it('Then null is returned', async () => {
        const result = await strategyRepository.getWalletById('123');
        expect(result).toBeNull();

        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Key: {
            pk: 'Strategy::123::Wallet',
            sk: 'Details',
          },
        });
      });
    });

    describe('When strategy wallet is found', () => {
      beforeEach(() => {
        wallet = buildDefaultStrategyWallet();
        ddbClientMock.send.mockImplementation(() => ({
          Item: {
            data: wallet,
          },
        }));
      });

      it('Then strategy wallet is returned', async () => {
        const result = await strategyRepository.getWalletById('123');
        expect(result).toEqual(wallet);

        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Key: {
            pk: 'Strategy::123::Wallet',
            sk: 'Details',
          },
        });
      });
    });
  });

  describe('Given a strategy wallet to update by its ID', () => {
    describe('When strategy is not found', () => {
      beforeEach(() => {
        ddbClientMock.send.mockImplementation(() => {
          throw new Error('Error !');
        });
      });

      it('Then error is thrown', async () => {
        try {
          await strategyRepository.updateWalletById('123', 1.5, -100);
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual(`Unable to update strategy '123' wallet '1.5/-100': Error !`);
        }

        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Key: {
            pk: `Strategy::123::Wallet`,
            sk: 'Details',
          },
          UpdateExpression:
            'SET #data.availableBaseAssetQuantity = #data.availableBaseAssetQuantity + :baseAssetQuantity, #data.profitAndLossBaseAssetQuantity = #data.profitAndLossBaseAssetQuantity + :baseAssetQuantity, #data.availableQuoteAssetQuantity = #data.availableQuoteAssetQuantity + :quoteAssetQuantity, #data.profitAndLossQuoteAssetQuantity = #data.profitAndLossQuoteAssetQuantity + :quoteAssetQuantity',
          ExpressionAttributeNames: {
            '#data': 'data',
          },
          ExpressionAttributeValues: {
            ':baseAssetQuantity': 1.5,
            ':quoteAssetQuantity': -100,
          },
        });
      });
    });

    describe('When strategy is found', () => {
      let wallet: StrategyWallet;

      beforeEach(() => {
        ddbClientMock.send.mockImplementation(() => ({
          Attributes: {
            data: wallet,
          },
        }));
      });

      it('Then updated strategy is returned', async () => {
        await strategyRepository.updateWalletById('123', 1.5, -100);

        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Key: {
            pk: `Strategy::123::Wallet`,
            sk: 'Details',
          },
          UpdateExpression:
            'SET #data.availableBaseAssetQuantity = #data.availableBaseAssetQuantity + :baseAssetQuantity, #data.profitAndLossBaseAssetQuantity = #data.profitAndLossBaseAssetQuantity + :baseAssetQuantity, #data.availableQuoteAssetQuantity = #data.availableQuoteAssetQuantity + :quoteAssetQuantity, #data.profitAndLossQuoteAssetQuantity = #data.profitAndLossQuoteAssetQuantity + :quoteAssetQuantity',
          ExpressionAttributeNames: {
            '#data': 'data',
          },
          ExpressionAttributeValues: {
            ':baseAssetQuantity': 1.5,
            ':quoteAssetQuantity': -100,
          },
        });
      });
    });
  });
});
