import DynamoDB from 'aws-sdk/clients/dynamodb';
import { DdbBotTradingRepository } from '../../../../src/code/infrastructure/bot-trading/ddb-bot-trading-repository';
import { mocked } from 'ts-jest/utils';
import { BotTrading } from '../../../../src/code/domain/bot-trading/model/bot-trading';
import { buildDefaultBotTrading } from '../../../builders/domain/bot-trading/bot-trading-test-builder';

const ddbClientMock = mocked(jest.genMockFromModule<DynamoDB.DocumentClient>('aws-sdk/clients/dynamodb'), true);

let botTradingRepository: DdbBotTradingRepository;
beforeEach(() => {
  botTradingRepository = new DdbBotTradingRepository('my-table', ddbClientMock);
});

describe('DdbBotTradingRepository', () => {
  describe('Given a BOT trading to save', () => {
    let botTrading: BotTrading;

    beforeEach(() => {
      botTrading = buildDefaultBotTrading();
    });

    describe('When BOT trading is saved', () => {
      it('Then two items are saved', async () => {
        ddbClientMock.batchWrite = jest.fn().mockReturnValue({
          promise: jest.fn(),
        });

        await botTradingRepository.save(botTrading);

        expect(ddbClientMock.batchWrite).toHaveBeenCalledTimes(1);
        const batchWriteParams = ddbClientMock.batchWrite.mock.calls[0];
        expect(batchWriteParams).toBeDefined();
        expect(batchWriteParams[0].RequestItems['my-table']).toBeDefined();
        expect(batchWriteParams[0].RequestItems['my-table'].length).toEqual(2);
        expect(batchWriteParams[0].RequestItems['my-table'][0].PutRequest).toBeDefined();
        expect(batchWriteParams[0].RequestItems['my-table'][0].PutRequest!.Item.pk).toEqual(`BotTrading::Id::${botTrading.id}`);
        expect(batchWriteParams[0].RequestItems['my-table'][0].PutRequest!.Item.sk).toEqual('Details');
        expect(batchWriteParams[0].RequestItems['my-table'][0].PutRequest!.Item.type).toEqual('BotTrading');
        expect(batchWriteParams[0].RequestItems['my-table'][0].PutRequest!.Item.data).toBeDefined();
        expect(batchWriteParams[0].RequestItems['my-table'][0].PutRequest!.Item.data).toEqual({ ...botTrading, creationDate: botTrading.creationDate.toISOString() });
        expect(batchWriteParams[0].RequestItems['my-table'][1].PutRequest).toBeDefined();
        expect(batchWriteParams[0].RequestItems['my-table'][1].PutRequest!.Item.pk).toEqual(`BotTrading::Last`);
        expect(batchWriteParams[0].RequestItems['my-table'][1].PutRequest!.Item.sk).toEqual('Details');
        expect(batchWriteParams[0].RequestItems['my-table'][1].PutRequest!.Item.type).toEqual('BotTrading');
        expect(batchWriteParams[0].RequestItems['my-table'][1].PutRequest!.Item.data).toBeDefined();
        expect(batchWriteParams[0].RequestItems['my-table'][1].PutRequest!.Item.data).toEqual({ ...botTrading, creationDate: botTrading.creationDate.toISOString() });
      });
    });
  });

  describe('Given the last BOT trading to retrieve', () => {
    describe('When item is not found', () => {
      beforeEach(() => {
        ddbClientMock.get = jest.fn().mockReturnValue({
          promise: jest.fn().mockResolvedValue({
            Item: undefined,
          }),
        });
      });

      afterEach(() => {
        expect(ddbClientMock.get).toHaveBeenCalledTimes(1);
        const getParams = ddbClientMock.get.mock.calls[0];
        expect(getParams).toBeDefined();
        expect(getParams[0]).toBeDefined();
        expect(getParams[0].TableName).toEqual('my-table');
        expect(getParams[0].Key).toEqual({ pk: 'BotTrading::Last', sk: 'Details' });
      });

      it('Then null is returned', async () => {
        const result = await botTradingRepository.getLast();
        expect(result).toBeDefined();
        expect(result).toEqual(null);
      });
    });

    describe('When item is found', () => {
      let botTrading: BotTrading;

      beforeEach(() => {
        botTrading = buildDefaultBotTrading();
        ddbClientMock.get = jest.fn().mockReturnValue({
          promise: jest.fn().mockResolvedValue({
            Item: {
              data: { ...botTrading, creationDate: botTrading.creationDate.toISOString() },
            },
          }),
        });
      });

      afterEach(() => {
        expect(ddbClientMock.get).toHaveBeenCalledTimes(1);
        const getParams = ddbClientMock.get.mock.calls[0];
        expect(getParams).toBeDefined();
        expect(getParams[0]).toBeDefined();
        expect(getParams[0].TableName).toEqual('my-table');
        expect(getParams[0].Key).toEqual({ pk: 'BotTrading::Last', sk: 'Details' });
      });

      it('Then last BOT trading is returned', async () => {
        const result = await botTradingRepository.getLast();
        expect(result).toBeDefined();
        expect(result).toEqual(botTrading);
      });
    });
  });
});
