import SQS from 'aws-sdk/clients/sqs';
import { SqsStrategyPublisher, StrategyMessage } from '../../../../src/code/infrastructure/strategy/sqs-strategy-publisher';
import { StrategyPublisher } from '../../../../src/code/domain/strategy/strategy-publisher';
import { mocked } from 'ts-jest/utils';
import { buildDefaultStrategyMessage } from '../../../builders/infrastructure/strategy/strategy-message-builder';
import MockDate from 'mockdate';

const sqsClientMock = mocked(jest.genMockFromModule<SQS>('aws-sdk/clients/sqs'), true);

let strategyPublisher: StrategyPublisher;
beforeEach(() => {
  sqsClientMock.sendMessage = jest.fn();

  strategyPublisher = new SqsStrategyPublisher('my-queue-url', sqsClientMock);
});

describe('SqsStrategyPublisher', () => {
  let date: Date;
  let strategyMessage: StrategyMessage;

  beforeEach(() => {
    date = new Date();
    MockDate.set(date);

    strategyMessage = buildDefaultStrategyMessage();
  });

  describe('Given an active strategy ID to publish', () => {
    beforeEach(() => {
      sqsClientMock.sendMessage = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue(null),
      });
    });

    it('Then active strategy ID is published', async () => {
      await strategyPublisher.publishWithStatusActive(strategyMessage.id);

      expect(sqsClientMock.sendMessage).toHaveBeenCalledTimes(1);
      const sendMessageParams = sqsClientMock.sendMessage.mock.calls[0];
      expect(sendMessageParams.length).toEqual(1);
      expect(sendMessageParams[0]).toEqual({
        QueueUrl: 'my-queue-url',
        MessageBody: JSON.stringify(strategyMessage),
        MessageGroupId: strategyMessage.id,
        MessageDeduplicationId: `${strategyMessage.id}-${date.valueOf()}`,
      });
    });
  });
});
