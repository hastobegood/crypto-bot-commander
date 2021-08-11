import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { DcaTrading } from '../../domain/dca-trading/model/dca-trading';
import { DcaTradingRepository } from '../../domain/dca-trading/dca-trading-repository';

export class DdbDcaTradingRepository implements DcaTradingRepository {
  constructor(private tableName: string, private ddbClient: DocumentClient) {}

  async save(dcaTrading: DcaTrading): Promise<DcaTrading> {
    const batchWriteItemInput = {
      RequestItems: {
        [this.tableName]: [this.#buildItem(dcaTrading, `Id::${dcaTrading.id}`), this.#buildItem(dcaTrading, 'Last')],
      },
    };

    await this.ddbClient.batchWrite(batchWriteItemInput).promise();

    return dcaTrading;
  }

  #buildItem(dcaTrading: DcaTrading, id: string): DocumentClient.WriteRequest {
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

  #convertToItemFormat(dcaTrading: DcaTrading): any {
    return {
      ...dcaTrading,
      creationDate: dcaTrading.creationDate.toISOString(),
    };
  }
}
