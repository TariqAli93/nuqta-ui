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
              v-model="accountingForm.taxEnabled"
              label="تفعيل الضريبة"
              color="primary"
              hint="تفعيل حساب الضريبة على الفواتير"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.taxRate"
              label="نسبة الضريبة (%)"
              type="number"
              min="0"
              max="100"
              variant="outlined"
              density="compact"
              :disabled="!accountingForm.taxEnabled"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="accountingForm.taxName"
              label="اسم الضريبة"
              variant="outlined"
              density="compact"
              :disabled="!accountingForm.taxEnabled"
            />
          </v-col>

          <v-divider class="my-4" />

          <v-col cols="12" md="6">
            <v-select
              v-model="accountingForm.costingMethod"
              :items="costMethods"
              label="طريقة حساب التكلفة"
              variant="outlined"
              density="compact"
              hint="FIFO: الوارد أولاً صادر أولاً"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="accountingForm.fiscalYearStart"
              label="بداية السنة المالية (MM-DD)"
              variant="outlined"
              density="compact"
              placeholder="01-01"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="accountingForm.exchangeRate"
              label="سعر الصرف (USD → IQD)"
              type="number"
              min="0"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="accountingForm.roundingMode"
              :items="roundingModes"
              label="نمط التقريب"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="accountingForm.roundingPrecision"
              label="دقة التقريب"
              type="number"
              min="0"
              max="8"
              variant="outlined"
              density="compact"
            />
          </v-col>
        </v-row>

        <v-btn
          type="submit"
          color="primary"
          variant="flat"
          class="mt-4"
          :loading="saving"
          :disabled="!isDirty"
        >
          حفظ
        </v-btn>
      </v-form>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { useAccountingSettingsStore } from '../../stores/settings/useAccountingSettingsStore';
import { useSettingsForm } from '../../composables/useSettingsForm';
import type { AccountingSettings } from '../../types/settings/AccountingSettings';
import { onMounted, reactive } from 'vue';

const store = useAccountingSettingsStore();
const { form, saving, isDirty, load, save } = useSettingsForm<AccountingSettings>(
  store as any,
  'تم حفظ إعدادات المحاسبة بنجاح'
);

const accountingModules = [
  { title: 'نظام الحسابات', value: 'accounting' },
  { title: 'الأقساط', value: 'installments' },
];

const accountingForm = reactive({
  taxEnabled: false,
  taxName: '',
  costingMethod: null as 'FIFO' | 'LIFO' | 'AVERAGE' | null,
  fiscalYearStart: null as string | null,
  exchangeRate: null as number | null,
  roundingMode: null as 'up' | 'down' | 'nearest' | null,
  roundingPrecision: null as number | null,
});

const costMethods = [
  { title: 'FIFO — الوارد أولاً صادر أولاً', value: 'FIFO' },
  { title: 'LIFO — الوارد أخيراً صادر أولاً', value: 'LIFO' },
  { title: 'المتوسط المرجح', value: 'AVERAGE' },
];

const roundingModes = [
  { title: 'تقريب لأعلى', value: 'up' },
  { title: 'تقريب لأسفل', value: 'down' },
  { title: 'تقريب لأقرب', value: 'nearest' },
];

onMounted(async () => {
  // Load settings when component mounts
  await load();

  // Initialize reactive form properties
  accountingForm.taxEnabled = form.value.taxEnabled;
  accountingForm.taxName = form.value.taxName ?? '';
  accountingForm.costingMethod = form.value.costingMethod;
  accountingForm.fiscalYearStart = form.value.fiscalYearStart;
  accountingForm.exchangeRate = form.value.exchangeRate;
  accountingForm.roundingMode = form.value.roundingMode;
  accountingForm.roundingPrecision = form.value.roundingPrecision;
});
</script>
