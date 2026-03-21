<template>
  <v-container>
    <div class="win-page">
      <v-app-bar class="mb-6" border="bottom">
        <template #prepend>
          <v-btn icon="mdi-arrow-right" variant="text" to="/sales" />
        </template>
        <v-app-bar-title>
          <div class="win-title mb-0">{{ t('sales.details') }}</div>
          <div class="text-sm">{{ sale?.invoiceNumber ?? '' }}</div>
        </v-app-bar-title>

        <template #append>
          <div class="d-flex ga-2">
            <v-btn
              v-if="sale?.status === 'completed' || sale?.status === 'partial_refund'"
              color="warning"
              prepend-icon="mdi-cash-refund"
              :loading="refunding"
              @click="openRefundDialog(false)"
            >
              استرجاع مالي
            </v-btn>
            <v-btn
              v-if="sale?.status === 'completed' || sale?.status === 'partial_refund'"
              color="deep-orange"
              prepend-icon="mdi-package-variant-closed-remove"
              :loading="refunding"
              @click="openRefundDialog(true)"
            >
              استرجاع مع إرجاع البضاعة
            </v-btn>
            <!-- تسوية الفاتورة في حال المتبقي اكبر من 0 -->
            <v-btn
              v-if="
                sale?.status === 'pending' &&
                (sale.paidAmount < sale.remainingAmount || sale.remainingAmount > 0)
              "
              color="success"
              prepend-icon="mdi-cash-check"
              @click="settleDialog = true"
            >
              تسوية
            </v-btn>
            <!-- Cancel is only allowed when no refund payments exist.
                 Backend blocks cancellation if a refund payment is present
                 (partial_refund status) to prevent double inventory reversal. -->
            <v-btn
              v-if="sale?.status === 'completed' || sale?.status === 'pending'"
              color="error"
              prepend-icon="mdi-close-circle-outline"
              :loading="cancelling"
              @click="cancelDialog = true"
            >
              إلغاء الفاتورة
            </v-btn>
          </div>
        </template>
      </v-app-bar>

      <v-skeleton-loader v-if="loading" type="card, table" class="mb-4" />

      <template v-else-if="sale">
        <!-- Summary cards -->
        <v-row class="mb-4" dense>
          <v-col cols="12" sm="4">
            <v-card class="win-card" flat>
              <v-card-text class="d-flex align-center ga-3 pa-4">
                <v-avatar color="primary" variant="tonal" size="40">
                  <v-icon>mdi-receipt-text-outline</v-icon>
                </v-avatar>
                <div>
                  <div class="text-caption text-medium-emphasis">{{ t('sales.invoice') }}</div>
                  <div class="text-body-1 font-weight-bold">{{ sale.invoiceNumber }}</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="4">
            <v-card class="win-card" flat>
              <v-card-text class="d-flex align-center ga-3 pa-4">
                <v-avatar :color="statusColor(sale.status)" variant="tonal" size="40">
                  <v-icon>{{ statusIcon(sale.status) }}</v-icon>
                </v-avatar>
                <div>
                  <div class="text-caption text-medium-emphasis">{{ t('sales.status') }}</div>
                  <v-chip :color="statusColor(sale.status)" size="small" variant="tonal" label>
                    {{ statusLabel(sale.status) }}
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" sm="4">
            <v-card class="win-card" flat>
              <v-card-text class="d-flex align-center ga-3 pa-4">
                <v-avatar color="success" variant="tonal" size="40">
                  <v-icon>mdi-cash-multiple</v-icon>
                </v-avatar>
                <div>
                  <div class="text-caption text-medium-emphasis">{{ t('sales.total') }}</div>
                  <div class="text-body-1 font-weight-bold">{{ formatAmount(sale.total) }}</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Payment details -->
        <PaymentInfoCard :sale="sale" class="mb-4" />

        <!-- Line items -->
        <v-card class="win-card" flat>
          <v-card-title class="pa-4 text-body-1 font-weight-bold">
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
                  <v-table v-if="item.depletions?.length" density="compact">
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
        <v-card v-if="sale.cogs != null" class="win-card mt-4" flat>
          <v-card-title class="pa-4 text-body-1 font-weight-bold"> ملخص التكلفة </v-card-title>
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
    </div>

    <!-- Refund confirmation dialog -->
    <v-dialog v-model="refundDialog" max-width="480">
      <v-card>
        <v-card-title>تأكيد الاسترجاع</v-card-title>
        <v-card-text>
          <p class="mb-4">
            <template v-if="refundReturnToStock">
              سيتم استرجاع المبلغ المحدد وإعادة جميع البضاعة للمخزون وعكس القيود المحاسبية.
            </template>
            <template v-else>
              سيتم استرجاع المبلغ المحدد فقط بدون إعادة البضاعة للمخزون.
            </template>
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
          <v-btn variant="text" @click="refundDialog = false">إلغاء</v-btn>
          <v-btn
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
    <v-dialog v-model="cancelDialog" max-width="420">
      <v-card>
        <v-card-title>تأكيد الإلغاء</v-card-title>
        <v-card-text>
          هل أنت متأكد من إلغاء هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="cancelDialog = false">إلغاء</v-btn>
          <v-btn color="error" :loading="cancelling" @click="executeCancel">تأكيد الإلغاء</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Settle confirmation dialog -->
    <v-dialog v-model="settleDialog" max-width="480">
      <v-card>
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
          <v-btn variant="text" @click="settleDialog = false">إلغاء</v-btn>
          <v-btn
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
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { mapErrorToArabic, t } from '../../i18n/t';
import { useSalesStore } from '../../stores/salesStore';
import EmptyState from '../../components/emptyState.vue';
import PaymentInfoCard from '../../components/shared/PaymentInfoCard.vue';
import AuditLogTab from '../../components/shared/AuditLogTab.vue';
import type { Sale } from '../../types/domain';
import { notifyError, notifySuccess } from '@/utils/notify';
import { useSystemSettingsStore } from '@/stores/settings';
import type { PaymentMethod } from '@/types/domain';

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
    const returnItems = refundReturnToStock.value
      ? (sale.value.items ?? [])
          .filter((item) => item.id != null)
          .map((item) => ({
            saleItemId: item.id!,
            quantity: item.quantity,
            returnToStock: true as const,
          }))
      : undefined;

    const result = await store.refundSale(
      sale.value.id,
      refundAmount.value,
      'Refund from sale details view',
      returnItems,
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

async function loadSale() {
  const id = Number(route.params.id);
  if (Number.isNaN(id)) return;
  loading.value = true;
  const result = await store.getSale(id);
  if (result.ok) {
    sale.value = result.data;
  } else {
    notifyError(mapErrorToArabic(result.error, 'errors.loadFailed'));
  }
  loading.value = false;
}

onMounted(() => {
  void loadSale();
  settingsStore.fetch();
});
</script>
