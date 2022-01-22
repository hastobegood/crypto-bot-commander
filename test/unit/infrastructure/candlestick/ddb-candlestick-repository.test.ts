import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { mocked } from 'ts-jest/utils';
import { Candlestick } from '@hastobegood/crypto-bot-artillery/candlestick';
import { buildCandlesticksFromTo } from '@hastobegood/crypto-bot-artillery/test/builders';
import { CandlestickRepository } from '../../../../src/code/domain/candlestick/candlestick-repository';
import { CandlestickEntity, DdbCandlestickRepository } from '../../../../src/code/infrastructure/candlestick/ddb-candlestick-repository';
import { buildDefaultCandlestickEntity } from '../../../builders/infrastructure/candlestick/candlestick-entity-builder';

const ddbClientMock = mocked(jest.genMockFromModule<DynamoDBDocumentClient>('@aws-sdk/lib-dynamodb'), true);

let candlestickRepository: CandlestickRepository;
beforeEach(() => {
  ddbClientMock.send = jest.fn();

  candlestickRepository = new DdbCandlestickRepository('my-table', ddbClientMock);
});

describe('DdbCandlestickRepository', () => {
  describe('Given candlesticks to save', () => {
    let candlesticks: Candlestick[];

    beforeEach(() => {
      candlesticks = buildCandlesticksFromTo(new Date('2021-09-01T23:35:00.000Z'), new Date('2021-09-02T00:35:00.000Z'));
    });

    describe('When candlesticks are saved', () => {
      it('Then candlesticks are saved by chunk of 25', async () => {
        await candlestickRepository.saveAllBySymbol('Binance', 'ABC', candlesticks);

        expect(ddbClientMock.send).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Given candlesticks to retrieve by dates', () => {
    describe('When candlesticks are not found', () => {
      beforeEach(() => {
        ddbClientMock.send.mockImplementation(() =>
          Promise.resolve({
            Items: undefined,
          }),
        );
      });

      it('Then empty list is returned', async () => {
        const startDate = new Date('2021-09-11T12:30:00.000Z');
        const endDate = new Date('2021-09-13T12:30:00.000Z');
        const result = await candlestickRepository.getAllBySymbol('Binance', 'ABC', startDate.valueOf(), endDate.valueOf());
        expect(result.length).toEqual(0);
        expect(result).toEqual([]);

        expect(ddbClientMock.send).toHaveBeenCalledTimes(3);
        let sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          KeyConditionExpression: '#pk = :pk and #sk between :startDate and :endDate',
          ExpressionAttributeNames: {
            '#pk': 'pk',
            '#sk': 'sk',
          },
          ExpressionAttributeValues: {
            ':pk': 'Candlestick::Binance::ABC::2021-09-11',
            ':startDate': startDate.valueOf().toString(),
            ':endDate': endDate.valueOf().toString(),
          },
        });
        sendParams = ddbClientMock.send.mock.calls[1];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          KeyConditionExpression: '#pk = :pk and #sk between :startDate and :endDate',
          ExpressionAttributeNames: {
            '#pk': 'pk',
            '#sk': 'sk',
          },
          ExpressionAttributeValues: {
            ':pk': 'Candlestick::Binance::ABC::2021-09-12',
            ':startDate': startDate.valueOf().toString(),
            ':endDate': endDate.valueOf().toString(),
          },
        });
        sendParams = ddbClientMock.send.mock.calls[2];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          KeyConditionExpression: '#pk = :pk and #sk between :startDate and :endDate',
          ExpressionAttributeNames: {
            '#pk': 'pk',
            '#sk': 'sk',
          },
          ExpressionAttributeValues: {
            ':pk': 'Candlestick::Binance::ABC::2021-09-13',
            ':startDate': startDate.valueOf().toString(),
            ':endDate': endDate.valueOf().toString(),
          },
        });
      });
    });

    describe('When candlesticks are found', () => {
      let candlestick1: CandlestickEntity;
      let candlestick2: CandlestickEntity;
      let candlestick3: CandlestickEntity;

      beforeEach(() => {
        candlestick1 = buildDefaultCandlestickEntity();
        candlestick2 = buildDefaultCandlestickEntity();
        candlestick3 = buildDefaultCandlestickEntity();
        ddbClientMock.send
          .mockImplementationOnce(() =>
            Promise.resolve({
              Items: [{ data: candlestick1 }, { data: candlestick2 }],
            }),
          )
          .mockImplementationOnce(() =>
            Promise.resolve({
              Items: [{ data: candlestick3 }],
            }),
          )
          .mockImplementationOnce(() =>
            Promise.resolve({
              Items: undefined,
            }),
          );
      });

      it('Then candlesticks are returned', async () => {
        const startDate = new Date('2021-09-11T12:30:00.000Z');
        const endDate = new Date('2021-09-13T12:30:00.000Z');
        const result = await candlestickRepository.getAllBySymbol('Binance', 'ABC', startDate.valueOf(), endDate.valueOf());
        expect(result.length).toEqual(3);
        expect(result).toEqual([
          {
            openingDate: candlestick1.start,
            closingDate: candlestick1.end,
            openingPrice: candlestick1.ohlcv[0],
            closingPrice: candlestick1.ohlcv[3],
            lowestPrice: candlestick1.ohlcv[2],
            highestPrice: candlestick1.ohlcv[1],
          },
          {
            openingDate: candlestick2.start,
            closingDate: candlestick2.end,
            openingPrice: candlestick2.ohlcv[0],
            closingPrice: candlestick2.ohlcv[3],
            lowestPrice: candlestick2.ohlcv[2],
            highestPrice: candlestick2.ohlcv[1],
          },
          {
            openingDate: candlestick3.start,
            closingDate: candlestick3.end,
            openingPrice: candlestick3.ohlcv[0],
            closingPrice: candlestick3.ohlcv[3],
            lowestPrice: candlestick3.ohlcv[2],
            highestPrice: candlestick3.ohlcv[1],
          },
        ]);

        expect(ddbClientMock.send).toHaveBeenCalledTimes(3);
        let sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          KeyConditionExpression: '#pk = :pk and #sk between :startDate and :endDate',
          ExpressionAttributeNames: {
            '#pk': 'pk',
            '#sk': 'sk',
          },
          ExpressionAttributeValues: {
            ':pk': 'Candlestick::Binance::ABC::2021-09-11',
            ':startDate': startDate.valueOf().toString(),
            ':endDate': endDate.valueOf().toString(),
          },
        });
        sendParams = ddbClientMock.send.mock.calls[1];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          KeyConditionExpression: '#pk = :pk and #sk between :startDate and :endDate',
          ExpressionAttributeNames: {
            '#pk': 'pk',
            '#sk': 'sk',
          },
          ExpressionAttributeValues: {
            ':pk': 'Candlestick::Binance::ABC::2021-09-12',
            ':startDate': startDate.valueOf().toString(),
            ':endDate': endDate.valueOf().toString(),
          },
        });
        sendParams = ddbClientMock.send.mock.calls[2];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          KeyConditionExpression: '#pk = :pk and #sk between :startDate and :endDate',
          ExpressionAttributeNames: {
            '#pk': 'pk',
            '#sk': 'sk',
          },
          ExpressionAttributeValues: {
            ':pk': 'Candlestick::Binance::ABC::2021-09-13',
            ':startDate': startDate.valueOf().toString(),
            ':endDate': endDate.valueOf().toString(),
          },
        });
      });
    });
  });
});
