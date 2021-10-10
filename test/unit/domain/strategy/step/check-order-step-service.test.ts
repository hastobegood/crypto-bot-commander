import { mocked } from 'ts-jest/utils';
import { Strategy } from '../../../../../src/code/domain/strategy/model/strategy';
import { CheckOrderStepInput } from '../../../../../src/code/domain/strategy/model/strategy-step';
import { buildDefaultStrategy } from '../../../../builders/domain/strategy/strategy-test-builder';
import { OrderReview } from '../../../../../src/code/domain/order/model/order';
import { buildDefaultCheckOrderStepInput } from '../../../../builders/domain/strategy/strategy-step-test-builder';
import { buildDefaultOrderReview } from '../../../../builders/domain/order/order-test-builder';
import { CheckOrderStepService } from '../../../../../src/code/domain/strategy/step/check-order-step-service';
import { CheckOrderService } from '../../../../../src/code/domain/order/check-order-service';
import { UpdateStrategyService } from '../../../../../src/code/domain/strategy/update-strategy-service';
import { UpdateOrderService } from '../../../../../src/code/domain/order/update-order-service';

const checkOrderServiceMock = mocked(jest.genMockFromModule<CheckOrderService>('../../../../../src/code/domain/order/check-order-service'), true);
const updateOrderServiceMock = mocked(jest.genMockFromModule<UpdateOrderService>('../../../../../src/code/domain/order/update-order-service'), true);
const updateStrategyServiceMock = mocked(jest.genMockFromModule<UpdateStrategyService>('../../../../../src/code/domain/strategy/update-strategy-service'), true);

let checkOrderStepService: CheckOrderStepService;
beforeEach(() => {
  checkOrderServiceMock.check = jest.fn();
  updateOrderServiceMock.updateStatusById = jest.fn();
  updateStrategyServiceMock.updateWalletById = jest.fn();

  checkOrderStepService = new CheckOrderStepService(checkOrderServiceMock, updateOrderServiceMock, updateStrategyServiceMock);
});

