<template>
  <div class="win-page">
    <v-skeleton-loader v-if="loading" type="card" />

    <template v-else-if="customer">
      <!-- Header -->
      <div class="ds-page-header-block">
        <div class="d-flex align-center ga-3">
          <v-btn icon="mdi-arrow-right" variant="text" size="small" @click="router.back()" />
          <div class="win-title">{{ customer.name }}</div>
        </div>
        <div class="ds-page-header__actions">
          <v-btn
            variant="tonal"
            size="small"
            prepend-icon="mdi-pencil"
            :to="{ name: 'CustomerEdit', params: { id: customer.id } }"
            >تعديل</v-btn
          >
        </div>
      </div>

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
          <MoneyInput v-model="paymentAmount" label="المبلغ" class="mb-3" />
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
          <v-btn color="primary" :loading="paymentLoading" @click="onRecordPayment">حفظ</v-btn>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { customersClient, customerLedgerClient } from '../../api';
import type { Customer } from '../../types/domain';
import type { LedgerEntry } from '../../components/shared/LedgerTable.vue';
import MoneyDisplay from '../../components/shared/MoneyDisplay.vue';
import MoneyInput from '../../components/shared/MoneyInput.vue';
import LedgerTable from '../../components/shared/LedgerTable.vue';
import { generateIdempotencyKey } from '../../utils/idempotency';
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
