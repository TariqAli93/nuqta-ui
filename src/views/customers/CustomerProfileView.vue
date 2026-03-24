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

      <!-- Info Cards -->
      <v-row dense>
        <v-col cols="6" sm="3">
          <v-card flat>
            <div class="ds-stat-card">
              <v-avatar color="grey" variant="tonal" size="40">
                <v-icon size="20">mdi-phone</v-icon>
              </v-avatar>
              <div class="ds-stat-card__info">
                <div class="ds-stat-card__label">الهاتف</div>
                <div class="ds-stat-card__value" style="font-size: 0.95rem" dir="ltr">
                  {{ customer.phone || '—' }}
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card flat>
            <div class="ds-stat-card">
              <v-avatar color="grey" variant="tonal" size="40">
                <v-icon size="20">mdi-city</v-icon>
              </v-avatar>
              <div class="ds-stat-card__info">
                <div class="ds-stat-card__label">المدينة</div>
                <div class="ds-stat-card__value" style="font-size: 0.95rem">
                  {{ customer.city || '—' }}
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card flat>
            <div class="ds-stat-card">
              <v-avatar
                :color="(customer.totalDebt ?? 0) > 0 ? 'error' : 'success'"
                variant="tonal"
                size="40"
              >
                <v-icon size="20">mdi-cash-clock</v-icon>
              </v-avatar>
              <div class="ds-stat-card__info">
                <div class="ds-stat-card__label">الرصيد المستحق</div>
                <MoneyDisplay :amount="customer.totalDebt ?? 0" size="lg" />
              </div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card flat>
            <div class="ds-stat-card">
              <v-avatar color="primary" variant="tonal" size="40">
                <v-icon size="20">mdi-cart</v-icon>
              </v-avatar>
              <div class="ds-stat-card__info">
                <div class="ds-stat-card__label">إجمالي المشتريات</div>
                <MoneyDisplay :amount="customer.totalPurchases ?? 0" size="lg" />
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Tabs -->
      <v-card flat>
        <v-tabs v-model="activeTab" color="primary" density="comfortable">
          <v-tab value="ledger">كشف الحساب</v-tab>
          <v-tab value="invoices">الفواتير</v-tab>
          <v-tab value="info">معلومات</v-tab>
        </v-tabs>
        <v-divider />

        <v-window v-model="activeTab">
          <!-- Ledger Tab -->
          <v-window-item value="ledger">
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
            <LedgerTable :entries="ledgerEntries" :loading="ledgerLoading" entity-type="customer" />
          </v-window-item>

          <!-- Invoices Tab -->
          <v-window-item value="invoices">
            <v-row dense class="mb-3">
              <v-col cols="auto">
                <v-btn-toggle v-model="invoiceFilter" mandatory density="compact" variant="outlined">
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
              @click:row="(_: Event, { item }: { item: any }) => router.push({ name: 'SaleDetails', params: { id: item.id } })"
            >
              <template #item.total="{ item }">
                <MoneyDisplay :amount="item.total" size="sm" />
              </template>
              <template #item.paidAmount="{ item }">
                <MoneyDisplay :amount="item.paidAmount ?? 0" size="sm" colored />
              </template>
              <template #item.remainingAmount="{ item }">
                <span :class="(item.remainingAmount ?? 0) > 0 ? 'text-error font-weight-bold' : 'text-success'">
                  <MoneyDisplay :amount="item.remainingAmount ?? 0" size="sm" />
                </span>
              </template>
              <template #item.status="{ item }">
                <v-chip
                  size="x-small"
                  variant="tonal"
                  :color="saleStatusColor(item.status)"
                >
                  {{ saleStatusLabel(item.status) }}
                </v-chip>
              </template>
              <template #item.createdAt="{ item }">
                {{ formatDate(item.createdAt) }}
              </template>
              <template #no-data>
                <div class="text-center py-8 text-medium-emphasis">لا توجد فواتير لهذا العميل</div>
              </template>
            </v-data-table>
          </v-window-item>

          <!-- Info Tab -->
          <v-window-item value="info">
            <v-card max-width="500">
              <v-card-text>
                <div class="mb-2"><strong>الاسم:</strong> {{ customer.name }}</div>
                <div class="mb-2"><strong>الهاتف:</strong> {{ customer.phone || '—' }}</div>
                <div class="mb-2"><strong>العنوان:</strong> {{ customer.address || '—' }}</div>
                <div class="mb-2"><strong>المدينة:</strong> {{ customer.city || '—' }}</div>
                <div class="mb-2"><strong>ملاحظات:</strong> {{ customer.notes || '—' }}</div>
              </v-card-text>
            </v-card>
          </v-window-item>
        </v-window>
      </v-card>
    </template>

    <!-- Payment Dialog -->
    <v-dialog v-model="showPaymentDialog" max-width="400" persistent class="ds-dialog">
      <v-card rounded="lg">
        <v-card-title>تسجيل دفعة</v-card-title>
        <v-card-text>
          <p class="mb-3 text-body-2 text-medium-emphasis">
            الرصيد المستحق: <strong class="text-error">
              <MoneyDisplay :amount="customer?.totalDebt ?? 0" size="sm" />
            </strong>
          </p>
          <MoneyInput v-model="paymentAmount" label="المبلغ" class="mb-3" />
          <div
            v-if="paymentAmount < 0"
            class="text-error text-caption mb-2"
          >
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

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const customer = ref<Customer | null>(null);
const activeTab = ref('ledger');

