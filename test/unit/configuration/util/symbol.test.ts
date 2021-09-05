import { convertToBinanceFormat, extractAssets } from '../../../../src/code/configuration/util/symbol';

describe('Symbol', () => {
  describe('Given assets to extract from a symbol', () => {
    describe('When symbol is invalid', () => {
      it('Then error is thrown', async () => {
        try {
          extractAssets('ABCDEF');
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual("Unable to extract assets, symbol 'ABCDEF' is invalid");
        }

        try {
          extractAssets('AB#CD#EF');
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual("Unable to extract assets, symbol 'AB#CD#EF' is invalid");
        }
      });
    });

    describe('When symbol is valid', () => {
      it('Then base and quote assets are returned', async () => {
        const result = extractAssets('ABC#DEF');
        expect(result).toEqual({
          baseAsset: 'ABC',
          quoteAsset: 'DEF',
        });
      });
    });
  });

  describe('Given symbol to convert to Binance format', () => {
    describe('When symbol is invalid', () => {
      it('Then error is thrown', async () => {
        try {
          convertToBinanceFormat('ABCDEF');
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual("Unable to extract assets, symbol 'ABCDEF' is invalid");
        }

        try {
          convertToBinanceFormat('AB#CD#EF');
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual("Unable to extract assets, symbol 'AB#CD#EF' is invalid");
        }
      });
    });

    describe('When symbol is valid', () => {
      it('Then Binance symbol is returned', async () => {
        const result = convertToBinanceFormat('ABC#DEF');
        expect(result).toEqual('ABCDEF');
      });
    });
  });
});
