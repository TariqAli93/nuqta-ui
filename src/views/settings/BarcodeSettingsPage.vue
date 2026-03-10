<template>
  <div>
    <v-card class="pa-4 mb-4" flat>
      <v-card-title class="d-flex align-center ga-2 mb-4">
        <v-icon color="primary">mdi-barcode-scan</v-icon>
        <span>إعدادات الباركود</span>
      </v-card-title>

      <v-form @submit.prevent="save">
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="form.barcodeType"
              :items="barcodeTypes"
              label="نوع الباركود"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.prefix"
              label="بادئة الباركود"
              variant="outlined"
              density="compact"
              hint="تُضاف تلقائياً قبل رقم الباركود المولّد"
              persistent-hint
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="form.encoding"
              label="الترميز"
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-divider class="my-4" />

          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.width"
              label="العرض (px)"
              type="number"
              min="1"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.height"
              label="الارتفاع (px)"
              type="number"
              min="1"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="form.dpi"
              label="DPI"
              type="number"
              min="72"
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-divider class="my-4" />

          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="form.labelWidth"
              label="عرض الملصق (مم)"
              type="number"
              min="20"
              max="200"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="form.labelHeight"
              label="ارتفاع الملصق (مم)"
              type="number"
              min="10"
              max="100"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model.number="form.marginTop"
              label="هامش علوي (مم)"
              type="number"
              min="0"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model.number="form.marginBottom"
              label="هامش سفلي (مم)"
              type="number"
              min="0"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model.number="form.marginLeft"
              label="هامش أيسر (مم)"
              type="number"
              min="0"
              variant="outlined"
              density="compact"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              v-model.number="form.marginRight"
              label="هامش أيمن (مم)"
              type="number"
              min="0"
              variant="outlined"
              density="compact"
            />
          </v-col>

          <v-divider class="my-4" />

          <v-col cols="12" md="6">
            <v-switch
              v-model="form.showText"
              label="إظهار النص تحت الباركود"
              color="primary"
              hide-details
              class="mb-3"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-switch
              v-model="form.autoGenerate"
              label="توليد تلقائي للباركود"
              color="primary"
              hide-details
              class="mb-3"
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
import { useBarcodeSettingsStore } from '../../stores/settings/useBarcodeSettingsStore';
import { useSettingsForm } from '../../composables/useSettingsForm';
import type { BarcodeSettings } from '../../types/settings/BarcodeSettings';

const store = useBarcodeSettingsStore();
const { form, saving, isDirty, save } = useSettingsForm<BarcodeSettings>(
  store as any,
  'تم حفظ إعدادات الباركود'
);

const barcodeTypes = [
  { title: 'Code 128', value: 'CODE128' },
  { title: 'EAN-13', value: 'EAN13' },
  { title: 'EAN-8', value: 'EAN8' },
  { title: 'QR Code', value: 'QR' },
  { title: 'UPC', value: 'UPC' },
];
</script>
