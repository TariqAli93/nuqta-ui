<!--
  PageShell — top-level wrapper for standalone pages (list, detail, form, workspace root).
  Use SubPageShell instead for workspace child pages rendered inside a parent layout (e.g. accounting tabs).
-->
<template>
  <div class="win-page">
    <slot />
  </div>
</template>
