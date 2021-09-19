import { SQSClient } from '@aws-sdk/client-sqs';
import { mocked } from 'ts-jest/utils';
import MockDate from 'mockdate';
import { SqsCandlestickPublisher, UpdatedCandlesticksMessage } from '../../../../src/code/infrastructure/candlestick/sqs-candlestick-publisher';
import { buildDefaultUpdatedCandlesticksMessage } from '../../../builders/infrastructure/candlestick/candlestick-message-builder';
import { CandlestickPublisher } from '../../../../src/code/domain/candlestick/candlestick-publisher';

const sqsClientMock = mocked(jest.genMockFromModule<SQSClient>('@aws-sdk/client-sqs'), true);

let candlestickPublisher: CandlestickPublisher;
beforeEach(() => {
  sqsClientMock.send = jest.fn();

  candlestickPublisher = new SqsCandlestickPublisher('my-queue-url', sqsClientMock);
});

describe('SqsCandlestickPublisher', () => {
  let date: Date;
  let updatedCandlesticksMessage: UpdatedCandlesticksMessage;

  beforeEach(() => {
    date = new Date();
    MockDate.set(date);

    updatedCandlesticksMessage = buildDefaultUpdatedCandlesticksMessage();
  });

  describe('Given updated candlesticks by symbol to publish', () => {
    it('Then updated candlesticks symbol is published', async () => {
      await candlestickPublisher.publishUpdatedBySymbol(updatedCandlesticksMessage.content.symbol);

      expect(sqsClientMock.send).toHaveBeenCalledTimes(1);
      const sendParams = sqsClientMock.send.mock.calls[0];
      expect(sendParams.length).toEqual(1);
      expect(sendParams[0].input).toEqual({
        QueueUrl: 'my-queue-url',
        MessageBody: JSON.stringify(updatedCandlesticksMessage),
        MessageGroupId: updatedCandlesticksMessage.content.symbol,
        MessageDeduplicationId: `${updatedCandlesticksMessage.content.symbol}-${date.valueOf()}`,
      });
    });
  });
});
