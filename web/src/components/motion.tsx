'use client'

import { motion } from 'motion/react'
import { usePathname } from '@/i18n/navigation'

type Props = {
  children: React.ReactNode
}

const initial = { opacity: 0 }
const animate = { opacity: 1 }
const exit = { opacity: 1 }
const transition = { duration: 0.25, ease: 'easeInOut' } as const

export default function Motion(props: Props) {
  const pathname = usePathname()

  return (
    <motion.div key={pathname} initial={initial} animate={animate} exit={exit} transition={transition}>
      {props.children}
    </motion.div>
  )
}