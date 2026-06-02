import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-create-board-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './create-board-dialog.component.html',
  styleUrls: ['./create-board-dialog.component.scss']
})
export class CreateBoardDialogComponent {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateBoardDialogComponent>
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required]
    });
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const name = (this.form.get('name')?.value || '').trim();
    const board = {
      id: Date.now(),
      name,
      createdAt: new Date().toISOString()
    };
    this.dialogRef.close(board);
  }

  cancel() {
    this.dialogRef.close();
  }
}
