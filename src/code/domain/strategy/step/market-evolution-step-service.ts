import { Candlestick } from '@hastobegood/crypto-bot-artillery/candlestick';
import { MarketEvolutionService } from '../../technical-analysis/market-evolution-service';
import { Point } from '../../technical-analysis/model/point';
import { CheckOrderStepOutput, MarketEvolutionInterval, MarketEvolutionStepInput, MarketEvolutionStepOutput, StrategyStepType } from '../model/strategy-step';
import { StrategyStepService } from './strategy-step-service';
import { StrategyStepRepository } from './strategy-step-repository';
import { Strategy } from '../model/strategy';
import { GetCandlestickService } from '../../candlestick/get-candlestick-service';

export class MarketEvolutionStepService implements StrategyStepService {
  constructor(private getCandlestickService: GetCandlestickService, private marketEvolutionService: MarketEvolutionService, private strategyStepRepository: StrategyStepRepository) {}

  getType(): StrategyStepType {
    return 'MarketEvolution';
  }

  async process(strategy: Strategy, marketEvolutionStepInput: MarketEvolutionStepInput): Promise<MarketEvolutionStepOutput> {
    const points = await this.#getPoints(strategy, marketEvolutionStepInput);
    const calculateMarketEvolution = {
      period: points.length,
      points: points,
    };

    const marketEvolution = await this.marketEvolutionService.calculate(calculateMarketEvolution);

    return {
      success: Math.sign(marketEvolutionStepInput.percentageThreshold) === -1 ? marketEvolution.percentage <= marketEvolutionStepInput.percentageThreshold : marketEvolution.percentage >= marketEvolutionStepInput.percentageThreshold,
      lastPrice: marketEvolution.lastValue,
      currentPrice: marketEvolution.currentValue,
      percentage: marketEvolution.percentage,
    };
  }

  async #getPoints(strategy: Strategy, marketEvolutionStepInput: MarketEvolutionStepInput): Promise<Point[]> {
    switch (marketEvolutionStepInput.source) {
      case 'Market':
        return this.#getPointsSinceMarketInterval(strategy, marketEvolutionStepInput.period, marketEvolutionStepInput.interval);
      case 'LastOrder':
        return this.#getPointsSinceLastOrder(strategy);
      default:
        throw new Error(`Unsupported '${marketEvolutionStepInput.source}' market evolution source`);
    }
  }

  async #getPointsSinceMarketInterval(strategy: Strategy, period?: number, interval?: MarketEvolutionInterval): Promise<Point[]> {
    if (!period) {
      throw new Error(`Unable to calculate market evolution without period`);
    }
    if (!interval) {
      throw new Error(`Unable to calculate market evolution without interval`);
    }

    return this.#buildPoints(await this.getCandlestickService.getAllLastBySymbol(strategy.exchange, strategy.symbol, interval, period));
  }

  async #getPointsSinceLastOrder(strategy: Strategy): Promise<Point[]> {
    const points = await Promise.all([this.#getPointsSinceMarketInterval(strategy, 1, '1m'), this.#getLastOrderStepPoint(strategy)]);

    return [...points[0], points[1]];
  }

  async #getLastOrderStepPoint(strategy: Strategy): Promise<Point> {
    const lastCheckOrderStep = await this.strategyStepRepository.getLastByStrategyIdAndType(strategy.id, 'CheckOrder');
    if (!lastCheckOrderStep) {
      throw new Error(`Unable to calculate market evolution without last order`);
    }

    return {
      timestamp: lastCheckOrderStep.executionEndDate.valueOf(),
      value: (lastCheckOrderStep.output as CheckOrderStepOutput).price!,
    };
  }

  #buildPoints(candlesticks: Candlestick[]): Point[] {
    return candlesticks.map((candlestick) => ({
      timestamp: candlestick.openingDate,
      value: candlestick.closingPrice,
    }));
  }
}
