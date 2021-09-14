import { BatchWriteCommand, BatchWriteCommandInput, DynamoDBDocumentClient, QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { CandlestickRepository } from '../../domain/candlestick/candlestick-repository';
import { Candlestick } from '../../domain/candlestick/model/candlestick';
import { chunk } from 'lodash';

export class DdbCandlestickRepository implements CandlestickRepository {
  constructor(private tableName: string, private ddbClient: DynamoDBDocumentClient) {}

  async saveAllBySymbol(symbol: string, candlesticks: Candlestick[]): Promise<void> {
    const items = candlesticks.map((candlestick) => this.#buildItem(symbol, candlestick));

    await Promise.all(
      chunk(items, 25).map((chunk) => {
        const batchWriteInput: BatchWriteCommandInput = {
          RequestItems: {
            [this.tableName]: chunk,
          },
        };

        return this.ddbClient.send(new BatchWriteCommand(batchWriteInput));
      }),
    );
  }

  #buildItem(symbol: string, candlestick: Candlestick): any {
    return {
      PutRequest: {
        Item: {
          pk: `Candlestick::${symbol}::${new Date(candlestick.openingDate).toISOString().substr(0, 10)}`,
          sk: candlestick.openingDate.valueOf().toString(),
          type: 'Candlestick',
          data: this.#convertToItemFormat(candlestick),
        },
      },
    };
  }

  async getAllBySymbol(symbol: string, startDate: number, endDate: number): Promise<Candlestick[]> {
    const candlesticks: Promise<Candlestick[]>[] = [];
    const start = new Date(startDate).setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate).setUTCHours(0, 0, 0, 0);

    let current = start;
    while (current <= end) {
      const queryInput: QueryCommandInput = {
        TableName: this.tableName,
        KeyConditionExpression: '#pk = :pk and #sk between :startDate and :endDate',
        ExpressionAttributeNames: {
          '#pk': 'pk',
          '#sk': 'sk',
        },
        ExpressionAttributeValues: {
          ':pk': `Candlestick::${symbol}::${new Date(current).toISOString().substr(0, 10)}`,
          ':startDate': startDate.toString(),
          ':endDate': endDate.toString(),
        },
      };

      candlesticks.push(
        this.ddbClient.send(new QueryCommand(queryInput)).then((queryOutput) => {
          return queryOutput.Items ? queryOutput.Items.map((item) => this.#convertFromItemFormat(item.data)) : [];
        }),
      );

      current += 60 * 60 * 24 * 1_000;
    }

    return (await Promise.all(candlesticks)).reduce((accumulator, value) => accumulator.concat(value));
  }

  #convertToItemFormat(candlestick: Candlestick): CandlestickEntity {
    return {
      start: candlestick.openingDate.valueOf(),
      end: candlestick.closingDate.valueOf(),
      ohlcv: [candlestick.openingPrice, candlestick.highestPrice, candlestick.lowestPrice, candlestick.closingPrice, 0],
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
    };
  }
}

export interface CandlestickEntity {
  start: number;
  end: number;
  ohlcv: [number, number, number, number, number];
}
