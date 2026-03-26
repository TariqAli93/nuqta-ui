<template>
  <PageShell>
    <PageHeader title="تفاصيل فاتورة المشتريات" show-back :back-to="{ name: 'Purchases' }">
      <template v-if="purchase && purchase.paymentStatus !== 'paid'" #actions>
        <v-btn
          class="win-btn"
          color="primary"
          size="small"
          prepend-icon="mdi-cash-minus"
          @click="showPaymentDialog = true"
        >
          تسجيل دفعة
        </v-btn>
      </template>
    </PageHeader>

    <v-skeleton-loader v-if="purchasesStore.loading" type="card" />

    <template v-else-if="purchase">
      <div class="d-flex flex-column ga-4">
        <!-- Payment summary — values from backend -->
        <v-row dense>
          <v-col cols="6" sm="3">
            <StatCard icon="mdi-cash-multiple" label="الإجمالي" color="primary">
              <MoneyDisplay :amount="purchase.total" size="lg" />
            </StatCard>
          </v-col>
          <v-col cols="6" sm="3">
            <StatCard icon="mdi-cash-check" label="المدفوع" color="success">
              <MoneyDisplay :amount="purchase.paidAmount ?? 0" size="lg" colored />
            </StatCard>
          </v-col>
          <v-col cols="6" sm="3">
            <StatCard
              icon="mdi-cash-minus"
              label="المتبقي"
              :color="(purchase.remainingAmount ?? 0) > 0 ? 'error' : 'success'"
            >
              <MoneyDisplay :amount="purchase.remainingAmount ?? 0" size="lg" />
            </StatCard>
          </v-col>
          <v-col cols="6" sm="3">
            <StatCard
              icon="mdi-clipboard-check-outline"
              label="حالة الدفع"
              :color="paymentStatusColor(purchase.paymentStatus as NonNullable<Purchase['paymentStatus']>)"
            >
              <v-chip
                :color="paymentStatusColor(purchase.paymentStatus as NonNullable<Purchase['paymentStatus']>)"
                size="small"
                variant="tonal"
                label
              >
                {{ paymentStatusLabel(purchase.paymentStatus as NonNullable<Purchase['paymentStatus']>) }}
              </v-chip>
            </StatCard>
          </v-col>
        </v-row>

        <!-- Tabs -->
        <v-card elevation="0" variant="flat" class="border" rounded="lg">
          <v-tabs v-model="activeTab" color="primary" density="comfortable" grow>
            <v-tab value="products">المنتجات</v-tab>
            <v-tab value="payments">الدفعات</v-tab>
            <v-tab value="info">معلومات</v-tab>
          </v-tabs>
          <v-divider />

          <v-window v-model="activeTab">
            <v-window-item value="products">
        <v-data-table
          :headers="itemHeaders"
          :items="purchase.items ?? []"
          density="comfortable"
          class="ds-table-enhanced ds-table-striped"
          :items-per-page="-1"
          hide-default-footer
        >
          <template #item.unitCost="{ item }">
            <MoneyDisplay :amount="item.unitCost" size="sm" />
          </template>
          <template #item.lineSubtotal="{ item }">
            <MoneyDisplay :amount="item.lineSubtotal" size="sm" />
          </template>
          <template #no-data>
            <div class="text-center py-6 text-medium-emphasis">لا توجد أصناف في هذه الفاتورة</div>
          </template>
            </v-data-table>
            </v-window-item>

            <v-window-item value="payments">
              <div class="pa-4">
                <v-data-table
                  :headers="paymentHeaders"
                  :items="purchase.payments ?? []"
                  density="comfortable"
                  class="ds-table-enhanced ds-table-striped"
                  :items-per-page="10"
                >
                  <template #item.amount="{ item }">
                    <MoneyDisplay :amount="item.amount" size="sm" colored />
                  </template>
                  <template #item.paymentDate="{ item }">
                    {{ formatDate(item.paymentDate) }}
                  </template>
                  <template #no-data>
                    <div class="text-center py-6 text-medium-emphasis">لا توجد دفعات بعد</div>
                  </template>
                </v-data-table>
              </div>
            </v-window-item>

 

            <v-window-item value="info">
              <v-list lines="two" class="bg-transparent">
                <v-list-item prepend-icon="mdi-file-document-outline">
                  <v-list-item-title>رقم الفاتورة</v-list-item-title>
                  <v-list-item-subtitle>{{ purchase.invoiceNumber }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item prepend-icon="mdi-calendar">
                  <v-list-item-title>التاريخ</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(purchase.createdAt) }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item prepend-icon="mdi-information-outline">
                  <v-list-item-title>حالة الفاتورة</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                      :color="invoiceStatusColor(purchase.status)"
                      size="small"
                      variant="tonal"
                    >
                      {{ invoiceStatusLabel(purchase.status) }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-divider />
                <v-list-item prepend-icon="mdi-calculator">
                  <v-list-item-title>المجموع الفرعي</v-list-item-title>
                  <v-list-item-subtitle>
                    <MoneyDisplay :amount="purchase.subtotal" size="sm" />
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item prepend-icon="mdi-percent">
                  <v-list-item-title>الخصم</v-list-item-title>
                  <v-list-item-subtitle>
                    <MoneyDisplay :amount="purchase.discount ?? 0" size="sm" />
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item prepend-icon="mdi-receipt-text">
                  <v-list-item-title>الضريبة</v-list-item-title>
                  <v-list-item-subtitle>
                    <MoneyDisplay :amount="purchase.tax ?? 0" size="sm" />
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-window-item>
          </v-window>
        </v-card>
      </div>
    </template>

    <v-dialog v-model="showPaymentDialog" max-width="400" persistent class="ds-dialog">
      <v-card elevation="0" variant="flat" class="border" rounded="lg">
        <v-card-title class="text-subtitle-1 font-weight-bold">تسجيل دفعة</v-card-title>
        <v-card-text>
          <p class="mb-3 text-body-2 text-medium-emphasis">
            المتبقي:
            <strong class="text-error">
              <MoneyDisplay :amount="purchase?.remainingAmount ?? 0" size="sm" />
            </strong>
          </p>
          <MoneyInput v-model="paymentAmount" label="المبلغ" class="mb-3" />
          <div
            v-if="paymentAmount > (purchase?.remainingAmount ?? 0)"
            class="text-error text-caption mb-2"
          >
            المبلغ يتجاوز المتبقي
          </div>
          <div v-if="paymentAmount < 0" class="text-error text-caption mb-2">
            المبلغ لا يمكن أن يكون سالباً
          </div>
          <v-select
            v-model="paymentMethod"
            :items="paymentMethodOptions"
            item-title="title"
            item-value="value"
            label="طريقة الدفع"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          />
          <v-textarea
            v-model="paymentNotes"
            label="ملاحظات"
            variant="outlined"
            density="comfortable"
            rows="2"
          />
        </v-card-text>
        <v-card-actions class="px-4 py-3">
          <v-spacer />
          <v-btn variant="text" @click="showPaymentDialog = false">إلغاء</v-btn>
          <v-btn
            class="win-btn"
            color="primary"
            variant="flat"
            :loading="purchasesStore.loading"
            :disabled="
              paymentAmount <= 0 || paymentAmount > (purchase?.remainingAmount ?? 0)
            "
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
import { computed, onMounted, ref } from 'vue';
import { PageShell, PageHeader } from '@/components/layout';
import { StatCard } from '@/components/common';
import { formatDate } from '@/utils/formatters';
import { useRoute, useRouter } from 'vue-router';
import { usePurchasesStore } from '@/stores/purchasesStore';
import MoneyDisplay from '@/components/shared/MoneyDisplay.vue';
import MoneyInput from '@/components/shared/MoneyInput.vue';
import { notifyError, notifySuccess, notifyWarn } from '@/utils/notify';
import { mapErrorToArabic } from '@/i18n/t';
import { paymentStatusLabel, paymentStatusColor } from '@/types/invoice';
import type { Purchase } from '@/types/domain';

const route = useRoute();
const router = useRouter();
const purchasesStore = usePurchasesStore();

const purchase = computed(() => purchasesStore.currentPurchase);

const activeTab = ref('products');
const showPaymentDialog = ref(false);
const paymentAmount = ref(0);
const paymentNotes = ref('');
const paymentMethod = ref<'cash' | 'card' | 'bank_transfer' | 'credit'>('cash');

const paymentMethodOptions = [
  { title: 'نقدي', value: 'cash' },
  { title: 'بطاقة', value: 'card' },
  { title: 'حوالة بنكية', value: 'bank_transfer' },
  { title: 'آجل', value: 'credit' },
];

/** Invoice lifecycle status — separate from paymentStatus */
function invoiceStatusColor(status: Purchase['status']): string {
  switch (status) {
    case 'completed': return 'success';
    case 'cancelled': return 'error';
    case 'received': return 'info';
    case 'partial': return 'warning';
    default: return 'warning';
  }
}

function invoiceStatusLabel(status: Purchase['status']): string {
  switch (status) {
    case 'completed': return 'مكتمل';
    case 'cancelled': return 'ملغي';
    case 'received': return 'مستلم';
    case 'partial': return 'جزئي';
    default: return 'معلق';
  }
}

async function onRecordPayment() {
  if (!purchase.value || paymentAmount.value <= 0) return;
  const remaining = purchase.value.remainingAmount ?? 0;
  if (paymentAmount.value > remaining) {
    notifyWarn('المبلغ يتجاوز المتبقي', { dedupeKey: 'purchase-payment-max' });
    return;
  }

  const result = await purchasesStore.addPayment({
    purchaseId: purchase.value.id!,
    supplierId: purchase.value.supplierId,
    amount: paymentAmount.value,
    paymentMethod: paymentMethod.value,
    notes: paymentNotes.value || undefined,
  });

  if (!result.ok) {
    notifyError(mapErrorToArabic(result.error, 'errors.saveFailed'));
    return;
  }

  showPaymentDialog.value = false;
  paymentAmount.value = 0;
  paymentNotes.value = '';
  paymentMethod.value = 'cash';
  notifySuccess('تم تسجيل الدفعة بنجاح');
}

const itemHeaders = [
  { title: 'المنتج', key: 'productName' },
  { title: 'الوحدة', key: 'unitName' },
  { title: 'الكمية', key: 'quantity', align: 'center' as const },
  { title: 'سعر الوحدة', key: 'unitCost', align: 'end' as const },
  { title: 'المجموع', key: 'lineSubtotal', align: 'end' as const },
];

const paymentHeaders = [
  { title: 'التاريخ', key: 'paymentDate', width: '130px' },
  { title: 'الطريقة', key: 'paymentMethod' },
  { title: 'المبلغ', key: 'amount', align: 'end' as const },
];

const movementHeaders = [
  { title: 'التاريخ', key: 'createdAt', width: '130px' },
  { title: 'النوع', key: 'movementType' },
  { title: 'الكمية', key: 'quantityBase', align: 'center' as const },
  { title: 'قبل', key: 'stockBefore', align: 'center' as const },
  { title: 'بعد', key: 'stockAfter', align: 'center' as const },
];

onMounted(async () => {
  const result = await purchasesStore.fetchPurchaseById(Number(route.params.id));
  if (!result.ok) {
    notifyError(mapErrorToArabic(result.error, 'errors.loadFailed'));
    return;
  }
  if (!purchase.value) {
    notifyWarn('لم يتم العثور على الفاتورة', { dedupeKey: 'purchase-not-found' });
  }
});
</script>
