import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { BotTradingRepository } from '../../domain/bot-trading/bot-trading-repository';
import { BotTrading } from '../../domain/bot-trading/model/bot-trading';

export class DdbBotTradingRepository implements BotTradingRepository {
  constructor(private tableName: string, private ddbClient: DocumentClient) {}

  async save(botTrading: BotTrading): Promise<BotTrading> {
    const batchWriteItemInput = {
      RequestItems: {
        [this.tableName]: [this.#buildItem(botTrading, `Id::${botTrading.id}`), this.#buildItem(botTrading, 'Last')],
      },
    };

    await this.ddbClient.batchWrite(batchWriteItemInput).promise();

    return botTrading;
  }

  #buildItem(botTrading: BotTrading, id: string): DocumentClient.WriteRequest {
    return {
      PutRequest: {
        Item: {
          pk: `BotTrading::${id}`,
          sk: 'Details',
          type: 'BotTrading',
          data: this.#convertToItemFormat(botTrading),
        },
      },
    };
  }

  async getLast(): Promise<BotTrading | null> {
    const getItemInput = {
      TableName: this.tableName,
      Key: {
        pk: 'BotTrading::Last',
        sk: 'Details',
      },
    };

    const getItemOutput = await this.ddbClient.get(getItemInput).promise();

    return getItemOutput.Item ? this.#convertFromItemFormat(getItemOutput.Item.data) : null;
  }

  #convertToItemFormat(botTrading: BotTrading): any {
    return {
      ...botTrading,
      creationDate: botTrading.creationDate.toISOString(),
    };
  }

  #convertFromItemFormat(botTrading: any): BotTrading {
    return {
      ...botTrading,
      creationDate: new Date(botTrading.creationDate),
    };
  }
}
