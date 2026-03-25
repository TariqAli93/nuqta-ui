<template>
  <PageShell>
    <v-skeleton-loader v-if="loading" type="card" />

    <template v-else-if="customer">
      <!-- Header -->
      <PageHeader :title="customer.name" show-back :back-to="{ name: 'Customers' }">
        <template #actions>
          <v-btn
            variant="tonal"
            size="small"
            prepend-icon="mdi-pencil"
            :to="{ name: 'CustomerEdit', params: { id: customer.id } }"
            >تعديل</v-btn
          >
        </template>
      </PageHeader>

      <!-- Stat Cards -->
      <v-row dense>
        <v-col cols="6" sm="3">
          <StatCard
            icon="mdi-phone"
            label="الهاتف"
            :value="customer.phone || '—'"
            size="sm"
            dir="ltr"
          />
        </v-col>
        <v-col cols="6" sm="3">
          <StatCard icon="mdi-city" label="المدينة" :value="customer.city || '—'" size="sm" />
        </v-col>
        <v-col cols="6" sm="3">
          <!--
            Customer balance derived from ledger running balance — the single
            source of truth on this page.  Do NOT use customer.totalDebt here.
          -->
          <StatCard
            icon="mdi-cash-clock"
            label="الرصيد المستحق"
            :color="customerLedgerBalance > 0 ? 'error' : 'success'"
            :value="formatMoney(customerLedgerBalance)"
          />
        </v-col>
        <v-col cols="6" sm="3">
          <StatCard
            icon="mdi-cart"
            label="إجمالي المشتريات"
            color="primary"
            :value="formatMoney(customer.totalPurchases ?? 0)"
          />
        </v-col>
      </v-row>

      <!-- Tabs -->
      <AppCard>
        <v-tabs v-model="activeTab" color="primary" density="comfortable" grow>
          <v-tab value="ledger">كشف الحساب</v-tab>
          <v-tab value="invoices">الفواتير</v-tab>
          <v-tab value="info">معلومات</v-tab>
        </v-tabs>
        <v-divider />

        <v-window v-model="activeTab">
          <!-- Ledger Tab — account balance history, not invoice dues -->
          <v-window-item value="ledger">
            <div class="pa-4">
              <v-row class="mb-3">
                <v-col cols="auto" class="d-flex ga-2">
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-cash-plus"
                    @click="showPaymentDialog = true"
                    >تسجيل دفعة</v-btn
                  >
                  <v-btn
                    variant="tonal"
                    color="warning"
                    prepend-icon="mdi-scale-balance"
                    @click="showAdjustmentDialog = true"
                    >تعديل رصيد</v-btn
                  >
                </v-col>
              </v-row>
              <LedgerTable
                :entries="ledgerEntries"
                :loading="ledgerLoading"
                entity-type="customer"
              />
            </div>
          </v-window-item>

          <!-- Invoices Tab — individual invoice payment state -->
          <v-window-item value="invoices">
            <div class="pa-4">
              <v-row dense class="mb-3">
                <v-col cols="auto">
                  <v-btn-toggle
                    v-model="invoiceFilter"
                    mandatory
                    density="compact"
                    variant="outlined"
                  >
                    <v-btn value="all">الكل</v-btn>
                    <v-btn value="unpaid">غير مدفوعة</v-btn>
                    <v-btn value="partial">مدفوعة جزئياً</v-btn>
                  </v-btn-toggle>
                </v-col>
              </v-row>
              <v-data-table
                :headers="saleHeaders"
                :items="filteredSales"
                :loading="salesLoading"
                density="compact"
                class="ds-table-enhanced ds-table-striped"
                :items-per-page="20"
                @click:row="
                  (_: Event, { item }: { item: any }) =>
                    router.push({ name: 'SaleDetails', params: { id: item.id } })
                "
              >
                <template #item.total="{ item }">
                  <MoneyDisplay :amount="item.total" size="sm" />
                </template>
                <template #item.paidAmount="{ item }">
                  <MoneyDisplay :amount="item.paidAmount ?? 0" size="sm" colored />
                </template>
                <!-- Remaining Due — directly from invoice.remainingAmount, NOT customer balance -->
                <template #item.remainingAmount="{ item }">
                  <span
                    :class="
                      (item.remainingAmount ?? 0) > 0
                        ? 'text-error font-weight-bold'
                        : 'text-success'
                    "
                  >
                    <MoneyDisplay :amount="item.remainingAmount ?? 0" size="sm" />
                  </span>
                </template>
                <!-- Payment status — from backend paymentStatus field, never derived manually -->
                <template #item.paymentStatus="{ item }">
                  <v-chip
                    v-if="item.paymentStatus"
                    size="x-small"
                    variant="tonal"
                    :color="paymentStatusColor(item.paymentStatus)"
                  >
                    {{ paymentStatusLabel(item.paymentStatus) }}
                  </v-chip>
                  <span v-else class="text-disabled">—</span>
                </template>
                <template #item.createdAt="{ item }">
                  {{ formatDate(item.createdAt) }}
                </template>
                <template #no-data>
                  <div class="text-center py-8 text-medium-emphasis">
                    لا توجد فواتير لهذا العميل
                  </div>
                </template>
              </v-data-table>
            </div>
          </v-window-item>

          <!-- Info Tab -->
          <v-window-item value="info">
            <div class="pa-4">
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-list density="compact" class="bg-transparent">
                    <v-list-item>
                      <template #prepend>
                        <v-icon size="20" class="me-3">mdi-account</v-icon>
                      </template>
                      <v-list-item-title class="text-medium-emphasis text-caption"
                        >الاسم</v-list-item-title
                      >
                      <v-list-item-subtitle class="font-weight-medium text-body-2">{{
                        customer.name
                      }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <template #prepend>
                        <v-icon size="20" class="me-3">mdi-phone</v-icon>
                      </template>
                      <v-list-item-title class="text-medium-emphasis text-caption"
                        >الهاتف</v-list-item-title
                      >
                      <v-list-item-subtitle class="font-weight-medium text-body-2" dir="ltr">{{
                        customer.phone || '—'
                      }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <template #prepend>
                        <v-icon size="20" class="me-3">mdi-city</v-icon>
                      </template>
                      <v-list-item-title class="text-medium-emphasis text-caption"
                        >المدينة</v-list-item-title
                      >
                      <v-list-item-subtitle class="font-weight-medium text-body-2">{{
                        customer.city || '—'
                      }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-list density="compact" class="bg-transparent">
                    <v-list-item>
                      <template #prepend>
                        <v-icon size="20" class="me-3">mdi-map-marker</v-icon>
                      </template>
                      <v-list-item-title class="text-medium-emphasis text-caption"
                        >العنوان</v-list-item-title
                      >
                      <v-list-item-subtitle class="font-weight-medium text-body-2">{{
                        customer.address || '—'
                      }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <template #prepend>
                        <v-icon size="20" class="me-3">mdi-note-text</v-icon>
                      </template>
                      <v-list-item-title class="text-medium-emphasis text-caption"
                        >ملاحظات</v-list-item-title
                      >
                      <v-list-item-subtitle class="font-weight-medium text-body-2">{{
                        customer.notes || '—'
                      }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-col>
              </v-row>
            </div>
          </v-window-item>
        </v-window>
      </AppCard>
    </template>

    <!-- Payment Dialog -->
    <v-dialog v-model="showPaymentDialog" max-width="400" persistent class="ds-dialog">
      <v-card rounded="lg">
        <v-card-title>تسجيل دفعة</v-card-title>
        <v-card-text>
          <p class="mb-3 text-body-2 text-medium-emphasis">
            الرصيد المستحق:
            <!--
              Customer balance comes from ledger, not customer.totalDebt.
              customerLedgerBalance is the single source of truth for this display.
            -->
            <strong class="text-error">
              <MoneyDisplay :amount="customerLedgerBalance" size="sm" />
            </strong>
          </p>
          <MoneyInput v-model="paymentAmount" label="المبلغ" class="mb-3" />
          <div v-if="paymentAmount < 0" class="text-error text-caption mb-2">
            المبلغ لا يمكن أن يكون سالباً
          </div>
          <v-textarea
            v-model="paymentNotes"
            label="ملاحظات"
            variant="outlined"
            density="compact"
            rows="2"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showPaymentDialog = false">إلغاء</v-btn>
          <v-btn
            color="primary"
            :loading="paymentLoading"
            :disabled="paymentAmount <= 0"
            @click="onRecordPayment"
          >
            حفظ
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Adjustment Dialog -->
    <v-dialog v-model="showAdjustmentDialog" max-width="400" persistent class="ds-dialog">
      <v-card rounded="lg">
        <v-card-title>تعديل رصيد يدوي</v-card-title>
        <v-card-text>
          <v-text-field
            v-model.number="adjustmentAmount"
            label="المبلغ"
            type="number"
            variant="outlined"
            density="compact"
            class="mb-3"
            dir="ltr"
          />
          <v-textarea
            v-model="adjustmentNotes"
            label="ملاحظات"
            variant="outlined"
            density="compact"
            rows="2"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showAdjustmentDialog = false">إلغاء</v-btn>
          <v-btn color="primary" :loading="adjustmentLoading" @click="onAddAdjustment">حفظ</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PageShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { PageShell, PageHeader } from '@/components/layout';
import { AppCard, StatCard } from '@/components/common';
import { useRoute, useRouter } from 'vue-router';
import { customersClient, customerLedgerClient, salesClient } from '@/api';
import type { Customer, Sale } from '@/types/domain';
import type { LedgerEntry } from '@/components/shared/LedgerTable.vue';
import MoneyDisplay from '@/components/shared/MoneyDisplay.vue';
import MoneyInput from '@/components/shared/MoneyInput.vue';
import LedgerTable from '@/components/shared/LedgerTable.vue';
import { formatDate } from '@/utils/formatters';
import { generateIdempotencyKey } from '@/utils/idempotency';
import { notifyError, notifyInfo, notifySuccess, notifyWarn } from '@/utils/notify';
import { toUserMessage } from '@/utils/errorMessage';
import { formatMoney } from '@/utils/formatters';
import { paymentStatusLabel, paymentStatusColor } from '@/types/invoice';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const customer = ref<Customer | null>(null);
const activeTab = ref('ledger');

// Ledger
const ledgerEntries = ref<LedgerEntry[]>([]);
const ledgerLoading = ref(false);

/**
 * Current customer account balance — the SINGLE source of truth on this page.
 * Derived from the ledger running balance (first entry = newest, per API sort order).
 * Falls back to 0 when no ledger entries exist.
 *
 * Do NOT use customer.totalDebt for display — it can be stale.
 * Do NOT mix this with invoice.remainingAmount — they are separate concepts.
 */
const customerLedgerBalance = computed<number>(() => {
  if (!ledgerEntries.value.length) return 0;
  // API returns entries newest-first; first entry holds the current running balance.
  return ledgerEntries.value[0].balanceAfter;
});

// Sales / Invoices
const sales = ref<Sale[]>([]);
const salesLoading = ref(false);
const invoiceFilter = ref<'all' | 'unpaid' | 'partial'>('all');

/**
 * Filter invoices by payment state using backend-authoritative paymentStatus.
 * Do NOT fall back to manual paidAmount/remainingAmount derivations here.
 */
const filteredSales = computed(() => {
  if (invoiceFilter.value === 'all') return sales.value;
  if (invoiceFilter.value === 'unpaid') {
    return sales.value.filter((s) => s.paymentStatus === 'unpaid');
  }
  // partial: backend paymentStatus = 'partial'
  return sales.value.filter((s) => s.paymentStatus === 'partial');
});

const saleHeaders = [
  { title: 'رقم الفاتورة', key: 'invoiceNumber' },
  { title: 'التاريخ', key: 'createdAt', width: '140px' },
  { title: 'الإجمالي', key: 'total', align: 'end' as const },
  { title: 'المدفوع', key: 'paidAmount', align: 'end' as const },
  { title: 'المتبقي', key: 'remainingAmount', align: 'end' as const },
  // Payment state column — uses paymentStatus (not operational status)
  { title: 'حالة الدفع', key: 'paymentStatus', width: '130px' },
];

// Payment dialog
const showPaymentDialog = ref(false);
const paymentAmount = ref(0);
const paymentNotes = ref('');
const paymentLoading = ref(false);

onMounted(async () => {
  const id = Number(route.params.id);
  const result = await customersClient.getById(id);
  if (result.ok) {
    customer.value = result.data;
  } else {
    notifyError(toUserMessage(result.error));
  }
  loading.value = false;
  fetchLedger(id);
  fetchSales(id);
  if (!customer.value) {
    notifyWarn('لم يتم العثور على العميل', { dedupeKey: 'customer-not-found' });
  }
});

async function fetchLedger(customerId: number) {
  ledgerLoading.value = true;
  const result = await customerLedgerClient.getLedger(customerId);
  if (result.ok) {
    ledgerEntries.value = result.data.items as LedgerEntry[];
  } else {
    notifyError(toUserMessage(result.error), { dedupeKey: 'customer-ledger-error' });
  }
  ledgerLoading.value = false;
}

async function fetchSales(customerId: number) {
  salesLoading.value = true;
  const result = await salesClient.getAll({ customerId, limit: 100, offset: 0 });
  if (result.ok) {
    sales.value = result.data.items;
  } else {
    notifyError(toUserMessage(result.error), { dedupeKey: 'customer-sales-error' });
  }
  salesLoading.value = false;
}

async function onRecordPayment() {
  if (!customer.value || paymentAmount.value <= 0) return;
  paymentLoading.value = true;
  const result = await customerLedgerClient.recordPayment({
    customerId: customer.value.id!,
    amount: paymentAmount.value,
    paymentMethod: 'cash',
    notes: paymentNotes.value || undefined,
    idempotencyKey: generateIdempotencyKey('customer-payment'),
  });
  paymentLoading.value = false;
  if (result.ok) {
    showPaymentDialog.value = false;
    paymentAmount.value = 0;
    paymentNotes.value = '';
    // Refetch ledger to get the updated running balance — customerLedgerBalance
    // will update automatically from the new ledgerEntries.
    await fetchLedger(customer.value.id!);
    fetchSales(customer.value.id!);
    notifySuccess('تم تسجيل الدفعة بنجاح');
  } else {
    notifyError(toUserMessage(result.error));
  }
}

// Adjustment dialog
const showAdjustmentDialog = ref(false);
const adjustmentAmount = ref(0);
const adjustmentNotes = ref('');
const adjustmentLoading = ref(false);

async function onAddAdjustment() {
  if (!customer.value || adjustmentAmount.value === 0) return;
  adjustmentLoading.value = true;
  const result = await customerLedgerClient.addAdjustment({
    customerId: customer.value.id!,
    amount: adjustmentAmount.value,
    notes: adjustmentNotes.value || undefined,
  });
  adjustmentLoading.value = false;
  if (result.ok) {
    showAdjustmentDialog.value = false;
    adjustmentAmount.value = 0;
    adjustmentNotes.value = '';
    // Refetch ledger to get the updated running balance.
    await fetchLedger(customer.value.id!);
    fetchSales(customer.value.id!);
    notifySuccess('تم تعديل الرصيد بنجاح');
  } else {
    notifyError(toUserMessage(result.error));
  }
}

watch(showAdjustmentDialog, (opened) => {
  if (!opened) return;
  notifyInfo('استخدم القيمة الموجبة لزيادة الدين، والسالبة لإنقاصه.', {
    dedupeKey: 'customer-adjustment-info',
  });
});
</script>
