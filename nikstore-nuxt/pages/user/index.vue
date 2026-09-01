<script setup>
definePageMeta({
  middleware: () => navigateTo('/user/profile', { replace: true })
})
useSeoMeta({ robots: 'noindex,nofollow' })
</script>