describe('CheckOrderStepService', () => {
  let strategy: Strategy;
  let checkOrderStepInput: CheckOrderStepInput;
  let orderReview: OrderReview;

  beforeEach(() => {
    strategy = buildDefaultStrategy();
    checkOrderStepInput = buildDefaultCheckOrderStepInput();
  });

  describe('Given the strategy step type to retrieve', () => {
    it('Then check order type is returned', async () => {
      expect(checkOrderStepService.getType()).toEqual('CheckOrder');
    });
  });

  describe('Given a check order step to process', () => {
    describe('When buy status order is filled', () => {
      beforeEach(() => {
        orderReview = {
          ...buildDefaultOrderReview(),
          side: 'Buy',
          status: 'Filled',
          executedAssetQuantity: 0.23,
          executedPrice: 532.18,
        };
        checkOrderServiceMock.check.mockResolvedValue(orderReview);
      });

      it('Then check order step is a success', async () => {
        const result = await checkOrderStepService.process(strategy, checkOrderStepInput);
        expect(result).toEqual({
          success: true,
          id: checkOrderStepInput.id,
          status: orderReview.status,
          externalId: checkOrderStepInput.externalId,
          externalStatus: orderReview.externalStatus,
          quantity: orderReview.executedAssetQuantity,
          price: orderReview.executedPrice,
        });

        expect(checkOrderServiceMock.check).toHaveBeenCalledTimes(1);
        const checkParams = checkOrderServiceMock.check.mock.calls[0];
        expect(checkParams.length).toEqual(2);
        expect(checkParams[0]).toEqual(strategy.symbol);
        expect(checkParams[1]).toEqual(checkOrderStepInput.externalId);

        expect(updateOrderServiceMock.updateStatusById).toHaveBeenCalledTimes(1);
        const updateStatusByIdParams = updateOrderServiceMock.updateStatusById.mock.calls[0];
        expect(updateStatusByIdParams.length).toEqual(5);
        expect(updateStatusByIdParams[0]).toEqual(checkOrderStepInput.id);
        expect(updateStatusByIdParams[1]).toEqual(orderReview.status);
        expect(updateStatusByIdParams[2]).toEqual(orderReview.externalStatus);
        expect(updateStatusByIdParams[3]).toEqual(orderReview.executedAssetQuantity);
        expect(updateStatusByIdParams[4]).toEqual(orderReview.executedPrice);

        expect(updateStrategyServiceMock.updateWalletById).toHaveBeenCalledTimes(1);
        const updateWalletByIdParams = updateStrategyServiceMock.updateWalletById.mock.calls[0];
        expect(updateWalletByIdParams.length).toEqual(3);
        expect(updateWalletByIdParams[0]).toEqual(strategy.id);
        expect(updateWalletByIdParams[1]).toEqual(0.23);
        expect(updateWalletByIdParams[2]).toEqual(0.23 * 532.18 * -1);
      });
    });

    describe('When sell status order is filled', () => {
      beforeEach(() => {
        orderReview = {
          ...buildDefaultOrderReview(),
          side: 'Sell',
          status: 'Filled',
          executedAssetQuantity: 0.23,
          executedPrice: 532.18,
        };
        checkOrderServiceMock.check.mockResolvedValue(orderReview);
      });

      it('Then check order step is a success', async () => {
        const result = await checkOrderStepService.process(strategy, checkOrderStepInput);
        expect(result).toEqual({
          success: true,
          id: checkOrderStepInput.id,
          status: orderReview.status,
          externalId: checkOrderStepInput.externalId,
          externalStatus: orderReview.externalStatus,
          quantity: orderReview.executedAssetQuantity,
          price: orderReview.executedPrice,
        });

        expect(checkOrderServiceMock.check).toHaveBeenCalledTimes(1);
        const checkParams = checkOrderServiceMock.check.mock.calls[0];
        expect(checkParams.length).toEqual(2);
        expect(checkParams[0]).toEqual(strategy.symbol);
        expect(checkParams[1]).toEqual(checkOrderStepInput.externalId);

        expect(updateOrderServiceMock.updateStatusById).toHaveBeenCalledTimes(1);
        const updateStatusByIdParams = updateOrderServiceMock.updateStatusById.mock.calls[0];
        expect(updateStatusByIdParams.length).toEqual(5);
        expect(updateStatusByIdParams[0]).toEqual(checkOrderStepInput.id);
        expect(updateStatusByIdParams[1]).toEqual(orderReview.status);
        expect(updateStatusByIdParams[2]).toEqual(orderReview.externalStatus);
        expect(updateStatusByIdParams[3]).toEqual(orderReview.executedAssetQuantity);
        expect(updateStatusByIdParams[4]).toEqual(orderReview.executedPrice);

        expect(updateStrategyServiceMock.updateWalletById).toHaveBeenCalledTimes(1);
        const updateWalletByIdParams = updateStrategyServiceMock.updateWalletById.mock.calls[0];
        expect(updateWalletByIdParams.length).toEqual(3);
        expect(updateWalletByIdParams[0]).toEqual(strategy.id);
        expect(updateWalletByIdParams[1]).toEqual(0.23 * -1);
        expect(updateWalletByIdParams[2]).toEqual(0.23 * 532.18);
      });
    });

    describe('When buy status order is not filled', () => {
      beforeEach(() => {
        orderReview = {
          ...buildDefaultOrderReview(),
          side: 'Buy',
          status: 'Waiting',
          executedAssetQuantity: undefined,
          executedPrice: undefined,
        };
        checkOrderServiceMock.check.mockResolvedValue(orderReview);
      });

      it('Then check order step is not a success', async () => {
        const result = await checkOrderStepService.process(strategy, checkOrderStepInput);
        expect(result).toEqual({
          success: false,
          id: checkOrderStepInput.id,
          status: orderReview.status,
          externalId: checkOrderStepInput.externalId,
          externalStatus: orderReview.externalStatus,
        });

        expect(checkOrderServiceMock.check).toHaveBeenCalledTimes(1);
        const checkParams = checkOrderServiceMock.check.mock.calls[0];
        expect(checkParams.length).toEqual(2);
        expect(checkParams[0]).toEqual(strategy.symbol);
        expect(checkParams[1]).toEqual(checkOrderStepInput.externalId);

        expect(updateOrderServiceMock.updateStatusById).toHaveBeenCalledTimes(0);
        expect(updateStrategyServiceMock.updateWalletById).toHaveBeenCalledTimes(0);
      });
    });

    describe('When sell status order is not filled', () => {
      beforeEach(() => {
        orderReview = {
          ...buildDefaultOrderReview(),
          side: 'Sell',
          status: 'Waiting',
          executedAssetQuantity: undefined,
          executedPrice: undefined,
        };
        checkOrderServiceMock.check.mockResolvedValue(orderReview);
      });

      it('Then check order step is not a success', async () => {
        const result = await checkOrderStepService.process(strategy, checkOrderStepInput);
        expect(result).toEqual({
          success: false,
          id: checkOrderStepInput.id,
          status: orderReview.status,
          externalId: checkOrderStepInput.externalId,
          externalStatus: orderReview.externalStatus,
        });

        expect(checkOrderServiceMock.check).toHaveBeenCalledTimes(1);
        const checkParams = checkOrderServiceMock.check.mock.calls[0];
        expect(checkParams.length).toEqual(2);
        expect(checkParams[0]).toEqual(strategy.symbol);
        expect(checkParams[1]).toEqual(checkOrderStepInput.externalId);

        expect(updateOrderServiceMock.updateStatusById).toHaveBeenCalledTimes(0);
        expect(updateStrategyServiceMock.updateWalletById).toHaveBeenCalledTimes(0);
      });
    });
  });
});
