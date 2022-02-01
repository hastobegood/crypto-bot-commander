import Joi, { ObjectSchema, SchemaMap, ValidationResult } from 'joi';
import { APIGatewayProxyEvent, APIGatewayProxyEventQueryStringParameters, APIGatewayProxyResult } from 'aws-lambda';
import { buildApiResponseFromData, buildApiResponseFromValidationError, logger, validate } from '@hastobegood/crypto-bot-artillery/common';
import { CandlestickExchange, CandlestickInterval } from '@hastobegood/crypto-bot-artillery/candlestick';
import { GetCandlestickService } from '../../domain/candlestick/get-candlestick-service';

interface QueryParameters {
  exchange: CandlestickExchange;
  symbol: string;
  interval: CandlestickInterval;
  limit: number;
  until?: number;
}

export class GetAllCandlesticksApiValidator {
  readonly #queryParametersValidator: ObjectSchema<QueryParameters>;

  constructor(private symbols: string[]) {
    const queryParametersSchema: Required<SchemaMap<QueryParameters, true>> = {
      exchange: Joi.string().required().valid('Binance'),
      symbol: Joi.string()
        .required()
        .valid(...symbols),
      interval: Joi.string().required().valid('1m', '1h', '1d'),
      limit: Joi.number().integer().required().min(1).max(1000),
      until: Joi.number().integer().optional(),
    };

    this.#queryParametersValidator = Joi.object<QueryParameters, true>(queryParametersSchema);
  }

  async validateQueryParameters(queryParameters: APIGatewayProxyEventQueryStringParameters | null): Promise<ValidationResult<QueryParameters>> {
    return validate(this.#queryParametersValidator, queryParameters);
  }
}

export class GetAllCandlesticksApiController {
  constructor(private getAllCandlesticksApiValidator: GetAllCandlesticksApiValidator, private getCandlestickService: GetCandlestickService) {}

  async process(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
    const queryParametersValidation = await this.getAllCandlesticksApiValidator.validateQueryParameters(event.queryStringParameters);
    if (queryParametersValidation.error) {
      return buildApiResponseFromValidationError(queryParametersValidation.error);
    }

    const queryParameters = queryParametersValidation.value;

    const log = {
      exchange: queryParameters.exchange,
      symbol: queryParameters.symbol,
      interval: queryParameters.interval,
      limit: queryParameters.limit,
      until: queryParameters.until,
    };

    try {
      logger.info(log, 'Getting all candlesticks');
      const candlesticks = await this.getCandlestickService.getAllLastBySymbol(queryParameters.exchange, queryParameters.symbol, queryParameters.interval, queryParameters.limit, queryParameters.until);
      logger.info(log, 'All candlesticks got');
      return buildApiResponseFromData(200, {
        exchange: queryParameters.exchange,
        symbol: queryParameters.symbol,
        interval: queryParameters.interval,
        values: candlesticks.map((candlestick) => ({
          time: candlestick.openingDate,
          ohlc: [candlestick.openingPrice, candlestick.highestPrice, candlestick.lowestPrice, candlestick.closingPrice],
        })),
      });
    } catch (error) {
      logger.error(log, 'Unable to get all candlesticks');
      throw error;
    }
  }
}
