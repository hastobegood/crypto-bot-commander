import SQS from 'aws-sdk/clients/sqs';
import { ActiveStrategyMessage, SqsStrategyPublisher } from '../../../../src/code/infrastructure/strategy/sqs-strategy-publisher';
import { StrategyPublisher } from '../../../../src/code/domain/strategy/strategy-publisher';
import { mocked } from 'ts-jest/utils';
import { buildDefaultActiveStrategyMessage } from '../../../builders/infrastructure/strategy/strategy-message-builder';
import MockDate from 'mockdate';

const sqsClientMock = mocked(jest.genMockFromModule<SQS>('aws-sdk/clients/sqs'), true);

let strategyPublisher: StrategyPublisher;
beforeEach(() => {
  sqsClientMock.sendMessage = jest.fn();

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
    beforeEach(() => {
      sqsClientMock.sendMessage = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue(null),
      });
    });

    it('Then active strategy ID is published', async () => {
      await strategyPublisher.publishWithStatusActive(activeStrategyMessage.content.id);

      expect(sqsClientMock.sendMessage).toHaveBeenCalledTimes(1);
      const sendMessageParams = sqsClientMock.sendMessage.mock.calls[0];
      expect(sendMessageParams.length).toEqual(1);
      expect(sendMessageParams[0]).toEqual({
        QueueUrl: 'my-queue-url',
        MessageBody: JSON.stringify(activeStrategyMessage),
        MessageGroupId: activeStrategyMessage.content.id,
        MessageDeduplicationId: `${activeStrategyMessage.content.id}-${date.valueOf()}`,
      });
    });
  });
});
