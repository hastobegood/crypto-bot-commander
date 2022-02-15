import { SendMessageCommand, SendMessageCommandInput, SQSClient } from '@aws-sdk/client-sqs';
import { CandlestickExchange } from '@hastobegood/crypto-bot-artillery/candlestick';
import { CandlestickPublisher } from '../../domain/candlestick/candlestick-publisher';

export class SqsCandlestickPublisher implements CandlestickPublisher {
  constructor(private queueUrl: string, private sqsClient: SQSClient) {}

  async publishTriggeredBySymbol(exchange: CandlestickExchange, symbol: string): Promise<void> {
    const currentSeconds = (new Date().setUTCMilliseconds(0) / 1_000) % 60;
    const delaySeconds = (currentSeconds <= 10 ? 10 : 70) - currentSeconds;

    const sendMessageInput: SendMessageCommandInput = {
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(this.#buildMessage(exchange, symbol)),
      DelaySeconds: delaySeconds,
    };

    await this.sqsClient.send(new SendMessageCommand(sendMessageInput));
  }

  async publishUpdatedBySymbol(exchange: CandlestickExchange, symbol: string): Promise<void> {
    const sendMessageInput: SendMessageCommandInput = {
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(this.#buildMessage(exchange, symbol)),
      MessageGroupId: `${exchange}-${symbol}`,
      MessageDeduplicationId: `${exchange}-${symbol}-${new Date().valueOf()}`,
    };

    await this.sqsClient.send(new SendMessageCommand(sendMessageInput));
  }

  #buildMessage(exchange: CandlestickExchange, symbol: string): TriggeredCandlesticksMessage | UpdatedCandlesticksMessage {
    return {
      content: {
        exchange: exchange,
        symbol: symbol,
      },
    };
  }
}

export interface TriggeredCandlesticksMessage {
  content: {
    exchange: CandlestickExchange;
    symbol: string;
  };
}

export interface UpdatedCandlesticksMessage {
  content: {
    exchange: CandlestickExchange;
    symbol: string;
  };
}
