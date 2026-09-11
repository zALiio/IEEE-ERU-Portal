import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X as CloseIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

// items: [{ label, icon: Component, to?: string, onClick?: () => void, primary?: boolean }]
export default function NavDrawer({ items }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden glass-pill p-3 hover:bg-primary/10 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="absolute right-0 top-0 h-full w-72 max-w-[85vw] glass rounded-none p-4 flex flex-col gap-2 overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: [0.25, 0.46, 0.45, 0.94], duration: 0.25 }}
            >
              <button
                onClick={() => setOpen(false)}
                className="self-end p-2 mb-2 text-foreground/50 hover:text-foreground/80"
                aria-label="Close menu"
              >
                <CloseIcon size={20} />
              </button>
              {items.map((item, i) =>
                item.to ? (
                  <Link
                    key={i}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="glass-pill px-4 py-3 flex items-center gap-3 text-sm hover:bg-primary/10 transition-colors"
                  >
                    <item.icon size={16} /> {item.label}
                  </Link>
                ) : (
                  <button
                    key={i}
                    onClick={() => { item.onClick(); setOpen(false) }}
                    className={`px-4 py-3 flex items-center gap-3 text-sm rounded-full transition-colors ${
                      item.primary ? 'btn-primary' : 'glass-pill hover:bg-primary/10'
                    }`}
                  >
                    <item.icon size={16} /> {item.label}
                  </button>
                )
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
