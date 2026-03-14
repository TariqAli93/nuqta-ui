<template>
  <v-app>
    <v-main class="auth-layout">
      <!-- Right (RTL): Form Area — follows active theme -->
      <section class="auth-form-area">
        <div class="auth-form-area__inner">
          <!-- Top bar -->
          <div class="auth-topbar">
            <span class="auth-topbar__version">v2.0</span>
          </div>

          <!-- Centered form content -->
          <div class="auth-form-area__content">
            <router-view />
          </div>

          <!-- Footer -->
          <div class="auth-footer">
            <span class="auth-footer__text">
              &copy; {{ new Date().getFullYear() }} Codel &mdash; {{ t('common.appName') }}
            </span>
          </div>
        </div>
      </section>

      <!-- Left (RTL): Brand panel — follows active theme -->
      <aside class="auth-brand">
        <!-- Geometric pattern background -->
        <div class="auth-brand__pattern" aria-hidden="true">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path
                  d="M 60 0 L 0 0 0 60"
                  fill="none"
                  style="stroke: rgba(var(--v-theme-on-surface), 0.04)"
                  stroke-width="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <circle
              cx="75%"
              cy="20%"
              r="180"
              fill="none"
              style="stroke: rgba(var(--v-theme-on-surface), 0.03)"
              stroke-width="1.5"
            />
            <circle
              cx="75%"
              cy="20%"
              r="120"
              fill="none"
              style="stroke: rgba(var(--v-theme-on-surface), 0.04)"
              stroke-width="1"
            />
            <circle
              cx="75%"
              cy="20%"
              r="60"
              fill="none"
              style="stroke: rgba(var(--v-theme-on-surface), 0.05)"
              stroke-width="0.75"
            />
            <rect
              x="8%"
              y="65%"
              width="200"
              height="200"
              rx="4"
              fill="none"
              style="stroke: rgba(var(--v-theme-on-surface), 0.03)"
              stroke-width="1"
              transform="rotate(15, 200, 700)"
            />
            <rect
              x="12%"
              y="68%"
              width="140"
              height="140"
              rx="4"
              fill="none"
              style="stroke: rgba(var(--v-theme-on-surface), 0.04)"
              stroke-width="0.75"
              transform="rotate(15, 200, 700)"
            />
          </svg>
        </div>

        <!-- Floating accent orbs -->
        <div class="auth-brand__orb auth-brand__orb--1" aria-hidden="true" />
        <div class="auth-brand__orb auth-brand__orb--2" aria-hidden="true" />

        <!-- Brand content -->
        <div class="auth-brand__content">
          <div class="auth-brand__badge">
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
          <h1 class="auth-brand__title">{{ t('common.appName') }}</h1>
          <p class="auth-brand__tagline">{{ t('common.appTagline') }}</p>

          <!-- Feature pills -->
          <div class="auth-brand__features">
            <span class="auth-brand__pill">
              <v-icon size="14" color="success">mdi-check-circle-outline</v-icon>
              نقاط البيع
            </span>
            <span class="auth-brand__pill">
              <v-icon size="14" color="success">mdi-check-circle-outline</v-icon>
              إدارة المخزون
            </span>
            <span class="auth-brand__pill">
              <v-icon size="14" color="success">mdi-check-circle-outline</v-icon>
              المحاسبة
            </span>
          </div>
        </div>
      </aside>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { t } from '@/i18n/t';
</script>

<style scoped lang="scss">
// ── Color strategy ──
// Both panels are fully theme-reactive using rgb(var(--v-theme-*)).
// Brand panel: surface bg, on-surface text/strokes, primary/success accents
// Form area: background bg, on-surface text, primary focus states

/* ========== Layout ========== */
.auth-layout {
  display: flex;
  min-height: 100vh;
  overflow: hidden;
  background: rgb(var(--v-theme-background));
}

/* ========== Brand Panel (theme-reactive) ========== */
.auth-brand {
  position: relative;
  flex: 1;
  display: none;
  background: rgb(var(--v-theme-surface));
  overflow: hidden;
}

@media (min-width: 960px) {
  .auth-brand {
    display: flex;
    align-items: flex-end;
  }
}

.auth-brand__pattern {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.auth-brand__orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
}

.auth-brand__orb--1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(var(--v-theme-primary), 0.12) 0%, transparent 70%);
  top: -5%;
  right: -8%;
  animation: float-orb 18s ease-in-out infinite;
}

.auth-brand__orb--2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(var(--v-theme-success), 0.1) 0%, transparent 70%);
  bottom: 15%;
  left: -5%;
  animation: float-orb 22s ease-in-out infinite reverse;
}

@keyframes float-orb {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(15px, -20px) scale(1.05);
  }
  66% {
    transform: translate(-10px, 15px) scale(0.97);
  }
}

.auth-brand__content {
  position: relative;
  z-index: 2;
  padding: 3.5rem;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.auth-brand__badge {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.15),
    rgba(var(--v-theme-success), 0.15)
  );
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  display: grid;
  place-items: center;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 8px;
  backdrop-filter: blur(12px);
}

.auth-brand__title {
  font-size: 2.5rem;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.auth-brand__tagline {
  font-size: 1.05rem;
  color: rgba(var(--v-theme-on-surface), 0.55);
  margin: 0;
  max-width: 38ch;
  line-height: 1.7;
}

.auth-brand__features {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.auth-brand__pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 100px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.07);
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-size: 0.82rem;
  letter-spacing: 0.01em;
  transition: all 0.3s ease;
}

/* ========== Form Area (theme-reactive) ========== */
.auth-form-area {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 100%;
  background: rgb(var(--v-theme-background));
}

@media (min-width: 960px) {
  .auth-form-area {
    width: 520px;
    flex-shrink: 0;
    z-index: 10;
    border-inline-start: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  }
}

.auth-form-area__inner {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  padding: 1.5rem 2.5rem;
}

.auth-topbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-bottom: 1rem;
}

.auth-topbar__version {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.3);
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(var(--v-theme-on-surface), 0.04);
  font-family: 'IBM Plex Mono', monospace;
}

.auth-form-area__content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-footer {
  padding-top: 1rem;
  text-align: center;
}

.auth-footer__text {
  font-size: 0.78rem;
  color: rgba(var(--v-theme-on-surface), 0.35);
}
</style>
