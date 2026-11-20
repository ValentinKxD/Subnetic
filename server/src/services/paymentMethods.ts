import type { PaymentMethodInput } from '../../../shared/domain.js';
import {
  deletePaymentMethod,
  insertPaymentMethod,
  listPaymentMethods,
  updatePaymentMethod,
} from '../db/paymentMethods.js';
import type { PaymentMethod, PaymentMethodDTO } from '../types.js';
import { notFound } from './errors.js';

const toDTO = ({ user_id: _u, ...m }: PaymentMethod): PaymentMethodDTO => m;

export function listMethods(userId: number): { items: PaymentMethodDTO[] } {
  return { items: listPaymentMethods(userId).map(toDTO) };
}

export function createMethod(userId: number, data: Required<PaymentMethodInput>): PaymentMethodDTO {
  return toDTO(insertPaymentMethod(userId, data));
}

export function updateMethod(userId: number, id: number, patch: Partial<PaymentMethodInput>): PaymentMethodDTO {
  const m = updatePaymentMethod(userId, id, patch);
  if (!m) throw notFound('Спосіб оплати');
  return toDTO(m);
}

export function removeMethod(userId: number, id: number): void {
  if (!deletePaymentMethod(userId, id)) throw notFound('Спосіб оплати');
}
