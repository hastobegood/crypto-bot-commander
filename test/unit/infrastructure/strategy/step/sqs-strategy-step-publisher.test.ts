import { SQSClient } from '@aws-sdk/client-sqs';
import { mocked } from 'ts-jest/utils';

import { StrategyStepPublisher } from '../../../../../src/code/domain/strategy/step/strategy-step-publisher';
import { ProcessedStrategyStepMessage, SqsStrategyStepPublisher } from '../../../../../src/code/infrastructure/strategy/step/sqs-strategy-step-publisher';
import { buildDefaultProcessedStrategyStepMessage } from '../../../../builders/infrastructure/strategy/step/strategy-step-message-builder';

const sqsClientMock = mocked(jest.genMockFromModule<SQSClient>('@aws-sdk/client-sqs'), true);

let strategyStepPublisher: StrategyStepPublisher;
beforeEach(() => {
  sqsClientMock.send = jest.fn();

  strategyStepPublisher = new SqsStrategyStepPublisher('my-queue-url', sqsClientMock);
});

describe('SqsStrategyStepPublisher', () => {
  let processedStrategyStepMessage: ProcessedStrategyStepMessage;

  beforeEach(() => {
    processedStrategyStepMessage = buildDefaultProcessedStrategyStepMessage();
  });

  describe('Given a processed strategy step to publish', () => {
    it('Then processed strategy step is published', async () => {
      await strategyStepPublisher.publishProcessed(processedStrategyStepMessage.content);

      expect(sqsClientMock.send).toHaveBeenCalledTimes(1);
      const sendParams = sqsClientMock.send.mock.calls[0];
      expect(sendParams.length).toEqual(1);
      expect(sendParams[0].input).toEqual({
        QueueUrl: 'my-queue-url',
        MessageBody: JSON.stringify(processedStrategyStepMessage),
        MessageGroupId: processedStrategyStepMessage.content.strategyId,
        MessageDeduplicationId: `${processedStrategyStepMessage.content.strategyId}-${processedStrategyStepMessage.content.executionStartDate.valueOf()}`,
      });
    });
  });
});
