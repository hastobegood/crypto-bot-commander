import { axiosInstance } from '../../configuration/http/axios';
import { AxiosRequestConfig } from 'axios';
import SecretsManager from 'aws-sdk/clients/secretsmanager';
import { BinanceSecrets } from './model/binance-secret';
import { BinanceAccount } from './model/binance-account';
import { BinanceOrder } from './model/binance-order';
import * as crypto from 'crypto';
import { BinanceSymbolPrice } from './model/binance-price';

const accountInformationEndpoint = '/v3/account';
const symbolCurrentPriceEndpoint = '/v3/ticker/price';
const symbolAveragePriceEndpoint = '/v3/avgPrice';
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

  async getSymbolCurrentPrice(symbol: string): Promise<BinanceSymbolPrice> {
    if (!this.secrets) {
      this.secrets = await this.#getSecrets();
    }

    const queryParameters = `symbol=${symbol}`;
    const queryUrl = `${symbolCurrentPriceEndpoint}?${queryParameters}`;
    const queryConfig = this.#getQueryConfig();
    const account = await axiosInstance.get<BinanceSymbolPrice>(queryUrl, queryConfig);

    return account.data;
  }

  async getSymbolAveragePrice(symbol: string): Promise<BinanceSymbolPrice> {
    if (!this.secrets) {
      this.secrets = await this.#getSecrets();
    }

    const queryParameters = `symbol=${symbol}`;
    const queryUrl = `${symbolAveragePriceEndpoint}?${queryParameters}`;
    const queryConfig = this.#getQueryConfig();
    const account = await axiosInstance.get<BinanceSymbolPrice>(queryUrl, queryConfig);

    return account.data;
  }

  async sendMarketOrder(symbol: string, side: string, quantity: number): Promise<BinanceOrder> {
    const queryParameters = `symbol=${symbol}&side=${side}&type=MARKET&quoteOrderQty=${quantity}&newOrderRespType=FULL&timestamp=${new Date().valueOf()}`;

    return await this.#sendOrder(queryParameters);
  }

  async sendTakeProfitOrder(symbol: string, side: string, quantity: number, price: number): Promise<BinanceOrder> {
    const queryParameters = `symbol=${symbol}&side=${side}&type=TAKE_PROFIT_LIMIT&quantity=${quantity}&stopPrice=${price}&price=${price}&timeInForce=GTC&newOrderRespType=FULL&timestamp=${new Date().valueOf()}`;

    return await this.#sendOrder(queryParameters);
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

    return await this.smClient
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
