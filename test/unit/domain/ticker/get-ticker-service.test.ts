import { mocked } from 'ts-jest/utils';
import { TickerRepository } from '../../../../src/code/domain/ticker/ticker-repository';
import { GetTickerService } from '../../../../src/code/domain/ticker/get-ticker-service';
import { Ticker } from '../../../../src/code/domain/ticker/model/ticker';
import { buildDefaultTicker } from '../../../builders/domain/ticker/ticker-test-builder';

const tickerRepositoryMock = mocked(jest.genMockFromModule<TickerRepository>('../../../../src/code/domain/ticker/ticker-repository'), true);

let getTickerService: GetTickerService;
beforeEach(() => {
  tickerRepositoryMock.getBySymbol = jest.fn();

  getTickerService = new GetTickerService(tickerRepositoryMock);
});

describe('GetTickerService', () => {
  describe('Given a ticker to retrieve by its symbol', () => {
    describe('When ticker is found', () => {
      let ticker: Ticker;

      beforeEach(() => {
        ticker = buildDefaultTicker();
        tickerRepositoryMock.getBySymbol.mockResolvedValue(ticker);
      });

      it('Then ticker is returned', async () => {
        const result = await getTickerService.getBySymbol('ABC');
        expect(result).toEqual(ticker);

        expect(tickerRepositoryMock.getBySymbol).toHaveBeenCalledTimes(1);
        const getBySymbolParams = tickerRepositoryMock.getBySymbol.mock.calls[0];
        expect(getBySymbolParams.length).toEqual(1);
        expect(getBySymbolParams[0]).toEqual('ABC');
      });
    });
  });
});
