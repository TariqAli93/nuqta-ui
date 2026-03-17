<template>
  <v-dialog v-model="dialog" max-width="520" persistent>
    <v-card>
      <v-card-title>إعدادات المحاسبة</v-card-title>

      <v-card-text>
        <v-switch
          v-model="form.autoPostOnSale"
          label="ترحيل تلقائي عند البيع"
          color="primary"
          density="comfortable"
          hide-details
          class="mb-2"
        />
        <v-switch
          v-model="form.autoPostOnPurchase"
          label="ترحيل تلقائي عند الشراء"
          color="primary"
          density="comfortable"
          hide-details
          class="mb-2"
        />
        <v-switch
          v-model="form.enforceBalancedEntries"
          label="فرض توازن القيود"
          color="primary"
          density="comfortable"
          hide-details
          class="mb-4"
        />
        <v-select
          v-model="form.defaultCostMethod"
          :items="costMethods"
          label="طريقة التكلفة"
          variant="outlined"
          density="comfortable"
          class="mb-2"
        />
        <v-select
          v-model="form.fiscalYearStart"
          :items="months"
          label="بداية السنة المالية"
          variant="outlined"
          density="comfortable"
        />
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">إلغاء</v-btn>
        <v-btn color="primary" variant="flat" :loading="saving" @click="save">حفظ</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useAccountingStore, type AccountingSettings } from '@/stores/accountingStore';
import { notifyError, notifySuccess } from '@/utils/notify';

const accountingStore = useAccountingStore();

const dialog = ref(false);
const saving = ref(false);

const form = reactive<AccountingSettings>({
  autoPostOnSale: true,
  autoPostOnPurchase: true,
  enforceBalancedEntries: true,
  defaultCostMethod: 'fifo',
  fiscalYearStart: 1,
});

const costMethods = [
  { title: 'الوارد أولاً صادر أولاً (FIFO)', value: 'fifo' },
  { title: 'الوارد أخيراً صادر أولاً (LIFO)', value: 'lifo' },
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

async function open() {
  await accountingStore.fetchAccountingSettings();
  const s = accountingStore.settings;
  form.autoPostOnSale = s.autoPostOnSale;
  form.autoPostOnPurchase = s.autoPostOnPurchase;
  form.enforceBalancedEntries = s.enforceBalancedEntries;
  form.defaultCostMethod = s.defaultCostMethod;
  form.fiscalYearStart = s.fiscalYearStart;
  dialog.value = true;
}

function close() {
  dialog.value = false;
}

async function save() {
  saving.value = true;
  try {
    const result = await accountingStore.saveAccountingSettings({ ...form });
    if (result.ok) {
      notifySuccess('تم حفظ إعدادات المحاسبة');
      close();
    } else {
      notifyError(result.error || 'فشل في حفظ الإعدادات');
    }
  } catch {
    notifyError('فشل في حفظ الإعدادات');
  } finally {
    saving.value = false;
  }
}

defineExpose({ open });
</script>
