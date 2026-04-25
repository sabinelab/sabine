<script setup lang="ts">
import { Icon } from '@iconify/vue'
import {
  BookCheck,
  IdCardLanyard,
  NotepadText,
  SlashSquare
} from 'lucide-vue-next'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle
} from '~/components/ui/navigation-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger
} from '~/components/ui/select'

const router = useRouter()
const { t } = useI18n()
const env = useRuntimeConfig()

const items = [
  {
    label: t('header.commands'),
    icon: SlashSquare,
    href: '/commands'
  },
  {
    label: 'Wiki',
    icon: BookCheck,
    href: '/wiki'
  },
  {
    label: t('header.changelog'),
    icon: NotepadText,
    href: '/changelog'
  },
  {
    label: t('header.cards'),
    icon: IdCardLanyard,
    href: '/cards'
  }
] as const
</script>

<template>
  <main>
    <header class="flex justify-between items-center py-5 px-15">
      <div class="flex gap-5 items-center">
        <nuxt-img
          src="/favicon.ico"
          :width="100"
          :height="100"
          densities="1x 2x"
          class="size-20 rounded-full cursor-pointer transition duration-300 hover:scale-110"
          @click="router.push('/')"
        />

        <navigation-menu :viewport="false">
          <navigation-menu-list>
            <navigation-menu-item v-for="item in items">
              <navigation-menu-link
                as-child
                :class="[
                  navigationMenuTriggerStyle(),
                  'bg-transparent hover:bg-primary hover:text-white text-white transition duration-300'
                ]"
              >
                <nuxt-link :href="item.href">
                  <div class="flex gap-1 items-center">
                    <component :is="item.icon" class="size-6" />
                    <span class="text-xl">{{ item.label }}</span>
                  </div>
                </nuxt-link>
              </navigation-menu-link>
            </navigation-menu-item>
          </navigation-menu-list>
        </navigation-menu>
      </div>

      <div class="flex items-center gap-3">
        <nuxt-link
          :href="env.public.supportServer"
          target="_blank"
          class="flex size-10 items-center justify-center text-white"
        >
          <Icon
            icon="ic:baseline-discord"
            ssr
            class="size-10 shrink-0 transition duration-300 hover:scale-105"
          />
        </nuxt-link>

        <Select>
          <SelectTrigger
            aria-label="Language"
            class="size-10 cursor-pointer border-none bg-transparent p-0 hover:bg-transparent focus-visible:ring-0 [&>svg:last-child]:hidden"
          >
            <Icon
              icon="meteor-icons:language"
              ssr
              class="size-10 shrink-0 text-white transition duration-300 hover:scale-105"
            />
          </SelectTrigger>

          <SelectContent align="end" class="bg-[#111] text-white border-none">
            <SelectItem
              value="en-us"
              class="cursor-pointer transition duration-300 hover:bg-white/10 focus:bg-white/10 focus:text-white"
            >
              English
            </SelectItem>
            <SelectItem
              value="pt-br"
              class="cursor-pointer transition duration-300 hover:bg-white/10 focus:bg-white/10 focus:text-white"
            >
              Português
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </header>
    <slot />
  </main>
</template>