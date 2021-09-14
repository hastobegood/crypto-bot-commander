import { mocked } from 'ts-jest/utils';
import { UpdateAllCandlesticksController } from '../../../../src/code/application/candlestick/update-all-candlesticks-controller';
import { UpdateCandlestickService } from '../../../../src/code/domain/candlestick/update-candlestick-service';
import { PublishCandlestickService } from '../../../../src/code/domain/candlestick/publish-candlestick-service';

const updateCandlestickServiceMock = mocked(jest.genMockFromModule<UpdateCandlestickService>('../../../../src/code/domain/candlestick/update-candlestick-service'), true);
const publishCandlestickServiceMock = mocked(jest.genMockFromModule<PublishCandlestickService>('../../../../src/code/domain/candlestick/publish-candlestick-service'), true);

let updateAllCandlesticksController: UpdateAllCandlesticksController;
beforeEach(() => {
  updateCandlestickServiceMock.updateAllBySymbol = jest.fn();
  publishCandlestickServiceMock.publishUpdatedBySymbol = jest.fn();

  updateAllCandlesticksController = new UpdateAllCandlesticksController(updateCandlestickServiceMock, publishCandlestickServiceMock);
});

describe('UpdateAllCandlesticksController', () => {
  describe('Given candlesticks to update for a symbol', () => {
    describe('When update has failed', () => {
      beforeEach(() => {
        updateCandlestickServiceMock.updateAllBySymbol.mockRejectedValue(new Error('Error occurred !'));
      });

      it('Then error is thrown', async () => {
        try {
          await updateAllCandlesticksController.process('ABC');
          fail();
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual('Error occurred !');
        }

        expect(updateCandlestickServiceMock.updateAllBySymbol).toHaveBeenCalledTimes(1);
        const updateAllBySymbolParams = updateCandlestickServiceMock.updateAllBySymbol.mock.calls[0];
        expect(updateAllBySymbolParams.length).toEqual(1);
        expect(updateAllBySymbolParams[0]).toEqual('ABC');

        expect(publishCandlestickServiceMock.publishUpdatedBySymbol).toHaveBeenCalledTimes(0);
      });
    });

    describe('When update has succeeded', () => {
      beforeEach(() => {
        updateCandlestickServiceMock.updateAllBySymbol = jest.fn().mockReturnValue({});
      });

      it('Then nothing is returned', async () => {
        await updateAllCandlesticksController.process('ABC');

        expect(updateCandlestickServiceMock.updateAllBySymbol).toHaveBeenCalledTimes(1);
        const updateAllBySymbolParams = updateCandlestickServiceMock.updateAllBySymbol.mock.calls[0];
        expect(updateAllBySymbolParams.length).toEqual(1);
        expect(updateAllBySymbolParams[0]).toEqual('ABC');

        expect(publishCandlestickServiceMock.publishUpdatedBySymbol).toHaveBeenCalledTimes(1);
        const publishUpdatedBySymbolParams = publishCandlestickServiceMock.publishUpdatedBySymbol.mock.calls[0];
        expect(publishUpdatedBySymbolParams.length).toEqual(1);
        expect(publishUpdatedBySymbolParams[0]).toEqual('ABC');
      });
    });
  });
});
