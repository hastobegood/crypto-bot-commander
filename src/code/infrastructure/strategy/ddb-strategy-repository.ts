import { DynamoDBDocumentClient, GetCommand, GetCommandInput, QueryCommand, QueryCommandInput, UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import { StrategyRepository } from '../../domain/strategy/strategy-repository';
import { Strategy, StrategyStatus } from '../../domain/strategy/model/strategy';

export class DdbStrategyRepository implements StrategyRepository {
  constructor(private tableName: string, private ddbClient: DynamoDBDocumentClient) {}

  async getById(id: string): Promise<Strategy | null> {
    const getInput: GetCommandInput = {
      TableName: this.tableName,
      Key: {
        pk: `Strategy::${id}`,
        sk: 'Details',
      },
    };

    const getOutput = await this.ddbClient.send(new GetCommand(getInput));

    return getOutput.Item ? this.#convertFromItemFormat(getOutput.Item.data) : null;
  }

  async getAllIdsWithStatusActive(): Promise<string[]> {
    const queryInput: QueryCommandInput = {
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
      const queryOutput = await this.ddbClient.send(new QueryCommand(queryInput));
      if (queryOutput.Items) {
        results.push(...queryOutput.Items?.map((item) => item.activeStrategiesSk));
      }
      queryInput.ExclusiveStartKey = queryOutput.LastEvaluatedKey;
    } while (queryInput.ExclusiveStartKey);

    return results;
  }

  async updateStatusById(id: string, status: StrategyStatus): Promise<Strategy> {
    const updateInput: UpdateCommandInput = {
      TableName: this.tableName,
      Key: {
        pk: `Strategy::${id}`,
        sk: 'Details',
      },
      UpdateExpression: 'SET #data.#status = :status',
      ExpressionAttributeNames: {
        '#data': 'data',
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': status,
      },
      ReturnValues: 'ALL_NEW',
    };

    if (status === 'Active') {
      updateInput.UpdateExpression = `${updateInput.UpdateExpression}, #gsiPk = :gsiPk, #gsiSk = :gsiSk`;
      updateInput.ExpressionAttributeNames!['#gsiPk'] = 'activeStrategiesPk';
      updateInput.ExpressionAttributeNames!['#gsiSk'] = 'activeStrategiesSk';
      updateInput.ExpressionAttributeValues![':gsiPk'] = 'Strategy::Active';
      updateInput.ExpressionAttributeValues![':gsiSk'] = id;
    } else {
      updateInput.UpdateExpression = `${updateInput.UpdateExpression} REMOVE #gsiPk, #gsiSk`;
      updateInput.ExpressionAttributeNames!['#gsiPk'] = 'activeStrategiesPk';
      updateInput.ExpressionAttributeNames!['#gsiSk'] = 'activeStrategiesSk';
    }

    try {
      const updateOutput = await this.ddbClient.send(new UpdateCommand(updateInput));
      return this.#convertFromItemFormat(updateOutput.Attributes!.data);
    } catch (error) {
      throw new Error(`Unable to update strategy '${id}' status '${status}': ${(error as Error).message}`);
    }
  }

  async updateBudgetById(id: string, consumedBaseAssetQuantity: number, consumedQuoteAssetQuantity: number): Promise<Strategy> {
    const updateInput: UpdateCommandInput = {
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
      const updateOutput = await this.ddbClient.send(new UpdateCommand(updateInput));
      return this.#convertFromItemFormat(updateOutput.Attributes!.data);
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
