import { mocked } from 'ts-jest/utils';
import { DefaultCandlestickService } from '../../../../src/code/domain/candlestick/default-candlestick-service';
import { CandlestickRepository } from '../../../../src/code/domain/candlestick/candlestick-repository';
import { Candlestick } from '../../../../src/code/domain/candlestick/model/candlestick';
import { buildDefaultCandlesticks } from '../../../builders/domain/candlestick/candlestick-test-builder';

const candlestickRepositoryMock = mocked(jest.genMockFromModule<CandlestickRepository>('../../../../src/code/domain/candlestick/candlestick-repository'), true);

let candlestickService: DefaultCandlestickService;
beforeEach(() => {
  candlestickRepositoryMock.getAllBySymbol = jest.fn();
  candlestickService = new DefaultCandlestickService(candlestickRepositoryMock);
});

describe('DefaultCandlestickService', () => {
  describe('Given a symbol candlesticks to retrieve', () => {
    describe('When symbol candlesticks retrieval has succeeded', () => {
      let candlesticks: Candlestick[];

      beforeEach(() => {
        candlesticks = buildDefaultCandlesticks();
        candlestickRepositoryMock.getAllBySymbol.mockResolvedValue(candlesticks);
      });

      it('Then symbol candlesticks are returned', async () => {
        const result = await candlestickService.getAllBySymbol('ABC', 1, '1d');
        expect(result).toBeDefined();
        expect(result).toEqual(candlesticks);

        expect(candlestickRepositoryMock.getAllBySymbol).toHaveBeenCalledTimes(1);
        const getBySymbolParams = candlestickRepositoryMock.getAllBySymbol.mock.calls[0];
        expect(getBySymbolParams).toBeDefined();
        expect(getBySymbolParams[0]).toEqual('ABC');
        expect(getBySymbolParams[1]).toEqual(1);
        expect(getBySymbolParams[2]).toEqual('1d');
      });
    });
  });
});
