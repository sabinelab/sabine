import tailwind from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: {
    enabled: true
  },
  nitro: {
    preset: 'bun',
    imports: {
      warn(message) {
        if (
          message.includes('Duplicated imports "useAppConfig"') &&
          message.includes('nitropack/runtime/internal/config')
        )
          return

        console.warn(message)
      }
    }
  },
  vite: {
    plugins: [tailwind()]
  },
  css: ['~/assets/css/main.css'],
  components: [
    {
      path: '~/components',
      extensions: ['vue']
    }
  ],
  modules: ['@nuxt/fonts', '@nuxt/image'],
  experimental: {
    typedPages: true
  }
})