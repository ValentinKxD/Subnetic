import { convert, round2 } from '../../../shared/money.js';
import { getCurrentRates } from '../db/rates.js';
import { getUserCurrency } from '../db/settings.js';
import type { Currency, UserContext } from '../types.js';

/** Валюта користувача + актуальні курси з exchange_rates (НБУ або останні збережені). */
export function userContext(userId: number): UserContext {
  return { userId, currency: getUserCurrency(userId), rates: getCurrentRates().rates };
}

/** Сума у валюті користувача, округлена до копійок. */
export function toUserCurrency(ctx: UserContext, amount: number, from: Currency): number {
  return round2(convert(amount, from, ctx.currency, ctx.rates));
}
