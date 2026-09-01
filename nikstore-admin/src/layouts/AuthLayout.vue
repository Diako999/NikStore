<template>
  <div class="auth-layout">
    <div class="auth-glow auth-glow-1" />
    <div class="auth-glow auth-glow-2" />
    <div class="auth-grid" />
    <slot />
  </div>
</template>

<style scoped>
/* Full aurora-mesh background (login only — see glass-theme.css's --page-bg
   for the shared purple/gold/green gradient stack; AdminLayout deliberately
   stays calm/flat instead, this is the one screen that gets the full mesh). */
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--page-bg);
  background-attachment: fixed;
  background-size: cover;
  position: relative;
  overflow: hidden;
}
.auth-glow {
  position: absolute;
  border-radius: 9999px;
  pointer-events: none;
}
.auth-glow-1 {
  top: -15%;
  right: -5%;
  width: 650px;
  height: 650px;
  background: radial-gradient(circle, rgb(var(--brand-rgb) / 0.14) 0%, transparent 70%);
  filter: blur(60px);
}
.auth-glow-2 {
  bottom: -20%;
  left: -5%;
  width: 550px;
  height: 550px;
  background: radial-gradient(circle, rgb(var(--brand-rgb) / 0.10) 0%, transparent 70%);
  filter: blur(70px);
}
.auth-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgb(var(--text-primary-rgb) / 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgb(var(--text-primary-rgb) / 0.035) 1px, transparent 1px);
  background-size: 44px 44px;
  pointer-events: none;
}
</style>
