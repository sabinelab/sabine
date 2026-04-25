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
    plugins: [tailwind()],
    optimizeDeps: {
      include: [
        'lucide-vue-next',
        'class-variance-authority',
        '@vueuse/core',
        'reka-ui',
        'clsx',
        'tailwind-merge'
      ]
    }
  },
  css: ['~/assets/css/main.css'],
  components: [
    {
      path: '~/components',
      extensions: ['vue']
    }
  ],
  modules: ['@nuxt/fonts', '@nuxt/image', '@nuxtjs/i18n'],
  experimental: {
    typedPages: true
  },
  i18n: {
    defaultLocale: 'en-US',
    strategy: 'no_prefix',
    locales: [
      {
        code: 'en-us',
        language: 'en-us',
        file: 'en-us.json'
      }
    ]
  }
})