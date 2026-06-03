import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface TaskDialogData {
  /** Modal header title, e.g. "Edit Task" or "Rename Board" */
  title: string;
  /** Label shown above the input field */
  label: string;
  /** Pre-filled value when editing an existing item */
  value?: string;
  /** Placeholder text for the input */
  placeholder?: string;
}

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-dialog.component.html',
  styleUrls: ['./task-dialog.component.scss']
})
export class TaskDialogComponent {
  inputValue: string;

  constructor(
    public dialogRef: MatDialogRef<TaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaskDialogData
  ) {
    this.inputValue = data.value ?? '';
  }

  save(): void {
    const trimmed = this.inputValue.trim();
    if (!trimmed) return;
    this.dialogRef.close(trimmed);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.save();
    if (event.key === 'Escape') this.cancel();
  }
}
