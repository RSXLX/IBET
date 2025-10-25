'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from './Sidebar';
import { WalletButton } from '@/components/wallet/WalletButton';
import { motion, AnimatePresence } from 'framer-motion';

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background z-50">
        <div className="flex items-center justify-between h-full px-4">
          {/* Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>

          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-xl text-foreground">Predix</span>
          </div>

          {/* Wallet Button */}
          <div className="scale-90">
            <WalletButton />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="w-80 h-full bg-background shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">P</span>
                  </div>
                  <span className="font-bold text-xl text-foreground">Predix</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Sidebar Content */}
              <div className="h-full overflow-y-auto">
                <Sidebar onClose={() => setIsOpen(false)} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Update Sidebar component to accept onClose prop
interface SidebarCloseProps {
  onClose?: () => void;
}

// This would be added to the existing Sidebar component props