<template>
  <SubPageShell>
    <v-card class="pa-4 mb-4 border" elevation="0" variant="flat" rounded="lg">
      <v-card-title class="d-flex align-center ga-2 mb-4">
        <v-icon color="primary">mdi-point-of-sale</v-icon>
        <span>إعدادات نقاط البيع</span>
      </v-card-title>

      <v-form @submit.prevent="save">
        <v-row>
          <!-- <v-col cols="12" md="6">
            <v-text-field
              v-model="form.invoicePrefix"
              label="بادئة الفاتورة"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="form.nextInvoiceNumber"
              label="رقم الفاتورة التالي"
              type="number"
              min="1"
              variant="outlined"
              density="compact"
            />
          </v-col> -->
          <v-col cols="12" md="6">
            <v-select
              v-model="form.paperSize"
              :items="paperSizes"
              label="حجم الورق"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.layoutDirection"
              :items="layoutDirections"
              label="اتجاه التخطيط"
              variant="outlined"
              density="comfortable"
            />
          </v-col>

          <v-divider class="my-4" />

          <v-divider class="my-4" />

          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.receiptHeader"
              label="رأس الإيصال"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.receiptFooter"
              label="تذييل الإيصال"
              variant="outlined"
              density="comfortable"
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
import { usePosSettingsStore } from '@/stores/settings/usePosSettingsStore';
import { useSettingsForm } from '@/composables/useSettingsForm';
import type { PosSettings } from '@/types/settings/PosSettings';

const store = usePosSettingsStore();

const { form, saving, isDirty, save } = useSettingsForm<PosSettings>(
  store,
  'تم حفظ إعدادات نقاط البيع'
);

const paperSizes = [
  { title: 'A4', value: 'a4' },
  { title: 'A5', value: 'a5' },
  { title: 'حراري', value: 'thermal' },
] as const;

const layoutDirections = [
  { title: 'من اليمين لليسار (RTL)', value: 'rtl' },
  { title: 'من اليسار لليمين (LTR)', value: 'ltr' },
];
</script>
