import { OrderRepository } from '../../domain/order/order-repository';
import { DynamoDBDocumentClient, PutCommand, PutCommandInput, UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import { Order, OrderStatus } from '../../domain/order/model/order';

export class DdbOrderRepository implements OrderRepository {
  constructor(private tableName: string, private ddbClient: DynamoDBDocumentClient) {}

  async save(order: Order): Promise<Order> {
    const putInput: PutCommandInput = {
      TableName: this.tableName,
      Item: {
        pk: `Order::${order.id}`,
        sk: 'Details',
        type: 'Order',
        data: this.#convertToItemFormat(order),
      },
    };

    await this.ddbClient.send(new PutCommand(putInput));

    return order;
  }

  async updateStatusById(id: string, status: OrderStatus, externalStatus: string, executedAssetQuantity: number, executedPrice: number): Promise<void> {
    const updateInput: UpdateCommandInput = {
      TableName: this.tableName,
      Key: {
        pk: `Order::${id}`,
        sk: 'Details',
      },
      UpdateExpression: 'SET #data.#status = :status, #data.#externalStatus = :externalStatus, #data.#executedAssetQuantity = :executedAssetQuantity, #data.#executedPrice = :executedPrice',
      ExpressionAttributeNames: {
        '#data': 'data',
        '#status': 'status',
        '#externalStatus': 'externalStatus',
        '#executedAssetQuantity': 'executedAssetQuantity',
        '#executedPrice': 'executedPrice',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':externalStatus': externalStatus,
        ':executedAssetQuantity': executedAssetQuantity,
        ':executedPrice': executedPrice,
      },
    };

    try {
      await this.ddbClient.send(new UpdateCommand(updateInput));
    } catch (error) {
      throw new Error(`Unable to update order '${id}' status: ${(error as Error).message}`);
    }
  }

  #convertToItemFormat(order: Order): any {
    return {
      ...order,
      creationDate: order.creationDate.toISOString(),
      transactionDate: order.transactionDate.toISOString(),
    };
  }
}
