import { BatchWriteCommand, BatchWriteCommandInput, DynamoDBDocumentClient, GetCommand, GetCommandInput } from '@aws-sdk/lib-dynamodb';
import { DcaTrading } from '../../domain/dca-trading/model/dca-trading';
import { DcaTradingRepository } from '../../domain/dca-trading/dca-trading-repository';

export class DdbDcaTradingRepository implements DcaTradingRepository {
  constructor(private tableName: string, private ddbClient: DynamoDBDocumentClient) {}

  async save(dcaTrading: DcaTrading): Promise<DcaTrading> {
    const batchWriteInput: BatchWriteCommandInput = {
      RequestItems: {
        [this.tableName]: [this.#buildItem(dcaTrading, `Id::${dcaTrading.id}`), this.#buildItem(dcaTrading, 'Last')],
      },
    };

    await this.ddbClient.send(new BatchWriteCommand(batchWriteInput));

    return dcaTrading;
  }

  #buildItem(dcaTrading: DcaTrading, id: string): any {
    return {
      PutRequest: {
        Item: {
          pk: `DcaTrading::${id}`,
          sk: 'Details',
          type: 'DcaTrading',
          data: this.#convertToItemFormat(dcaTrading),
        },
      },
    };
  }

  async getLast(): Promise<DcaTrading | null> {
    const getInput: GetCommandInput = {
      TableName: this.tableName,
      Key: {
        pk: 'DcaTrading::Last',
        sk: 'Details',
      },
    };

    const getOutput = await this.ddbClient.send(new GetCommand(getInput));

    return getOutput.Item ? this.#convertFromItemFormat(getOutput.Item.data) : null;
  }

  #convertToItemFormat(dcaTrading: DcaTrading): any {
    return {
      ...dcaTrading,
      creationDate: dcaTrading.creationDate.toISOString(),
    };
  }

  #convertFromItemFormat(dcaTrading: any): DcaTrading {
    return {
      ...dcaTrading,
      creationDate: new Date(dcaTrading.creationDate),
    };
  }
}
