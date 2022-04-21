import { Candlestick } from '@hastobegood/crypto-bot-artillery/candlestick';
import { buildDefaultCandlesticks } from '@hastobegood/crypto-bot-artillery/test/builders';
import { APIGatewayProxyEvent, APIGatewayProxyEventQueryStringParameters } from 'aws-lambda';
import { mocked } from 'ts-jest/utils';

import { GetAllCandlesticksApiController, GetAllCandlesticksApiValidator } from '../../../../src/code/application/candlestick/get-all-candlesticks-api-controller';
import { GetCandlestickService } from '../../../../src/code/domain/candlestick/get-candlestick-service';
import { buildDefaultGetAllCandlesticksEvent } from '../../../builders/application/candlestick/candlestick-api-test-builder';

const getAllCandlesticksApiValidatorMock = mocked(jest.genMockFromModule<GetAllCandlesticksApiValidator>('../../../../src/code/application/candlestick/get-all-candlesticks-api-controller'), true);
const getCandlestickServiceMock = mocked(jest.genMockFromModule<GetCandlestickService>('../../../../src/code/domain/candlestick/get-candlestick-service'), true);

describe('GetAllCandlesticksApiValidator', () => {
  let getAllCandlesticksApiValidator: GetAllCandlesticksApiValidator;

  beforeEach(() => {
    getAllCandlesticksApiValidator = new GetAllCandlesticksApiValidator(['ABC', 'DEF']);
  });

  describe('Given query parameters to validate', () => {
    describe('When exchange is missing', () => {
      let queryParameters: APIGatewayProxyEventQueryStringParameters;

      beforeEach(() => {
        queryParameters = {
          symbol: 'ABC',
          interval: '1d',
          limit: '666',
          until: '77',
        };
      });

      it('Then validation has failed', async () => {
        const result = await getAllCandlesticksApiValidator.validateQueryParameters(queryParameters);
        expect(result.error?.details.length).toEqual(1);
        expect(result.error?.details[0].message).toEqual('"exchange" is required');
      });
    });

    describe('When exchange is invalid', () => {
      let queryParameters: APIGatewayProxyEventQueryStringParameters;

      beforeEach(() => {
        queryParameters = {
          exchange: 'Invalid value',
          symbol: 'ABC',
          interval: '1d',
          limit: '666',
          until: '77',
        };
      });

      it('Then validation has failed', async () => {
        const result = await getAllCandlesticksApiValidator.validateQueryParameters(queryParameters);
        expect(result.error?.details.length).toEqual(1);
        expect(result.error?.details[0].message).toEqual('"exchange" must be [Binance]');
      });
    });

    describe('When symbol is missing', () => {
      let queryParameters: APIGatewayProxyEventQueryStringParameters;

      beforeEach(() => {
        queryParameters = {
          exchange: 'Binance',
          interval: '1d',
          limit: '666',
          until: '77',
        };
      });

      it('Then validation has failed', async () => {
        const result = await getAllCandlesticksApiValidator.validateQueryParameters(queryParameters);
        expect(result.error?.details.length).toEqual(1);
        expect(result.error?.details[0].message).toEqual('"symbol" is required');
      });
    });

    describe('When symbol is invalid', () => {
      let queryParameters: APIGatewayProxyEventQueryStringParameters;

      beforeEach(() => {
        queryParameters = {
          exchange: 'Binance',
          symbol: 'XXX',
          interval: '1d',
          limit: '666',
          until: '77',
        };
      });

      it('Then validation has failed', async () => {
        const result = await getAllCandlesticksApiValidator.validateQueryParameters(queryParameters);
        expect(result.error?.details.length).toEqual(1);
        expect(result.error?.details[0].message).toEqual('"symbol" must be one of [ABC, DEF]');
      });
    });

    describe('When interval is missing', () => {
      let queryParameters: APIGatewayProxyEventQueryStringParameters;

      beforeEach(() => {
        queryParameters = {
          exchange: 'Binance',
          symbol: 'ABC',
          limit: '666',
          until: '77',
        };
      });

      it('Then validation has failed', async () => {
        const result = await getAllCandlesticksApiValidator.validateQueryParameters(queryParameters);
        expect(result.error?.details.length).toEqual(1);
        expect(result.error?.details[0].message).toEqual('"interval" is required');
      });
    });

    describe('When interval is invalid', () => {
      let queryParameters: APIGatewayProxyEventQueryStringParameters;

      beforeEach(() => {
        queryParameters = {
          exchange: 'Binance',
          symbol: 'ABC',
          interval: '1y',
          limit: '666',
          until: '77',
        };
      });

      it('Then validation has failed', async () => {
        const result = await getAllCandlesticksApiValidator.validateQueryParameters(queryParameters);
        expect(result.error?.details.length).toEqual(1);
        expect(result.error?.details[0].message).toEqual('"interval" must be one of [1m, 1h, 1d]');
      });
    });

    describe('When limit is missing', () => {
      let queryParameters: APIGatewayProxyEventQueryStringParameters;

      beforeEach(() => {
        queryParameters = {
          exchange: 'Binance',
          symbol: 'ABC',
          interval: '1d',
          until: '77',
        };
      });

      it('Then validation has failed', async () => {
        const result = await getAllCandlesticksApiValidator.validateQueryParameters(queryParameters);
        expect(result.error?.details.length).toEqual(1);
        expect(result.error?.details[0].message).toEqual('"limit" is required');
      });
    });

    describe('When limit is invalid', () => {
      let queryParameters: APIGatewayProxyEventQueryStringParameters;

      beforeEach(() => {
        queryParameters = {
          exchange: 'Binance',
          symbol: 'ABC',
          interval: '1d',
          limit: 'abc',
          until: '77',
        };
      });

      it('Then validation has failed', async () => {
        const result = await getAllCandlesticksApiValidator.validateQueryParameters(queryParameters);
        expect(result.error?.details.length).toEqual(1);
        expect(result.error?.details[0].message).toEqual('"limit" must be a number');
      });
    });

    describe('When until is missing', () => {
      let queryParameters: APIGatewayProxyEventQueryStringParameters;

      beforeEach(() => {
        queryParameters = {
          exchange: 'Binance',
          symbol: 'ABC',
          interval: '1d',
          limit: '666',
        };
      });

      it('Then validation has succeeded', async () => {
        const result = await getAllCandlesticksApiValidator.validateQueryParameters(queryParameters);
        expect(result.error).toBeUndefined();
      });
    });

    describe('When until is invalid', () => {
      let queryParameters: APIGatewayProxyEventQueryStringParameters;

      beforeEach(() => {
        queryParameters = {
          exchange: 'Binance',
          symbol: 'ABC',
          interval: '1d',
          limit: '666',
          until: 'abc',
        };
      });

      it('Then validation has failed', async () => {
        const result = await getAllCandlesticksApiValidator.validateQueryParameters(queryParameters);
        expect(result.error?.details.length).toEqual(1);
        expect(result.error?.details[0].message).toEqual('"until" must be a number');
      });
    });
  });
});

