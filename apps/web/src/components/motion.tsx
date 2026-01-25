'use client'

import { motion } from 'motion/react'
import { usePathname } from '@/i18n/navigation'

type Props = {
  children: React.ReactNode
}

export default function Motion(props: Props) {
  const pathname = usePathname()

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
    >
      {props.children}
    </motion.div>
  )
}
