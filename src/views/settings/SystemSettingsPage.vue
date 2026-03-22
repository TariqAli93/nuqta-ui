<template>
  <div>
    <div class="d-flex justify-end mb-4">
      <v-btn color="primary" variant="tonal" prepend-icon="mdi-refresh" @click="load">
        {{ t('common.refresh') }}
      </v-btn>
    </div>

    <v-card class="pa-4 mb-4" flat>
      <v-card-title class="d-flex align-center ga-2 mb-4">
        <v-icon color="primary">mdi-cog</v-icon>
        <span>{{ t('settings.companyInfo') }}</span>
      </v-card-title>

      <v-form @submit.prevent="save">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.companyName"
              :label="t('settings.companyName') + ' *'"
              variant="outlined"
              density="comfortable"
              required
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.companyEmail"
              :label="t('settings.companyEmail')"
              variant="outlined"
              density="comfortable"
              type="email"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.companyPhone"
              :label="t('settings.companyPhone')"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12">
            <v-textarea
              v-model="form.companyAddress"
              :label="t('settings.companyAddress')"
              variant="outlined"
              density="comfortable"
              rows="2"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.defaultCurrency"
              :items="currencyOptions"
              :label="t('settings.companyCurrency') + ' *'"
              variant="outlined"
              density="comfortable"
              required
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="form.lowStockThreshold"
              :label="t('settings.lowStockThreshold')"
              variant="outlined"
              density="comfortable"
              type="number"
              min="0"
              :hint="t('settings.lowStockThresholdHint')"
              persistent-hint
            />
          </v-col>
        </v-row>

        <v-divider class="my-6" />

        <v-card-title class="d-flex align-center ga-2 mb-4 px-0">
          <v-icon color="primary">mdi-view-module</v-icon>
          <span>الوحدات المفعّلة</span>
        </v-card-title>

        <v-row>
          <v-col cols="12" md="6">
            <v-switch
              v-model="form.accountingEnabled"
              label="المحاسبة"
              color="primary"
              hide-details
              class="mb-3"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-switch
              v-model="form.purchasesEnabled"
              label="المشتريات"
              color="primary"
              hide-details
              class="mb-3"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-switch
              v-model="form.ledgersEnabled"
              label="دفاتر الأستاذ"
              color="primary"
              hide-details
              class="mb-3"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-switch
              v-model="form.unitsEnabled"
              label="وحدات القياس"
              color="primary"
              hide-details
              class="mb-3"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-switch
              v-model="form.paymentsOnInvoicesEnabled"
              label="المدفوعات على الفواتير"
              color="primary"
              hide-details
              class="mb-3"
            />
          </v-col>
        </v-row>

        <v-divider class="my-6" />

        <v-card-title class="d-flex align-center ga-2 mb-4 px-0">
          <v-icon color="primary">mdi-bell</v-icon>
          <span>الإشعارات</span>
        </v-card-title>

        <v-row>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.expiryAlertDays"
              label="أيام تنبيه انتهاء الصلاحية"
              variant="outlined"
              density="comfortable"
              type="number"
              min="0"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.debtReminderCount"
              label="عدد تذكيرات الديون"
              variant="outlined"
              density="comfortable"
              type="number"
              min="0"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.debtReminderIntervalDays"
              label="فترة تذكير الديون (أيام)"
              variant="outlined"
              density="comfortable"
              type="number"
              min="0"
            />
          </v-col>
        </v-row>

        <v-btn
          type="submit"
          color="primary"
          variant="flat"
          class="win-btn mt-6"
          :loading="saving"
          :disabled="!isDirty"
        >
          {{ t('common.save') }}
        </v-btn>
      </v-form>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { t } from '@/i18n/t';
import { useSystemSettingsStore } from '@/stores/settings/useSystemSettingsStore';
import { useSettingsForm } from '@/composables/useSettingsForm';
import type { SystemSettings } from '@/types/settings/SystemSettings';

const store = useSystemSettingsStore();

const { form, saving, isDirty, load, save } = useSettingsForm<SystemSettings>(
  store,
  t('settings.companySaved')
);

const currencyOptions = [
  { title: 'USD - US Dollar', value: 'USD' },
  { title: 'IQD - Iraqi Dinar', value: 'IQD' },
];
</script>
