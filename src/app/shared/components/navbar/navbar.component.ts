import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateBoardDialogComponent } from '../create-board-dialog/create-board-dialog.component';
import { BoardService } from '../../../core/services/board.service';
import { AuthService } from '../../../features/auth/auth.service';
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
  notificationsCount = 3;
  userInitials = 'PK';

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
    const ref = this.dialog.open(CreateBoardDialogComponent, { width: '420px' });
    ref.afterClosed().subscribe((board) => {
      if (board) {
        this.boardService.addBoard(board);
      }
    });
  }
}
