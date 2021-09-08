import { Point } from '../../technical-analysis/model/point';
import { MovingAverageCrossover, MovingAverageCrossoverStepInput, MovingAverageCrossoverStepOutput, MovingAverageSignal, StrategyStepType } from '../model/strategy-step';
import { StrategyStepService } from './strategy-step-service';
import { Candlestick } from '../../candlestick/model/candlestick';
import { Strategy } from '../model/strategy';
import { GetCandlestickService } from '../../candlestick/get-candlestick-service';
import { MovingAverageService } from '../../technical-analysis/moving-average-service';

export class MovingAverageCrossoverStepService implements StrategyStepService {
  constructor(private getCandlestickService: GetCandlestickService, private movingAverageService: MovingAverageService) {}

  getType(): StrategyStepType {
    return 'MovingAverageCrossover';
  }

  async process(strategy: Strategy, movingAverageCrossoverStepInput: MovingAverageCrossoverStepInput): Promise<MovingAverageCrossoverStepOutput> {
    if (movingAverageCrossoverStepInput.shortTermPeriod > movingAverageCrossoverStepInput.longTermPeriod) {
      throw new Error('Unable to calculate moving average when short term period is greater than long term period');
    }

    const points = await this.#getPoints(strategy, movingAverageCrossoverStepInput.longTermPeriod);
    const calculateMovingAverage = {
      type: movingAverageCrossoverStepInput.type,
      points: points,
    };

    const movingAverages = await Promise.all([
      this.movingAverageService.calculate({ ...calculateMovingAverage, period: movingAverageCrossoverStepInput.shortTermPeriod }),
      this.movingAverageService.calculate({ ...calculateMovingAverage, period: movingAverageCrossoverStepInput.longTermPeriod }),
    ]);

    const currentPrice = points.reduce((previousPoint, currentPoint) => (currentPoint.timestamp > previousPoint.timestamp ? currentPoint : previousPoint)).value;
    const shortTermPrice = movingAverages[0].value;
    const longTermMovingPrice = movingAverages[1].value;

    return {
      success: this.#isMovingAverageCrossed(movingAverageCrossoverStepInput.crossover, movingAverageCrossoverStepInput.signal, currentPrice, shortTermPrice, longTermMovingPrice),
      currentPrice: currentPrice,
      shortTermPrice: shortTermPrice,
      longTermPrice: longTermMovingPrice,
    };
  }

  async #getPoints(strategy: Strategy, period: number): Promise<Point[]> {
    return this.#buildPoints(await this.getCandlestickService.getAllBySymbol(strategy.symbol, period, '1d'));
  }

  #buildPoints(candlesticks: Candlestick[]): Point[] {
    return candlesticks.map((candlestick) => ({
      timestamp: candlestick.closingDate.valueOf(),
      value: candlestick.closingPrice,
    }));
  }

  #isMovingAverageCrossed(crossover: MovingAverageCrossover, signal: MovingAverageSignal, currentPrice: number, shortTermPrice: number, longTermPrice: number): boolean {
    switch (crossover) {
      case 'CurrentPrice':
        return this.#isMovingAverageSignalTriggered(signal, currentPrice, longTermPrice);
      case 'ShortTermPrice':
        return this.#isMovingAverageSignalTriggered(signal, shortTermPrice, longTermPrice);
      default:
        throw new Error(`Unsupported '${crossover}' moving average crossover`);
    }
  }

  #isMovingAverageSignalTriggered(signal: MovingAverageSignal, targetPrice: number, longTermPrice: number): boolean {
    switch (signal) {
      case 'Buy':
        return targetPrice > longTermPrice;
      case 'Sell':
        return targetPrice < longTermPrice;
      default:
        throw new Error(`Unsupported '${signal}' moving average signal`);
    }
  }
}
