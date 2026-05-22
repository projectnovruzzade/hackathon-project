import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { PropsWithChildren } from 'react';

interface DrawerProps extends PropsWithChildren {
  open: boolean;
  onClose: () => void;
  title?: string;
}

export const Drawer = ({ open, onClose, title, children }: DrawerProps) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div
          className="fixed inset-0 z-50 bg-slate-950/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.aside
          className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-white/10 bg-slate-900/95 p-5 backdrop-blur"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 240, damping: 26 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
            <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-[calc(100%-40px)] overflow-y-auto pr-1">{children}</div>
        </motion.aside>
      </>
    )}
  </AnimatePresence>
);
