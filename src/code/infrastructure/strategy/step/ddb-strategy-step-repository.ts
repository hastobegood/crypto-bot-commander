import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import { StrategyStepRepository } from '../../../domain/strategy/step/strategy-step-repository';
import { SendOrderSide, SendOrderStepInput, StrategyStep, StrategyStepType } from '../../../domain/strategy/model/strategy-step';

export class DdbStrategyStepRepository implements StrategyStepRepository {
  constructor(private tableName: string, private ddbClient: DocumentClient) {}

  async save(step: StrategyStep): Promise<StrategyStep> {
    const batchWriteItemInput = {
      RequestItems: {
        [this.tableName]: [this.#buildItem(step, `${step.id}-${step.creationDate.valueOf()}`), this.#buildItem(step, 'Last'), this.#buildItem(step, `Last::${step.type}`)],
      },
    };

    if (step.type === 'SendOrder') {
      batchWriteItemInput.RequestItems[this.tableName].push(this.#buildItem(step, `Last::SendOrder::${(step.input as SendOrderStepInput).side}`));
    }

    await this.ddbClient.batchWrite(batchWriteItemInput).promise();

    return step;
  }

  #buildItem(step: StrategyStep, id: string): DocumentClient.WriteRequest {
    return {
      PutRequest: {
        Item: {
          pk: `Strategy::${step.strategyId}::Step::${id}`,
          sk: 'Details',
          type: 'StrategyStep',
          data: this.#convertToItemFormat(step),
        },
      },
    };
  }

  async getLastByStrategyId(strategyId: string): Promise<StrategyStep | null> {
    const getItemInput = {
      TableName: this.tableName,
      Key: {
        pk: `Strategy::${strategyId}::Step::Last`,
        sk: 'Details',
      },
    };

    const getItemOutput = await this.ddbClient.get(getItemInput).promise();

    return getItemOutput.Item ? this.#convertFromItemFormat(getItemOutput.Item.data) : null;
  }

  async getLastByStrategyIdAndType(strategyId: string, type: StrategyStepType): Promise<StrategyStep | null> {
    const getItemInput = {
      TableName: this.tableName,
      Key: {
        pk: `Strategy::${strategyId}::Step::Last::${type}`,
        sk: 'Details',
      },
    };

    const getItemOutput = await this.ddbClient.get(getItemInput).promise();

    return getItemOutput.Item ? this.#convertFromItemFormat(getItemOutput.Item.data) : null;
  }

  async getLastSendOrderByStrategyIdAndOrderSide(strategyId: string, orderSide: SendOrderSide): Promise<StrategyStep | null> {
    const getItemInput = {
      TableName: this.tableName,
      Key: {
        pk: `Strategy::${strategyId}::Step::Last::SendOrder::${orderSide}`,
        sk: 'Details',
      },
    };

    const getItemOutput = await this.ddbClient.get(getItemInput).promise();

    return getItemOutput.Item ? this.#convertFromItemFormat(getItemOutput.Item.data) : null;
  }

  #convertToItemFormat(step: StrategyStep): any {
    return {
      ...step,
      creationDate: step.creationDate.toISOString(),
      lastExecutionDate: step.lastExecutionDate.toISOString(),
    };
  }

  #convertFromItemFormat(step: any): StrategyStep {
    return {
      ...step,
      creationDate: new Date(step.creationDate),
      lastExecutionDate: new Date(step.lastExecutionDate),
    };
  }
}
