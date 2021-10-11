import { fromBinanceOrderSide, fromBinanceOrderStatus, toBinanceSymbol } from '../../../../src/code/infrastructure/binance/binance-converter';
import { BinanceOrderSide, BinanceOrderStatus } from '../../../../src/code/infrastructure/binance/model/binance-order';

describe('BinanceConverter', () => {
  describe('Given a Binance order status', () => {
    describe('When known value', () => {
      it('Then converted value is returned', async () => {
        expect(fromBinanceOrderStatus('NEW')).toEqual('Waiting');
        expect(fromBinanceOrderStatus('PARTIALLY_FILLED')).toEqual('PartiallyFilled');
        expect(fromBinanceOrderStatus('FILLED')).toEqual('Filled');
        expect(fromBinanceOrderStatus('PENDING_CANCEL')).toEqual('Canceled');
        expect(fromBinanceOrderStatus('CANCELED')).toEqual('Canceled');
        expect(fromBinanceOrderStatus('EXPIRED')).toEqual('Error');
        expect(fromBinanceOrderStatus('REJECTED')).toEqual('Error');
      });
    });

    describe('When unknown value', () => {
      it('Then unknown value is returned', async () => {
        expect(fromBinanceOrderStatus('XXX' as BinanceOrderStatus)).toEqual('Unknown');
      });
    });
  });

  describe('Given a Binance order side', () => {
    describe('When known value', () => {
      it('Then converted value is returned', async () => {
        expect(fromBinanceOrderSide('BUY')).toEqual('Buy');
        expect(fromBinanceOrderSide('SELL')).toEqual('Sell');
      });
    });

    describe('When unknown value', () => {
      it('Then error is thrown', async () => {
        try {
          fromBinanceOrderSide('XXX' as BinanceOrderSide);
          fail();
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual("Unsupported 'XXX' Binance order side");
        }
      });
    });
  });

  describe('Given a symbol', () => {
    describe('When invalid value', () => {
      it('Then error is thrown', async () => {
        try {
          toBinanceSymbol('ABCDEF');
          fail();
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual("Unable to extract assets, symbol 'ABCDEF' is invalid");
        }

        try {
          toBinanceSymbol('AB#CD#EF');
          fail();
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual("Unable to extract assets, symbol 'AB#CD#EF' is invalid");
        }
      });
    });

    describe('When valid value', () => {
      it('Then converted value is returned', async () => {
        const result = toBinanceSymbol('ABC#DEF');
        expect(result).toEqual('ABCDEF');
      });
    });
  });
});
