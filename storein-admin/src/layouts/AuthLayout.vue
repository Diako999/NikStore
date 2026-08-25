<template>
  <div class="auth-layout">
    <div class="auth-glow auth-glow-1" />
    <div class="auth-glow auth-glow-2" />
    <div class="auth-grid" />
    <slot />
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #FFFFFF;
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
  background: radial-gradient(circle, rgba(26,54,32,0.06) 0%, transparent 70%);
  filter: blur(60px);
}
.auth-glow-2 {
  bottom: -20%;
  left: -5%;
  width: 550px;
  height: 550px;
  background: radial-gradient(circle, rgba(26,54,32,0.04) 0%, transparent 70%);
  filter: blur(70px);
}
.auth-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(26,54,32,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(26,54,32,0.03) 1px, transparent 1px);
  background-size: 44px 44px;
  pointer-events: none;
}
</style>
