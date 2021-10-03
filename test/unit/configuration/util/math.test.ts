import { roundNumber, truncateNumber } from '../../../../src/code/configuration/util/math';

describe('Math', () => {
  describe('Given a number to round', () => {
    it('Then number is rounded according to provided number of decimals', async () => {
      expect(roundNumber(1.0123456789, 0)).toEqual(1);
      expect(roundNumber(1.0123456789, 1)).toEqual(1.0);
      expect(roundNumber(1.0123456789, 2)).toEqual(1.01);
      expect(roundNumber(1.0123456789, 3)).toEqual(1.012);
      expect(roundNumber(1.0123456789, 4)).toEqual(1.0123);
      expect(roundNumber(1.0123456789, 5)).toEqual(1.01235);
      expect(roundNumber(1.0123456789, 6)).toEqual(1.012346);
      expect(roundNumber(1.0123456789, 7)).toEqual(1.0123457);
      expect(roundNumber(1.0123456789, 8)).toEqual(1.01234568);
      expect(roundNumber(1.0123456789, 9)).toEqual(1.012345679);
      expect(roundNumber(1.0123456789, 10)).toEqual(1.0123456789);
    });
  });

  describe('Given a number to truncate', () => {
    it('Then number is truncated according to provided number of decimals', async () => {
      expect(truncateNumber(1.0123456789, 0)).toEqual(1);
      expect(truncateNumber(1.0123456789, 1)).toEqual(1.0);
      expect(truncateNumber(1.0123456789, 2)).toEqual(1.01);
      expect(truncateNumber(1.0123456789, 3)).toEqual(1.012);
      expect(truncateNumber(1.0123456789, 4)).toEqual(1.0123);
      expect(truncateNumber(1.0123456789, 5)).toEqual(1.01234);
      expect(truncateNumber(1.0123456789, 6)).toEqual(1.012345);
      expect(truncateNumber(1.0123456789, 7)).toEqual(1.0123456);
      expect(truncateNumber(1.0123456789, 8)).toEqual(1.01234567);
      expect(truncateNumber(1.0123456789, 9)).toEqual(1.012345678);
      expect(truncateNumber(1.0123456789, 10)).toEqual(1.0123456789);
    });
  });
});
