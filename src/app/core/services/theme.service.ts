import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'theme';
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  /** Reactive signal — current user-chosen theme (not the resolved effective theme). */
  readonly currentTheme = signal<Theme>(this.loadSavedTheme());

  constructor() {
    // Apply immediately on startup
    this.applyEffectiveTheme();

    // Listen for OS preference changes while in System mode
    this.mediaQuery.addEventListener('change', () => {
      if (this.currentTheme() === 'system') {
        this.applyEffectiveTheme();
      }
    });

    // Whenever the signal changes, persist + apply
    effect(() => {
      const theme = this.currentTheme();
      localStorage.setItem(this.STORAGE_KEY, theme);
      this.applyEffectiveTheme();
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Set theme to 'light', 'dark', or 'system'. */
  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
  }

  /**
   * Returns the actual resolved theme ('light' | 'dark').
   * 'system' resolves by reading the OS preference.
   */
  getEffective(): 'light' | 'dark' {
    const chosen = this.currentTheme();
    if (chosen === 'system') {
      return this.mediaQuery.matches ? 'dark' : 'light';
    }
    return chosen;
  }

  /** Material icon name matching the current theme choice. */
  get themeIcon(): string {
    switch (this.currentTheme()) {
      case 'dark':   return 'dark_mode';
      case 'system': return 'brightness_auto';
      default:       return 'light_mode';
    }
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private loadSavedTheme(): Theme {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
    return 'light'; // default
  }

  private applyEffectiveTheme(): void {
    const isDark = this.getEffective() === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
  }
}
