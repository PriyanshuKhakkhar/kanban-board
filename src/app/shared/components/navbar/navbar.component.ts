import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateBoardDialogComponent } from '../create-board-dialog/create-board-dialog.component';
import { BoardService } from '../../../core/services/board.service';
import { AuthService, User } from '../../../features/auth/auth.service';
import { ThemeSwitcherComponent } from '../theme-switcher/theme-switcher.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatMenuModule,
    MatDividerModule,
    ThemeSwitcherComponent
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  useImageLogo = true;
  notificationsCount = 0;

  get canManageBoards(): boolean {
    return this.authService.getCurrentUserRole() === 'ADMIN';
  }

  get currentUser(): User | null {
    return this.authService.getCurrentUser();
  }

  get userInitials(): string {
    const email = this.authService.getCurrentUserEmail();
    if (!email) return 'GU';
    const user = this.authService.getCurrentUser();
    if (user && user.fullName) {
      const parts = user.fullName.trim().split(/\s+/);
      const initials = parts.map(p => p[0]).join('').toUpperCase();
      return initials.substring(0, 2);
    }
    return email.substring(0, 2).toUpperCase();
  }

  onLogout() {
    this.authService.logout();
  }

  onLogoError() {
    this.useImageLogo = false;
  }

  constructor(
    private dialog: MatDialog,
    private boardService: BoardService,
    private authService: AuthService
  ) {}

  openCreateDialog() {
    if (!this.canManageBoards) return;
    const ref = this.dialog.open(CreateBoardDialogComponent, { width: '420px' });
    ref.afterClosed().subscribe((board) => {
      if (board) {
        this.boardService.addBoard(board);
      }
    });
  }
}
