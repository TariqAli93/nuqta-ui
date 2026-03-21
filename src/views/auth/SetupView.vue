<template>
  <v-app>
    <v-main class="setup-layout">
      <div class="setup-container">
        <!-- Background decoration -->
        <div class="setup-bg" aria-hidden="true">
          <div class="setup-bg__orb setup-bg__orb--1" />
          <div class="setup-bg__orb setup-bg__orb--2" />
        </div>

        <!-- Main card -->
        <div class="setup-card" role="status" :aria-live="hasError ? 'assertive' : 'polite'">
          <!-- Header -->
          <div class="setup-card__header">
            <div class="setup-card__badge">
              <svg
                width="28"
                height="28"
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
            <h1 class="setup-card__title">{{ t('setup.autoSetupTitle') }}</h1>
            <p class="setup-card__subtitle">{{ t('setup.autoSetupSubtitle') }}</p>
          </div>

          <!-- Steps timeline -->
          <div class="setup-steps">
            <div
              v-for="(step, index) in steps"
              :key="step.key"
              class="setup-step"
              :class="{
                'setup-step--pending': step.status === 'pending',
                'setup-step--active': step.status === 'active',
                'setup-step--done': step.status === 'done',
                'setup-step--error': step.status === 'error',
              }"
            >
              <!-- Connector line (not on first) -->
              <div v-if="index > 0" class="setup-step__connector">
                <div
                  class="setup-step__connector-fill"
                  :class="{ 'setup-step__connector-fill--active': step.status !== 'pending' }"
                />
              </div>

              <div class="setup-step__row">
                <!-- Status icon -->
                <div class="setup-step__icon">
                  <!-- Pending -->
                  <svg
                    v-if="step.status === 'pending'"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" opacity="0.3" />
                  </svg>
                  <!-- Active spinner -->
                  <div v-else-if="step.status === 'active'" class="setup-step__spinner" />
                  <!-- Done checkmark -->
                  <svg
                    v-else-if="step.status === 'done'"
                    class="setup-step__check"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <!-- Error X -->
                  <svg
                    v-else-if="step.status === 'error'"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>

                <!-- Text with typewriter effect -->
                <div class="setup-step__content">
                  <span class="setup-step__label">
                    <template v-if="step.status === 'active'">
                      <span>
                        {{ step.label }}
                      </span>
                    </template>
                    <template v-else>{{ step.label }}</template>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Success message -->
          <Transition name="success-fade">
            <div v-if="allDone && !hasError" class="setup-success">
              <div class="setup-success__icon">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 class="setup-success__title">{{ t('setup.completeTitle') }}</h2>
              <p class="setup-success__message">{{ t('setup.redirecting') }}</p>
              <div class="setup-success__progress">
                <div class="setup-success__progress-bar" />
              </div>
            </div>
          </Transition>

          <!-- Error state -->
          <Transition name="success-fade">
            <div v-if="hasError" class="setup-error">
              <div class="setup-error__icon">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h2 class="setup-error__title">{{ t('setup.errorOccurred') }}</h2>
              <p class="setup-error__message">{{ errorMessage }}</p>
              <button class="setup-error__retry" @click="retrySetup">
                {{ t('setup.retry') }}
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { t } from '@/i18n/t';

const router = useRouter();
const authStore = useAuthStore();

// ── Default admin credentials used during auto-setup ──
const DEFAULT_ADMIN = {
  username: 'admin',
  password: 'admin123',
  fullName: 'مدير النظام',
} as const;

// ── Step definitions ──
interface SetupStep {
  key: string;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
  action: () => Promise<void>;
}

const steps = reactive<SetupStep[]>([
  {
    key: 'check',
    label: t('setup.stepCheckStatus'),
    status: 'pending',
    action: runCheckStatus,
  },
  {
    key: 'admin',
    label: t('setup.stepAdmin'),
    status: 'pending',
    action: runAdminSetup,
  },
  {
    key: 'database',
    label: t('setup.stepDatabase'),
    status: 'pending',
    action: runDatabaseSetup,
  },
  {
    key: 'finalize',
    label: t('setup.stepFinalize'),
    status: 'pending',
    action: runFinalize,
  },
]);

const hasError = ref(false);
const errorMessage = ref('');
const allDone = ref(false);
let redirectTimer: ReturnType<typeof setTimeout> | null = null;

const isRunning = ref(false);

// ── Step action implementations ──

/**
 * Step 1 — Check system status.
 * Calls GET /auth/setup-status to determine current initialization state.
 * If already fully initialized, skip the rest and redirect to login.
 */
async function runCheckStatus(): Promise<void> {
  const result = await authStore.checkInitialSetup();

  if (!result.ok) {
    throw new Error(result.error?.message || t('setup.errorOccurred'));
  }

  const status = result.data;

  // Already fully initialized — nothing to do
  if (status.isInitialized && status.hasUsers && status.wizardCompleted) {
    router.replace({ name: 'Login' });
    throw new SetupSkipError();
  }
}

