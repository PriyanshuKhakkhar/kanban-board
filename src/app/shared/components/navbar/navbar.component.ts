import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CreateBoardDialogComponent } from '../create-board-dialog/create-board-dialog.component';
import { BoardService } from '../../../core/services/board.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule, MatMenuModule, MatDividerModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  useImageLogo = true;
  notificationsCount = 3;
  userInitials = 'PK';

  onLogout() {
    // placeholder logout action
    console.log('logout clicked');
  }

  onLogoError() {
    this.useImageLogo = false;
  }

  constructor(private dialog: MatDialog, private boardService: BoardService) {}

  openCreateDialog() {
    const ref = this.dialog.open(CreateBoardDialogComponent, { width: '420px' });
    ref.afterClosed().subscribe((board) => {
      if (board) {
        this.boardService.addBoard(board);
      }
    });
  }
}
