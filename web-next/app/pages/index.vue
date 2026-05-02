<script setup lang="ts">
import { ArrowDown } from 'lucide-vue-next'
import { Button } from '~/components/ui/button'

definePageMeta({
  layout: 'default'
})

const { t } = useI18n()
const router = useRouter()
</script>

<template>
  <div class="-mt-30 h-dvh flex flex-col justify-center items-center gap-5">
    <NuxtImg src="/favicon.ico" :width="180" :height="180" class="rounded-full" />

    <div class="flex flex-col items-center max-w-md md:max-w-full text-center gap-2">
      <h1 class="text-6xl font-bold md:text-8xl">Sabine</h1>
      <h2 class="text-2xl md:text-4xl">{{ t('pages.home.title') }}</h2>
    </div>

    <Button
      variant="outline"
      class="h-11 px-5 md:h-13 md:px-7 md:text-lg bg-transparent cursor-pointer"
      @click="router.push('/invite')"
    >
      <span class="text-3xl">{{ t('pages.home.add_to_discord') }}</span>
    </Button>

    <ArrowDown :size="50" class="animate-bounce absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2" />
  </div>

  <div class="flex flex-col justify-center items-center px-6 md:px-20 pt-8 md:pt-15">
    <div class="flex w-full max-w-8xl flex-col md:flex-row items-center gap-10">
      <div class="text-center md:text-left md:flex-1">
        <h1 class="text-4xl font-bold">{{ t('pages.home.build.title') }}</h1>
        <I18nT keypath="pages.home.build.desc" tag="p" class="text-[#9CA3AF] text-lg">
          <template #claim>
            <strong class="font-extrabold">/claim</strong>
          </template>

          <template #promote>
            <strong class="font-extrabold">/promote</strong>
          </template>

          <template #roster>
            <strong class="font-extrabold">/roster active</strong>
          </template>
        </I18nT>
      </div>

      <div class="hidden md:flex md:flex-1 justify-center gap-5">
        <NuxtImg
          src="/claim.png"
          :width="500"
          :height="500"
          densities="1x 2x"
          class="size-75 rounded-md shadow-xl transition duration-300 hover:scale-105"
        />
        <NuxtImg
          src="/match.png"
          :width="500"
          :height="500"
          densities="1x 2x"
          class="size-75 rounded-md shadow-xl transition duration-300 hover:scale-105"
        />
      </div>
    </div>
  </div>
</template>
