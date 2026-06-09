import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

export interface BoardDetailsDialogData {
  boardName: string;
  owner: string;
  createdDate: string;
  todoCount: number;
  inprogressCount: number;
  reviewCount: number;
  doneCount: number;
}

@Component({
  selector: 'app-board-details-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule],
  templateUrl: './board-details-dialog.component.html',
  styleUrls: ['./board-details-dialog.component.scss']
})
export class BoardDetailsDialogComponent {
  totalTasks: number;

  constructor(
    public dialogRef: MatDialogRef<BoardDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BoardDetailsDialogData
  ) {
    this.totalTasks = data.todoCount + data.inprogressCount + data.reviewCount + data.doneCount;
  }

  close(): void {
    this.dialogRef.close();
  }
}
