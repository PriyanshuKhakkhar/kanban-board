import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ThemeService, Theme } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './theme-switcher.component.html',
  styleUrls: ['./theme-switcher.component.scss']
})
export class ThemeSwitcherComponent {
  /** Expose the signal value for template bindings */
  get activeTheme(): Theme {
    return this.themeService.currentTheme();
  }

  /** Icon name matching the active theme choice */
  get themeIcon(): string {
    return this.themeService.themeIcon;
  }

  setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }

  constructor(private themeService: ThemeService) {}
}
