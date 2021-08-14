import DynamoDB from 'aws-sdk/clients/dynamodb';
import { DdbDcaTradingRepository } from '../../../../src/code/infrastructure/dca-trading/ddb-dca-trading-repository';
import { mocked } from 'ts-jest/utils';
import { DcaTrading } from '../../../../src/code/domain/dca-trading/model/dca-trading';
import { buildDefaultDcaTrading } from '../../../builders/domain/dca-trading/dca-trading-test-builder';

const ddbClientMock = mocked(jest.genMockFromModule<DynamoDB.DocumentClient>('aws-sdk/clients/dynamodb'), true);

let dcaTradingRepository: DdbDcaTradingRepository;
beforeEach(() => {
  dcaTradingRepository = new DdbDcaTradingRepository('my-table', ddbClientMock);
});

describe('DdbDcaTradingRepository', () => {
  describe('Given a DCA trading to save', () => {
    let dcaTrading: DcaTrading;

    beforeEach(() => {
      dcaTrading = buildDefaultDcaTrading();
    });

    describe('When DCA trading is saved', () => {
      it('Then two items are saved', async () => {
        ddbClientMock.batchWrite = jest.fn().mockReturnValue({
          promise: jest.fn(),
        });

        await dcaTradingRepository.save(dcaTrading);

        expect(ddbClientMock.batchWrite).toHaveBeenCalledTimes(1);
        const batchWriteParams = ddbClientMock.batchWrite.mock.calls[0];
        expect(batchWriteParams).toBeDefined();
        expect(batchWriteParams[0].RequestItems['my-table']).toBeDefined();
        expect(batchWriteParams[0].RequestItems['my-table'].length).toEqual(2);
        expect(batchWriteParams[0].RequestItems['my-table'][0].PutRequest).toBeDefined();
        expect(batchWriteParams[0].RequestItems['my-table'][0].PutRequest!.Item.pk).toEqual(`DcaTrading::Id::${dcaTrading.id}`);
        expect(batchWriteParams[0].RequestItems['my-table'][0].PutRequest!.Item.sk).toEqual('Details');
        expect(batchWriteParams[0].RequestItems['my-table'][0].PutRequest!.Item.type).toEqual('DcaTrading');
        expect(batchWriteParams[0].RequestItems['my-table'][0].PutRequest!.Item.data).toBeDefined();
        expect(batchWriteParams[0].RequestItems['my-table'][0].PutRequest!.Item.data).toEqual({ ...dcaTrading, creationDate: dcaTrading.creationDate.toISOString() });
        expect(batchWriteParams[0].RequestItems['my-table'][1].PutRequest).toBeDefined();
        expect(batchWriteParams[0].RequestItems['my-table'][1].PutRequest!.Item.pk).toEqual(`DcaTrading::Last`);
        expect(batchWriteParams[0].RequestItems['my-table'][1].PutRequest!.Item.sk).toEqual('Details');
        expect(batchWriteParams[0].RequestItems['my-table'][1].PutRequest!.Item.type).toEqual('DcaTrading');
        expect(batchWriteParams[0].RequestItems['my-table'][1].PutRequest!.Item.data).toBeDefined();
        expect(batchWriteParams[0].RequestItems['my-table'][1].PutRequest!.Item.data).toEqual({ ...dcaTrading, creationDate: dcaTrading.creationDate.toISOString() });
      });
    });
  });

  describe('Given the last DCA trading to retrieve', () => {
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
        expect(getParams[0].Key).toEqual({ pk: 'DcaTrading::Last', sk: 'Details' });
      });

      it('Then null is returned', async () => {
        const result = await dcaTradingRepository.getLast();
        expect(result).toBeDefined();
        expect(result).toEqual(null);
      });
    });

    describe('When item is found', () => {
      let dcaTrading: DcaTrading;

      beforeEach(() => {
        dcaTrading = buildDefaultDcaTrading();
        ddbClientMock.get = jest.fn().mockReturnValue({
          promise: jest.fn().mockResolvedValue({
            Item: {
              data: { ...dcaTrading, creationDate: dcaTrading.creationDate.toISOString() },
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
        expect(getParams[0].Key).toEqual({ pk: 'DcaTrading::Last', sk: 'Details' });
      });

      it('Then last DCA trading is returned', async () => {
        const result = await dcaTradingRepository.getLast();
        expect(result).toBeDefined();
        expect(result).toEqual(dcaTrading);
      });
    });
  });
});
