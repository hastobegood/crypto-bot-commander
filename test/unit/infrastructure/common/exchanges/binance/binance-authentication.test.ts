import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

import { BinanceAuthentication } from '../../../../../../src/code/infrastructure/common/exchanges/binance/binance-authentication';

const smClientMock = jest.mocked(jest.genMockFromModule<SecretsManagerClient>('@aws-sdk/client-secrets-manager'), true);

let binanceAuthentication: BinanceAuthentication;
beforeEach(() => {
  smClientMock.send = jest.fn();

  binanceAuthentication = new BinanceAuthentication('my-secrets', smClientMock);
});

describe('BinanceAuthentication', () => {
  describe('Give the api url to retrieve', () => {
    describe('When multiple requests', () => {
      beforeEach(() => {
        smClientMock.send.mockImplementation(() => ({
          SecretString: '{"binance": {"apiUrl": "my-api-url"}}',
        }));
      });

      it('Then same api url is always returned', async () => {
        let result = await binanceAuthentication.getApiUrl();
        expect(result).toEqual('my-api-url');
        result = await binanceAuthentication.getApiUrl();
        expect(result).toEqual('my-api-url');
        result = await binanceAuthentication.getApiUrl();
        expect(result).toEqual('my-api-url');

        expect(smClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = smClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          SecretId: 'my-secrets',
        });
      });
    });
  });

  describe('Give the api key to retrieve', () => {
    describe('When multiple requests', () => {
      beforeEach(() => {
        smClientMock.send.mockImplementation(() => ({
          SecretString: '{"binance": {"apiKey": "my-api-key"}}',
        }));
      });

      it('Then same api key is always returned', async () => {
        let result = await binanceAuthentication.getApiKey();
        expect(result).toEqual('my-api-key');
        result = await binanceAuthentication.getApiKey();
        expect(result).toEqual('my-api-key');
        result = await binanceAuthentication.getApiKey();
        expect(result).toEqual('my-api-key');

        expect(smClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = smClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          SecretId: 'my-secrets',
        });
      });
    });
  });

  describe('Give the secret key to retrieve', () => {
    describe('When multiple requests', () => {
      beforeEach(() => {
        smClientMock.send.mockImplementation(() => ({
          SecretString: '{"binance": {"secretKey": "my-secret-key"}}',
        }));
      });

      it('Then same secret key is always returned', async () => {
        let result = await binanceAuthentication.getSecretKey();
        expect(result).toEqual('my-secret-key');
        result = await binanceAuthentication.getSecretKey();
        expect(result).toEqual('my-secret-key');
        result = await binanceAuthentication.getSecretKey();
        expect(result).toEqual('my-secret-key');

        expect(smClientMock.send).toHaveBeenCalledTimes(1);
        const sendParams = smClientMock.send.mock.calls[0];
        expect(sendParams.length).toEqual(1);
        expect(sendParams[0].input).toEqual({
          SecretId: 'my-secrets',
        });
      });
    });
  });
});
