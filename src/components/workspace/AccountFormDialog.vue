<template>
  <v-dialog v-model="dialog" max-width="520" persistent>
    <v-card>
      <v-card-title>{{ isEdit ? 'تعديل حساب' : 'إضافة حساب جديد' }}</v-card-title>

      <v-card-text>
        <v-row dense>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="form.code"
              label="الكود"
              variant="outlined"
              density="comfortable"
              :disabled="isEdit && editAccount?.isSystem"
              :rules="[rules.required]"
            />
          </v-col>
          <v-col cols="12" sm="8">
            <v-text-field
              v-model="form.name"
              label="الاسم"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required]"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              v-model="form.nameAr"
              label="الاسم بالعربي (اختياري)"
              variant="outlined"
              density="comfortable"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-select
              v-model="form.accountType"
              :items="accountTypeOptions"
              label="نوع الحساب"
              variant="outlined"
              density="comfortable"
              :disabled="isEdit && editAccount?.isSystem"
              :rules="[rules.required]"
            />
          </v-col>
          <v-col cols="12" sm="6">
            <v-autocomplete
              v-model="form.parentId"
              :items="parentAccountItems"
              item-title="label"
              item-value="id"
              label="الحساب الأب (اختياري)"
              variant="outlined"
              density="comfortable"
              clearable
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">إلغاء</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="saving"
          :disabled="!isFormValid"
          @click="save"
        >
          {{ isEdit ? 'حفظ التعديلات' : 'إضافة' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useAccountingStore } from '@/stores/accountingStore';
import { notifyError, notifySuccess } from '@/utils/notify';
import type { Account } from '@/types/domain';

const accountingStore = useAccountingStore();

const dialog = ref(false);
const saving = ref(false);
const editAccount = ref<Account | null>(null);

const rules = {
  required: (v: unknown) => !!v || 'حقل مطلوب',
};

const accountTypeOptions = [
  { title: 'اصول', value: 'asset' as const },
  { title: 'التزامات', value: 'liability' as const },
  { title: 'حقوق ملكية', value: 'equity' as const },
  { title: 'إيرادات', value: 'revenue' as const },
  { title: 'مصاريف', value: 'expense' as const },
];

const form = reactive({
  code: '',
  name: '',
  nameAr: '',
  accountType: '' as Account['accountType'] | '',
  parentId: null as number | null,
});

const isEdit = computed(() => !!editAccount.value);

const parentAccountItems = computed(() =>
  accountingStore.accounts
    .filter((a) => !editAccount.value || a.id !== editAccount.value.id)
    .map((a) => ({ id: a.id, label: `${a.code} — ${a.name}` }))
);

const isFormValid = computed(() => {
  return !!form.code && !!form.name && !!form.accountType;
});

function open(account?: Account) {
  if (account) {
    editAccount.value = account;
    form.code = account.code;
    form.name = account.name;
    form.nameAr = account.nameAr || '';
    form.accountType = account.accountType;
    form.parentId = account.parentId ?? null;
  } else {
    editAccount.value = null;
    form.code = '';
    form.name = '';
    form.nameAr = '';
    form.accountType = '';
    form.parentId = null;
  }
  dialog.value = true;
}

function close() {
  dialog.value = false;
}

async function save() {
  saving.value = true;
  try {
    if (isEdit.value && editAccount.value?.id) {
      const result = await accountingStore.updateAccount(editAccount.value.id, {
        name: form.name,
        nameAr: form.nameAr || undefined,
        accountType: form.accountType as Account['accountType'],
        parentId: form.parentId,
      });
      if (result.ok) {
        notifySuccess('تم تحديث الحساب بنجاح');
        close();
      } else {
        notifyError(result.error.message || 'فشل في تحديث الحساب');
      }
    } else {
      const result = await accountingStore.createAccount({
        code: form.code,
        name: form.name,
        nameAr: form.nameAr,
        accountType: form.accountType as Account['accountType'],
        parentId: form.parentId,
      });
      if (result.ok) {
        notifySuccess('تم إضافة الحساب بنجاح');
        close();
      } else {
        notifyError(result.error.message || 'فشل في إضافة الحساب');
      }
    }
  } catch {
    notifyError('حدث خطأ أثناء الحفظ');
  } finally {
    saving.value = false;
  }
}

defineExpose({ open });
</script>
