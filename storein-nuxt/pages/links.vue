<template>
  <div class="links-page">
    <NikLinksCard />
  </div>
</template>

<script setup>
import NikLinksCard from '~/components/links/NikLinksCard.vue'

definePageMeta({ layout: false })

const config = useRuntimeConfig()

useSeoMeta({
  title:       'نیک | لینک صفحه‌های اجتماعی',
  description: 'لینک صفحه اینستاگرام، تلگرام و وب‌سایت فروشگاه لباس نیک.',
  ogUrl:       () => `${config.public.siteUrl}/links`,
})
useHead({ link: [{ rel: 'canonical', href: () => `${config.public.siteUrl}/links` }] })
</script>

<style scoped>
.links-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 20px 72px;
  background:
    radial-gradient(120% 90% at 50% -10%, #163527 0%, #0e2119 45%, #081611 100%);
}
</style>
