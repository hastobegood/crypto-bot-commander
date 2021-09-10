import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DdbDcaTradingRepository } from '../../../../src/code/infrastructure/dca-trading/ddb-dca-trading-repository';
import { mocked } from 'ts-jest/utils';
import { DcaTrading } from '../../../../src/code/domain/dca-trading/model/dca-trading';
import { buildDefaultDcaTrading } from '../../../builders/domain/dca-trading/dca-trading-test-builder';

const ddbClientMock = mocked(jest.genMockFromModule<DynamoDBDocumentClient>('@aws-sdk/lib-dynamodb'), true);

let dcaTradingRepository: DdbDcaTradingRepository;
beforeEach(() => {
  ddbClientMock.send = jest.fn();

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
        await dcaTradingRepository.save(dcaTrading);

        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const batchWriteParams = ddbClientMock.send.mock.calls[0];
        expect(batchWriteParams).toBeDefined();
        expect(batchWriteParams[0].input).toEqual({
          RequestItems: {
            'my-table': [
              {
                PutRequest: {
                  Item: {
                    pk: `DcaTrading::Id::${dcaTrading.id}`,
                    sk: 'Details',
                    type: 'DcaTrading',
                    data: { ...dcaTrading, creationDate: dcaTrading.creationDate.toISOString() },
                  },
                },
              },
              {
                PutRequest: {
                  Item: {
                    pk: 'DcaTrading::Last',
                    sk: 'Details',
                    type: 'DcaTrading',
                    data: { ...dcaTrading, creationDate: dcaTrading.creationDate.toISOString() },
                  },
                },
              },
            ],
          },
        });
      });
    });
  });

  describe('Given the last DCA trading to retrieve', () => {
    describe('When item is not found', () => {
      beforeEach(() => {
        ddbClientMock.send.mockImplementation(() => ({
          Item: undefined,
        }));
      });

      afterEach(() => {
        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams).toBeDefined();
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Key: {
            pk: 'DcaTrading::Last',
            sk: 'Details',
          },
        });
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
        ddbClientMock.send.mockImplementation(() => ({
          Item: {
            data: { ...dcaTrading, creationDate: dcaTrading.creationDate.toISOString() },
          },
        }));
      });

      afterEach(() => {
        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams).toBeDefined();
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Key: {
            pk: 'DcaTrading::Last',
            sk: 'Details',
          },
        });
      });

      it('Then last DCA trading is returned', async () => {
        const result = await dcaTradingRepository.getLast();
        expect(result).toBeDefined();
        expect(result).toEqual(dcaTrading);
      });
    });
  });
});
