import 'source-map-support/register';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { ddbClient } from '../code/configuration/aws/dynamodb';
import { handleEvent } from '@hastobegood/crypto-bot-artillery/common';
import { DdbCandlestickRepository } from '../code/infrastructure/candlestick/ddb-candlestick-repository';
import { GetCandlestickService } from '../code/domain/candlestick/get-candlestick-service';
import { GetAllCandlesticksApiController, GetAllCandlesticksApiValidator } from '../code/application/candlestick/get-all-candlesticks-api-controller';

const candlestickRepository = new DdbCandlestickRepository(process.env.CANDLESTICK_TABLE_NAME, ddbClient);
const getCandlestickService = new GetCandlestickService(candlestickRepository);

const symbols = process.env.AVAILABLE_SYMBOLS.split(',').map((symbol) => symbol.trim());
const getAllCandlesticksApiValidator = new GetAllCandlesticksApiValidator(symbols);
const getAllCandlesticksApiController = new GetAllCandlesticksApiController(getAllCandlesticksApiValidator, getCandlestickService);

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  return handleEvent(context, async () => getAllCandlesticksApiController.process(event));
};
