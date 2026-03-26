<template>
  <SubPageShell>
    <v-card class="pa-4 mb-4 border" elevation="0" variant="flat" rounded="lg">
      <v-card-title class="d-flex align-center ga-2 mb-4">
        <v-icon color="primary">mdi-calculator-variant</v-icon>
        <span>إعدادات المحاسبة</span>
      </v-card-title>

      <v-form @submit.prevent="save">
        <v-row>
          <v-col cols="12" md="4">
            <v-switch
              v-model="form.taxEnabled"
              label="تفعيل الضريبة"
              color="primary"
              hint="تفعيل حساب الضريبة على الفواتير"
              persistent-hint
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.defaultTaxRate"
              label="نسبة الضريبة (%)"
              type="number"
              min="0"
              max="100"
              variant="outlined"
              density="comfortable"
              :disabled="!form.taxEnabled"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model="form.taxRegistrationNumber"
              label="الرقم الضريبي"
              variant="outlined"
              density="comfortable"
              :disabled="!form.taxEnabled"
            />
          </v-col>

          <v-divider class="my-4" />

          <v-col cols="12" md="4">
            <v-select
              v-model="form.costMethod"
              :items="costMethods"
              label="طريقة حساب التكلفة"
              variant="outlined"
              density="comfortable"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.fiscalYearStartMonth"
              label="شهر بداية السنة المالية"
              type="number"
              min="1"
              max="12"
              variant="outlined"
              density="comfortable"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.fiscalYearStartDay"
              label="يوم بداية السنة المالية"
              type="number"
              min="1"
              max="31"
              variant="outlined"
              density="comfortable"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-select
              v-model="form.currencyCode"
              :items="currencies"
              label="العملة"
              variant="outlined"
              density="comfortable"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.usdExchangeRate"
              label="سعر الصرف (USD → IQD)"
              type="number"
              min="0"
              variant="outlined"
              density="comfortable"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-select
              v-model="form.roundingMethod"
              :items="roundingMethods"
              label="طريقة التقريب"
              variant="outlined"
              density="comfortable"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-switch
              v-model="form.autoPosting"
              label="الترحيل التلقائي"
              color="primary"
              hint="ترحيل القيود تلقائياً عند تنفيذ العمليات"
              persistent-hint
            />
          </v-col>
        </v-row>

        <v-btn
          class="win-btn mt-4"
          type="submit"
          color="primary"
          variant="flat"
          :loading="saving"
          :disabled="!isDirty"
        >
          حفظ
        </v-btn>
      </v-form>
    </v-card>
  </SubPageShell>
</template>

<script setup lang="ts">
import { SubPageShell } from '@/components/layout';
import { useAccountingSettingsStore } from '@/stores/settings/useAccountingSettingsStore';
import { useSettingsForm } from '@/composables/useSettingsForm';
import type { AccountingSettings } from '@/types/settings/AccountingSettings';

const store = useAccountingSettingsStore();

const { form, saving, isDirty, save } = useSettingsForm<AccountingSettings>(
  store,
  'تم حفظ إعدادات المحاسبة بنجاح'
);

const currencies = [
  { title: 'الدينار العراقي (IQD)', value: 'IQD' },
  { title: 'الدولار الأمريكي (USD)', value: 'USD' },
];

const costMethods = [
  { title: 'FIFO — الوارد أولاً صادر أولاً', value: 'fifo' },
  { title: 'LIFO — الوارد أخيراً صادر أولاً', value: 'lifo' },
  { title: 'المتوسط المرجح', value: 'average' },
];

const roundingMethods = [
  { title: 'تقريب عادي', value: 'round' },
  { title: 'تقريب لأعلى', value: 'ceil' },
  { title: 'تقريب لأسفل', value: 'floor' },
];
</script>
