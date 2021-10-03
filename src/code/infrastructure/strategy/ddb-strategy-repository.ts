import { DynamoDBDocumentClient, GetCommand, GetCommandInput, QueryCommand, QueryCommandInput, UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import { StrategyRepository } from '../../domain/strategy/strategy-repository';
import { Strategy, StrategyStatus, StrategyWallet } from '../../domain/strategy/model/strategy';

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

  async getAllIdsBySymbolAndActiveStatus(symbol: string): Promise<string[]> {
    const queryInput: QueryCommandInput = {
      TableName: this.tableName,
      IndexName: 'SymbolStatus-Index',
      KeyConditionExpression: '#gsiPk = :gsiPk',
      ExpressionAttributeNames: {
        '#gsiPk': 'symbolStatusPk',
      },
      ExpressionAttributeValues: {
        ':gsiPk': `Strategy::${symbol}::Active`,
      },
    };

    const results = [];

    do {
      const queryOutput = await this.ddbClient.send(new QueryCommand(queryInput));
      if (queryOutput.Items) {
        results.push(...queryOutput.Items?.map((item) => item.symbolStatusSk));
      }
      queryInput.ExclusiveStartKey = queryOutput.LastEvaluatedKey;
    } while (queryInput.ExclusiveStartKey);

    return results;
  }

  async updateStatusById(id: string, status: StrategyStatus): Promise<Strategy> {
    const symbol = await this.#getSymbolById(id);
    if (!symbol) {
      throw new Error(`Unable to find strategy with ID '${id}'`);
    }

    const updateInput: UpdateCommandInput = {
      TableName: this.tableName,
      Key: {
        pk: `Strategy::${id}`,
        sk: 'Details',
      },
      UpdateExpression: 'SET #data.#status = :status, #gsiPk = :gsiPk, #gsiSk = :gsiSk',
      ExpressionAttributeNames: {
        '#data': 'data',
        '#status': 'status',
        '#gsiPk': 'symbolStatusPk',
        '#gsiSk': 'symbolStatusSk',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':gsiPk': `Strategy::${symbol}::${status}`,
        ':gsiSk': id,
      },
      ReturnValues: 'ALL_NEW',
    };

    try {
      const updateOutput = await this.ddbClient.send(new UpdateCommand(updateInput));
      return this.#convertFromItemFormat(updateOutput.Attributes!.data);
    } catch (error) {
      throw new Error(`Unable to update strategy '${id}' status '${status}': ${(error as Error).message}`);
    }
  }

  async #getSymbolById(id: string): Promise<string> {
    const getInput: GetCommandInput = {
      TableName: this.tableName,
      Key: {
        pk: `Strategy::${id}`,
        sk: 'Details',
      },
      ProjectionExpression: '#data.symbol',
      ExpressionAttributeNames: {
        '#data': 'data',
      },
    };

    const getOutput = await this.ddbClient.send(new GetCommand(getInput));

    return getOutput.Item ? getOutput.Item.data.symbol : null;
  }

  async getWalletById(id: string): Promise<StrategyWallet | null> {
    const getInput: GetCommandInput = {
      TableName: this.tableName,
      Key: {
        pk: `Strategy::${id}::Wallet`,
        sk: 'Details',
      },
    };

    const getOutput = await this.ddbClient.send(new GetCommand(getInput));

    return getOutput.Item ? getOutput.Item.data : null;
  }

  async updateWalletById(id: string, consumedBaseAssetQuantity: number, consumedQuoteAssetQuantity: number): Promise<Strategy> {
    const updateInput: UpdateCommandInput = {
      TableName: this.tableName,
      Key: {
        pk: `Strategy::${id}::Wallet`,
        sk: 'Details',
      },
      UpdateExpression:
        'SET #data.availableBaseAssetQuantity = #data.availableBaseAssetQuantity + :baseAssetQuantity, #data.profitAndLossBaseAssetQuantity = #data.profitAndLossBaseAssetQuantity + :baseAssetQuantity, #data.availableQuoteAssetQuantity = #data.availableQuoteAssetQuantity + :quoteAssetQuantity, #data.profitAndLossQuoteAssetQuantity = #data.profitAndLossQuoteAssetQuantity + :quoteAssetQuantity',
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
      throw new Error(`Unable to update strategy '${id}' wallet '${consumedBaseAssetQuantity}/${consumedQuoteAssetQuantity}': ${(error as Error).message}`);
    }
  }

  #convertFromItemFormat(strategy: any): Strategy {
    return {
      ...strategy,
    };
  }
}
