import { CalculateMovingAverage, MovingAverageType } from '../../../../src/code/domain/technical-analysis/model/moving-average';
import { Point } from '../../../../src/code/domain/technical-analysis/model/point';
import { MovingAverageService } from '../../../../src/code/domain/technical-analysis/moving-average-service';
import { buildCalculateMovingAverage } from '../../../builders/domain/technical-analysis/moving-average-test-builder';

let movingAverageService: MovingAverageService;
beforeEach(() => {
  movingAverageService = new MovingAverageService();
});

describe('MovingAverageService', () => {
  let points: Point[];
  let calculateMovingAverage: CalculateMovingAverage;

  beforeEach(() => {
    points = [
      { timestamp: 1, value: 15 },
      { timestamp: 2, value: 10 },
      { timestamp: 3, value: 20 },
      { timestamp: 4, value: 30 },
      { timestamp: 5, value: 25 },
      { timestamp: 6, value: 20 },
      { timestamp: 7, value: 15 },
      { timestamp: 8, value: 5 },
      { timestamp: 9, value: 10 },
      { timestamp: 10, value: 5 },
      { timestamp: 11, value: 10 },
      { timestamp: 12, value: 15 },
      { timestamp: 13, value: 20 },
      { timestamp: 14, value: 30 },
      { timestamp: 15, value: 40 },
      { timestamp: 16, value: 50 },
      { timestamp: 17, value: 60 },
      { timestamp: 18, value: 70 },
    ];
  });

  describe('Given the technical analysis type to retrieve', () => {
    it('Then moving average type is returned', async () => {
      expect(movingAverageService.getType()).toEqual('MovingAverage');
    });
  });

  describe('Given an unknown moving average to calculate', () => {
    beforeEach(() => {
      calculateMovingAverage = buildCalculateMovingAverage('XXX' as MovingAverageType, 5, points);
    });

    it('Then error is thrown', async () => {
      try {
        await movingAverageService.calculate(calculateMovingAverage);
        fail();
      } catch (error) {
        expect((error as Error).message).toEqual("Unsupported 'XXX' moving average type");
      }
    });
  });

  describe('Given a simple moving average to calculate', () => {
    describe('When period is smaller than number of points', () => {
      beforeEach(() => {
        calculateMovingAverage = buildCalculateMovingAverage('SMA', 17, points);
      });

      it('Then simple moving average is calculated', async () => {
        const result = await movingAverageService.calculate(calculateMovingAverage);
        expect(result).toEqual({
          value: 22.35294118,
        });
      });
    });

    describe('When period is equal to number of points', () => {
      beforeEach(() => {
        calculateMovingAverage = buildCalculateMovingAverage('SMA', 18, points);
      });

      it('Then error is thrown', async () => {
        try {
          await movingAverageService.calculate(calculateMovingAverage);
          fail();
        } catch (error) {
          expect((error as Error).message).toEqual('Not enough point to calculate simple moving average (19 expected but found 18)');
        }
      });
    });

    describe('When period is bigger than number of points', () => {
      beforeEach(() => {
        calculateMovingAverage = buildCalculateMovingAverage('SMA', 19, points);
      });

      it('Then error is thrown', async () => {
        try {
          await movingAverageService.calculate(calculateMovingAverage);
          fail();
        } catch (error) {
          expect((error as Error).message).toEqual('Not enough point to calculate simple moving average (20 expected but found 18)');
        }
      });
    });
  });

  describe('Given a cumulative moving average to calculate', () => {
    describe('When period is smaller than number of points', () => {
      beforeEach(() => {
        calculateMovingAverage = buildCalculateMovingAverage('CMA', 17, points);
      });

      it('Then cumulative moving average is calculated', async () => {
        const result = await movingAverageService.calculate(calculateMovingAverage);
        expect(result).toEqual({
          value: 25.58823529,
        });
      });
    });

    describe('When period is equal to number of points', () => {
      beforeEach(() => {
        calculateMovingAverage = buildCalculateMovingAverage('CMA', 18, points);
      });

      it('Then cumulative moving average is calculated', async () => {
        const result = await movingAverageService.calculate(calculateMovingAverage);
        expect(result).toEqual({
          value: 25,
        });
      });
    });

    describe('When period is bigger than number of points', () => {
      beforeEach(() => {
        calculateMovingAverage = buildCalculateMovingAverage('CMA', 19, points);
      });

      it('Then error is thrown', async () => {
        try {
          await movingAverageService.calculate(calculateMovingAverage);
          fail();
        } catch (error) {
          expect((error as Error).message).toEqual('Not enough point to calculate cumulative moving average (19 expected but found 18)');
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
          value: 51.9473762,
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
          value: 48.58965532,
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
          fail();
        } catch (error) {
          expect(error).toBeDefined();
          expect((error as Error).message).toEqual('Not enough point to calculate exponential moving average (21 expected but found 18)');
        }
      });
    });
  });
});
