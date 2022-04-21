import { SendMessageCommand, SendMessageCommandInput, SQSClient } from '@aws-sdk/client-sqs';

import { StrategyPublisher } from '../../domain/strategy/strategy-publisher';

export class SqsStrategyPublisher implements StrategyPublisher {
  constructor(private queueUrl: string, private sqsClient: SQSClient) {}

  async publishWithStatusActive(id: string): Promise<void> {
    const sendMessageInput: SendMessageCommandInput = {
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(this.#buildMessage(id)),
      MessageGroupId: id,
      MessageDeduplicationId: `${id}-${new Date().valueOf()}`,
    };

    await this.sqsClient.send(new SendMessageCommand(sendMessageInput));
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
