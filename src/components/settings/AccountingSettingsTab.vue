<template>
  <div>
    <v-card class="pa-4 mb-4" flat>
      <v-card-title class="d-flex align-center ga-2 mb-4">
        <v-icon color="primary">mdi-calculator-variant</v-icon>
        <span>إعدادات المحاسبة</span>
      </v-card-title>

      <v-form @submit.prevent="save">
        <v-row>
          <v-col cols="12" md="4">
            <v-switch
              v-model="accountingSettings.autoPostOnSale"
              label="ترحيل تلقائي عند البيع"
              color="primary"
              hint="إنشاء قيود محاسبية تلقائياً عند تسجيل عمليات البيع"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-switch
              v-model="accountingSettings.autoPostOnPurchase"
              label="ترحيل تلقائي عند الشراء"
              color="primary"
              hint="إنشاء قيود محاسبية تلقائياً عند تسجيل عمليات الشراء"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-switch
              v-model="accountingSettings.enforceBalancedEntries"
              label="فرض توازن القيود"
              color="primary"
              hint="رفض القيود المحاسبية غير المتوازنة (مدين ≠ دائن)"
              persistent-hint
            />
          </v-col>

          <v-divider class="my-4" />
          <v-col cols="12" md="6">
            <v-select
              v-model="accountingSettings.defaultCostMethod"
              :items="costMethods"
              label="طريقة حساب التكلفة"
              variant="outlined"
              density="compact"
              hint="FIFO: الوارد أولاً صادر أولاً"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="accountingSettings.fiscalYearStart"
              :items="months"
              label="بداية السنة المالية"
              variant="outlined"
              density="compact"
            />
          </v-col>
        </v-row>

        <v-btn type="submit" color="primary" variant="flat" class="mt-4" :loading="saving">
          حفظ
        </v-btn>
      </v-form>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { notifyError, notifySuccess } from '@/utils/notify';
import { toUserMessage } from '@/utils/errorMessage';
import { useAccountingStore } from '@/stores/accountingStore';

const saving = ref(false);
const accountingStore = useAccountingStore();

const costMethods = [
  { title: 'FIFO — الوارد أولاً صادر أولاً', value: 'fifo' },
  { title: 'المتوسط المرجح', value: 'weighted_average' },
];

const months = [
  { title: 'يناير', value: 1 },
  { title: 'فبراير', value: 2 },
  { title: 'مارس', value: 3 },
  { title: 'أبريل', value: 4 },
  { title: 'مايو', value: 5 },
  { title: 'يونيو', value: 6 },
  { title: 'يوليو', value: 7 },
  { title: 'أغسطس', value: 8 },
  { title: 'سبتمبر', value: 9 },
  { title: 'أكتوبر', value: 10 },
  { title: 'نوفمبر', value: 11 },
  { title: 'ديسمبر', value: 12 },
];

// Local form state — synced from store on load
const accountingSettings = reactive({
  autoPostOnSale: true,
  autoPostOnPurchase: true,
  enforceBalancedEntries: true,
  defaultCostMethod: 'fifo',
  fiscalYearStart: 1,
});

// Sync local form state when store settings change (e.g. after fetch)
watch(
  () => accountingStore.settings,
  (s) => {
    accountingSettings.autoPostOnSale = s.autoPostOnSale;
    accountingSettings.autoPostOnPurchase = s.autoPostOnPurchase;
    accountingSettings.enforceBalancedEntries = s.enforceBalancedEntries;
    accountingSettings.defaultCostMethod = s.defaultCostMethod;
    accountingSettings.fiscalYearStart = s.fiscalYearStart;
  },
  { deep: true }
);

async function save() {
  saving.value = true;
  try {
    const result = await accountingStore.saveAccountingSettings({ ...accountingSettings });
    if (result.ok) {
      notifySuccess('تم حفظ إعدادات المحاسبة');
    } else {
      notifyError(result.error ?? 'فشل في حفظ الإعدادات');
    }
  } catch (err) {
    notifyError(toUserMessage(err));
  } finally {
    saving.value = false;
  }
}

async function fetchSettings() {
  try {
    const result = await accountingStore.fetchAccountingSettings();
    console.log('fetch settings result', result);
  } catch (err) {
    notifyError(toUserMessage(err));
  }
}

onMounted(() => {
  void fetchSettings();
});
</script>
