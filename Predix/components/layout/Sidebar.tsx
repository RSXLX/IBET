'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSimpleTranslation } from '@/lib/i18n-simple';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  BarChart3, 
  Trophy, 
  DollarSign, 
  Newspaper, 
  Puzzle,
  LogIn,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Remove external config dependency

const icons = {
  Home,
  BarChart3,
  Trophy,
  DollarSign,
  Newspaper,
  Puzzle,
  LogIn
};

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  onClose?: () => void; // 接受但不使用，保持菜单始终显示
}

export function Sidebar({ isCollapsed = false, onToggle, onClose }: SidebarProps) {
  const { t } = useSimpleTranslation();
  const pathname = usePathname();

  // Define navigation items
  const mainNav = [
    { id: 'home', label: t('nav.home'), href: '/', icon: 'Home' },
    { id: 'sports', label: t('topics.sports'), href: '/sports-betting', icon: 'Trophy' },
    { id: 'markets', label: t('nav.markets'), href: '/markets', icon: 'BarChart3' },
    { id: 'leaderboard', label: t('nav.leaderboard'), href: '/leaderboard', icon: 'Trophy' },
    { id: 'news', label: t('nav.news'), href: '/news', icon: 'Newspaper' }
  ];



  const footer = [
    { id: 'footer.about', href: '/about' },
    { id: 'footer.privacy', href: '/privacy' },
    { id: 'footer.terms', href: '/terms' },
    { id: 'footer.contact', href: '/contact' }
  ];

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-full sidebar-dark transition-all duration-300 z-40',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo and Toggle */}
      <div className="flex items-center justify-between p-4">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center tech-glow">
              <span className="text-primary-foreground font-bold text-sm">P</span>
            </div>
            <span className="font-bold text-xl text-foreground">Predix</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="ml-auto"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-6">
        {/* Main Navigation */}
        <div className="space-y-2">
          {mainNav.map((item) => {
            const Icon = icons[item.icon as keyof typeof icons];
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.id}
                href={item.href || '#'}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground tech-glow'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="w-5 h-5" />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>



      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        {!isCollapsed && (
          <div className="space-y-2">
            {footer.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="block text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t(item.id)}
              </Link>
            ))}
            <p className="text-xs text-muted-foreground mt-4">
              {t('copyright')}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}