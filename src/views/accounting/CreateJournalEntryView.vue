<template>
  <PageShell>
    <PageHeader
      title="إنشاء قيد يومي جديد"
      subtitle="قم بإنشاء قيد يومي يدوي لتسجيل المعاملات غير التلقائية أو لتعديل قيود سابقة"
      show-back
      :back-to="{ name: 'AccountingJournal' }"
    />

    <v-card elevation="0" variant="flat" class="border cje-section-card" rounded="lg">
      <div class="cje-section-header bg-primary">
        <v-icon size="18" class="me-2">mdi-book-plus</v-icon>
        إنشاء قيد يدوي
      </div>

      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="4">
            <AppDateInput
              v-model="form.entryDate"
              label="تاريخ القيد"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required]"
            />
          </v-col>
          <v-col cols="12" md="8">
            <v-text-field
              v-model="form.description"
              label="الوصف"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required]"
            />
          </v-col>
          <v-col cols="12">
            <v-textarea
              v-model="form.notes"
              label="ملاحظات (اختياري)"
              variant="outlined"
              density="comfortable"
              rows="2"
              auto-grow
            />
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider />

      <!-- Journal Lines -->
      <v-card-title class="text-subtitle-2 d-flex align-center">
        سطور القيد
        <v-spacer />
        <v-btn
          class="win-btn"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-plus"
          @click="addLine"
        >
          إضافة سطر
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-0">
        <v-table density="comfortable" class="ds-table-enhanced ds-table-striped">
          <thead>
            <tr>
              <th style="min-width: 250px">الحساب</th>
              <th style="width: 160px" class="text-end">مدين</th>
              <th style="width: 160px" class="text-end">دائن</th>
              <th style="min-width: 180px">وصف السطر</th>
              <th style="width: 50px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(line, index) in form.lines" :key="index">
              <td>
                <v-autocomplete
                  v-model="line.accountId"
                  :items="accountItems"
                  item-title="label"
                  item-value="id"
                  density="compact"
                  variant="plain"
                  hide-details
                  placeholder="اختر حساب..."
                  :rules="[rules.required]"
                />
              </td>
              <td>
                <v-text-field
                  v-model.number="line.debit"
                  type="number"
                  density="compact"
                  variant="plain"
                  hide-details
                  min="0"
                  class="text-end"
                  @update:model-value="onDebitChange(index)"
                />
              </td>
              <td>
                <v-text-field
                  v-model.number="line.credit"
                  type="number"
                  density="compact"
                  variant="plain"
                  hide-details
                  min="0"
                  class="text-end"
                  @update:model-value="onCreditChange(index)"
                />
              </td>
              <td>
                <v-text-field
                  v-model="line.description"
                  density="compact"
                  variant="plain"
                  hide-details
                  placeholder="اختياري"
                />
              </td>
              <td>
                <v-btn
                  icon="mdi-delete-outline"
                  variant="text"
                  size="x-small"
                  color="error"
                  :disabled="form.lines.length <= 2"
                  @click="removeLine(index)"
                />
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="font-weight-bold">
              <td>المجموع</td>
              <td class="text-end">{{ formatCurrency(totalDebit) }}</td>
              <td class="text-end">{{ formatCurrency(totalCredit) }}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </v-table>
      </v-card-text>

      <!-- Balance status bar -->
      <v-card
        v-if="form.lines.length > 0 && (totalDebit > 0 || totalCredit > 0)"
        elevation="0"
        variant="flat"
        :color="isBalanced ? 'success' : 'error'"
        class="cje-eq-bar mx-4 mb-4"
        rounded="lg"
      >
        <v-card-text class="d-flex align-center justify-center ga-2 py-2 text-body-2 flex-wrap">
          <v-icon size="18">{{ isBalanced ? 'mdi-check-circle' : 'mdi-alert-circle' }}</v-icon>
          <span v-if="isBalanced">القيد متوازن</span>
          <span v-else>
            القيد غير متوازن — الفرق: {{ formatCurrency(Math.abs(totalDebit - totalCredit)) }}
          </span>
        </v-card-text>
      </v-card>

      <v-divider />

      <v-card-actions class="px-4 py-3">
        <v-btn variant="text" @click="goBack">إلغاء</v-btn>
        <v-spacer />
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-content-save"
          :loading="saving"
          :disabled="!canSave"
          @click="save"
        >
          حفظ القيد
        </v-btn>
      </v-card-actions>
    </v-card>
  </PageShell>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { PageShell, PageHeader } from '@/components/layout';
