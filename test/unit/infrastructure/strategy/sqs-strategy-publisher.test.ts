import { SQSClient } from '@aws-sdk/client-sqs';
import MockDate from 'mockdate';
import { mocked } from 'ts-jest/utils';

import { StrategyPublisher } from '../../../../src/code/domain/strategy/strategy-publisher';
import { ActiveStrategyMessage, SqsStrategyPublisher } from '../../../../src/code/infrastructure/strategy/sqs-strategy-publisher';
import { buildDefaultActiveStrategyMessage } from '../../../builders/infrastructure/strategy/strategy-message-builder';

const sqsClientMock = mocked(jest.genMockFromModule<SQSClient>('@aws-sdk/client-sqs'), true);

let strategyPublisher: StrategyPublisher;
beforeEach(() => {
  sqsClientMock.send = jest.fn();

  strategyPublisher = new SqsStrategyPublisher('my-queue-url', sqsClientMock);
});

describe('SqsStrategyPublisher', () => {
  let date: Date;
  let activeStrategyMessage: ActiveStrategyMessage;

  beforeEach(() => {
    date = new Date();
    MockDate.set(date);

    activeStrategyMessage = buildDefaultActiveStrategyMessage();
  });

  describe('Given an active strategy ID to publish', () => {
    it('Then active strategy ID is published', async () => {
      await strategyPublisher.publishWithStatusActive(activeStrategyMessage.content.id);

      expect(sqsClientMock.send).toHaveBeenCalledTimes(1);
      const sendParams = sqsClientMock.send.mock.calls[0];
      expect(sendParams.length).toEqual(1);
      expect(sendParams[0].input).toEqual({
        QueueUrl: 'my-queue-url',
        MessageBody: JSON.stringify(activeStrategyMessage),
        MessageGroupId: activeStrategyMessage.content.id,
        MessageDeduplicationId: `${activeStrategyMessage.content.id}-${date.valueOf()}`,
      });
    });
  });
});
