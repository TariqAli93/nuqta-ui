<template>
  <v-card elevation="0" variant="flat" class="border" rounded="lg">
    <v-card-title class="win-title px-4 pt-4 pb-2">
      {{ t('sales.paymentDetails') }}
    </v-card-title>
    <v-card-text class="pa-0">
      <v-list density="comfortable" lines="two">
        <!-- Payment type -->
        <v-list-item
          v-if="sale.paymentType"
          :title="t('sales.paymentType')"
          :subtitle="t(`enum.paymentType.${sale.paymentType}`)"
          :prepend-icon="paymentTypeIcon"
        />

        <!-- Payment method -->
        <template v-if="resolvedMethod">
          <v-divider />
          <v-list-item :title="t('sales.paymentMethod')" :prepend-icon="methodIcon">
            <template #subtitle>
              <v-chip size="small" variant="tonal" :color="methodColor" label>
                {{ methodLabel }}
              </v-chip>
            </template>
          </v-list-item>
        </template>

        <!-- Card reference number -->
        <template v-if="resolvedMethod === 'card' && sale.referenceNumber">
          <v-divider />
          <v-list-item :title="t('sales.referenceNumber')" prepend-icon="mdi-card-text-outline">
            <template #subtitle>
              <span class="font-weight-medium" dir="ltr">{{ maskedReference }}</span>
            </template>
          </v-list-item>
        </template>

        <!-- Paid amount — maps to invoice.paidAmount only, NOT ledger balance -->
        <v-divider />
        <v-list-item
          :title="t('sales.paidAmount')"
          :subtitle="formatAmount(sale.paidAmount ?? 0)"
          prepend-icon="mdi-cash-check"
        />

        <!-- Remaining Due — maps directly to invoice.remainingAmount from backend -->
        <template v-if="(sale.remainingAmount ?? 0) > 0">
          <v-divider />
          <v-list-item :title="t('sales.remaining')" prepend-icon="mdi-cash-clock">
            <template #subtitle>
              <span class="text-error font-weight-medium">
                {{ formatAmount(sale.remainingAmount ?? 0) }}
              </span>
            </template>
          </v-list-item>
        </template>

        <!--
          Cash change display — shown only for completed cash transactions where
          the customer paid more than the total and received change back.
          This is a display-only helper; it does NOT affect remainingAmount.
          remainingAmount = 0 means the invoice is fully settled per backend.
        -->
        <template v-if="cashChange > 0">
          <v-divider />
          <v-list-item :title="t('sales.changeAmount')" prepend-icon="mdi-cash-refund">
            <template #subtitle>
              <span class="text-success font-weight-medium">
                {{ formatAmount(cashChange) }}
              </span>
            </template>
          </v-list-item>
        </template>

        <!-- Bank transfer reference -->
        <template v-if="resolvedMethod === 'bank_transfer' && sale.referenceNumber">
          <v-divider />
          <v-list-item
            :title="t('sales.referenceNumber')"
            :subtitle="sale.referenceNumber"
            prepend-icon="mdi-bank-transfer"
          />
        </template>

        <!-- Credit warning -->
        <template v-if="isCreditSale">
          <v-divider />
          <v-list-item prepend-icon="mdi-alert-circle-outline" class="text-warning">
            <v-list-item-title class="text-body-2 text-warning">
              {{ t('sales.creditWarning') }}
            </v-list-item-title>
          </v-list-item>
        </template>

        <!-- Discount -->
        <template v-if="sale.discount">
          <v-divider />
          <v-list-item
            :title="t('sales.discount')"
            :subtitle="formatAmount(sale.discount)"
            prepend-icon="mdi-tag-outline"
          />
        </template>

        <!-- Tax -->
        <template v-if="sale.tax">
          <v-divider />
          <v-list-item
            :title="t('sales.tax')"
            :subtitle="formatAmount(sale.tax)"
            prepend-icon="mdi-percent-outline"
          />
        </template>

        <!-- Notes -->
        <template v-if="sale.notes">
          <v-divider />
          <v-list-item
            :title="t('common.notes')"
            :subtitle="sale.notes"
            prepend-icon="mdi-note-text-outline"
          />
        </template>

        <template v-if="sale.createdAt">
          <v-divider />
          <v-list-item
            :title="t('common.createdAt')"
            :subtitle="
              dateWithTime(sale.createdAt) + ' - (' + formatDateRelative(sale.createdAt) + ')'
            "
            prepend-icon="mdi-calendar-clock"
          />
        </template>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { t } from '@/i18n/t';
import type { Sale } from '@/types/domain';
import { dateWithTime, formatDateRelative } from '@/utils/formatters';

const props = defineProps<{
  sale: Sale;
}>();

type Method = 'cash' | 'card' | 'bank_transfer' | 'credit';

const resolvedMethod = computed<Method | null>(() => {
  const m = props.sale.paymentMethod;
  if (m === 'cash' || m === 'card' || m === 'bank_transfer' || m === 'credit') return m;
  // Infer from paymentType when paymentMethod is missing
  if (props.sale.paymentType === 'credit') return 'credit';
  if (props.sale.paymentType === 'cash') return 'cash';
  return null;
});

const isCreditSale = computed(
  () =>
    (resolvedMethod.value === 'credit' || props.sale.paymentType === 'credit') &&
    (props.sale.remainingAmount ?? 0) > 0
);

/**
 * Cash change given back to the customer.
 * Only meaningful for cash transactions where the customer overpaid.
 * backend.remainingAmount = 0 confirms the invoice is fully settled.
 * This computed is display-only and does not affect any financial state.
 */
const cashChange = computed(() => {
  const paid = props.sale.paidAmount ?? 0;
  const total = props.sale.total ?? 0;
  return Math.max(paid - total, 0);
});

const paymentTypeIcon = computed(() => {
  switch (props.sale.paymentType) {
    case 'cash':
      return 'mdi-cash';
    case 'credit':
      return 'mdi-clock-outline';
    case 'mixed':
      return 'mdi-swap-horizontal';
    default:
      return 'mdi-credit-card-outline';
  }
});

const methodIcon = computed(() => {
  switch (resolvedMethod.value) {
    case 'cash':
      return 'mdi-cash';
    case 'card':
      return 'mdi-credit-card-outline';
    case 'bank_transfer':
      return 'mdi-bank-transfer';
    case 'credit':
      return 'mdi-account-clock-outline';
    default:
      return 'mdi-help-circle-outline';
  }
});

const methodColor = computed(() => {
  switch (resolvedMethod.value) {
    case 'cash':
      return 'success';
    case 'card':
      return 'primary';
    case 'bank_transfer':
      return 'info';
    case 'credit':
      return 'warning';
    default:
      return 'grey';
  }
});

const methodLabel = computed(() => {
  if (!resolvedMethod.value) return '';
  return t(`enum.paymentMethod.${resolvedMethod.value}`);
});

/** Mask card reference: show only last 4 digits */
const maskedReference = computed(() => {
  const ref = props.sale.referenceNumber;
  if (!ref) return '';
  if (ref.length <= 4) return ref;
  return '•'.repeat(ref.length - 4) + ref.slice(-4);
});

function formatAmount(value: number): string {
  return new Intl.NumberFormat('ar-IQ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    numberingSystem: 'latn',
  }).format(Number.isInteger(value) ? value : 0);
}
</script>