/**
 * Step 3 — Initialize database & setup wizard (requires auth).
 * Calls POST /settings/setup-wizard with default admin + company info.
 * Must run AFTER createFirstUser so we have a valid access token.
 */
async function runDatabaseSetup(): Promise<void> {
  const status = authStore.setupStatus;

  // If the wizard was already completed, skip this step
  if (status?.wizardCompleted) return;

  const result = await authStore.initializeApp({
    admin: {
      username: DEFAULT_ADMIN.username,
      password: DEFAULT_ADMIN.password,
      fullName: DEFAULT_ADMIN.fullName,
    },
  });

  if (!result.ok) {
    throw new Error(result.error?.message || t('setup.errorOccurred'));
  }
}

/**
 * Step 2 — Create the first admin user (no auth required).
 * Calls POST /auth/register which returns tokens + user object.
 * After this step we have a valid access token for subsequent requests.
 */
async function runAdminSetup(): Promise<void> {
  const status = authStore.setupStatus;

  // If a user already exists, skip creation
  if (status?.hasUsers) return;

  const result = await authStore.createFirstUser({
    username: DEFAULT_ADMIN.username,
    password: DEFAULT_ADMIN.password,
    fullName: DEFAULT_ADMIN.fullName,
  });

  if (!result.ok) {
    throw new Error(result.error?.message || t('setup.errorOccurred'));
  }
}

/**
 * Step 4 — Finalize: verify the admin can actually log in.
 * Calls POST /auth/login to confirm the full auth chain works.
 * On success the user is authenticated and tokens are stored.
 */
async function runFinalize(): Promise<void> {
  // If already authenticated from createFirstUser, just verify
  if (authStore.isAuthenticated) {
    // Logout first so redirect goes to Login page cleanly
    authStore.logout('not_authenticated');
    return;
  }

  // Verify login works with the credentials we just created
  const result = await authStore.login({
    username: DEFAULT_ADMIN.username,
    password: DEFAULT_ADMIN.password,
  });

  if (!result.ok) {
    throw new Error(result.error?.message || t('setup.errorOccurred'));
  }

  // Logout so the user arrives at a clean Login page
  authStore.logout('not_authenticated');
}

// ── Orchestrator ──

async function runAllSteps(): Promise<void> {
  if (isRunning.value) return;
  isRunning.value = true;
  hasError.value = false;
  errorMessage.value = '';
  allDone.value = false;

  for (const step of steps) {
    step.status = 'active';

    // Small pause before running so the "active" animation is visible
    await delay(400);

    try {
      await step.action();
      step.status = 'done';
    } catch (err: unknown) {
      if (err instanceof SetupSkipError) return; // Already redirecting
      step.status = 'error';
      hasError.value = true;
      errorMessage.value = err instanceof Error ? err.message : t('setup.errorOccurred');
      isRunning.value = false;
      return;
    }

    // Brief pause between steps for visual clarity
    await delay(500);
  }

  allDone.value = true;
  isRunning.value = false;

  // Redirect after showing success
  redirectTimer = setTimeout(() => {
    router.replace({ name: 'Login' });
  }, 3000);
}

function retrySetup(): void {
  for (const step of steps) {
    step.status = 'pending';
  }
  runAllSteps();
}

// ── Helpers ──

class SetupSkipError extends Error {
  constructor() {
    super('skip');
    this.name = 'SetupSkipError';
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Lifecycle ──

onMounted(() => {
  if (authStore.isAuthenticated) {
    router.replace({ name: 'Login' });
    return;
  }
  runAllSteps();
});

onUnmounted(() => {
  if (redirectTimer) clearTimeout(redirectTimer);
});
</script>

<style scoped lang="scss">
/* ========== Layout ========== */
.setup-layout {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
  overflow: hidden;
}

.setup-container {
  position: relative;
  width: 100%;
  max-width: 480px;
  padding: 24px;
  z-index: 1;
}

/* ========== Background Orbs ========== */
.setup-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.setup-bg__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
}

.setup-bg__orb--1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(var(--v-theme-primary), 0.1) 0%, transparent 70%);
  top: -10%;
  right: -15%;
  animation: float-orb 20s ease-in-out infinite;
}

.setup-bg__orb--2 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(var(--v-theme-success), 0.08) 0%, transparent 70%);
  bottom: 5%;
  left: -10%;
  animation: float-orb 25s ease-in-out infinite reverse;
}

@keyframes float-orb {
  0%,
  100% {
    transform: translate(0, 0);
  }
  33% {
    transform: translate(20px, -30px);
  }
  66% {
    transform: translate(-15px, 20px);
  }
}

/* ========== Card ========== */
.setup-card {
  background: rgb(var(--v-theme-background));
  border-radius: 20px;
  padding: 40px 36px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  animation: card-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  z-index: 1;
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(24px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ========== Header ========== */
.setup-card__header {
  text-align: center;
  margin-bottom: 36px;
}

.setup-card__badge {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  display: grid;
  place-items: center;
  margin: 0 auto 16px;
  animation: badge-pulse 2s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(var(--v-theme-primary), 0.15);
  }
  50% {
    box-shadow: 0 0 0 12px rgba(var(--v-theme-primary), 0);
  }
}

.setup-card__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  margin: 0 0 6px;
  letter-spacing: -0.01em;
}

