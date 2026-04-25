'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlignJustify, AlignLeft, Moon, Search, Sun } from './icons';

interface GlobalNavProps {
  isCompact: boolean;
  setIsCompact: (value: boolean) => void;
  isDark: boolean;
  setIsDark: (value: boolean) => void;
}

export function GlobalNav({
  isCompact,
  setIsCompact,
  isDark,
  setIsDark,
}: GlobalNavProps) {
  const pathname = usePathname();
  const navLinks = [
    { name: 'Monitor', path: '/' },
    { name: 'Compare', path: '/compare' },
    { name: 'Coverage', path: '/coverage', disabled: true },
    { name: 'Methodology', path: '/methodology', disabled: true },
  ];

  return (
    <header className="sticky top-0 z-50 flex h-12 items-center justify-between border-b border-stroke bg-canvas px-3 md:px-4">
      <div className="flex h-full items-center gap-3 md:gap-6">
        <Link href="/" className="group flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-accent transition-colors group-hover:bg-accent-hover">
            <div className="h-2 w-2 rounded-[1px] bg-canvas" />
          </div>
          <span className="text-label hidden tracking-widest text-ink sm:inline-block">REIT RESEARCH</span>
        </Link>

        <nav className="ml-1 flex h-full items-center gap-1 md:ml-4" aria-label="Primary navigation">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.path ||
              (link.path === '/' && pathname === '/monitor') ||
              (link.path !== '/' && pathname?.startsWith(link.path));

            if (link.disabled) {
              return (
                <span
                  key={link.name}
                  className="hidden cursor-not-allowed px-3 text-sm text-ink-faint md:inline-flex"
                >
                  {link.name}
                </span>
              );
            }

            return (
              <Link
                key={link.name}
                href={link.path}
                className={`relative flex h-full items-center px-3 text-sm font-medium transition-colors ${
                  isActive ? 'text-accent' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {link.name}
                {isActive && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <div className="hidden cursor-text items-center gap-2 rounded-sm border border-stroke bg-surface-alt px-2 py-1 text-xs text-ink-muted lg:flex">
          <Search className="h-3.5 w-3.5" />
          <span className="w-24 xl:w-32">Search...</span>
          <kbd className="rounded-[2px] border border-stroke bg-canvas px-1 font-sans text-[10px]">Cmd+K</kbd>
        </div>

        <div className="flex items-center gap-1 border-l border-stroke pl-3 md:pl-4">
          <button
            onClick={() => setIsCompact(!isCompact)}
            className="rounded-sm p-1.5 text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink"
            title={isCompact ? 'Switch to comfortable density' : 'Switch to compact density'}
            aria-label={isCompact ? 'Switch to comfortable density' : 'Switch to compact density'}
          >
            {isCompact ? <AlignJustify className="h-4 w-4" /> : <AlignLeft className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setIsDark(!isDark)}
            className="rounded-sm p-1.5 text-ink-muted transition-colors hover:bg-surface-alt hover:text-ink"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        <div className="hidden border-l border-stroke pl-4 text-xs text-ink-faint xl:block">
          Last updated 24 Apr 2025
        </div>
      </div>
    </header>
  );
}
