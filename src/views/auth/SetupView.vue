<template>
  <v-app>
    <v-main class="setup-layout">
      <div class="setup-container">
        <!-- Header -->
        <div class="setup-header">
          <v-icon size="36" color="primary" class="mb-3">mdi-cog-outline</v-icon>
          <h1 class="text-h5 font-weight-bold">{{ t('setup.title') }}</h1>
          <p class="text-body-2 text-medium-emphasis mt-1">{{ t('setup.subtitle') }}</p>
        </div>

        <!-- Stepper -->
        <v-stepper v-model="currentStep" :items="stepItems" flat class="setup-stepper" alt-labels>
          <!-- Step 1: Admin Account -->
          <template #item.1>
            <v-card flat class="step-card">
              <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-2">
                {{ t('setup.step1') }}
              </v-card-title>
              <p class="text-body-2 text-medium-emphasis mb-4">{{ t('setup.adminHint') }}</p>
              <v-form ref="adminFormRef">
                <v-text-field
                  v-model="admin.fullName"
                  :label="t('auth.fullName')"
                  :rules="[rules.required, rules.minLength3]"
                  prepend-inner-icon="mdi-account-outline"
                  class="mb-1"
                />
                <v-text-field
                  v-model="admin.username"
                  :label="t('auth.username')"
                  :rules="[rules.required, rules.minLength3, rules.alphanumeric]"
                  prepend-inner-icon="mdi-at"
                  dir="ltr"
                  class="mb-1"
                />
                <v-text-field
                  v-model="admin.password"
                  :label="t('auth.password')"
                  :type="showPassword ? 'text' : 'password'"
                  :rules="[rules.required, rules.minLength6]"
                  :hint="t('auth.passwordHint')"
                  prepend-inner-icon="mdi-lock-outline"
                  dir="ltr"
                  class="mb-1"
                >
                  <template #append-inner>
                    <v-icon size="20" class="cursor-pointer" @click="showPassword = !showPassword">
                      {{ showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline' }}
                    </v-icon>
                  </template>
                </v-text-field>
                <v-text-field
                  v-model="admin.phone"
                  :label="t('auth.phone')"
                  prepend-inner-icon="mdi-phone-outline"
                  class="mb-1"
                />

                <!-- Role badge (non-editable) -->
                <v-chip color="primary" variant="tonal" class="mb-4">
                  <v-icon start>mdi-shield-account</v-icon>
                  {{ t('users.admin') }}
                </v-chip>
              </v-form>

              <v-card-actions class="px-0 pt-2">
                <v-spacer />
                <v-btn color="primary" @click="goToStep2" :disabled="!isAdminValid">
                  {{ t('setup.next') }}
                  <v-icon end>mdi-arrow-left</v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </template>

          <!-- Step 2: Company Info (Optional) -->
          <template #item.2>
            <v-card flat class="step-card">
              <v-card-title class="text-subtitle-1 font-weight-bold px-0 pb-2">
                {{ t('setup.step2') }}
              </v-card-title>
              <p class="text-body-2 text-medium-emphasis mb-4">
                {{ t('setup.companyHint') }}
              </p>
              <v-form ref="companyFormRef">
                <v-row dense>
                  <v-col cols="12">
                    <v-text-field
                      v-model="company.name"
                      :label="t('setup.companyName')"
                      prepend-inner-icon="mdi-domain"
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-text-field
                      v-model="company.address"
                      :label="t('setup.companyAddress')"
                      prepend-inner-icon="mdi-map-marker-outline"
                    />
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="company.phone"
                      :label="t('setup.companyPhone')"
                      prepend-inner-icon="mdi-phone-outline"
                    />
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="company.phone2"
                      :label="t('setup.companyPhone2')"
                      prepend-inner-icon="mdi-phone-outline"
                    />
                  </v-col>

                  <v-col cols="12">
                    <v-text-field
                      v-model="company.email"
                      :label="t('setup.companyEmail')"
                      prepend-inner-icon="mdi-email-outline"
                    />
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="company.taxId"
                      :label="t('setup.companyTaxId')"
                      prepend-inner-icon="mdi-file-document-outline"
                    />
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="company.currency"
                      :label="t('setup.companyCurrency')"
                      :items="currencies"
                      prepend-inner-icon="mdi-currency-usd"
                    />
                  </v-col>
                </v-row>
              </v-form>

              <v-card-actions class="px-0 pt-4">
                <v-btn variant="text" @click="currentStep = 1">
                  <v-icon start>mdi-arrow-right</v-icon>
                  {{ t('setup.back') }}
                </v-btn>
                <v-spacer />
                <v-btn
                  variant="tonal"
                  @click="submitSetup(true)"
                  :loading="submitting"
                  :disabled="submitting"
                  class="ml-2"
                >
                  {{ t('setup.skip') }}
                </v-btn>
                <v-btn
                  color="primary"
                  @click="submitSetup(false)"
                  :loading="submitting"
                  :disabled="submitting"
                  prepend-icon="mdi-check"
                >
                  {{ t('setup.finish') }}
                </v-btn>
              </v-card-actions>
            </v-card>
          </template>
        </v-stepper>
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { t, mapErrorToArabic } from '../../i18n/t';
import { useAuthStore } from '../../stores/authStore';
import { notifyError, notifySuccess } from '@/utils/notify';

const authStore = useAuthStore();
const router = useRouter();

const currentStep = ref(1);
const showPassword = ref(false);
const adminFormRef = ref<{ validate(): boolean } | null>(null);
const submitting = ref(false);

const admin = reactive({
  fullName: '',
  username: '',
  password: '',
  phone: '',
});

const company = reactive({
  name: '',
  address: '',
  phone: '',
  phone2: '',
  email: '',
  taxId: '',
  currency: 'IQD',
});

const currencies = ['IQD', 'USD', 'EUR', 'SAR', 'AED', 'KWD', 'TRY'];

const stepItems = computed(() => [
  { value: 1, title: t('setup.step1') },
  { value: 2, title: t('setup.step2') },
]);

const isAdminValid = computed(
  () =>
    admin.fullName.trim().length >= 3 &&
    admin.username.trim().length >= 3 &&
    /^[a-zA-Z0-9_]+$/.test(admin.username) &&
    admin.password.length >= 6
);

const rules = {
  required: (v: string) => !!v || t('validation.required'),
  minLength3: (v: string) =>
    (v && v.trim().length >= 3) || t('validation.minLength').replace('{min}', '3'),
  minLength6: (v: string) =>
    (v && v.length >= 6) || t('validation.minLength').replace('{min}', '6'),
  alphanumeric: (v: string) => /^[a-zA-Z0-9_]+$/.test(v) || t('validation.invalid'),
};

function goToStep2() {
  if (adminFormRef.value && !adminFormRef.value.validate()) return;
  if (!isAdminValid.value) return;
  currentStep.value = 2;
}

async function submitSetup(skipCompany: boolean) {
  if (!isAdminValid.value) return;

  submitting.value = true;
  try {
    if (skipCompany) {
      authStore.createFirstUser({
        username: admin.username.trim(),
        password: admin.password,
        fullName: admin.fullName.trim(),
        phone: admin.phone || undefined,
      });

      notifySuccess(t('auth.setupSuccess'));
      await router.replace({ name: 'Login' });
    } else {
      const companySettings = skipCompany
        ? {
            name: admin.fullName.trim(),
            currency: 'IQD',
          }
        : {
            name: company.name.trim() || admin.fullName.trim(),
            address: company.address || null,
            phone: company.phone || null,
            phone2: company.phone2 || null,
            email: company.email || null,
            taxId: company.taxId || null,
            logo: null,
            currency: company.currency,
          };

      await authStore.initializeApp({
        admin: {
          username: admin.username.trim(),
          password: admin.password,
          fullName: admin.fullName.trim(),
          phone: admin.phone || undefined,
        },
        companySettings,
      });

      authStore.setupStatus = {
        isInitialized: true,
        hasUsers: true,
        hasCompanyInfo: !skipCompany,
        wizardCompleted: true,
      };
    }

    notifySuccess(t('auth.setupSuccess'));
    await router.replace({ name: 'Login' });
  } catch (err: any) {
    notifyError(mapErrorToArabic(err, 'errors.initializeFailed'));
    console.log(err);
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  if (!authStore.setupStatus) {
    try {
      await authStore.checkInitialSetup();
    } catch {
      // Keep setup screen visible
    }
  }
});
</script>

<style scoped>
.setup-layout {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}

.setup-container {
  width: 100%;
  max-width: 700px;
  padding: 32px 24px;
}

.setup-header {
  text-align: center;
  margin-bottom: 28px;
  color: rgb(var(--v-theme-on-background));
}

.setup-stepper {
  border-radius: 12px !important;
  overflow: hidden;
  background: rgb(var(--v-theme-surface)) !important;
}

.step-card {
  padding: 24px;
}

@media (max-width: 600px) {
  .setup-container {
    padding: 16px;
  }
  .step-card {
    padding: 16px;
  }
}
</style>
