import { PriceService } from './price-service';
import { Price } from './model/price';
import { PriceRepository } from './price-repository';

export class DefaultPriceService implements PriceService {
  constructor(private priceRepository: PriceRepository) {}

  async getBySymbol(symbol: string): Promise<Price> {
    return await this.priceRepository.getBySymbol(symbol);
  }
}
