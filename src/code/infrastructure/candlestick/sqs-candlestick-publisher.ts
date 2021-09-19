import { SendMessageCommand, SendMessageCommandInput, SQSClient } from '@aws-sdk/client-sqs';
import { CandlestickPublisher } from '../../domain/candlestick/candlestick-publisher';

export class SqsCandlestickPublisher implements CandlestickPublisher {
  constructor(private queueUrl: string, private sqsClient: SQSClient) {}

  async publishUpdatedBySymbol(symbol: string): Promise<void> {
    const sendMessageInput: SendMessageCommandInput = {
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(this.#buildMessage(symbol)),
      MessageGroupId: symbol,
      MessageDeduplicationId: `${symbol}-${new Date().valueOf()}`,
    };

    await this.sqsClient.send(new SendMessageCommand(sendMessageInput));
  }

  #buildMessage(symbol: string): UpdatedCandlesticksMessage {
    return {
      content: {
        symbol: symbol,
      },
    };
  }
}

export interface UpdatedCandlesticksMessage {
  content: {
    symbol: string;
  };
}