.setup-card__subtitle {
  font-size: 0.88rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 0;
  line-height: 1.6;
}

/* ========== Steps Timeline ========== */
.setup-steps {
  display: flex;
  flex-direction: column;
}

.setup-step {
  position: relative;
}

/* Connector line between steps */
.setup-step__connector {
  width: 2px;
  height: 20px;
  margin-inline-start: 22px;
  background: rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 1px;
  overflow: hidden;
}

.setup-step__connector-fill {
  width: 100%;
  height: 0;
  background: rgb(var(--v-theme-primary));
  border-radius: 1px;
  transition: height 0.5s ease;
}

.setup-step__connector-fill--active {
  height: 100%;
}

.setup-step__row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
}

/* ── Icon states ── */
.setup-step__icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  transition: all 0.35s ease;
}

.setup-step--pending .setup-step__icon {
  background: rgba(var(--v-theme-on-surface), 0.05);
  color: rgba(var(--v-theme-on-surface), 0.25);
}

.setup-step--active .setup-step__icon {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
}

.setup-step--done .setup-step__icon {
  background: rgba(var(--v-theme-success), 0.12);
  color: rgb(var(--v-theme-success));
}

.setup-step--error .setup-step__icon {
  background: rgba(var(--v-theme-error), 0.12);
  color: rgb(var(--v-theme-error));
}

/* Spinner */
.setup-step__spinner {
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(var(--v-theme-primary), 0.2);
  border-top-color: rgb(var(--v-theme-primary));
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Check animation */
.setup-step__check {
  animation: check-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes check-pop {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* ── Text ── */
.setup-step__content {
  flex: 1;
  min-width: 0;
}

.setup-step__label {
  font-size: 0.92rem;
  font-weight: 500;
  transition: color 0.3s ease;
}

.setup-step--pending .setup-step__label {
  color: rgba(var(--v-theme-on-surface), 0.3);
}

.setup-step--active .setup-step__label {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

.setup-step--done .setup-step__label {
  color: rgb(var(--v-theme-success));
}

.setup-step--error .setup-step__label {
  color: rgb(var(--v-theme-error));
}

/* Typewriter character animation */
.setup-step__char {
  display: inline-block;
  opacity: 0;
  animation: char-appear 0.15s ease forwards;
}

@keyframes char-appear {
  from {
    opacity: 0;
    transform: translateX(4px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* ========== Success State ========== */
.setup-success {
  text-align: center;
  margin-top: 32px;
  padding-top: 28px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.setup-success__icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(var(--v-theme-success), 0.1);
  color: rgb(var(--v-theme-success));
  display: grid;
  place-items: center;
  margin: 0 auto 16px;
  animation: success-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes success-bounce {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.setup-success__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: rgb(var(--v-theme-success));
  margin: 0 0 6px;
}

.setup-success__message {
  font-size: 0.85rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 0 0 20px;
}

/* Redirect countdown bar */
.setup-success__progress {
  width: 100%;
  height: 4px;
  background: rgba(var(--v-theme-success), 0.12);
  border-radius: 2px;
  overflow: hidden;
}

.setup-success__progress-bar {
  height: 100%;
  background: rgb(var(--v-theme-success));
  border-radius: 2px;
  animation: progress-fill 3s linear forwards;
}

@keyframes progress-fill {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}

/* ========== Error State ========== */
.setup-error {
  text-align: center;
  margin-top: 32px;
  padding-top: 28px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.setup-error__icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(var(--v-theme-error), 0.1);
  color: rgb(var(--v-theme-error));
  display: grid;
  place-items: center;
  margin: 0 auto 16px;
  animation: success-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.setup-error__title {
  font-size: 1.15rem;
  font-weight: 700;
  color: rgb(var(--v-theme-error));
  margin: 0 0 6px;
}

.setup-error__message {
  font-size: 0.85rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin: 0 0 20px;
  direction: ltr;
  word-break: break-word;
}

.setup-error__retry {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 28px;
  border: none;
  border-radius: 10px;
  background: rgb(var(--v-theme-error));
  color: rgb(var(--v-theme-on-error));
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 10px rgba(var(--v-theme-error), 0.25);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(var(--v-theme-error), 0.35);
  }

  &:active {
    transform: translateY(0);
  }
}

/* ========== Transitions ========== */
.success-fade-enter-active {
  animation: success-slide-in 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.success-fade-leave-active {
  animation: success-slide-in 0.3s ease reverse;
}

@keyframes success-slide-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== Responsive ========== */
@media (max-width: 480px) {
  .setup-card {
    padding: 28px 20px;
    border-radius: 16px;
  }

  .setup-card__title {
    font-size: 1.3rem;
  }

  .setup-container {
    padding: 16px;
  }
}
</style>