import AppDateInput from '@/components/shared/AppDateInput.vue';
import { useAccountingStore } from '@/stores/accountingStore';
import { useCurrency } from '@/composables/useCurrency';
import { notifyError, notifySuccess } from '@/utils/notify';

const router = useRouter();
const accountingStore = useAccountingStore();
const { formatCurrency } = useCurrency();

const saving = ref(false);

function goBack() {
  router.back();
}

const rules = {
  required: (v: unknown) => !!v || 'حقل مطلوب',
};

interface FormLine {
  accountId: number | null;
  debit: number;
  credit: number;
  description: string;
}

const form = reactive({
  entryDate: new Date().toISOString().slice(0, 10),
  description: '',
  notes: '',
  lines: [
    { accountId: null, debit: 0, credit: 0, description: '' },
    { accountId: null, debit: 0, credit: 0, description: '' },
  ] as FormLine[],
});

const accountItems = computed(() =>
  accountingStore.accounts.map((a) => ({
    id: a.id,
    label: `${a.code} — ${a.name}`,
  }))
);

const totalDebit = computed(() => form.lines.reduce((sum, l) => sum + (l.debit || 0), 0));
const totalCredit = computed(() => form.lines.reduce((sum, l) => sum + (l.credit || 0), 0));
const isBalanced = computed(() => {
  const diff = Math.abs(totalDebit.value - totalCredit.value);
  return diff < 0.005;
});

const canSave = computed(() => {
  if (!form.entryDate || !form.description) return false;
  if (form.lines.length < 2) return false;
  if (form.lines.some((l) => !l.accountId)) return false;
  if (totalDebit.value === 0 && totalCredit.value === 0) return false;

  // Enforce balanced entries if the setting is enabled
  if (accountingStore.settings.enforceBalancedEntries && !isBalanced.value) return false;

  return true;
});

function addLine() {
  form.lines.push({ accountId: null, debit: 0, credit: 0, description: '' });
}

function removeLine(index: number) {
  if (form.lines.length > 2) {
    form.lines.splice(index, 1);
  }
}

function onDebitChange(index: number) {
  if (form.lines[index].debit > 0) {
    form.lines[index].credit = 0;
  }
}

function onCreditChange(index: number) {
  if (form.lines[index].credit > 0) {
    form.lines[index].debit = 0;
  }
}

async function save() {
  saving.value = true;
  try {
    const result = await accountingStore.createEntry({
      entryDate: form.entryDate,
      description: form.description,
      notes: form.notes || undefined,
      lines: form.lines
        .filter((l) => l.accountId && (l.debit > 0 || l.credit > 0))
        .map((l) => ({
          accountId: l.accountId!,
          debit: l.debit || 0,
          credit: l.credit || 0,
          description: l.description || undefined,
        })),
    });

    if (result.ok) {
      notifySuccess('تم إنشاء القيد بنجاح');
      void router.push({ name: 'AccountingJournal' });
    } else {
      notifyError(result.error.message || 'فشل في إنشاء القيد');
    }
  } catch {
    notifyError('فشل في إنشاء القيد');
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void accountingStore.fetchAccounts();
  void accountingStore.fetchAccountingSettings();
});
</script>

<style scoped>
.cje-section-card {
  display: flex;
  flex-direction: column;
}
.cje-section-header {
  padding: 10px 16px;
  font-weight: 700;
  color: #fff;
  display: flex;
  align-items: center;
}
.cje-eq-bar,
.cje-eq-bar .v-card-text {
  color: #fff !important;
}
</style>
