import { expect } from '@jest/globals';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { mocked } from 'ts-jest/utils';
import { Candlestick, Candlesticks } from '@hastobegood/crypto-bot-artillery/candlestick';
import { buildCandlesticksFromTo, buildDefaultCandlestick, buildDefaultCandlesticks } from '@hastobegood/crypto-bot-artillery/test/builders';
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
    let candlesticks: Candlesticks;

    beforeEach(() => {
      ddbClientMock.send = jest.fn().mockResolvedValue({});
    });

    describe('When interval is 1m', () => {
      beforeEach(() => {
        candlesticks = {
          ...buildDefaultCandlesticks(),
          interval: '1m',
          values: buildCandlesticksFromTo(new Date('2021-09-01T23:00:00.000Z'), new Date('2021-09-01T23:54:00.000Z'), 60),
        };
      });

      it('Then candlesticks are saved by chunk of 25', async () => {
        await candlestickRepository.save(candlesticks);

        expect(ddbClientMock.send).toHaveBeenCalledTimes(4);
        let sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          RequestItems: {
            'my-table': expect.any(Array),
          },
        });
        sendParams = ddbClientMock.send.mock.calls[1];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          RequestItems: {
            'my-table': expect.any(Array),
          },
        });
        sendParams = ddbClientMock.send.mock.calls[2];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          RequestItems: {
            'my-table': expect.any(Array),
          },
        });
        sendParams = ddbClientMock.send.mock.calls[3];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Item: {
            pk: `Candlestick::${candlesticks.exchange}::${candlesticks.symbol}::${candlesticks.interval}::Last`,
            sk: 'Details',
            type: 'Candlestick',
            data: expect.anything(),
          },
          ConditionExpression: 'attribute_not_exists(pk) or #data.#start <= :openingDate',
          ExpressionAttributeNames: {
            '#data': 'data',
            '#start': 'start',
          },
          ExpressionAttributeValues: {
            ':openingDate': new Date('2021-09-01T23:54:00.000Z').valueOf(),
          },
        });
      });
    });

    describe('When interval is 1h', () => {
      beforeEach(() => {
        candlesticks = {
          ...buildDefaultCandlesticks(),
          interval: '1h',
          values: buildCandlesticksFromTo(new Date('2021-09-01T00:00:00.000Z'), new Date('2021-09-01T23:00:00.000Z'), 60 * 60),
        };
      });

      it('Then candlesticks are saved by chunk of 25', async () => {
        await candlestickRepository.save(candlesticks);

        expect(ddbClientMock.send).toHaveBeenCalledTimes(2);
        let sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          RequestItems: {
            'my-table': expect.any(Array),
          },
        });
        sendParams = ddbClientMock.send.mock.calls[1];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Item: {
            pk: `Candlestick::${candlesticks.exchange}::${candlesticks.symbol}::${candlesticks.interval}::Last`,
            sk: 'Details',
            type: 'Candlestick',
            data: expect.anything(),
          },
          ConditionExpression: 'attribute_not_exists(pk) or #data.#start <= :openingDate',
          ExpressionAttributeNames: {
            '#data': 'data',
            '#start': 'start',
          },
          ExpressionAttributeValues: {
            ':openingDate': new Date('2021-09-01T23:00:00.000Z').valueOf(),
          },
        });
      });
    });

    describe('When interval is 1d', () => {
      beforeEach(() => {
        candlesticks = {
          ...buildDefaultCandlesticks(),
          interval: '1d',
          values: buildCandlesticksFromTo(new Date('2021-01-01T00:00:00.000Z'), new Date('2021-01-31T00:00:00.000Z'), 60 * 60 * 24),
        };
      });

      it('Then candlesticks are saved by chunk of 25', async () => {
        await candlestickRepository.save(candlesticks);

        expect(ddbClientMock.send).toHaveBeenCalledTimes(3);
        let sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          RequestItems: {
            'my-table': expect.any(Array),
          },
        });
        sendParams = ddbClientMock.send.mock.calls[1];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          RequestItems: {
            'my-table': expect.any(Array),
          },
        });
        sendParams = ddbClientMock.send.mock.calls[2];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Item: {
            pk: `Candlestick::${candlesticks.exchange}::${candlesticks.symbol}::${candlesticks.interval}::Last`,
            sk: 'Details',
            type: 'Candlestick',
            data: expect.anything(),
          },
          ConditionExpression: 'attribute_not_exists(pk) or #data.#start <= :openingDate',
          ExpressionAttributeNames: {
            '#data': 'data',
            '#start': 'start',
          },
          ExpressionAttributeValues: {
            ':openingDate': new Date('2021-01-31T00:00:00.000Z').valueOf(),
          },
        });
      });
    });
  });

  describe('Given last candlestick to retrieve', () => {
    describe('When candlestick is not found', () => {
      beforeEach(() => {
        ddbClientMock.send.mockImplementation(() => ({
          Item: undefined,
        }));
      });

      it('Then null is returned', async () => {
        const result = await candlestickRepository.getLastBySymbol('Binance', 'ABC', '1d');
        expect(result).toBeNull();

        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Key: {
            pk: 'Candlestick::Binance::ABC::1d::Last',
            sk: 'Details',
          },
        });
      });
    });

    describe('When candlestick is found', () => {
      let candlestick: Candlestick;

      beforeEach(() => {
        candlestick = buildDefaultCandlestick();
        ddbClientMock.send.mockImplementation(() => ({
          Item: {
            data: {
              start: candlestick.openingDate.valueOf(),
              end: candlestick.closingDate.valueOf(),
              ohlcv: [candlestick.openingPrice, candlestick.highestPrice, candlestick.lowestPrice, candlestick.closingPrice, 0],
            },
          },
        }));
      });

      it('Then candlestick is returned', async () => {
        const result = await candlestickRepository.getLastBySymbol('Binance', 'ABC', '1d');
        expect(result).toEqual(candlestick);

        expect(ddbClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = ddbClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          TableName: 'my-table',
          Key: {
            pk: 'Candlestick::Binance::ABC::1d::Last',
            sk: 'Details',
          },
        });
      });
    });
  });

  describe('Given candlesticks to retrieve by dates with interval 1m', () => {
    describe('When candlesticks are not found', () => {
      beforeEach(() => {
        ddbClientMock.send.mockImplementation(() =>
          Promise.resolve({
            Items: undefined,
          }),
        );
      });

      it('Then empty list is returned', async () => {
        const startDate = new Date('2021-07-11T12:30:00.000Z');
        const endDate = new Date('2021-09-13T12:30:00.000Z');
        const result = await candlestickRepository.getAllBySymbol('Binance', 'ABC', '1m', startDate.valueOf(), endDate.valueOf());
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
            ':pk': 'Candlestick::Binance::ABC::1m::2021-09',
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
            ':pk': 'Candlestick::Binance::ABC::1m::2021-08',
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
            ':pk': 'Candlestick::Binance::ABC::1m::2021-07',
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
        const startDate = new Date('2021-07-11T12:30:00.000Z');
        const endDate = new Date('2021-09-13T12:30:00.000Z');
        const result = await candlestickRepository.getAllBySymbol('Binance', 'ABC', '1m', startDate.valueOf(), endDate.valueOf());
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
            ':pk': 'Candlestick::Binance::ABC::1m::2021-09',
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
            ':pk': 'Candlestick::Binance::ABC::1m::2021-08',
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
            ':pk': 'Candlestick::Binance::ABC::1m::2021-07',
            ':startDate': startDate.valueOf().toString(),
            ':endDate': endDate.valueOf().toString(),
          },
        });
      });
    });
  });

  describe('Given candlesticks to retrieve by dates with interval 1h', () => {
    describe('When candlesticks are not found', () => {
      beforeEach(() => {
        ddbClientMock.send.mockImplementation(() =>
          Promise.resolve({
            Items: undefined,
          }),
        );
      });

      it('Then empty list is returned', async () => {
        const startDate = new Date('2020-12-31T12:00:00.000Z');
        const endDate = new Date('2021-01-01T11:00:00.000Z');
        const result = await candlestickRepository.getAllBySymbol('Binance', 'ABC', '1h', startDate.valueOf(), endDate.valueOf());
        expect(result.length).toEqual(0);
        expect(result).toEqual([]);

        expect(ddbClientMock.send).toHaveBeenCalledTimes(2);
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
            ':pk': 'Candlestick::Binance::ABC::1h::2021',
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
            ':pk': 'Candlestick::Binance::ABC::1h::2020',
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
        const startDate = new Date('2020-12-31T12:00:00.000Z');
        const endDate = new Date('2021-01-01T11:00:00.000Z');
        const result = await candlestickRepository.getAllBySymbol('Binance', 'ABC', '1h', startDate.valueOf(), endDate.valueOf());
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

        expect(ddbClientMock.send).toHaveBeenCalledTimes(2);
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
            ':pk': 'Candlestick::Binance::ABC::1h::2021',
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
            ':pk': 'Candlestick::Binance::ABC::1h::2020',
            ':startDate': startDate.valueOf().toString(),
            ':endDate': endDate.valueOf().toString(),
          },
        });
      });
    });
  });

  describe('Given candlesticks to retrieve by dates with interval 1d', () => {
    describe('When candlesticks are not found', () => {
      beforeEach(() => {
        ddbClientMock.send.mockImplementation(() =>
          Promise.resolve({
            Items: undefined,
          }),
        );
      });

      it('Then empty list is returned', async () => {
        const startDate = new Date('2020-08-31T12:30:00.000Z');
        const endDate = new Date('2021-09-13T12:30:00.000Z');
        const result = await candlestickRepository.getAllBySymbol('Binance', 'ABC', '1d', startDate.valueOf(), endDate.valueOf());
        expect(result.length).toEqual(0);
        expect(result).toEqual([]);

        expect(ddbClientMock.send).toHaveBeenCalledTimes(2);
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
            ':pk': 'Candlestick::Binance::ABC::1d::2021',
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
            ':pk': 'Candlestick::Binance::ABC::1d::2020',
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
        const startDate = new Date('2020-08-31T12:30:00.000Z');
        const endDate = new Date('2021-09-13T12:30:00.000Z');
        const result = await candlestickRepository.getAllBySymbol('Binance', 'ABC', '1d', startDate.valueOf(), endDate.valueOf());
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

        expect(ddbClientMock.send).toHaveBeenCalledTimes(2);
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
            ':pk': 'Candlestick::Binance::ABC::1d::2021',
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
            ':pk': 'Candlestick::Binance::ABC::1d::2020',
            ':startDate': startDate.valueOf().toString(),
            ':endDate': endDate.valueOf().toString(),
          },
        });
      });
    });
  });
});
