<template>
  <NuxtLink to="/" class="brandmark">
    <div class="brandmark__ring">NK</div>
    <div>
      <div class="brandmark__name">{{ settings.siteName }}</div>
      <div class="brandmark__tag">FASHION STORE</div>
    </div>
  </NuxtLink>
</template>

<script setup>
// Matches the mockups' `.brandmark` — gold conic ring + wordmark, used in
// the hero topbar over the photo (always white/gold, not theme-reactive).
// The name itself comes from the admin-configured site settings rather
// than being hardcoded, so renaming the store in the admin panel actually
// takes effect here.
const { settings } = useSiteSettings()
</script>

<style scoped>
.brandmark {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brandmark__ring {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: conic-gradient(from 200deg, #E7C878, #FBEFC8, #E7C878);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 12px;
  color: #16241C;
  flex-shrink: 0;
}

.brandmark__name {
  font-size: 17px;
  font-weight: 700;
  color: #fff;
}

.brandmark__tag {
  font-size: 9px;
  letter-spacing: 1.5px;
  margin-top: 1px;
  color: rgba(255, 255, 255, .78);
}
</style>
