<template>
  <div class="nik-links">
    <div class="nik-links__badge-ring">
      <img
        class="nik-links__badge-img"
        src="/nik-logo.png"
        alt="فروشگاه لباس نیک"
        width="168"
        height="168"
      >
    </div>

    <h1 class="nik-links__title">
      فروشگاه لباس نیک <span class="nik-links__title-latin">(Nik)</span>
    </h1>
    <p class="nik-links__subtitle">لینک صفحه‌های اجتماعی</p>

    <ul class="nik-links__list">
      <li>
        <SocialLinkButton
          href="https://instagram.com/nikstore_ir"
          label="nikstore_ir"
          icon-class="link-pill--instagram"
        >
          <template #icon>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="5.5" stroke="#fff" stroke-width="1.8" />
              <circle cx="12" cy="12" r="4.2" stroke="#fff" stroke-width="1.8" />
              <circle cx="17.3" cy="6.7" r="1.15" fill="#fff" />
            </svg>
          </template>
        </SocialLinkButton>
      </li>
      <li>
        <SocialLinkButton
          href="https://t.me/nikstore_ir"
          label="nikstore_ir"
          icon-class="link-pill--telegram"
        >
          <template #icon>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
              <path d="M21.5 3.5 2.6 11.1c-1.2.5-1.2 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.6.4.8.8.8.3 0 .5-.1.7-.3l2.6-2.5 5 3.7c.9.5 1.6.2 1.8-.9l3.4-16c.3-1.3-.5-1.9-1.8-1z" fill="#fff" />
              <path d="M9 14.5 18.5 8l-8 6.8-.2 3.4z" fill="#c8e6fb" />
            </svg>
          </template>
        </SocialLinkButton>
      </li>
      <li>
        <SocialLinkButton
          href="https://www.nikstoree.ir"
          label="www.nikstoree.ir"
          icon-class="link-pill--site"
        >
          <template #icon>
            <svg width="26" height="20" viewBox="0 0 26 20" aria-hidden="true">
              <text x="0.5" y="14.5" font-family="Georgia, 'Times New Roman', serif" font-size="13" font-weight="700" fill="#1a1a18">N</text>
              <text x="12" y="14.5" font-family="Georgia, 'Times New Roman', serif" font-size="13" font-weight="700" fill="#c9a24a">K</text>
            </svg>
          </template>
        </SocialLinkButton>
      </li>
    </ul>

    <p class="nik-links__footer">Nik Fashion Store</p>
  </div>
</template>

<script setup>
import SocialLinkButton from '~/components/links/SocialLinkButton.vue'
</script>

<style scoped>
.nik-links {
  --links-ground:      #0e2119;
  --links-ground-deep: #081611;
  --links-gold:        #f2c53d;
  --links-gold-soft:   #d9b451;
  --links-pill-bg:       #34342f;
  --links-pill-bg-hover: #3d3d37;
  --links-pill-border:   #4a4a41;
  --links-muted:  #a7b2ab;
  --links-footer: #5f6d64;

  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.nik-links__badge-ring {
  width: 168px;
  height: 168px;
  border-radius: 50%;
  background: #fbf8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 0 0 1px rgba(242, 197, 61, 0.35),
    0 10px 30px rgba(0, 0, 0, 0.45);
  margin-bottom: 28px;
}

.nik-links__badge-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.nik-links__title {
  font-size: 25px;
  font-weight: 700;
  color: var(--links-gold);
  margin: 0 0 10px;
  text-wrap: balance;
  letter-spacing: 0.2px;
}

.nik-links__title-latin {
  font-family: Georgia, 'Times New Roman', serif;
  font-style: italic;
}

.nik-links__subtitle {
  font-size: 14px;
  color: var(--links-muted);
  margin: 0 0 28px;
}

.nik-links__list {
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.nik-links__list li { width: 100%; }

.nik-links__footer {
  margin-top: 36px;
  font-size: 11.5px;
  color: var(--links-footer);
  letter-spacing: 0.3px;
}
</style>
