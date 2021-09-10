import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { StrategyRepository } from '../../domain/strategy/strategy-repository';
import { Strategy, StrategyStatus } from '../../domain/strategy/model/strategy';
import GetItemInput = DocumentClient.GetItemInput;
import QueryInput = DocumentClient.QueryInput;
import UpdateItemInput = DocumentClient.UpdateItemInput;

export class DdbStrategyRepository implements StrategyRepository {
  constructor(private tableName: string, private ddbClient: DocumentClient) {}

  async getById(id: string): Promise<Strategy | null> {
    const getItemInput: GetItemInput = {
      TableName: this.tableName,
      Key: {
        pk: `Strategy::${id}`,
        sk: 'Details',
      },
    };

    const getItemOutput = await this.ddbClient.get(getItemInput).promise();

    return getItemOutput.Item ? this.#convertFromItemFormat(getItemOutput.Item.data) : null;
  }

  async getAllIdsWithStatusActive(): Promise<string[]> {
    const queryInput: QueryInput = {
      TableName: this.tableName,
      IndexName: 'ActiveStrategies-Index',
      KeyConditionExpression: '#gsiPk = :gsiPk',
      ExpressionAttributeNames: {
        '#gsiPk': 'activeStrategiesPk',
      },
      ExpressionAttributeValues: {
        ':gsiPk': 'Strategy::Active',
      },
    };

    const results = [];

    do {
      const queryOutput = await this.ddbClient.query(queryInput).promise();
      if (queryOutput.Items) {
        results.push(...queryOutput.Items?.map((item) => item.activeStrategiesSk));
      }
      queryInput.ExclusiveStartKey = queryOutput.LastEvaluatedKey;
    } while (queryInput.ExclusiveStartKey);

    return results;
  }

  async updateStatusById(id: string, status: StrategyStatus): Promise<Strategy> {
    const updateItemInput: UpdateItemInput = {
      TableName: this.tableName,
      Key: {
        pk: `Strategy::${id}`,
        sk: 'Details',
      },
      UpdateExpression: 'SET #data.status = :status',
      ExpressionAttributeNames: {
        '#data': 'data',
      },
      ExpressionAttributeValues: {
        ':status': status,
      },
      ReturnValues: 'ALL_NEW',
    };

    if (status === 'Active') {
      updateItemInput.UpdateExpression = `${updateItemInput.UpdateExpression}, #gsiPk = :gsiPk, #gsiSk = :gsiSk`;
      updateItemInput.ExpressionAttributeNames!['#gsiPk'] = 'activeStrategiesPk';
      updateItemInput.ExpressionAttributeNames!['#gsiSk'] = 'activeStrategiesSk';
      updateItemInput.ExpressionAttributeValues![':gsiPk'] = 'Strategy::Active';
      updateItemInput.ExpressionAttributeValues![':gsiSk'] = id;
    } else {
      updateItemInput.UpdateExpression = `${updateItemInput.UpdateExpression} REMOVE #gsiPk, #gsiSk`;
      updateItemInput.ExpressionAttributeNames!['#gsiPk'] = 'activeStrategiesPk';
      updateItemInput.ExpressionAttributeNames!['#gsiSk'] = 'activeStrategiesSk';
    }

    try {
      const updateItemOutput = await this.ddbClient.update(updateItemInput).promise();
      return this.#convertFromItemFormat(updateItemOutput.Attributes!.data);
    } catch (error) {
      throw new Error(`Unable to update strategy '${id}' status '${status}': ${(error as Error).message}`);
    }
  }

  async updateBudgetById(id: string, consumedBaseAssetQuantity: number, consumedQuoteAssetQuantity: number): Promise<Strategy> {
    const updateItemInput: UpdateItemInput = {
      TableName: this.tableName,
      Key: {
        pk: `Strategy::${id}`,
        sk: 'Details',
      },
      UpdateExpression:
        'SET #data.budget.availableBaseAssetQuantity = #data.budget.availableBaseAssetQuantity + :baseAssetQuantity, #data.budget.profitAndLossBaseAssetQuantity = #data.budget.profitAndLossBaseAssetQuantity + :baseAssetQuantity, #data.budget.availableQuoteAssetQuantity = #data.budget.availableQuoteAssetQuantity + :quoteAssetQuantity, #data.budget.profitAndLossQuoteAssetQuantity = #data.budget.profitAndLossQuoteAssetQuantity + :quoteAssetQuantity',
      ExpressionAttributeNames: {
        '#data': 'data',
      },
      ExpressionAttributeValues: {
        ':baseAssetQuantity': consumedBaseAssetQuantity,
        ':quoteAssetQuantity': consumedQuoteAssetQuantity,
      },
      ReturnValues: 'ALL_NEW',
    };

    try {
      const updateItemOutput = await this.ddbClient.update(updateItemInput).promise();
      return this.#convertFromItemFormat(updateItemOutput.Attributes!.data);
    } catch (error) {
      throw new Error(`Unable to update strategy '${id}' budget '${consumedBaseAssetQuantity}/${consumedQuoteAssetQuantity}': ${(error as Error).message}`);
    }
  }

  #convertFromItemFormat(strategy: any): Strategy {
    return {
      ...strategy,
    };
  }
}