// Ledger
const ledgerEntries = ref<LedgerEntry[]>([]);
const ledgerLoading = ref(false);

// Sales / Invoices
const sales = ref<Sale[]>([]);
const salesLoading = ref(false);
const invoiceFilter = ref<'all' | 'unpaid' | 'partial'>('all');

const filteredSales = computed(() => {
  if (invoiceFilter.value === 'all') return sales.value;
  if (invoiceFilter.value === 'unpaid') {
    return sales.value.filter((s) => (s.paidAmount ?? 0) === 0 && s.status !== 'cancelled');
  }
  // partial: has some payment but remaining > 0
  return sales.value.filter(
    (s) => (s.paidAmount ?? 0) > 0 && (s.remainingAmount ?? 0) > 0 && s.status !== 'cancelled'
  );
});

const saleHeaders = [
  { title: 'رقم الفاتورة', key: 'invoiceNumber' },
  { title: 'التاريخ', key: 'createdAt', width: '140px' },
  { title: 'الإجمالي', key: 'total', align: 'end' as const },
  { title: 'المدفوع', key: 'paidAmount', align: 'end' as const },
  { title: 'المتبقي', key: 'remainingAmount', align: 'end' as const },
  { title: 'الحالة', key: 'status', width: '120px' },
];

function saleStatusColor(status: string | undefined): string {
  switch (status) {
    case 'completed': return 'success';
    case 'cancelled': return 'error';
    case 'refunded': return 'error';
    case 'partial_refund': return 'orange';
    case 'pending': return 'warning';
    default: return 'grey';
  }
}

function saleStatusLabel(status: string | undefined): string {
  switch (status) {
    case 'completed': return 'مكتمل';
    case 'cancelled': return 'ملغي';
    case 'refunded': return 'مسترد';
    case 'partial_refund': return 'استرداد جزئي';
    case 'pending': return 'معلق';
    default: return status ?? '—';
  }
}

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
    fetchLedger(customer.value.id!);
    // Refresh customer data to update debt balance
    const res = await customersClient.getById(customer.value.id!);
    if (res.ok) customer.value = res.data;
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
    fetchLedger(customer.value.id!);
    const res = await customersClient.getById(customer.value.id!);
    if (res.ok) customer.value = res.data;
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
