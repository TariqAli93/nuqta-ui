<template>
  <PageShell>
    <PageHeader
      :title="isEdit ? 'تعديل مورد' : 'إضافة مورد'"
      show-back
      :back-to="{ name: 'Suppliers' }"
    />

    <AppFormLayout
      :loading="suppliersStore.loading"
      submit-label="حفظ"
      cancel-label="إلغاء"
      @submit="onSubmit"
      @cancel="router.push({ name: 'Suppliers' })"
    >
      <AppSection title="المعلومات الأساسية">
        <v-row dense>
          <v-col cols="12">
            <v-text-field
              v-model="form.name"
              label="اسم المورد"
              :rules="[(v) => !!v || 'مطلوب']"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.phone"
              label="الهاتف"
              variant="outlined"
              density="comfortable"
              dir="ltr"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.phone2"
              label="هاتف إضافي"
              variant="outlined"
              density="comfortable"
              dir="ltr"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="form.address"
              label="العنوان"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="form.city"
              label="المدينة"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
        </v-row>
      </AppSection>

      <AppSection title="ملاحظات">
        <v-textarea
          v-model="form.notes"
          label="ملاحظات"
          variant="outlined"
          density="comfortable"
          rows="3"
        />
      </AppSection>
    </AppFormLayout>
  </PageShell>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { PageShell, PageHeader } from '@/components/layout';
import { AppFormLayout, AppSection } from '@/components/common';
import { useSuppliersStore } from '@/stores/suppliersStore';

const route = useRoute();
const router = useRouter();
const suppliersStore = useSuppliersStore();

const isEdit = computed(() => route.name === 'SupplierEdit');

const form = reactive({
  name: '',
  phone: '',
  phone2: '',
  address: '',
  city: '',
  notes: '',
});

onMounted(async () => {
  if (isEdit.value) {
    const id = Number(route.params.id);
    const result = await suppliersStore.fetchSupplierById(id);
    if (result.ok && result.data) {
      Object.assign(form, {
        name: result.data.name,
        phone: result.data.phone ?? '',
        phone2: result.data.phone2 ?? '',
        address: result.data.address ?? '',
        city: result.data.city ?? '',
        notes: result.data.notes ?? '',
      });
    }
  }
});

async function onSubmit() {
  if (!form.name) return;

  const payload = { ...form };
  let result;
  if (isEdit.value) {
    result = await suppliersStore.updateSupplier(Number(route.params.id), payload);
  } else {
    result = await suppliersStore.createSupplier(payload);
  }
  if (result.ok) router.push({ name: 'Suppliers' });
}
</script>
