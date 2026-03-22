<template>
  <div class="login-view" style="max-width: 380px; width: 100%">
    <!-- Header -->
    <div class="login-header">
      <!-- Mobile-only brand badge -->
      <div class="login-header__badge d-md-none">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>

      <div class="login-header__greeting">
        {{ t('auth.loginTitle') }}
      </div>
      <p class="login-header__subtitle">
        {{ t('auth.loginSubtitle') }}
      </p>
    </div>

    <!-- Form -->
    <v-form ref="loginFormRef" @submit.prevent="submit" class="login-form">
      <!-- Username -->
      <div class="login-field">
        <label class="login-field__label">{{ t('auth.username') }}</label>
        <v-text-field
          v-model="username"
          variant="outlined"
          color="primary"
          :rules="[rules.required]"
          hide-details
          :placeholder="t('auth.username')"
          required
          density="comfortable"
          class="login-input"
        >
          <template #prepend-inner>
            <div class="login-field__icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </template>
        </v-text-field>
      </div>

      <!-- Password -->
      <div class="login-field">
        <label class="login-field__label">{{ t('auth.password') }}</label>
        <v-text-field
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          variant="outlined"
          color="primary"
          :rules="[rules.required]"
          hide-details
          :placeholder="t('auth.password')"
          required
          density="comfortable"
          class="login-input"
        >
          <template #prepend-inner>
            <div class="login-field__icon">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </template>
          <template #append-inner>
            <button
              type="button"
              class="login-field__toggle"
              @click="showPassword = !showPassword"
              tabindex="-1"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
            >
              <svg
                v-if="!showPassword"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <svg
                v-else
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.75"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            </button>
          </template>
        </v-text-field>
      </div>

      <!-- Submit -->
      <v-btn
        type="submit"
        color="primary"
        size="large"
        variant="flat"
        block
        class="login-submit"
        :loading="authStore.loading"
        :disabled="authStore.loading || !username || !password"
      >
        <span class="login-submit__text">{{ t('auth.loginAction') }}</span>
        <svg
          class="login-submit__arrow"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </v-btn>
    </v-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { mapErrorToArabic, t } from '../../i18n/t';
import { useAuthStore } from '../../stores/authStore';
import { notifyError } from '@/utils/notify';
import { useFormValidation } from '@/composables/useFormValidation';

interface LoginFormController {
  validate(): Promise<{ valid: boolean }> | { valid: boolean } | boolean;
  resetValidation(): void;
}

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const username = ref<string | null>(import.meta.env.DEV ? 'admin' : null);
const password = ref<string | null>(import.meta.env.DEV ? 'Admin@123' : null);
const showPassword = ref<boolean>(false);
const loginFormRef = ref<LoginFormController>();
const { rules, validate } = useFormValidation(loginFormRef);

async function submit(): Promise<void> {
  if (!(await validate())) return;

  try {
    await authStore.login({ username: username.value!, password: password.value! });
    const rawRedirect = route.query.redirect;
    const redirect =
      typeof rawRedirect === 'string' && rawRedirect.startsWith('/') ? rawRedirect : '/';
    router.push({ path: redirect });
  } catch (err: any) {
    notifyError(mapErrorToArabic(err, 'errors.loginFailed'));
  }
}

watch(
  () => authStore.error,
  (value) => {
    if (!value) return;
    notifyError(value, { dedupeKey: t('auth.loginError') });
  }
);
</script>

<style scoped lang="scss">
// ── All colors use Vuetify theme variables ──
// rgb(var(--v-theme-on-surface))         → main text
// rgb(var(--v-theme-on-surface-variant)) → muted text
// rgb(var(--v-theme-surface))            → input bg
// rgb(var(--v-theme-surface-variant))    → subtle bg
// rgb(var(--v-theme-primary))            → focus ring, accents
// Button uses color="primary" prop — Vuetify handles light/dark automatically

.login-view {
  animation: login-fade-in 0.5s ease-out;
}

@keyframes login-fade-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== Header ========== */
.login-header {
  margin-bottom: 36px;
  text-align: right;
}

.login-header__badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgb(var(--v-theme-primary));
  display: grid;
  place-items: center;
  color: rgb(var(--v-theme-on-primary));
  margin-bottom: 20px;
  margin-inline-start: 0;
}

.login-header__greeting {
  font-size: 1.65rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-background));
  letter-spacing: -0.02em;
  line-height: 1.25;
  margin-bottom: 8px;
}

.login-header__subtitle {
  font-size: 0.92rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 0;
  line-height: 1.6;
}

/* ========== Form ========== */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ========== Field ========== */
.login-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.login-field__label {
  font-size: 0.8rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  letter-spacing: 0.01em;
}

.login-field__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(var(--v-theme-on-surface), 0.4);
  margin-inline-end: 4px;
  transition: color 0.2s ease;
}

.login-field__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: rgba(var(--v-theme-on-surface), 0.4);
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    color: rgba(var(--v-theme-on-surface), 0.65);
    background: rgba(var(--v-theme-on-surface), 0.06);
  }
}

/* ========== Input overrides ========== */
.login-input {
  :deep(.v-field) {
    border-radius: 10px !important;
    background: rgb(var(--v-theme-surface)) !important;
    border: 1.5px solid rgba(var(--v-theme-on-surface), 0.12) !important;
    box-shadow: 0 1px 2px rgba(var(--v-theme-on-surface), 0.04);
    transition: all 0.2s ease;
    min-height: 48px;

    &:hover {
      border-color: rgba(var(--v-theme-on-surface), 0.2) !important;
    }
  }

  :deep(.v-field--focused) {
    border-color: rgb(var(--v-theme-primary)) !important;
    box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.12) !important;
  }

  :deep(.v-field__outline) {
    display: none;
  }

  :deep(.v-field__input) {
    font-size: 0.9rem;
    padding-top: 0;
    padding-bottom: 0;
    min-height: 48px;
    color: rgb(var(--v-theme-on-surface));

    &::placeholder {
      color: rgba(var(--v-theme-on-surface), 0.3);
    }
  }
}

/* ========== Submit Button ========== */
// Uses color="primary" prop on v-btn — Vuetify handles the fill color.
// We only style shape, shadow, and interaction here.
.login-submit {
  margin-top: 8px;
  height: 50px !important;
  border-radius: 10px !important;
  font-weight: 600 !important;
  font-size: 0.95rem !important;
  letter-spacing: 0.01em !important;
  text-transform: none !important;
  box-shadow:
    0 4px 14px rgba(var(--v-theme-primary), 0.25),
    0 1px 3px rgba(var(--v-theme-primary), 0.1) !important;
  transition: all 0.25s ease !important;
  overflow: hidden;

  &:hover:not(:disabled) {
    box-shadow:
      0 6px 20px rgba(var(--v-theme-primary), 0.35),
      0 2px 5px rgba(var(--v-theme-primary), 0.15) !important;
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(var(--v-theme-primary), 0.2) !important;
  }

  &:disabled {
    opacity: 0.45 !important;
  }
}

.login-submit__text {
  margin-inline-end: 8px;
}

.login-submit__arrow {
  opacity: 0.7;
  transition: transform 0.25s ease;

  .login-submit:hover:not(:disabled) & {
    transform: translateX(-3px);
  }
}
</style>
