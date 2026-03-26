<template>
  <PageShell>
    <PageHeader
      :title="t('sales.details')"
      :subtitle="sale?.invoiceNumber ?? ''"
      show-back
      :back-to="{ name: 'Sales' }"
    >
      <template #actions>
        <v-btn
          class="win-btn"
          v-if="sale?.status === 'completed' || sale?.status === 'partial_refund'"
          color="warning"
          prepend-icon="mdi-cash-refund"
          :loading="refunding"
          @click="openRefundDialog(false)"
        >
          استرجاع مالي
        </v-btn>
        <v-btn
          class="win-btn"
          v-if="sale?.status === 'completed' || sale?.status === 'partial_refund'"
          color="deep-orange"
          prepend-icon="mdi-package-variant-closed-remove"
          :loading="refunding"
          @click="openRefundDialog(true)"
        >
          استرجاع مع إرجاع البضاعة
        </v-btn>
        <!-- تسوية الفاتورة: عندما يكون الدفع غير مكتمل -->
        <v-btn
          class="win-btn"
          v-if="sale?.paymentStatus === 'unpaid' || sale?.paymentStatus === 'partial'"
          color="success"
          prepend-icon="mdi-cash-check"
          @click="settleDialog = true"
        >
          تسوية
        </v-btn>
        <!-- تحصيل دفعة جزئية: عندما يكون الدفع غير مكتمل -->
        <v-btn
          class="win-btn"
          v-if="sale?.paymentStatus === 'unpaid' || sale?.paymentStatus === 'partial'"
          color="primary"
          prepend-icon="mdi-cash-plus"
          @click="collectPaymentDialog = true"
        >
          تحصيل دفعة
        </v-btn>
        <!-- Cancel is only allowed when no refund payments exist.
             Backend blocks cancellation if a refund payment is present
             (partial_refund status) to prevent double inventory reversal. -->
        <v-btn
          class="win-btn"
          v-if="sale?.status === 'completed' || sale?.status === 'pending'"
          color="error"
          prepend-icon="mdi-close-circle-outline"
          :loading="cancelling"
          @click="cancelDialog = true"
        >
          إلغاء الفاتورة
        </v-btn>
      </template>
    </PageHeader>

    <v-skeleton-loader v-if="loading" type="card, table" />

    <template v-else-if="sale">
      <!-- Summary cards -->
      <v-row dense>
        <v-col cols="12" sm="4">
          <v-card class="border" elevation="0" variant="flat" rounded="lg">
            <div class="ds-stat-card">
              <v-avatar color="primary" variant="tonal" size="40">
                <v-icon>mdi-receipt-text-outline</v-icon>
              </v-avatar>
              <div class="ds-stat-card__info">
                <div class="ds-stat-card__label">{{ t('sales.invoice') }}</div>
                <div class="ds-stat-card__value" style="font-size: 1rem">
                  {{ sale.invoiceNumber }}
                </div>
              </div>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="4">
          <v-card class="border" elevation="0" variant="flat" rounded="lg">
            <div class="ds-stat-card">
              <v-avatar :color="statusColor(sale.status)" variant="tonal" size="40">
                <v-icon>{{ statusIcon(sale.status) }}</v-icon>
              </v-avatar>
              <div class="ds-stat-card__info">
                <div class="ds-stat-card__label">{{ t('sales.status') }}</div>
                <v-chip :color="statusColor(sale.status)" size="small" variant="tonal" label>
                  {{ statusLabel(sale.status) }}
                </v-chip>
              </div>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" sm="4">
          <v-card class="border" elevation="0" variant="flat" rounded="lg">
            <div class="ds-stat-card">
              <v-avatar color="success" variant="tonal" size="40">
                <v-icon>mdi-cash-multiple</v-icon>
              </v-avatar>
              <div class="ds-stat-card__info">
                <div class="ds-stat-card__label">{{ t('sales.total') }}</div>
                <div class="ds-stat-card__value" style="font-size: 1rem">
                  {{ formatAmount(sale.total) }}
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Payment details -->
      <PaymentInfoCard :sale="sale" class="mb-4" />

      <!-- Payment history -->
      <v-card v-if="sale.payments?.length" class="border ds-table-wrapper mb-4" elevation="0" variant="flat" rounded="lg">
        <v-card-title class="text-body-1 font-weight-bold d-flex align-center">
          سجل الدفعات
          <v-spacer />
          <v-chip size="small" variant="tonal" color="primary">
            {{ sale.payments.length }}
          </v-chip>
        </v-card-title>
        <v-card-text class="pa-0">
          <v-data-table
            :headers="paymentHistoryHeaders"
            :items="sale.payments"
            density="comfortable"
            class="ds-table-enhanced ds-table-striped"
            :hide-default-footer="sale.payments.length <= 10"
          >
            <template #item.amount="{ item }">
              <span class="font-weight-bold">{{ formatAmount(item.amount) }}</span>
            </template>
            <template #item.paymentMethod="{ item }">
              <v-chip size="x-small" variant="tonal" :color="paymentMethodColor(item.paymentMethod)">
                {{ paymentMethodLabel(item.paymentMethod) }}
              </v-chip>
            </template>
            <template #item.paymentDate="{ item }">
              {{ item.paymentDate || item.createdAt || '—' }}
            </template>
            <template #item.notes="{ item }">
              {{ item.notes || '—' }}
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>

      <!-- Line items -->
      <v-card class="border ds-table-wrapper" elevation="0" variant="flat" rounded="lg">
        <v-card-title class="text-body-1 font-weight-bold">
          {{ t('sales.lineItems') }}
        </v-card-title>
        <v-card-text class="pa-0">
          <v-data-table
            v-if="sale.items?.length"
            :headers="itemHeaders"
            :items="sale.items"
            density="comfortable"
            class="ds-table-enhanced ds-table-striped"
            :hide-default-footer="true"
            :show-expand="paymentsOnInvoicesEnabled"
          >
            <template #item.productName="{ item }">
              <span class="font-weight-medium">{{ item.productName }}</span>
            </template>
            <template #item.unitPrice="{ item }">
              {{ formatAmount(item.unitPrice) }}
            </template>
            <template #item.discount="{ item }">
              {{ formatAmount(item.discount ?? 0) }}
            </template>
            <template #item.subtotal="{ item }">
              <span class="font-weight-bold">{{ formatAmount(item.subtotal) }}</span>
            </template>
            <!-- Expandable row: per-item batch depletion (FIFO) -->
            <template v-if="paymentsOnInvoicesEnabled" #expanded-row="{ columns, item }">
              <td :colspan="columns.length" class="pa-4">
                <div class="text-caption font-weight-bold mb-2">تفاصيل الدفعات</div>
                <v-table v-if="item.depletions?.length" density="comfortable">
                  <thead>
                    <tr>
                      <th>رقم الدفعة</th>
                      <th>تاريخ الانتهاء</th>
                      <th class="text-center">الكمية</th>
                      <th class="text-end">تكلفة الوحدة</th>
                      <th class="text-end">إجمالي التكلفة</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(dep, di) in item.depletions" :key="di">
                      <td>{{ dep.batchNumber ?? '—' }}</td>
                      <td>
                        <v-chip
                          v-if="dep.expiryDate"
                          size="x-small"
                          variant="tonal"
                          :color="expiryChipColor(dep.expiryDate)"
                        >
                          {{ dep.expiryDate }} · {{ expiryLabel(dep.expiryDate) }}
                        </v-chip>
                        <span v-else>—</span>
                      </td>
                      <td class="text-center">{{ dep.quantityBase }}</td>
                      <td class="text-end">{{ formatAmount(dep.costPerUnit ?? 0) }}</td>
                      <td class="text-end font-weight-medium">
                        {{ formatAmount(dep.totalCost ?? 0) }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>
                <div v-else class="text-caption text-medium-emphasis">
                  لا توجد تفاصيل دفعات — قد لا يكون المنتج يتتبع الدفعات
                </div>
              </td>
            </template>
            <template #bottom>
              <div class="d-flex justify-space-between pa-4 font-weight-bold">
                <span>{{ t('sales.total') }}</span>
                <span>{{ formatAmount(sale.total) }}</span>
              </div>
            </template>
          </v-data-table>

          <EmptyState
            v-else
            icon="mdi-package-variant-closed"
            :title="t('sales.noItems')"
            :description="t('sales.noItemsHint')"
          />
        </v-card-text>
      </v-card>

      <!-- COGS Summary (server-computed) -->
      <v-card v-if="sale.cogs != null" class="border mt-4" elevation="0" variant="flat" rounded="lg">
        <v-card-title class="text-body-1 font-weight-bold"> ملخص التكلفة </v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">تكلفة البضاعة المباعة</div>
              <div class="text-body-1 font-weight-bold">{{ formatAmount(sale.cogs) }}</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">هامش الربح</div>
              <div class="text-body-1 font-weight-bold text-success">
                {{ formatAmount(sale.total - (sale.cogs ?? 0)) }}
              </div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">نسبة الربح</div>
              <div class="text-body-1 font-weight-bold text-success">{{ profitMarginPct }}%</div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Audit Trail -->
      <!-- <v-card class="win-card mt-4" flat>
        <AuditLogTab entity-type="sale" :entity-id="sale?.id ?? 1" title="سجل تدقيق الفاتورة" />
      </v-card> -->
    </template>

    <!-- Refund confirmation dialog -->
    <v-dialog v-model="refundDialog" max-width="480" class="ds-dialog">
      <v-card rounded="lg">
        <v-card-title>تأكيد الاسترجاع</v-card-title>
        <v-card-text>
          <p class="mb-4">
            <template v-if="refundReturnToStock">
              سيتم استرجاع المبلغ المحدد وإعادة جميع البضاعة للمخزون وعكس القيود المحاسبية.
            </template>
            <template v-else> سيتم استرجاع المبلغ المحدد فقط بدون إعادة البضاعة للمخزون. </template>
          </p>
          <v-text-field
            v-model.number="refundAmount"
            type="number"
            label="مبلغ الاسترجاع"
            variant="outlined"
            density="comfortable"
            :min="1"
            :max="refundableBalance"
            :hint="`الحد الأقصى: ${formatAmount(refundableBalance)}`"
            hide-details="auto"
            :rules="[
              (v) => v > 0 || 'يجب أن يكون المبلغ أكبر من الصفر',
              (v) => v <= refundableBalance || 'المبلغ يتجاوز الرصيد القابل للاسترداد',
            ]"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn class="win-ghost-btn" variant="text" @click="refundDialog = false">إلغاء</v-btn>
          <v-btn
            class="win-btn"
            :color="refundReturnToStock ? 'deep-orange' : 'warning'"
            :loading="refunding"
            :disabled="!refundAmount || refundAmount <= 0 || refundAmount > refundableBalance"
            @click="executeRefund"
          >
            {{ refundReturnToStock ? 'استرجاع مع إرجاع البضاعة' : 'استرجاع مالي فقط' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Cancel confirmation dialog -->
    <v-dialog v-model="cancelDialog" max-width="420" class="ds-dialog">
      <v-card rounded="lg">
        <v-card-title>تأكيد الإلغاء</v-card-title>
        <v-card-text>
          هل أنت متأكد من إلغاء هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn class="win-ghost-btn" variant="text" @click="cancelDialog = false">إلغاء</v-btn>
          <v-btn class="win-btn" color="error" :loading="cancelling" @click="executeCancel">تأكيد الإلغاء</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Settle confirmation dialog -->
    <v-dialog v-model="settleDialog" max-width="480" class="ds-dialog">
      <v-card rounded="lg">
        <v-card-title>تأكيد التسوية</v-card-title>
        <v-card-text>
          <p class="mb-4">
            سيتم تسوية المبلغ المتبقي
            <strong>{{ formatAmount(sale?.remainingAmount ?? 0) }}</strong>
            وتحديث حالة الفاتورة.
          </p>

          <v-select
            v-model="settleForm.paymentMethod"
            :items="paymentMethodOptions"
            item-title="title"
            item-value="value"
            label="طريقة الدفع"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            class="mb-3"
          />

          <v-text-field
            v-if="settleRefRequired"
            v-model="settleForm.referenceNumber"
            label="رقم المرجع"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            class="mb-3"
            :rules="[(v) => !!v || 'رقم المرجع مطلوب عند الدفع بالبطاقة']"
          />

          <v-textarea
            v-model="settleForm.notes"
            label="ملاحظات"
            variant="outlined"
            density="comfortable"
            hide-details
            rows="2"
            auto-grow
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn class="win-ghost-btn" variant="text" @click="settleDialog = false">إلغاء</v-btn>
          <v-btn
            class="win-btn"
            color="success"
            :loading="settling"
            :disabled="settleRefRequired && !settleForm.referenceNumber.trim()"
            @click="executeSettle"
          >
            تأكيد التسوية
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Collect Payment dialog -->
    <v-dialog v-model="collectPaymentDialog" max-width="480" class="ds-dialog">
      <v-card rounded="lg">
        <v-card-title>تحصيل دفعة</v-card-title>
        <v-card-text>
          <p class="mb-4 text-body-2 text-medium-emphasis">
            المتبقي: <strong class="text-error">{{ formatAmount(sale?.remainingAmount ?? 0) }}</strong>
          </p>

          <MoneyInput
            v-model="collectPaymentAmount"
            label="مبلغ الدفعة"
            class="mb-3"
          />
          <div
            v-if="collectPaymentAmount > (sale?.remainingAmount ?? 0)"
            class="text-error text-caption mb-2"
          >
            المبلغ يتجاوز المتبقي
          </div>
          <div
            v-if="collectPaymentAmount < 0"
            class="text-error text-caption mb-2"
          >
            المبلغ لا يمكن أن يكون سالباً
          </div>

          <v-select
            v-model="collectPaymentMethod"
            :items="paymentMethodOptions"
            item-title="title"
            item-value="value"
            label="طريقة الدفع"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            class="mb-3"
          />

          <v-textarea
            v-model="collectPaymentNotes"
            label="ملاحظات"
            variant="outlined"
            density="comfortable"
            hide-details
            rows="2"
            auto-grow
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn class="win-ghost-btn" variant="text" @click="collectPaymentDialog = false">إلغاء</v-btn>
          <v-btn
            class="win-btn"
            color="primary"
            :loading="collectingPayment"
            :disabled="
              !collectPaymentAmount ||
              collectPaymentAmount <= 0 ||
              collectPaymentAmount > (sale?.remainingAmount ?? 0)
            "
            @click="executeCollectPayment"
          >
            تحصيل
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { PageShell, PageHeader } from '@/components/layout';
import { mapErrorToArabic, t } from '@/i18n/t';
import { useSalesStore } from '@/stores/salesStore';
import EmptyState from '@/components/common/EmptyState.vue';
import PaymentInfoCard from '@/components/shared/PaymentInfoCard.vue';
import type { Sale, SaleItem, PaymentMethod } from '@/types/domain';
import { notifyError, notifySuccess, notifyWarn } from '@/utils/notify';
import { useSystemSettingsStore } from '@/stores/settings';
import MoneyInput from '@/components/shared/MoneyInput.vue';

const store = useSalesStore();
const route = useRoute();

const sale = ref<Sale | null>(null);
const loading = ref(false);
const refunding = ref(false);
const cancelling = ref(false);
const refundDialog = ref(false);
const cancelDialog = ref(false);
const settleDialog = ref(false);
const settling = ref(false);
const refundReturnToStock = ref(true);
const refundAmount = ref(0);

const settleForm = ref({
  paymentMethod: 'cash' as PaymentMethod,
  referenceNumber: '',
  notes: '',
});

const paymentMethodOptions = [
  { title: 'نقدي', value: 'cash' },
  { title: 'بطاقة', value: 'card' },
  { title: 'حوالة بنكية', value: 'bank_transfer' },
  { title: 'آجل', value: 'credit' },
];

const settleRefRequired = computed(() => settleForm.value.paymentMethod === 'card');

// Collect payment dialog
const collectPaymentDialog = ref(false);
const collectPaymentAmount = ref(0);
const collectPaymentMethod = ref<PaymentMethod>('cash');
const collectPaymentNotes = ref('');
const collectingPayment = ref(false);

const settingsStore = useSystemSettingsStore();

const localizedError = computed(() =>
  store.error ? mapErrorToArabic(store.error, 'errors.loadFailed') : null
);

const paymentsOnInvoicesEnabled = computed(() => settingsStore.data?.paymentsOnInvoicesEnabled);

watch(localizedError, (value) => {
  if (!value) return;
  notifyError(value, { dedupeKey: 'sale-details-error' });
});

/**
 * Maximum amount that can still be refunded for this sale.
 * = paidAmount - totalRefundedSoFar
 * Backend enforces the same rule; this computed is used only for UI hints.
 */
const refundableBalance = computed(() => {
  if (!sale.value) return 0;
  return Math.max(0, (sale.value.paidAmount ?? 0) - (sale.value.refundedAmount ?? 0));
});

const profitMarginPct = computed(() => {
  if (!sale.value || !sale.value.cogs || sale.value.total === 0) return '0';
  const margin = ((sale.value.total - sale.value.cogs) / sale.value.total) * 100;
  return margin.toFixed(1);
});

const itemHeaders = computed(() => {
  const headers = [
    { title: t('sales.product'), key: 'productName' },
    { title: t('sales.qty'), key: 'quantity' },
    { title: t('sales.unitPrice'), key: 'unitPrice' },
    { title: t('sales.discount'), key: 'discount' },
    { title: t('sales.subtotal'), key: 'subtotal' },
  ];
  if (paymentsOnInvoicesEnabled.value) {
    headers.push({ title: '', key: 'data-table-expand' });
  }
  return headers;
});

const paymentHistoryHeaders = [
  { title: 'التاريخ', key: 'paymentDate', width: '140px' },
  { title: 'الطريقة', key: 'paymentMethod', width: '120px' },
  { title: 'المبلغ', key: 'amount', align: 'end' as const },
  { title: 'ملاحظات', key: 'notes' },
];

function paymentMethodColor(method: string | undefined): string {
  switch (method) {
    case 'cash': return 'success';
    case 'card': return 'primary';
    case 'bank_transfer': return 'info';
    case 'credit': return 'warning';
    default: return 'grey';
  }
}

function paymentMethodLabel(method: string | undefined): string {
  switch (method) {
    case 'cash': return 'نقدي';
    case 'card': return 'بطاقة';
    case 'bank_transfer': return 'حوالة';
    case 'credit': return 'آجل';
    default: return method ?? '—';
  }
}

function statusLabel(status: string | undefined): string {
  if (!status) return t('common.none');
  const value = t(`enum.saleStatus.${status}`);
  return value === t('errors.undefinedText') ? t('common.none') : value;
}

function statusColor(status: string | undefined): string {
  switch (status) {
    case 'completed':
      return 'success';
    case 'cancelled':
      return 'error';
    case 'refunded':
      return 'error';
    case 'partial_refund':
      return 'orange';
    case 'pending':
      return 'warning';
    default:
      return 'warning';
  }
}

function statusIcon(status: string | undefined): string {
  switch (status) {
    case 'completed':
      return 'mdi-check-circle-outline';
    case 'cancelled':
      return 'mdi-close-circle-outline';
    case 'refunded':
      return 'mdi-cash-refund';
    case 'partial_refund':
      return 'mdi-cash-minus';
    default:
      return 'mdi-clock-outline';
  }
}

function formatAmount(value: number): string {
  const normalized = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
  return new Intl.NumberFormat('ar-IQ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    numberingSystem: 'latn',
  }).format(normalized);
}

function isExpiringSoon(dateStr: string): boolean {
  const diff = new Date(dateStr).getTime() - Date.now();
  return diff >= 0 && diff < 30 * 24 * 60 * 60 * 1000;
}

function isExpired(dateStr: string): boolean {
  return new Date(dateStr).getTime() < Date.now();
}

function expiryChipColor(dateStr: string): string {
  if (isExpired(dateStr)) return 'error';
  if (isExpiringSoon(dateStr)) return 'warning';
  return 'grey';
}

function expiryLabel(dateStr: string): string {
  if (isExpired(dateStr)) return 'منتهي';
  if (isExpiringSoon(dateStr)) return 'قريب';
  return 'صالح';
}

function openRefundDialog(returnToStock: boolean) {
  refundReturnToStock.value = returnToStock;
  // Default to the full remaining refundable balance (paidAmount - alreadyRefunded).
  refundAmount.value = refundableBalance.value;
  refundDialog.value = true;
}

async function executeRefund() {
  if (!sale.value?.id) return;
  refunding.value = true;
  refundDialog.value = false;
  store.error = null;

  try {
    // Build per-item return list when the cashier requested goods return.
    // Each item with a valid id is included; backend restores inventory per-item (LIFO on batches).
    const returnItems = refundReturnToStock.value ? returnableItems.value : undefined;

    const result = await store.refundSale(
      sale.value.id,
      refundAmount.value,
      'Refund from sale details view',
      returnItems
    );
    if (result.ok) {
      notifySuccess('تم استرجاع الفاتورة');
      await loadSale();
    } else {
      notifyError(mapErrorToArabic(result.error, 'errors.refundFailed'));
    }
  } finally {
    refunding.value = false;
  }
}

async function executeCancel() {
  if (!sale.value?.id) return;
  cancelling.value = true;
  cancelDialog.value = false;
  store.error = null;

  try {
    const result = await store.cancelSale(sale.value.id);
    if (result.ok) {
      notifySuccess('تم إلغاء الفاتورة');
      await loadSale();
    } else {
      notifyError(mapErrorToArabic(result.error, 'errors.cancelFailed'));
    }
  } finally {
    cancelling.value = false;
  }
}

function resetSettleForm() {
  settleForm.value = { paymentMethod: 'cash', referenceNumber: '', notes: '' };
}

async function executeSettle() {
  if (!sale.value?.id) return;
  if (settleRefRequired.value && !settleForm.value.referenceNumber.trim()) return;
  settling.value = true;
  settleDialog.value = false;
  store.error = null;

  try {
    const result = await store.settleSale(sale.value.id, {
      paymentMethod: settleForm.value.paymentMethod,
      referenceNumber: settleForm.value.referenceNumber.trim() || undefined,
      notes: settleForm.value.notes.trim() || undefined,
    });
    if (result.ok) {
      notifySuccess('تم تسوية الفاتورة');
      resetSettleForm();
      await loadSale();
    } else {
      notifyError(mapErrorToArabic(result.error, 'errors.settleFailed'));
    }
  } finally {
    settling.value = false;
  }
}

async function executeCollectPayment() {
  if (!sale.value?.id) return;
  const remaining = sale.value.remainingAmount ?? 0;
  if (collectPaymentAmount.value <= 0 || collectPaymentAmount.value > remaining) {
    notifyWarn('المبلغ غير صالح', { dedupeKey: 'collect-payment-invalid' });
    return;
  }
  collectingPayment.value = true;
  collectPaymentDialog.value = false;
  store.error = null;

  try {
    const result = await store.addPayment(sale.value.id, {
      amount: collectPaymentAmount.value,
      paymentMethod: collectPaymentMethod.value,
      notes: collectPaymentNotes.value.trim() || undefined,
    });
    if (result.ok) {
      notifySuccess('تم تحصيل الدفعة بنجاح');
      collectPaymentAmount.value = 0;
      collectPaymentMethod.value = 'cash';
      collectPaymentNotes.value = '';
      await loadSale();
    } else {
      notifyError(mapErrorToArabic(result.error, 'errors.paymentFailed'));
    }
  } finally {
    collectingPayment.value = false;
  }
}

async function loadSale() {
  const id = Number(route.params.id);
  if (Number.isNaN(id)) return;
  loading.value = true;
  try {
    const result = await store.getSale(id);
    if (result.ok) {
      sale.value = result.data;
    } else {
      notifyError(mapErrorToArabic(result.error, 'errors.loadFailed'));
    }
  } finally {
    loading.value = false;
  }
}

function getRemainingReturnQuantity(item: SaleItem): number {
  const unitFactor = item.unitFactor && item.unitFactor > 0 ? item.unitFactor : 1;
  const soldBase = item.quantityBase != null ? item.quantityBase : item.quantity * unitFactor;
  const returnedBase = item.returnedQuantityBase ?? 0;
  const remainingBase = Math.max(0, soldBase - returnedBase);
  return Math.floor(remainingBase / unitFactor);
}

const returnableItems = computed(() =>
  (sale.value?.items ?? [])
    .filter((item) => item.id != null)
    .map((item) => ({
      saleItemId: item.id!,
      quantity: getRemainingReturnQuantity(item),
      returnToStock: true as const,
    }))
    .filter((item) => item.quantity > 0)
);

onMounted(() => {
  void loadSale();
  settingsStore.fetch();
});
</script>
