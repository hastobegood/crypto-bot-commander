import { BatchWriteCommand, BatchWriteCommandInput, DynamoDBDocumentClient, GetCommand, GetCommandInput, PutCommand, PutCommandInput, QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { Candlestick, CandlestickExchange, CandlestickInterval, Candlesticks } from '@hastobegood/crypto-bot-artillery/candlestick';
import { chunk } from 'lodash-es';

import { CandlestickRepository } from '../../domain/candlestick/candlestick-repository';

export class DdbCandlestickRepository implements CandlestickRepository {
  constructor(private tableName: string, private ddbClient: DynamoDBDocumentClient) {}

  async save(candlesticks: Candlesticks): Promise<void> {
    await Promise.all([this.#saveAll(candlesticks), this.#saveLast(candlesticks)]);
  }

  async #saveAll(candlesticks: Candlesticks): Promise<void> {
    await Promise.all(
      chunk(candlesticks.values, 25).map(async (chunk) => {
        const batchWriteInput: BatchWriteCommandInput = {
          RequestItems: {
            [this.tableName]: chunk.map((candlestick) => ({
              PutRequest: {
                Item: {
                  pk: `Candlestick::${candlesticks.exchange}::${candlesticks.symbol}::${candlesticks.interval}::${this.#formatPkDate(candlesticks.interval, new Date(candlestick.openingDate))}`,
                  sk: candlestick.openingDate.valueOf().toString(),
                  type: 'Candlestick',
                  data: this.#convertToItemFormat(candlestick),
                },
              },
            })),
          },
        };

        while (batchWriteInput.RequestItems && batchWriteInput.RequestItems[this.tableName].length) {
          const batchWriteOutput = await this.ddbClient.send(new BatchWriteCommand(batchWriteInput));
          if (batchWriteOutput.UnprocessedItems && Object.keys(batchWriteOutput.UnprocessedItems).length) {
            batchWriteInput.RequestItems = batchWriteOutput.UnprocessedItems;
          } else {
            batchWriteInput.RequestItems[this.tableName].length = 0;
          }
        }
      }),
    );
  }

  async #saveLast(candlesticks: Candlesticks): Promise<void> {
    const lastCandlestick = candlesticks.values.reduce((previous, current) => (current.openingDate > previous.openingDate ? current : previous));

    const putInput: PutCommandInput = {
      TableName: this.tableName,
      Item: {
        pk: `Candlestick::${candlesticks.exchange}::${candlesticks.symbol}::${candlesticks.interval}::Last`,
        sk: 'Details',
        type: 'Candlestick',
        data: this.#convertToItemFormat(lastCandlestick),
      },
      ConditionExpression: 'attribute_not_exists(pk) or #data.#start <= :openingDate',
      ExpressionAttributeNames: {
        '#data': 'data',
        '#start': 'start',
      },
      ExpressionAttributeValues: {
        ':openingDate': lastCandlestick.openingDate,
      },
    };

    await this.ddbClient.send(new PutCommand(putInput)).catch((error) => {
      if (error.name !== 'ConditionalCheckFailedException') {
        throw error;
      }
    });
  }

  async getLastBySymbol(exchange: CandlestickExchange, symbol: string, interval: CandlestickInterval): Promise<Candlestick | null> {
    const getInput: GetCommandInput = {
      TableName: this.tableName,
      Key: {
        pk: `Candlestick::${exchange}::${symbol}::${interval}::Last`,
        sk: 'Details',
      },
    };

    const getOutput = await this.ddbClient.send(new GetCommand(getInput));

    return getOutput.Item ? this.#convertFromItemFormat(getOutput.Item.data) : null;
  }

  async getAllBySymbol(exchange: CandlestickExchange, symbol: string, interval: CandlestickInterval, startDate: number, endDate: number): Promise<Candlestick[]> {
    const candlesticks: Promise<Candlestick[]>[] = [];
    const intervalDates = this.#extractIntervalDates(interval, startDate, endDate);

    while (intervalDates.currentDate >= intervalDates.limitDate) {
      const queryInput: QueryCommandInput = {
        TableName: this.tableName,
        KeyConditionExpression: '#pk = :pk and #sk between :startDate and :endDate',
        ExpressionAttributeNames: {
          '#pk': 'pk',
          '#sk': 'sk',
        },
        ExpressionAttributeValues: {
          ':pk': `Candlestick::${exchange}::${symbol}::${interval}::${this.#formatPkDate(interval, intervalDates.currentDate)}`,
          ':startDate': startDate.toString(),
          ':endDate': endDate.toString(),
        },
      };

      candlesticks.push(
        this.ddbClient.send(new QueryCommand(queryInput)).then((queryOutput) => {
          return queryOutput.Items ? queryOutput.Items.map((item) => this.#convertFromItemFormat(item.data)) : [];
        }),
      );

      intervalDates.decrement();
    }

    return (await Promise.all(candlesticks)).reduce((accumulator, value) => accumulator.concat(value), []);
  }

  #formatPkDate(interval: CandlestickInterval, date: Date): string {
    switch (interval) {
      case '1m':
      case '5m':
      case '15m':
      case '30m':
        return date.toISOString().substr(0, 7);
      case '1h':
      case '6h':
      case '12h':
      case '1d':
        return date.toISOString().substr(0, 4);
    }
  }

  #extractIntervalDates(interval: CandlestickInterval, startDate: number, endDate: number): IntervalDates {
    const intervalDates = {
      limitDate: new Date(startDate),
      currentDate: new Date(endDate),
    };

    intervalDates.limitDate.setUTCHours(0, 0, 0, 0);
    intervalDates.currentDate.setUTCHours(0, 0, 0, 0);

    switch (interval) {
      case '1m':
      case '5m':
      case '15m':
      case '30m':
        intervalDates.limitDate.setUTCDate(1);
        intervalDates.currentDate.setUTCDate(1);
        return { ...intervalDates, decrement: this.#decrementMinuteInterval(intervalDates.currentDate) };
      case '1h':
      case '6h':
      case '12h':
      case '1d':
        intervalDates.limitDate.setUTCFullYear(intervalDates.limitDate.getUTCFullYear(), 0, 1);
        intervalDates.currentDate.setUTCFullYear(intervalDates.currentDate.getUTCFullYear(), 0, 1);
        return { ...intervalDates, decrement: this.#decrementDayInterval(intervalDates.currentDate) };
    }
  }

  #decrementMinuteInterval(currentDate: Date): () => void {
    return (): void => {
      currentDate.setUTCMonth(currentDate.getUTCMonth() - 1);
    };
  }

  #decrementDayInterval(currentDate: Date): () => void {
    return (): void => {
      currentDate.setUTCFullYear(currentDate.getUTCFullYear() - 1, 0, 1);
    };
  }

  #convertToItemFormat(candlestick: Candlestick): CandlestickEntity {
    return {
      start: candlestick.openingDate.valueOf(),
      end: candlestick.closingDate.valueOf(),
      ohlcv: [candlestick.openingPrice, candlestick.highestPrice, candlestick.lowestPrice, candlestick.closingPrice, candlestick.volume],
    };
  }

  #convertFromItemFormat(candlestick: CandlestickEntity): Candlestick {
    return {
      openingDate: candlestick.start,
      closingDate: candlestick.end,
      openingPrice: candlestick.ohlcv[0],
      closingPrice: candlestick.ohlcv[3],
      lowestPrice: candlestick.ohlcv[2],
      highestPrice: candlestick.ohlcv[1],
      volume: candlestick.ohlcv[4],
    };
  }
}

export interface CandlestickEntity {
  start: number;
  end: number;
  ohlcv: [number, number, number, number, number];
}

interface IntervalDates {
  limitDate: Date;
  currentDate: Date;
  decrement: () => void;
}