describe('GetAllCandlesticksApiController', () => {
  let getAllCandlesticksController: GetAllCandlesticksApiController;

  beforeEach(() => {
    getAllCandlesticksApiValidatorMock.validateQueryParameters = jest.fn();
    getCandlestickServiceMock.getAllLastBySymbol = jest.fn();

    getAllCandlesticksController = new GetAllCandlesticksApiController(getAllCandlesticksApiValidatorMock, getCandlestickServiceMock);
  });

  describe('Given all candlesticks to get', () => {
    let event: APIGatewayProxyEvent;

    beforeEach(() => {
      event = buildDefaultGetAllCandlesticksEvent();
    });

    describe('When request is not valid', () => {
      beforeEach(() => {
        getAllCandlesticksApiValidatorMock.validateQueryParameters.mockResolvedValueOnce({
          error: {
            message: 'Error !',
            details: [
              {
                message: 'Message 1',
              },
              {
                message: 'Message 2',
              },
            ],
          },
        } as any);
      });

      afterEach(() => {
        expect(getCandlestickServiceMock.getAllLastBySymbol).toHaveBeenCalledTimes(0);
      });

      it('Then bad request response is returned', async () => {
        const result = await getAllCandlesticksController.process(event);
        expect(result).toEqual({
          statusCode: 400,
          body: JSON.stringify({
            message: 'Bad request',
            details: [
              {
                message: 'Message 1',
              },
              {
                message: 'Message 2',
              },
            ],
          }),
        });

        expect(getAllCandlesticksApiValidatorMock.validateQueryParameters).toHaveBeenCalledTimes(1);
        const validateQueryParametersParams = getAllCandlesticksApiValidatorMock.validateQueryParameters.mock.calls[0];
        expect(validateQueryParametersParams.length).toEqual(1);
        expect(validateQueryParametersParams[0]).toEqual(event.queryStringParameters);
      });
    });

    describe('When request is valid', () => {
      let candlesticks: Candlestick[];

      beforeEach(() => {
        getAllCandlesticksApiValidatorMock.validateQueryParameters.mockResolvedValueOnce({
          value: {
            exchange: 'Binance',
            symbol: 'ABC#DEF',
            interval: '1d',
            limit: 666,
            until: 77,
          },
        } as any);

        candlesticks = buildDefaultCandlesticks().values;
        getCandlestickServiceMock.getAllLastBySymbol.mockResolvedValueOnce(candlesticks);
      });

      it('Then ok response is returned', async () => {
        const result = await getAllCandlesticksController.process(event);
        expect(result).toEqual({
          statusCode: 200,
          body: JSON.stringify({
            data: {
              exchange: 'Binance',
              symbol: 'ABC#DEF',
              interval: '1d',
              values: candlesticks.map((candlestick) => ({
                time: candlestick.openingDate,
                ohlcv: [candlestick.openingPrice, candlestick.highestPrice, candlestick.lowestPrice, candlestick.closingPrice, candlestick.volume],
              })),
            },
          }),
        });

        expect(getAllCandlesticksApiValidatorMock.validateQueryParameters).toHaveBeenCalledTimes(1);
        const validateQueryParametersParams = getAllCandlesticksApiValidatorMock.validateQueryParameters.mock.calls[0];
        expect(validateQueryParametersParams.length).toEqual(1);
        expect(validateQueryParametersParams[0]).toEqual(event.queryStringParameters);

        expect(getCandlestickServiceMock.getAllLastBySymbol).toHaveBeenCalledTimes(1);
        const getAllLastBySymbolParams = getCandlestickServiceMock.getAllLastBySymbol.mock.calls[0];
        expect(getAllLastBySymbolParams.length).toEqual(5);
        expect(getAllLastBySymbolParams[0]).toEqual('Binance');
        expect(getAllLastBySymbolParams[1]).toEqual('ABC#DEF');
        expect(getAllLastBySymbolParams[2]).toEqual('1d');
        expect(getAllLastBySymbolParams[3]).toEqual(666);
        expect(getAllLastBySymbolParams[4]).toEqual(77);
      });
    });
  });
});
