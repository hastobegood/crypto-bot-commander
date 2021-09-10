import { SendMessageCommand, SendMessageCommandInput, SQSClient } from '@aws-sdk/client-sqs';
import { StrategyStepPublisher } from '../../../domain/strategy/step/strategy-step-publisher';
import { StrategyStep } from '../../../domain/strategy/model/strategy-step';

export class SqsStrategyStepPublisher implements StrategyStepPublisher {
  constructor(private queueUrl: string, private sqsClient: SQSClient) {}

  async publishProcessed(step: StrategyStep): Promise<void> {
    const sendMessageInput: SendMessageCommandInput = {
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(this.#buildMessage(step)),
      MessageGroupId: step.strategyId,
      MessageDeduplicationId: `${step.strategyId}-${step.executionStartDate.valueOf()}`,
    };

    await this.sqsClient.send(new SendMessageCommand(sendMessageInput));
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
