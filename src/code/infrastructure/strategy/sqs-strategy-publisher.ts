import SQS, { SendMessageRequest } from 'aws-sdk/clients/sqs';
import { StrategyPublisher } from '../../domain/strategy/strategy-publisher';

export class SqsStrategyPublisher implements StrategyPublisher {
  constructor(private queueUrl: string, private sqsClient: SQS) {}

  async publishWithStatusActive(id: string): Promise<void> {
    const sendMessageRequest: SendMessageRequest = {
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(this.#buildMessage(id)),
      MessageGroupId: id,
      MessageDeduplicationId: `${id}-${new Date().valueOf()}`,
    };

    await this.sqsClient.sendMessage(sendMessageRequest).promise();
  }

  #buildMessage(id: string): ActiveStrategyMessage {
    return {
      content: {
        id: id,
      },
    };
  }
}

export interface ActiveStrategyMessage {
  content: {
    id: string;
  };
}
