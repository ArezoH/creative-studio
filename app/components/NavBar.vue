<script setup lang="ts">
const { loggedIn, clear } = useUserSession();
</script>
<template>
  <nav class="relative z-50 px-6 py-4">
    <div class="max-w-7xl mx-auto flex justify-between items-center">
      <div class="flex items-center space-x-2">
        <UIcon name="i-heroicons-sparkles" class="w-8 h-8 text-purple-400" />
        <span class="text-xl font-bold text-white">AI Content Studio</span>
      </div>

      <div class="hidden md:flex items-center space-x-6">
        <NuxtLink
          to="#features"
          class="text-gray-300 hover:text-white transition-colors"
          >Features</NuxtLink
        >
        <NuxtLink
          to="#demo"
          class="text-gray-300 hover:text-white transition-colors"
          >Demo</NuxtLink
        >
        <NuxtLink
          to="#pricing"
          class="text-gray-300 hover:text-white transition-colors"
          >Pricing</NuxtLink
        >
      </div>

      <div class="flex items-center space-x-4">
        <template v-if="loggedIn">
          <UButton to="/dashboard" color="secondary" variant="solid">
            Dashboard
          </UButton>
        </template>
        <template v-else>
          <UButton
            @click="
              clear();
              navigateTo('/login');
            "
            color="secondary"
            variant="solid"
          >
            Login
          </UButton>
        </template>
      </div>
    </div>
  </nav>
</template>
