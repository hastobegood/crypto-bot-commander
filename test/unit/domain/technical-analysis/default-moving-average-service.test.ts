import { DefaultMovingAverageService } from '../../../../src/code/domain/technical-analysis/default-moving-average-service';
import { Point } from '../../../../src/code/domain/technical-analysis/model/point';
import { CalculateMovingAverage } from '../../../../src/code/domain/technical-analysis/model/moving-average';
import { buildCalculateMovingAverage } from '../../../builders/domain/technical-analysis/moving-average-test-builder';

let movingAverageService: DefaultMovingAverageService;
beforeEach(() => {
  movingAverageService = new DefaultMovingAverageService();
});

describe('DefaultMovingAverageService', () => {
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

  describe('Given a simple moving average to calculate', () => {
    describe('When period is smaller than number of points', () => {
      beforeEach(() => {
        calculateMovingAverage = buildCalculateMovingAverage('SMA', 5, points);
      });

      it('Then simple moving average is calculated', async () => {
        const result = await movingAverageService.calculate(calculateMovingAverage);
        expect(result).toBeDefined();
        expect(result.type).toEqual(calculateMovingAverage.type);
        expect(result.period).toEqual(calculateMovingAverage.period);
        expect(result.value).toEqual(40);
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
          expect(error.message).toEqual('Not enough point to calculate simple moving average');
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
          expect(error.message).toEqual('Not enough point to calculate simple moving average');
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
        expect(result).toBeDefined();
        expect(result.type).toEqual(calculateMovingAverage.type);
        expect(result.period).toEqual(calculateMovingAverage.period);
        expect(result.value).toEqual(50);
      });
    });

    describe('When period is equal to number of points', () => {
      beforeEach(() => {
        calculateMovingAverage = buildCalculateMovingAverage('CMA', 6, points);
      });

      it('Then cumulative moving average is calculated', async () => {
        const result = await movingAverageService.calculate(calculateMovingAverage);
        expect(result).toBeDefined();
        expect(result.type).toEqual(calculateMovingAverage.type);
        expect(result.period).toEqual(calculateMovingAverage.period);
        expect(result.value).toEqual(45);
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
          expect(error.message).toEqual('Not enough point to calculate cumulative moving average');
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
        expect(result).toBeDefined();
        expect(result.type).toEqual(calculateMovingAverage.type);
        expect(result.period).toEqual(calculateMovingAverage.period);
        expect(result.value).toEqual(53.95061728);
      });
    });

    describe('When period is equal to number of points', () => {
      beforeEach(() => {
        calculateMovingAverage = buildCalculateMovingAverage('EMA', 6, points);
      });

      it('Then exponential moving average is calculated', async () => {
        const result = await movingAverageService.calculate(calculateMovingAverage);
        expect(result).toBeDefined();
        expect(result.type).toEqual(calculateMovingAverage.type);
        expect(result.period).toEqual(calculateMovingAverage.period);
        expect(result.value).toEqual(49.6483608);
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
          expect(error.message).toEqual('Not enough point to calculate exponential moving average');
        }
      });
    });
  });
});
