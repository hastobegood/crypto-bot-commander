import { mocked } from 'ts-jest/utils';
import { DefaultPriceService } from '../../../../src/code/domain/price/default-price-service';
import { PriceRepository } from '../../../../src/code/domain/price/price-repository';
import { Price } from '../../../../src/code/domain/price/model/price';
import { buildDefaultPrice } from '../../../builders/domain/price/price-test-builder';

const priceRepositoryMock = mocked(jest.genMockFromModule<PriceRepository>('../../../../src/code/domain/price/price-repository'), true);

let priceService: DefaultPriceService;
beforeEach(() => {
  priceRepositoryMock.getBySymbol = jest.fn();
  priceService = new DefaultPriceService(priceRepositoryMock);
});

describe('DefaultPriceService', () => {
  describe('Given a symbol price to retrieve', () => {
    describe('When symbol price retrieval has succeeded', () => {
      let price: Price;

      beforeEach(() => {
        price = buildDefaultPrice();
        priceRepositoryMock.getBySymbol.mockResolvedValue(price);
      });

      it('Then symbol price is returned', async () => {
        const result = await priceService.getBySymbol('ABC');
        expect(result).toBeDefined();
        expect(result).toEqual(price);

        expect(priceRepositoryMock.getBySymbol).toHaveBeenCalledTimes(1);
        const getBySymbolParams = priceRepositoryMock.getBySymbol.mock.calls[0];
        expect(getBySymbolParams).toBeDefined();
        expect(getBySymbolParams[0]).toEqual('ABC');
      });
    });
  });
});
