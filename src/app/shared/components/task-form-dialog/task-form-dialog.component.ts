import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Task } from '../../../core/services/board.service';

export interface TaskFormDialogData {
  title: string;
  task?: Task;
  submitLabel?: string;
}

@Component({
  selector: 'app-task-form-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-form-dialog.component.html',
  styleUrls: ['./task-form-dialog.component.scss']
})
export class TaskFormDialogComponent implements OnInit {
  form!: FormGroup;
  title: string;
  submitLabel: string;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<TaskFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TaskFormDialogData
  ) {
    this.title = data.title;
    this.submitLabel = data.submitLabel ?? 'Add';
  }

  ngOnInit(): void {
    let initialDateStr = '';
    if (this.data.task?.dueDate) {
      const dateObj = new Date(this.data.task.dueDate);
      if (!isNaN(dateObj.getTime())) {
        initialDateStr = dateObj.toISOString().split('T')[0];
      }
    }

    this.form = this.fb.group({
      title: [this.data.task?.title ?? '', Validators.required],
      priority: [this.data.task?.priority ?? '', Validators.required],
      dueDate: [initialDateStr, Validators.required]
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const formVal = this.form.value;
    const taskResult: Partial<Task> = {
      title: formVal.title.trim(),
      priority: formVal.priority as 'HIGH' | 'MEDIUM' | 'LOW',
      dueDate: new Date(formVal.dueDate)
    };

    this.dialogRef.close(taskResult);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
