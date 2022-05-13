import { SQSClient } from '@aws-sdk/client-sqs';
import MockDate from 'mockdate';

import { CandlestickPublisher } from '../../../../src/code/domain/candlestick/candlestick-publisher';
import { SqsCandlestickPublisher, TriggeredCandlesticksMessage, UpdatedCandlesticksMessage } from '../../../../src/code/infrastructure/candlestick/sqs-candlestick-publisher';
import { buildDefaultTriggeredCandlesticksMessage, buildDefaultUpdatedCandlesticksMessage } from '../../../builders/infrastructure/candlestick/candlestick-message-builder';

const sqsClientMock = jest.mocked(jest.genMockFromModule<SQSClient>('@aws-sdk/client-sqs'), true);

let candlestickPublisher: CandlestickPublisher;
beforeEach(() => {
  sqsClientMock.send = jest.fn();

  candlestickPublisher = new SqsCandlestickPublisher('my-queue-url', sqsClientMock);
});

describe('SqsCandlestickPublisher', () => {
  let date: Date;

  describe('Given triggered candlesticks by symbol to publish', () => {
    let triggeredCandlesticksMessage: TriggeredCandlesticksMessage;

    beforeEach(() => {
      triggeredCandlesticksMessage = buildDefaultTriggeredCandlesticksMessage();
    });

    describe('Where current seconds is lower than 10', () => {
      beforeEach(() => {
        date = new Date('2022-02-26T16:17:07.153Z');
        MockDate.set(date);
      });

      it('Then triggered candlesticks symbol is published with less than 10 seconds delay ', async () => {
        await candlestickPublisher.publishTriggeredBySymbol(triggeredCandlesticksMessage.content.exchange, triggeredCandlesticksMessage.content.symbol);

        expect(sqsClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = sqsClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          QueueUrl: 'my-queue-url',
          MessageBody: JSON.stringify(triggeredCandlesticksMessage),
          DelaySeconds: 3,
        });
      });
    });

    describe('Where current seconds is equal to 10', () => {
      beforeEach(() => {
        date = new Date('2022-02-26T16:17:10.153Z');
        MockDate.set(date);
      });

      it('Then triggered candlesticks symbol is published with 0 seconds delay ', async () => {
        await candlestickPublisher.publishTriggeredBySymbol(triggeredCandlesticksMessage.content.exchange, triggeredCandlesticksMessage.content.symbol);

        expect(sqsClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = sqsClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          QueueUrl: 'my-queue-url',
          MessageBody: JSON.stringify(triggeredCandlesticksMessage),
          DelaySeconds: 0,
        });
      });
    });

    describe('Where current seconds is greater than 10', () => {
      beforeEach(() => {
        date = new Date('2022-02-26T16:17:45.153Z');
        MockDate.set(date);
      });

      it('Then triggered candlesticks symbol is published with more than 10 seconds delay ', async () => {
        await candlestickPublisher.publishTriggeredBySymbol(triggeredCandlesticksMessage.content.exchange, triggeredCandlesticksMessage.content.symbol);

        expect(sqsClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = sqsClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          QueueUrl: 'my-queue-url',
          MessageBody: JSON.stringify(triggeredCandlesticksMessage),
          DelaySeconds: 25,
        });
      });
    });
  });

  describe('Given updated candlesticks by symbol to publish', () => {
    let updatedCandlesticksMessage: UpdatedCandlesticksMessage;

    beforeEach(() => {
      updatedCandlesticksMessage = buildDefaultUpdatedCandlesticksMessage();

      date = new Date();
      MockDate.set(date);
    });

    it('Then updated candlesticks symbol is published', async () => {
      await candlestickPublisher.publishUpdatedBySymbol(updatedCandlesticksMessage.content.exchange, updatedCandlesticksMessage.content.symbol);

      expect(sqsClientMock.send).toHaveBeenCalledTimes(1);
      const sendParams = sqsClientMock.send.mock.calls[0];
      expect(sendParams.length).toEqual(1);
      expect(sendParams[0].input).toEqual({
        QueueUrl: 'my-queue-url',
        MessageBody: JSON.stringify(updatedCandlesticksMessage),
        MessageGroupId: `${updatedCandlesticksMessage.content.exchange}-${updatedCandlesticksMessage.content.symbol}`,
        MessageDeduplicationId: `${updatedCandlesticksMessage.content.exchange}-${updatedCandlesticksMessage.content.symbol}-${date.valueOf()}`,
      });
    });
  });
});
