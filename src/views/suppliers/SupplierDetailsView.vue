<template>
  <PageShell>
    <v-skeleton-loader v-if="loading" type="card" />

    <template v-else-if="supplier">
      <PageHeader :title="supplier.name" show-back :back-to="{ name: 'Suppliers' }">
        <template #actions>
          <v-btn
            variant="tonal"
            prepend-icon="mdi-pencil"
            :to="{ name: 'SupplierEdit', params: { id: supplier.id } }"
          >
            تعديل
          </v-btn>
          <v-btn color="primary" prepend-icon="mdi-cash-minus" @click="showPaymentDialog = true">
            تسجيل دفعة
          </v-btn>
        </template>
      </PageHeader>

      <v-row class="mb-4" dense>
        <v-col cols="6" sm="3">
          <v-card variant="tonal">
            <v-card-text class="text-center">
              <div class="text-caption">الهاتف</div>
              <div class="text-body-1" dir="ltr">{{ supplier.phone || '—' }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card variant="tonal">
            <v-card-text class="text-center">
              <div class="text-caption">المدينة</div>
              <div class="text-body-1">{{ supplier.city || '—' }}</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card variant="tonal" :color="(supplier.currentBalance ?? 0) > 0 ? 'error' : 'success'">
            <v-card-text class="text-center">
              <div class="text-caption">الرصيد المستحق</div>
              <MoneyDisplay :amount="supplier.currentBalance ?? 0" size="lg" />
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="6" sm="3">
          <v-card variant="tonal" color="primary">
            <v-card-text class="text-center">
              <div class="text-caption">عدد المشتريات</div>
              <div class="text-h6">{{ purchases.length }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-tabs v-model="activeTab" class="mb-4">
        <v-tab value="ledger">كشف الحساب</v-tab>
        <v-tab value="purchases">المشتريات</v-tab>
        <v-tab value="info">معلومات</v-tab>
      </v-tabs>

      <v-window v-model="activeTab">
        <v-window-item value="ledger">
          <LedgerTable :entries="ledgerEntries" :loading="ledgerLoading" entity-type="supplier" />
        </v-window-item>

        <v-window-item value="purchases">
          <v-row dense class="mb-3">
            <v-col cols="auto">
              <v-btn-toggle v-model="purchaseFilter" mandatory density="compact" variant="outlined">
                <v-btn value="all">الكل</v-btn>
                <v-btn value="unpaid">غير مدفوعة</v-btn>
                <v-btn value="partial">مدفوعة جزئياً</v-btn>
              </v-btn-toggle>
            </v-col>
          </v-row>
          <v-data-table
            :headers="purchaseHeaders"
            :items="filteredPurchases"
            :loading="purchasesLoading"
            density="compact"
            :items-per-page="20"
            @click:row="
              (_: Event, { item }: { item: any }) =>
                router.push({ name: 'PurchaseDetails', params: { id: item.id } })
            "
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
            <template #item.createdAt="{ item }">
              {{ formatDate(item.createdAt) }}
            </template>
            <template #item.status="{ item }">
              <v-chip
                size="x-small"
                variant="tonal"
                :color="purchaseStatusColor(item)"
              >
                {{ purchasePaymentLabel(item) }}
              </v-chip>
            </template>
            <template #no-data>
              <div class="text-center py-8 text-medium-emphasis">لا توجد مشتريات لهذا المورد</div>
            </template>
          </v-data-table>
        </v-window-item>

        <v-window-item value="info">
          <v-card max-width="500">
            <v-card-text>
              <div class="mb-2"><strong>الاسم:</strong> {{ supplier.name }}</div>
              <div class="mb-2"><strong>الهاتف:</strong> {{ supplier.phone || '—' }}</div>
              <div class="mb-2"><strong>العنوان:</strong> {{ supplier.address || '—' }}</div>
              <div class="mb-2"><strong>المدينة:</strong> {{ supplier.city || '—' }}</div>
              <div class="mb-2"><strong>ملاحظات:</strong> {{ supplier.notes || '—' }}</div>
            </v-card-text>
          </v-card>
        </v-window-item>
      </v-window>
    </template>

    <v-dialog v-model="showPaymentDialog" max-width="400" persistent class="ds-dialog">
      <v-card rounded="lg">
        <v-card-title>تسجيل دفعة مورد</v-card-title>
        <v-card-text>
          <p class="mb-3 text-body-2 text-medium-emphasis">
            الرصيد المستحق: <strong class="text-error"><MoneyDisplay :amount="supplier?.currentBalance ?? 0" size="sm" /></strong>
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
  </PageShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { formatDate } from '@/utils/formatters';
import { useRoute, useRouter } from 'vue-router';
import { PageShell, PageHeader } from '@/components/layout';
import { suppliersClient, supplierLedgerClient, purchasesClient } from '@/api';
import type { Supplier } from '@/types/domain';
import type { LedgerEntry } from '@/components/shared/LedgerTable.vue';
import type { Purchase } from '@/types/domain';
import LedgerTable from '@/components/shared/LedgerTable.vue';
import MoneyDisplay from '@/components/shared/MoneyDisplay.vue';
import MoneyInput from '@/components/shared/MoneyInput.vue';
import { generateIdempotencyKey } from '@/utils/idempotency';
import { notifyError, notifySuccess, notifyWarn } from '@/utils/notify';
import { toUserMessage } from '@/utils/errorMessage';

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const supplier = ref<Supplier | null>(null);
const activeTab = ref('ledger');

const ledgerEntries = ref<LedgerEntry[]>([]);
const purchases = ref<Purchase[]>([]);
const ledgerLoading = ref(false);
const purchasesLoading = ref(false);

const showPaymentDialog = ref(false);
const paymentAmount = ref(0);
const paymentNotes = ref('');
const paymentLoading = ref(false);

const purchaseHeaders = [
  { title: 'رقم الفاتورة', key: 'invoiceNumber' },
  { title: 'التاريخ', key: 'createdAt', width: '140px' },
  { title: 'الإجمالي', key: 'total', align: 'end' as const },
  { title: 'المدفوع', key: 'paidAmount', align: 'end' as const },
  { title: 'المتبقي', key: 'remainingAmount', align: 'end' as const },
  { title: 'الحالة', key: 'status', width: '120px' },
];

const purchaseFilter = ref<'all' | 'unpaid' | 'partial'>('all');

const filteredPurchases = computed(() => {
  if (purchaseFilter.value === 'all') return purchases.value;
  if (purchaseFilter.value === 'unpaid') {
    return purchases.value.filter((p) => (p.paidAmount ?? 0) === 0 && p.status !== 'cancelled');
  }
  return purchases.value.filter(
    (p) => (p.paidAmount ?? 0) > 0 && (p.remainingAmount ?? 0) > 0 && p.status !== 'cancelled'
  );
});

function purchaseStatusColor(p: { remainingAmount?: number; paidAmount?: number; status?: string }): string {
  if (p.status === 'cancelled') return 'error';
  const remaining = p.remainingAmount ?? 0;
  const paid = p.paidAmount ?? 0;
  if (remaining <= 0 && paid > 0) return 'success';
  if (paid > 0 && remaining > 0) return 'warning';
  return 'error';
}

function purchasePaymentLabel(p: { remainingAmount?: number; paidAmount?: number }): string {
  const remaining = p.remainingAmount ?? 0;
  const paid = p.paidAmount ?? 0;
  if (remaining <= 0 && paid > 0) return 'مدفوع';
  if (paid > 0 && remaining > 0) return 'جزئي';
  return 'غير مدفوع';
}

onMounted(async () => {
  await refreshSupplier();
});

async function refreshSupplier() {
  const id = Number(route.params.id);
  const result = await suppliersClient.getById(id);
  if (result.ok) {
    supplier.value = result.data;
    if (!supplier.value) {
      notifyWarn('لم يتم العثور على المورد', { dedupeKey: 'supplier-not-found' });
    } else {
      await Promise.all([fetchLedger(id), fetchPurchases(id)]);
    }
  } else {
    notifyError(toUserMessage(result.error));
    supplier.value = null;
  }
  loading.value = false;
}

async function fetchLedger(supplierId: number) {
  ledgerLoading.value = true;
  const result = await supplierLedgerClient.getLedger(supplierId);
  if (result.ok) {
    ledgerEntries.value = result.data.items as LedgerEntry[];
  } else {
    notifyError(toUserMessage(result.error), { dedupeKey: 'supplier-ledger-error' });
  }
  ledgerLoading.value = false;
}

async function fetchPurchases(supplierId: number) {
  purchasesLoading.value = true;
  const result = await purchasesClient.getAll({ supplierId, limit: 100, offset: 0 });
  if (result.ok) {
    purchases.value = result.data.items;
  } else {
    notifyError(toUserMessage(result.error), { dedupeKey: 'supplier-purchases-error' });
  }
  purchasesLoading.value = false;
}

async function onRecordPayment() {
  if (!supplier.value || paymentAmount.value <= 0) return;
  paymentLoading.value = true;
  const result = await supplierLedgerClient.recordPayment({
    supplierId: supplier.value.id!,
    amount: paymentAmount.value,
    paymentMethod: 'cash',
    notes: paymentNotes.value || undefined,
    idempotencyKey: generateIdempotencyKey('supplier-payment'),
  });
  paymentLoading.value = false;
  if (!result.ok) {
    notifyError(toUserMessage(result.error));
    return;
  }
  showPaymentDialog.value = false;
  paymentAmount.value = 0;
  paymentNotes.value = '';
  await refreshSupplier();
  notifySuccess('تم تسجيل الدفعة بنجاح');
}
</script>
