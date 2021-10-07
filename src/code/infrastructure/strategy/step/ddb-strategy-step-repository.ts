import { BatchWriteCommand, BatchWriteCommandInput, DynamoDBDocumentClient, GetCommand, GetCommandInput } from '@aws-sdk/lib-dynamodb';
import { StrategyStepRepository } from '../../../domain/strategy/step/strategy-step-repository';
import { StrategyStep, StrategyStepType } from '../../../domain/strategy/model/strategy-step';

export class DdbStrategyStepRepository implements StrategyStepRepository {
  constructor(private tableName: string, private ddbClient: DynamoDBDocumentClient) {}

  async save(step: StrategyStep): Promise<StrategyStep> {
    const batchWriteInput: BatchWriteCommandInput = {
      RequestItems: {
        [this.tableName]: [
          this.#buildItem(step, `${step.creationDate.valueOf()}::${step.type}::${step.id}`, {
            stepsListPk: `Strategy::${step.strategyId}::Steps`,
            stepsListSk: step.creationDate.valueOf(),
          }),
          this.#buildItem(step, 'Last'),
          this.#buildItem(step, `Last::${step.type}`),
        ],
      },
    };

    await this.ddbClient.send(new BatchWriteCommand(batchWriteInput));

    return step;
  }

  #buildItem(step: StrategyStep, id: string, indexes?: { [key: string]: string | number }): any {
    return {
      PutRequest: {
        Item: {
          pk: `Strategy::${step.strategyId}::Step::${id}`,
          sk: 'Details',
          type: 'StrategyStep',
          data: this.#convertToItemFormat(step),
          ...indexes,
        },
      },
    };
  }

  async getLastByStrategyId(strategyId: string): Promise<StrategyStep | null> {
    const getInput: GetCommandInput = {
      TableName: this.tableName,
      Key: {
        pk: `Strategy::${strategyId}::Step::Last`,
        sk: 'Details',
      },
    };

    const getOutput = await this.ddbClient.send(new GetCommand(getInput));

    return getOutput.Item ? this.#convertFromItemFormat(getOutput.Item.data) : null;
  }

  async getLastByStrategyIdAndType(strategyId: string, type: StrategyStepType): Promise<StrategyStep | null> {
    const getInput: GetCommandInput = {
      TableName: this.tableName,
      Key: {
        pk: `Strategy::${strategyId}::Step::Last::${type}`,
        sk: 'Details',
      },
    };

    const getOutput = await this.ddbClient.send(new GetCommand(getInput));

    return getOutput.Item ? this.#convertFromItemFormat(getOutput.Item.data) : null;
  }

  #convertToItemFormat(step: StrategyStep): any {
    return {
      ...step,
      creationDate: step.creationDate.toISOString(),
      executionStartDate: step.executionStartDate.toISOString(),
      executionEndDate: step.executionEndDate.toISOString(),
    };
  }

  #convertFromItemFormat(step: any): StrategyStep {
    return {
      ...step,
      creationDate: new Date(step.creationDate),
      executionStartDate: new Date(step.executionStartDate),
      executionEndDate: new Date(step.executionEndDate),
    };
  }
}
