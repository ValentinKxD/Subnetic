import { Link } from 'react-router-dom';
import { Card, EmptyState, ServiceIcon } from '@/components/ui';
import {
  billingPeriodAdverbs,
  formatDayMonth,
  formatMoney,
  formatRelativeDays,
  formatWeekday,
} from '@/lib/format';
import type { Currency, NextPaymentInfo } from '@/lib/types';
import { ui } from '@/lib/ui';

export interface NextPaymentProps {
  payment: NextPaymentInfo | null;
  currency: Currency;
}

/** Акцентний блок «Найближче списання»: лише один найближчий платіж. */
export function NextPayment({ payment, currency }: NextPaymentProps) {
  if (!payment) {
    return (
      <Card variant="base">
        <EmptyState
          title="Найближчих списань немає"
          description="Додайте активну підписку, і тут з’явиться дата наступного платежу."
        />
      </Card>
    );
  }

  const meta = [billingPeriodAdverbs[payment.billing_period], payment.payment_method].filter(Boolean).join(' · ');
  const relative =
    payment.days_until < 0 ? `Прострочено: ${formatRelativeDays(payment.date)}` : formatRelativeDays(payment.date);

  return (
    <section aria-label="Найближче списання" className={ui.hero.card}>
      <div className={ui.hero.main}>
        <span className={ui.hero.iconRing}>
          <ServiceIcon name={payment.service.name} icon={payment.service.icon} brandColor={payment.service.brand_color} size="lg" />
        </span>
        <div className={ui.hero.text}>
          <span className={ui.hero.eyebrow}>{payment.trial_end ? 'Кінець пробного періоду' : 'Найближче списання'}</span>
          <span className={ui.hero.title}>
            {payment.service.name} · {payment.plan_name}
          </span>
          <span className={ui.hero.meta}>{meta}</span>
        </div>
      </div>
      <div className={ui.hero.side}>
        <div className="flex flex-col gap-1">
          <span className={ui.hero.amount}>{formatMoney(payment.converted_amount, currency)}</span>
          <span className={ui.hero.meta}>
            {formatDayMonth(payment.date)}, {formatWeekday(payment.date)}
            {payment.currency !== currency && ` · ${formatMoney(payment.amount, payment.currency)}`}
          </span>
        </div>
        <span className={ui.hero.pill}>{relative}</span>
        <Link to="/calendar" className={ui.hero.button}>
          Переглянути
        </Link>
      </div>
    </section>
  );
}
