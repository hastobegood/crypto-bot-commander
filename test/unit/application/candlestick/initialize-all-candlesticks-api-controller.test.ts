import { mocked } from 'ts-jest/utils';
import { InitializeCandlestickService } from '../../../../src/code/domain/candlestick/initialize-candlestick-service';
import { InitializeAllCandlesticksApiController } from '../../../../src/code/application/candlestick/initialize-all-candlesticks-api-controller';

const initializeCandlestickServiceMock = mocked(jest.genMockFromModule<InitializeCandlestickService>('../../../../src/code/domain/candlestick/initialize-candlestick-service'), true);

let initializeAllCandlesticksController: InitializeAllCandlesticksApiController;
beforeEach(() => {
  initializeCandlestickServiceMock.initializeAllBySymbol = jest.fn();

  initializeAllCandlesticksController = new InitializeAllCandlesticksApiController(initializeCandlestickServiceMock);
});

describe('InitializeAllCandlesticksApiController', () => {
  describe('Given candlesticks to initialize for an exchange, a symbol, a year and a month', () => {
    describe('When exchange is unknown', () => {
      it('Then error is thrown', async () => {
        try {
          await initializeAllCandlesticksController.process('Unknown', 'ABC', 2021, 8);
          fail();
        } catch (error) {
          expect((error as Error).message).toEqual("Unsupported 'Unknown' exchange");
        }

        expect(initializeCandlestickServiceMock.initializeAllBySymbol).toHaveBeenCalledTimes(0);
      });
    });

    describe('When initialization has failed', () => {
      beforeEach(() => {
        initializeCandlestickServiceMock.initializeAllBySymbol.mockRejectedValue(new Error('Error occurred !'));
      });

      it('Then error is thrown', async () => {
        try {
          await initializeAllCandlesticksController.process('Binance', 'ABC', 2021, 8);
          fail();
        } catch (error) {
          expect((error as Error).message).toEqual('Error occurred !');
        }

        expect(initializeCandlestickServiceMock.initializeAllBySymbol).toHaveBeenCalledTimes(1);
        const initializeAllBySymbolParams = initializeCandlestickServiceMock.initializeAllBySymbol.mock.calls[0];
        expect(initializeAllBySymbolParams.length).toEqual(4);
        expect(initializeAllBySymbolParams[0]).toEqual('Binance');
        expect(initializeAllBySymbolParams[1]).toEqual('ABC');
        expect(initializeAllBySymbolParams[2]).toEqual(2021);
        expect(initializeAllBySymbolParams[3]).toEqual(8);
      });
    });

    describe('When initialization has succeeded', () => {
      beforeEach(() => {
        initializeCandlestickServiceMock.initializeAllBySymbol = jest.fn().mockReturnValue({});
      });

      it('Then nothing is returned', async () => {
        await initializeAllCandlesticksController.process('Binance', 'ABC', 2021, 8);

        expect(initializeCandlestickServiceMock.initializeAllBySymbol).toHaveBeenCalledTimes(1);
        const initializeAllBySymbolParams = initializeCandlestickServiceMock.initializeAllBySymbol.mock.calls[0];
        expect(initializeAllBySymbolParams.length).toEqual(4);
        expect(initializeAllBySymbolParams[0]).toEqual('Binance');
        expect(initializeAllBySymbolParams[1]).toEqual('ABC');
        expect(initializeAllBySymbolParams[2]).toEqual(2021);
        expect(initializeAllBySymbolParams[3]).toEqual(8);
      });
    });
  });
});
