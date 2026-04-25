<script setup lang="ts">
import {
  BookCheck,
  IdCardLanyard,
  Menu,
  NotepadText,
  SlashSquare
} from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
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
    <header
      class="hidden md:flex justify-between items-center py-5 md:px-15 px-5"
    >
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            class="size-10 shrink-0 transition duration-300 hover:scale-105"
          >
            <path
              fill="currentColor"
              d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.1.1 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.1 16.1 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02M8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12m6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12"
            />
          </svg>
        </nuxt-link>

        <Select>
          <SelectTrigger
            aria-label="Language"
            class="size-10 cursor-pointer border-none bg-transparent p-0 hover:bg-transparent focus-visible:ring-0 [&>svg:last-child]:hidden"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              class="size-10 shrink-0 text-white transition duration-300 hover:scale-105"
            >
              <path
                fill="currentColor"
                d="m20.58 19.37l-2.99-8.36c-.21-.55-.68-.89-1.22-.89s-1 .34-1.23.91l-2.98 8.34a.75.75 0 1 0 1.41.51l.62-1.73h4.35l.62 1.73c.11.31.4.5.71.5c.08 0 .17-.01.25-.04a.75.75 0 0 0 .45-.96Zm-5.84-2.73l1.64-4.59l1.64 4.59zm-2.55-8.79c-2.26 3.57-4.3 5.73-6.78 7.17a.746.746 0 0 1-1.02-.27a.74.74 0 0 1 .27-1.02c2.1-1.22 3.82-2.97 5.75-5.87H4.12c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h3.75V4.38c0-.41.34-.75.75-.75s.75.34.75.75v1.98h3.75c.41 0 .75.34.75.75s-.34.75-.75.75h-.94Zm.04 7.27c-.13 0-.26-.03-.38-.1c-.65-.38-1.28-.8-1.87-1.24a.75.75 0 0 1 .9-1.2c.54.41 1.13.79 1.73 1.14a.752.752 0 0 1-.38 1.4"
              />
            </svg>
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

    <header class="md:hidden flex justify-between items-center p-5">
      <nuxt-img
        src="/favicon.ico"
        :width="100"
        :height="100"
        densities="1x 2x"
        class="size-20 rounded-full cursor-pointer transition duration-300 hover:scale-110"
        @click="router.push('/')"
      />

      <div class="flex items-center">
        <Select>
          <SelectTrigger
            aria-label="Language"
            class="size-10 cursor-pointer border-none bg-transparent p-0 hover:bg-transparent focus-visible:ring-0 [&>svg:last-child]:hidden"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              class="size-7 shrink-0 text-white transition duration-300 hover:scale-105"
            >
              <path
                fill="currentColor"
                d="m20.58 19.37l-2.99-8.36c-.21-.55-.68-.89-1.22-.89s-1 .34-1.23.91l-2.98 8.34a.75.75 0 1 0 1.41.51l.62-1.73h4.35l.62 1.73c.11.31.4.5.71.5c.08 0 .17-.01.25-.04a.75.75 0 0 0 .45-.96Zm-5.84-2.73l1.64-4.59l1.64 4.59zm-2.55-8.79c-2.26 3.57-4.3 5.73-6.78 7.17a.746.746 0 0 1-1.02-.27a.74.74 0 0 1 .27-1.02c2.1-1.22 3.82-2.97 5.75-5.87H4.12c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h3.75V4.38c0-.41.34-.75.75-.75s.75.34.75.75v1.98h3.75c.41 0 .75.34.75.75s-.34.75-.75.75h-.94Zm.04 7.27c-.13 0-.26-.03-.38-.1c-.65-.38-1.28-.8-1.87-1.24a.75.75 0 0 1 .9-1.2c.54.41 1.13.79 1.73 1.14a.752.752 0 0 1-.38 1.4"
              />
            </svg>
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

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Menu />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            class="bg-[#111] text-white border-none"
          >
            <DropdownMenuGroup class="">
              <DropdownMenuItem
                v-for="item in items"
                @click="router.push(item.href)"
                class="hover:bg-white/10 focus:bg-white/10 focus:text-white active:bg-white/10 data-highlighted:bg-white/10 data-highlighted:text-white"
              >
                {{ item.label }}

                <DropdownMenuShortcut>
                  <component :is="item.icon" class="text-white" />
                </DropdownMenuShortcut>
              </DropdownMenuItem>

              <a :href="env.public.supportServer" target="_blank">
                <DropdownMenuItem>
                  Discord

                  <DropdownMenuShortcut>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      class="size-5 text-white shrink-0 transition duration-300 hover:scale-105"
                    >
                      <path
                        fill="currentColor"
                        d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.1.1 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.1 16.1 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02M8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12m6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12"
                      />
                    </svg>
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
              </a>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    <slot />
  </main>
</template>