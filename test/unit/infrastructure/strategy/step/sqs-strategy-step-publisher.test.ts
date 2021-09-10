import SQS from 'aws-sdk/clients/sqs';
import { mocked } from 'ts-jest/utils';
import { StrategyStepPublisher } from '../../../../../src/code/domain/strategy/step/strategy-step-publisher';
import { ProcessedStrategyStepMessage, SqsStrategyStepPublisher } from '../../../../../src/code/infrastructure/strategy/step/sqs-strategy-step-publisher';
import { buildDefaultProcessedStrategyStepMessage } from '../../../../builders/infrastructure/strategy/step/strategy-step-message-builder';

const sqsClientMock = mocked(jest.genMockFromModule<SQS>('aws-sdk/clients/sqs'), true);

let strategyStepPublisher: StrategyStepPublisher;
beforeEach(() => {
  sqsClientMock.sendMessage = jest.fn();

  strategyStepPublisher = new SqsStrategyStepPublisher('my-queue-url', sqsClientMock);
});

describe('SqsStrategyStepPublisher', () => {
  let processedStrategyStepMessage: ProcessedStrategyStepMessage;

  beforeEach(() => {
    processedStrategyStepMessage = buildDefaultProcessedStrategyStepMessage();
  });

  describe('Given a processed strategy step to publish', () => {
    beforeEach(() => {
      sqsClientMock.sendMessage = jest.fn().mockReturnValue({
        promise: jest.fn().mockResolvedValue(null),
      });
    });

    it('Then processed strategy step is published', async () => {
      await strategyStepPublisher.publishProcessed(processedStrategyStepMessage.content);

      expect(sqsClientMock.sendMessage).toHaveBeenCalledTimes(1);
      const sendMessageParams = sqsClientMock.sendMessage.mock.calls[0];
      expect(sendMessageParams.length).toEqual(1);
      expect(sendMessageParams[0]).toEqual({
        QueueUrl: 'my-queue-url',
        MessageBody: JSON.stringify(processedStrategyStepMessage),
        MessageGroupId: processedStrategyStepMessage.content.strategyId,
        MessageDeduplicationId: `${processedStrategyStepMessage.content.strategyId}-${processedStrategyStepMessage.content.executionStartDate.valueOf()}`,
      });
    });
  });
});
