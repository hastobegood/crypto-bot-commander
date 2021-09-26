import { mocked } from 'ts-jest/utils';
import { Strategy } from '../../../../../src/code/domain/strategy/model/strategy';
import { CheckOrderStepInput } from '../../../../../src/code/domain/strategy/model/strategy-step';
import { buildDefaultStrategy } from '../../../../builders/domain/strategy/strategy-test-builder';
import { StatusOrder } from '../../../../../src/code/domain/order/model/order';
import { buildDefaultCheckOrderStepInput } from '../../../../builders/domain/strategy/strategy-step-test-builder';
import { buildDefaultStatusOrder } from '../../../../builders/domain/order/order-test-builder';
import { CheckOrderStepService } from '../../../../../src/code/domain/strategy/step/check-order-step-service';
import { StatusOrderService } from '../../../../../src/code/domain/order/status-order-service';
import { UpdateStrategyService } from '../../../../../src/code/domain/strategy/update-strategy-service';

const statusOrderServiceMock = mocked(jest.genMockFromModule<StatusOrderService>('../../../../../src/code/domain/order/status-order-service'), true);
const updateStrategyServiceMock = mocked(jest.genMockFromModule<UpdateStrategyService>('../../../../../src/code/domain/strategy/update-strategy-service'), true);

let checkOrderStepService: CheckOrderStepService;
beforeEach(() => {
  statusOrderServiceMock.check = jest.fn();
  updateStrategyServiceMock.updateWalletById = jest.fn();

  checkOrderStepService = new CheckOrderStepService(statusOrderServiceMock, updateStrategyServiceMock);
});

describe('CheckOrderStepService', () => {
  let strategy: Strategy;
  let checkOrderStepInput: CheckOrderStepInput;
  let statusOrder: StatusOrder;

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
        statusOrder = {
          ...buildDefaultStatusOrder(),
          side: 'Buy',
          status: 'Filled',
          executedAssetQuantity: 0.23,
          executedPrice: 532.18,
        };
        statusOrderServiceMock.check.mockResolvedValue(statusOrder);
      });

      it('Then check order step is a success', async () => {
        const result = await checkOrderStepService.process(strategy, checkOrderStepInput);
        expect(result).toEqual({
          success: true,
          id: checkOrderStepInput.id,
          side: statusOrder.side,
          status: statusOrder.status,
          externalId: checkOrderStepInput.externalId,
          externalStatus: statusOrder.externalStatus,
          quantity: statusOrder.executedAssetQuantity,
          price: statusOrder.executedPrice,
        });

        expect(statusOrderServiceMock.check).toHaveBeenCalledTimes(1);
        const checkParams = statusOrderServiceMock.check.mock.calls[0];
        expect(checkParams.length).toEqual(2);
        expect(checkParams[0]).toEqual(strategy.symbol);
        expect(checkParams[1]).toEqual(checkOrderStepInput.externalId);

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
        statusOrder = {
          ...buildDefaultStatusOrder(),
          side: 'Sell',
          status: 'Filled',
          executedAssetQuantity: 0.23,
          executedPrice: 532.18,
        };
        statusOrderServiceMock.check.mockResolvedValue(statusOrder);
      });

      it('Then check order step is a success', async () => {
        const result = await checkOrderStepService.process(strategy, checkOrderStepInput);
        expect(result).toEqual({
          success: true,
          id: checkOrderStepInput.id,
          side: statusOrder.side,
          status: statusOrder.status,
          externalId: checkOrderStepInput.externalId,
          externalStatus: statusOrder.externalStatus,
          quantity: statusOrder.executedAssetQuantity,
          price: statusOrder.executedPrice,
        });

        expect(statusOrderServiceMock.check).toHaveBeenCalledTimes(1);
        const checkParams = statusOrderServiceMock.check.mock.calls[0];
        expect(checkParams.length).toEqual(2);
        expect(checkParams[0]).toEqual(strategy.symbol);
        expect(checkParams[1]).toEqual(checkOrderStepInput.externalId);

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
        statusOrder = {
          ...buildDefaultStatusOrder(),
          side: 'Buy',
          status: 'Waiting',
          executedAssetQuantity: undefined,
          executedPrice: undefined,
        };
        statusOrderServiceMock.check.mockResolvedValue(statusOrder);
      });

      it('Then check order step is not a success', async () => {
        const result = await checkOrderStepService.process(strategy, checkOrderStepInput);
        expect(result).toEqual({
          success: false,
          id: checkOrderStepInput.id,
          side: statusOrder.side,
          status: statusOrder.status,
          externalId: checkOrderStepInput.externalId,
          externalStatus: statusOrder.externalStatus,
        });

        expect(statusOrderServiceMock.check).toHaveBeenCalledTimes(1);
        const checkParams = statusOrderServiceMock.check.mock.calls[0];
        expect(checkParams.length).toEqual(2);
        expect(checkParams[0]).toEqual(strategy.symbol);
        expect(checkParams[1]).toEqual(checkOrderStepInput.externalId);

        expect(updateStrategyServiceMock.updateWalletById).toHaveBeenCalledTimes(0);
      });
    });

    describe('When sell status order is not filled', () => {
      beforeEach(() => {
        statusOrder = {
          ...buildDefaultStatusOrder(),
          side: 'Sell',
          status: 'Waiting',
          executedAssetQuantity: undefined,
          executedPrice: undefined,
        };
        statusOrderServiceMock.check.mockResolvedValue(statusOrder);
      });

      it('Then check order step is not a success', async () => {
        const result = await checkOrderStepService.process(strategy, checkOrderStepInput);
        expect(result).toEqual({
          success: false,
          id: checkOrderStepInput.id,
          side: statusOrder.side,
          status: statusOrder.status,
          externalId: checkOrderStepInput.externalId,
          externalStatus: statusOrder.externalStatus,
        });

        expect(statusOrderServiceMock.check).toHaveBeenCalledTimes(1);
        const checkParams = statusOrderServiceMock.check.mock.calls[0];
        expect(checkParams.length).toEqual(2);
        expect(checkParams[0]).toEqual(strategy.symbol);
        expect(checkParams[1]).toEqual(checkOrderStepInput.externalId);

        expect(updateStrategyServiceMock.updateWalletById).toHaveBeenCalledTimes(0);
      });
    });
  });
});
