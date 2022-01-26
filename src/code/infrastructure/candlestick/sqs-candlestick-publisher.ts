import { SendMessageCommand, SendMessageCommandInput, SQSClient } from '@aws-sdk/client-sqs';
import { CandlestickExchange } from '@hastobegood/crypto-bot-artillery/candlestick';
import { CandlestickPublisher } from '../../domain/candlestick/candlestick-publisher';

export class SqsCandlestickPublisher implements CandlestickPublisher {
  constructor(private queueUrl: string, private sqsClient: SQSClient) {}

  async publishUpdatedBySymbol(exchange: CandlestickExchange, symbol: string): Promise<void> {
    const sendMessageInput: SendMessageCommandInput = {
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(this.#buildMessage(exchange, symbol)),
      MessageGroupId: `${exchange}-${symbol}`,
      MessageDeduplicationId: `${exchange}-${symbol}-${new Date().valueOf()}`,
    };

    await this.sqsClient.send(new SendMessageCommand(sendMessageInput));
  }

  #buildMessage(exchange: CandlestickExchange, symbol: string): UpdatedCandlesticksMessage {
    return {
      content: {
        exchange: exchange,
        symbol: symbol,
      },
    };
  }
}

export interface UpdatedCandlesticksMessage {
  content: {
    exchange: CandlestickExchange;
    symbol: string;
  };
}
