import { Point } from '../../../../src/code/domain/technical-analysis/model/point';
import { CalculateMovingAverage } from '../../../../src/code/domain/technical-analysis/model/moving-average';
import { buildCalculateMovingAverage } from '../../../builders/domain/technical-analysis/moving-average-test-builder';
import { MovingAverageService } from '../../../../src/code/domain/technical-analysis/moving-average-service';

let movingAverageService: MovingAverageService;
beforeEach(() => {
  movingAverageService = new MovingAverageService();
});

describe('MovingAverageService', () => {
  let points: Point[];
  let calculateMovingAverage: CalculateMovingAverage;

  beforeEach(() => {
    points = [
      { timestamp: 1, value: 20 },
      { timestamp: 2, value: 30 },
      { timestamp: 3, value: 40 },
      { timestamp: 4, value: 50 },
      { timestamp: 5, value: 60 },
      { timestamp: 6, value: 70 },
    ];
  });

  describe('Given the technical analysis type to retrieve', () => {
    it('Then moving average type is returned', async () => {
      expect(movingAverageService.getType()).toEqual('MovingAverage');
    });
  });

  describe('Given a simple moving average to calculate', () => {
    describe('When period is smaller than number of points', () => {
      beforeEach(() => {
        calculateMovingAverage = buildCalculateMovingAverage('SMA', 5, points);
      });

      it('Then simple moving average is calculated', async () => {
        const result = await movingAverageService.calculate(calculateMovingAverage);
        expect(result).toEqual({
          value: 40,
        });
      });
    });

    describe('When period is equal to number of points', () => {
      beforeEach(() => {
        calculateMovingAverage = buildCalculateMovingAverage('SMA', 6, points);
      });

      it('Then error is thrown', async () => {
        try {
          await movingAverageService.calculate(calculateMovingAverage);
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual('Not enough point to calculate simple moving average');
        }
      });
    });

    describe('When period is bigger than number of points', () => {
      beforeEach(() => {
        calculateMovingAverage = buildCalculateMovingAverage('SMA', 7, points);
      });

      it('Then error is thrown', async () => {
        try {
          await movingAverageService.calculate(calculateMovingAverage);
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual('Not enough point to calculate simple moving average');
        }
      });
    });
  });

  describe('Given a cumulative moving average to calculate', () => {
    describe('When period is smaller than number of points', () => {
      beforeEach(() => {
        calculateMovingAverage = buildCalculateMovingAverage('CMA', 5, points);
      });

      it('Then cumulative moving average is calculated', async () => {
        const result = await movingAverageService.calculate(calculateMovingAverage);
        expect(result).toEqual({
          value: 50,
        });
      });
    });

    describe('When period is equal to number of points', () => {
      beforeEach(() => {
        calculateMovingAverage = buildCalculateMovingAverage('CMA', 6, points);
      });

      it('Then cumulative moving average is calculated', async () => {
        const result = await movingAverageService.calculate(calculateMovingAverage);
        expect(result).toEqual({
          value: 45,
        });
      });
    });

    describe('When period is bigger than number of points', () => {
      beforeEach(() => {
        calculateMovingAverage = buildCalculateMovingAverage('CMA', 7, points);
      });

      it('Then error is thrown', async () => {
        try {
          await movingAverageService.calculate(calculateMovingAverage);
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual('Not enough point to calculate cumulative moving average');
        }
      });
    });
  });

  describe('Given an exponential moving average to calculate', () => {
    describe('When period is smaller than number of points', () => {
      beforeEach(() => {
        calculateMovingAverage = buildCalculateMovingAverage('EMA', 5, points);
      });

      it('Then exponential moving average is calculated', async () => {
        const result = await movingAverageService.calculate(calculateMovingAverage);
        expect(result).toEqual({
          value: 53.95061728,
        });
      });
    });

    describe('When period is equal to number of points', () => {
      beforeEach(() => {
        calculateMovingAverage = buildCalculateMovingAverage('EMA', 6, points);
      });

      it('Then exponential moving average is calculated', async () => {
        const result = await movingAverageService.calculate(calculateMovingAverage);
        expect(result).toEqual({
          value: 49.6483608,
        });
      });
    });

    describe('When period is bigger than number of points', () => {
      beforeEach(() => {
        calculateMovingAverage = buildCalculateMovingAverage('EMA', 7, points);
      });

      it('Then error is thrown', async () => {
        try {
          await movingAverageService.calculate(calculateMovingAverage);
          fail('An error should have been thrown');
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual('Not enough point to calculate exponential moving average');
        }
      });
    });
  });
});
