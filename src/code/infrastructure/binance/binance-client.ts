import { axiosInstance } from '../../configuration/http/axios';
import { AxiosRequestConfig } from 'axios';
import SecretsManager from 'aws-sdk/clients/secretsmanager';
import { BinanceSecrets } from './model/binance-secret';
import { BinanceAccount } from './model/binance-account';
import { BinanceOrder, BinanceOrderSide } from './model/binance-order';
import * as crypto from 'crypto';
import { BinanceSymbolCandlestick } from './model/binance-candlestick';

const accountInformationEndpoint = '/v3/account';
const symbolCandlesticksEndpoint = '/v3/klines';
const orderEndpoint = '/v3/order';

export class BinanceClient {
  private secrets?: BinanceSecrets;

  constructor(private smClient: SecretsManager, private secretName: string, private url: string) {}

  async getAccount(): Promise<BinanceAccount> {
    if (!this.secrets) {
      this.secrets = await this.#getSecrets();
    }

    const queryParameters = `timestamp=${new Date().valueOf()}`;
    const querySignature = this.#getSignature(queryParameters);
    const queryUrl = `${accountInformationEndpoint}?${queryParameters}&signature=${querySignature}`;
    const queryConfig = this.#getQueryConfig();
    const account = await axiosInstance.get<BinanceAccount>(queryUrl, queryConfig);

    return account.data;
  }

  async getSymbolCandlesticks(symbol: string, interval: string, limit: number): Promise<BinanceSymbolCandlestick[]> {
    if (!this.secrets) {
      this.secrets = await this.#getSecrets();
    }

    const queryParameters = `symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const queryUrl = `${symbolCandlesticksEndpoint}?${queryParameters}`;
    const queryConfig = this.#getQueryConfig();
    const response = await axiosInstance.get<[string | number[]]>(queryUrl, queryConfig);

    return response.data.map((element) => ({
      openingDate: element[0] as number,
      closingDate: element[6] as number,
      openingPrice: element[1] as string,
      closingPrice: element[4] as string,
      lowestPrice: element[3] as string,
      highestPrice: element[2] as string,
    }));
  }

  async sendMarketOrder(symbol: string, side: BinanceOrderSide, quantity: number, asset: 'BASE' | 'QUOTE'): Promise<BinanceOrder> {
    const quantityParameter = asset === 'BASE' ? `quantity=${quantity}` : `quoteOrderQty=${quantity}`;
    const queryParameters = `symbol=${symbol}&side=${side}&type=MARKET&${quantityParameter}&newOrderRespType=FULL&timestamp=${new Date().valueOf()}`;

    return this.#sendOrder(queryParameters);
  }

  async sendTakeProfitOrder(symbol: string, side: BinanceOrderSide, quantity: number, price: number): Promise<BinanceOrder> {
    const queryParameters = `symbol=${symbol}&side=${side}&type=TAKE_PROFIT_LIMIT&quantity=${quantity}&stopPrice=${price}&price=${price}&timeInForce=GTC&newOrderRespType=FULL&timestamp=${new Date().valueOf()}`;

    return this.#sendOrder(queryParameters);
  }

  async #sendOrder(queryParameters: string): Promise<BinanceOrder> {
    if (!this.secrets) {
      this.secrets = await this.#getSecrets();
    }

    const querySignature = this.#getSignature(queryParameters);
    const queryUrl = `${orderEndpoint}?${queryParameters}&signature=${querySignature}`;
    const queryConfig = this.#getQueryConfig();
    const order = await axiosInstance.post<BinanceOrder>(queryUrl, null, queryConfig);

    return order.data;
  }

  async #getSecrets(): Promise<BinanceSecrets> {
    const getSecretValueRequest = {
      SecretId: this.secretName,
    };

    return this.smClient
      .getSecretValue(getSecretValueRequest)
      .promise()
      .then((getSecretValueResponse) => JSON.parse(getSecretValueResponse.SecretString!));
  }

  #getSignature(parameters: string): string {
    const hmac = crypto.createHmac('sha256', this.secrets!.secretKey);
    const result = hmac.update(parameters);

    return result.digest('hex');
  }

  #getQueryConfig(): AxiosRequestConfig {
    return {
      baseURL: this.url,
      headers: {
        'X-MBX-APIKEY': this.secrets!.apiKey,
      },
    };
  }
}
