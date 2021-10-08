import { round, truncate } from '../../../../src/code/configuration/util/math';

describe('Math', () => {
  describe('Given a number to round', () => {
    it('Then number is rounded according to provided number of decimals', async () => {
      expect(round(1.0123456789, 0)).toEqual(1);
      expect(round(1.0123456789, 1)).toEqual(1.0);
      expect(round(1.0123456789, 2)).toEqual(1.01);
      expect(round(1.0123456789, 3)).toEqual(1.012);
      expect(round(1.0123456789, 4)).toEqual(1.0123);
      expect(round(1.0123456789, 5)).toEqual(1.01235);
      expect(round(1.0123456789, 6)).toEqual(1.012346);
      expect(round(1.0123456789, 7)).toEqual(1.0123457);
      expect(round(1.0123456789, 8)).toEqual(1.01234568);
      expect(round(1.0123456789, 9)).toEqual(1.012345679);
      expect(round(1.0123456789, 10)).toEqual(1.0123456789);
      expect(round(1.0123456789, 11)).toEqual(1.0123456789);

      expect(round(-1.0123456789, 0)).toEqual(-1);
      expect(round(-1.0123456789, 1)).toEqual(-1.0);
      expect(round(-1.0123456789, 2)).toEqual(-1.01);
      expect(round(-1.0123456789, 3)).toEqual(-1.012);
      expect(round(-1.0123456789, 4)).toEqual(-1.0123);
      expect(round(-1.0123456789, 5)).toEqual(-1.01235);
      expect(round(-1.0123456789, 6)).toEqual(-1.012346);
      expect(round(-1.0123456789, 7)).toEqual(-1.0123457);
      expect(round(-1.0123456789, 8)).toEqual(-1.01234568);
      expect(round(-1.0123456789, 9)).toEqual(-1.012345679);
      expect(round(-1.0123456789, 10)).toEqual(-1.0123456789);
      expect(round(-1.0123456789, 11)).toEqual(-1.0123456789);

      expect(round(1.005, 2)).toEqual(1.01);
      expect(round(1.555, 2)).toEqual(1.56);
      expect(round(1.3549999999999998, 2)).toEqual(1.35);

      expect(round(-1.005, 2)).toEqual(-1.01);
      expect(round(-1.555, 2)).toEqual(-1.56);
      expect(round(-1.3549999999999998, 2)).toEqual(-1.35);

      expect(round(0.5, 0)).toEqual(1);
      expect(round(1.25, 1)).toEqual(1.3);
      expect(round(234.20405, 4)).toEqual(234.2041);
      expect(round(234.204050000000000000000000000000006, 4)).toEqual(234.2041);

      expect(round(-0.5, 0)).toEqual(-1);
      expect(round(-1.25, 1)).toEqual(-1.3);
      expect(round(-234.20405, 4)).toEqual(-234.2041);
      expect(round(-234.204050000000000000000000000000006, 4)).toEqual(-234.2041);

      expect(round(0.1 + 0.2, 1)).toEqual(0.3);
      expect(round(-0.1 + -0.2, 1)).toEqual(-0.3);
    });
  });

  describe('Given a number to truncate', () => {
    it('Then number is truncated according to provided number of decimals', async () => {
      expect(truncate(1.0123456789, 0)).toEqual(1);
      expect(truncate(1.0123456789, 1)).toEqual(1.0);
      expect(truncate(1.0123456789, 2)).toEqual(1.01);
      expect(truncate(1.0123456789, 3)).toEqual(1.012);
      expect(truncate(1.0123456789, 4)).toEqual(1.0123);
      expect(truncate(1.0123456789, 5)).toEqual(1.01234);
      expect(truncate(1.0123456789, 6)).toEqual(1.012345);
      expect(truncate(1.0123456789, 7)).toEqual(1.0123456);
      expect(truncate(1.0123456789, 8)).toEqual(1.01234567);
      expect(truncate(1.0123456789, 9)).toEqual(1.012345678);
      expect(truncate(1.0123456789, 10)).toEqual(1.0123456789);
      expect(truncate(1.0123456789, 11)).toEqual(1.0123456789);

      expect(truncate(-1.0123456789, 0)).toEqual(-1);
      expect(truncate(-1.0123456789, 1)).toEqual(-1.0);
      expect(truncate(-1.0123456789, 2)).toEqual(-1.01);
      expect(truncate(-1.0123456789, 3)).toEqual(-1.012);
      expect(truncate(-1.0123456789, 4)).toEqual(-1.0123);
      expect(truncate(-1.0123456789, 5)).toEqual(-1.01234);
      expect(truncate(-1.0123456789, 6)).toEqual(-1.012345);
      expect(truncate(-1.0123456789, 7)).toEqual(-1.0123456);
      expect(truncate(-1.0123456789, 8)).toEqual(-1.01234567);
      expect(truncate(-1.0123456789, 9)).toEqual(-1.012345678);
      expect(truncate(-1.0123456789, 10)).toEqual(-1.0123456789);
      expect(truncate(-1.0123456789, 11)).toEqual(-1.0123456789);

      expect(truncate(1.005, 2)).toEqual(1.0);
      expect(truncate(1.555, 2)).toEqual(1.55);
      expect(truncate(1.3549999999999998, 2)).toEqual(1.35);

      expect(truncate(-1.005, 2)).toEqual(-1.0);
      expect(truncate(-1.555, 2)).toEqual(-1.55);
      expect(truncate(-1.3549999999999998, 2)).toEqual(-1.35);

      expect(truncate(0.5, 0)).toEqual(0);
      expect(truncate(1.25, 1)).toEqual(1.2);
      expect(truncate(234.20405, 4)).toEqual(234.204);
      expect(truncate(234.204050000000000000000000000000006, 4)).toEqual(234.204);

      expect(truncate(-0.5, 0)).toEqual(-0);
      expect(truncate(-1.25, 1)).toEqual(-1.2);
      expect(truncate(-234.20405, 4)).toEqual(-234.204);
      expect(truncate(-234.204050000000000000000000000000006, 4)).toEqual(-234.204);

      expect(truncate(0.1 + 0.2, 1)).toEqual(0.3);
      expect(truncate(-0.1 + -0.2, 1)).toEqual(-0.3);
    });
  });
});
