<template>
  <PageShell>
    <PageHeader
      :title="isEdit ? t('customers.edit') : t('customers.new')"
      :subtitle="t('customers.formHint')"
      show-back
      back-to="/customers"
    />

    <AppFormLayout
      :loading="store.loading"
      :submit-label="t('common.save')"
      :cancel-label="t('common.cancel')"
      @submit="submit"
      @cancel="router.push('/customers')"
    >
      <AppSection :title="t('customers.basicInfo')">
        <v-row dense>
          <v-col cols="12">
            <v-text-field
              v-model="form.name"
              :label="t('common.name')"
              variant="outlined"
              density="comfortable"
              required
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.phone"
              :label="t('common.phone')"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.city"
              :label="t('common.city')"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="form.address"
              :label="t('customers.address')"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
        </v-row>
      </AppSection>

      <AppSection :title="t('common.notes')">
        <v-textarea
          v-model="form.notes"
          :label="t('common.notes')"
          variant="outlined"
          density="comfortable"
          rows="3"
        />
      </AppSection>
    </AppFormLayout>
  </PageShell>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue';
import { PageShell, PageHeader } from '@/components/layout';
import { AppFormLayout, AppSection } from '@/components/common';
import { useRoute, useRouter } from 'vue-router';
import { mapErrorToArabic, t } from '@/i18n/t';
import { useCustomersStore } from '@/stores/customersStore';
import type { CustomerInput } from '@/types/domain';
import { notifyError, notifySuccess } from '@/utils/notify';

const store = useCustomersStore();
const route = useRoute();
const router = useRouter();

const localizedError = computed(() =>
  store.error ? mapErrorToArabic(store.error, 'errors.unexpected') : null
);

watch(localizedError, (value) => {
  if (!value) return;
  notifyError(value, { dedupeKey: 'customer-form-error' });
});

const idParam = computed(() => route.params.id);
const isEdit = computed(() => typeof idParam.value === 'string');

const form = reactive<CustomerInput>({
  name: '',
  phone: null,
  address: null,
  city: null,
  notes: null,
});

async function loadCustomer() {
  if (!isEdit.value) return;
  const id = Number(idParam.value);
  if (Number.isNaN(id)) return;
  const result = await store.fetchCustomerById(id);
  if (result.ok && result.data) {
    form.name = result.data.name;
    form.phone = result.data.phone ?? null;
    form.address = result.data.address ?? null;
    form.city = result.data.city ?? null;
    form.notes = result.data.notes ?? null;
  }
}

async function submit() {
  if (isEdit.value) {
    const id = Number(idParam.value);
    if (Number.isNaN(id)) return;
    const result = await store.updateCustomer(id, form);
    if (result.ok) {
      notifySuccess(t('common.saved'));
      await router.push('/customers');
    } else {
      notifyError(mapErrorToArabic(result.error, 'errors.saveFailed'));
    }
    return;
  }

  const result = await store.createCustomer(form);
  if (result.ok) {
    notifySuccess(t('common.saved'));
    await router.push('/customers');
  } else {
    notifyError(mapErrorToArabic(result.error, 'errors.saveFailed'));
  }
}

onMounted(() => {
  void loadCustomer();
});
</script>
