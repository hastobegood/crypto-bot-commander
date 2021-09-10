import SQS, { SendMessageRequest } from 'aws-sdk/clients/sqs';
import { StrategyStepPublisher } from '../../../domain/strategy/step/strategy-step-publisher';
import { StrategyStep } from '../../../domain/strategy/model/strategy-step';

export class SqsStrategyStepPublisher implements StrategyStepPublisher {
  constructor(private queueUrl: string, private sqsClient: SQS) {}

  async publishProcessed(step: StrategyStep): Promise<void> {
    const sendMessageRequest: SendMessageRequest = {
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(this.#buildMessage(step)),
      MessageGroupId: step.strategyId,
      MessageDeduplicationId: `${step.strategyId}-${step.executionStartDate.valueOf()}`,
    };

    await this.sqsClient.sendMessage(sendMessageRequest).promise();
  }

  #buildMessage(step: StrategyStep): ProcessedStrategyStepMessage {
    return {
      content: step,
    };
  }
}

export interface ProcessedStrategyStepMessage {
  content: StrategyStep;
}
