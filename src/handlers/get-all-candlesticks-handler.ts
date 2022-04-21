import 'source-map-support/register';
import { handleEvent } from '@hastobegood/crypto-bot-artillery/common';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { GetAllCandlesticksApiController, GetAllCandlesticksApiValidator } from '../code/application/candlestick/get-all-candlesticks-api-controller';
import { ddbClient } from '../code/configuration/aws/dynamodb';
import { GetCandlestickService } from '../code/domain/candlestick/get-candlestick-service';
import { DdbCandlestickRepository } from '../code/infrastructure/candlestick/ddb-candlestick-repository';

const candlestickRepository = new DdbCandlestickRepository(process.env.CANDLESTICK_TABLE_NAME, ddbClient);
const getCandlestickService = new GetCandlestickService(candlestickRepository);

const symbols = process.env.AVAILABLE_SYMBOLS.split(',').map((symbol) => symbol.trim());
const getAllCandlesticksApiValidator = new GetAllCandlesticksApiValidator(symbols);
const getAllCandlesticksApiController = new GetAllCandlesticksApiController(getAllCandlesticksApiValidator, getCandlestickService);

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  return handleEvent(context, async () => getAllCandlesticksApiController.process(event));
};
