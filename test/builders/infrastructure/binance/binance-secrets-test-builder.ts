import { randomString } from '../../random-test-builder';
import { BinanceSecrets } from '../../../../src/code/infrastructure/binance/model/binance-secret';

export const buildDefaultBinanceSecrets = (): BinanceSecrets => {
  return {
    apiKey: randomString(),
    secretKey: randomString(),
  };
};
