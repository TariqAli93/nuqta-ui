<template>
  <PageShell>
    <PageHeader :title="isEdit ? 'تعديل مورد' : 'إضافة مورد'" show-back :back-to="{ name: 'Suppliers' }" />


    <v-card max-width="600">
      <v-card-text>
        <v-form ref="formRef" @submit.prevent="onSubmit">
          <v-text-field
            v-model="form.name"
            label="اسم المورد"
            :rules="[(v) => !!v || 'مطلوب']"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          <v-text-field
            v-model="form.phone"
            label="الهاتف"
            variant="outlined"
            density="compact"
            class="mb-3"
            dir="ltr"
          />
          <v-text-field
            v-model="form.phone2"
            label="هاتف إضافي"
            variant="outlined"
            density="compact"
            class="mb-3"
            dir="ltr"
          />
          <v-text-field
            v-model="form.address"
            label="العنوان"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          <v-text-field
            v-model="form.city"
            label="المدينة"
            variant="outlined"
            density="compact"
            class="mb-3"
          />
          <v-textarea
            v-model="form.notes"
            label="ملاحظات"
            variant="outlined"
            density="compact"
            rows="3"
            class="mb-3"
          />

          <div class="d-flex ga-3">
            <v-btn type="submit" color="primary" :loading="suppliersStore.loading">
              {{ isEdit ? 'تحديث' : 'حفظ' }}
            </v-btn>
            <v-btn variant="text" :to="{ name: 'Suppliers' }">إلغاء</v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </PageShell>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { PageShell, PageHeader } from '@/components/layout';
import { useSuppliersStore } from '@/stores/suppliersStore';

const route = useRoute();
const router = useRouter();
const suppliersStore = useSuppliersStore();
const formRef = ref();

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
  const { valid } = await formRef.value.validate();
  if (!valid) return;

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
