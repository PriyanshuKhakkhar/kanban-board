import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Task } from '../../../core/services/board.service';
import { AuthService, User } from '../../../features/auth/auth.service';

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

  allUsers: User[] = [];
  filteredUsers: User[] = [];
  isDropdownOpen = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<TaskFormDialogComponent>,
    private authService: AuthService,
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
      description: [
        this.data.task?.description ?? '',
        [Validators.required, Validators.minLength(10), Validators.maxLength(500)]
      ],
      priority: [this.data.task?.priority ?? '', Validators.required],
      dueDate: [initialDateStr, Validators.required],
      assigneeId: [this.data.task?.assigneeId ?? '', Validators.required],
      assigneeName: [this.data.task?.assigneeName ?? '', Validators.required],
      _assigneeSearch: [this.data.task?.assigneeName ?? '']
    });

    this.loadUsers();
  }

  loadUsers(): void {
    this.authService.getAllUsers().subscribe({
      next: (users) => {
        const role = this.authService.getRole() || 'USER';
        if (role === 'ADMIN') {
          this.allUsers = users;
        } else {
          // HR and USER can only assign to role USER
          this.allUsers = users.filter(u => u.role?.toUpperCase() === 'USER');
        }
        this.filteredUsers = this.allUsers;
      },
      error: (err) => console.error('Failed to load users for task assignment:', err)
    });
  }

  onAssigneeFocus(): void {
    this.isDropdownOpen = true;
    this.filterUsers();
  }

  onAssigneeInput(event: any): void {
    this.isDropdownOpen = true;
    this.filterUsers();
  }

  onAssigneeBlur(): void {
    // Delay hiding dropdown list to allow selection click to register
    setTimeout(() => {
      this.isDropdownOpen = false;
      const searchVal = (this.form.get('_assigneeSearch')?.value || '').trim();
      const selectedName = this.form.get('assigneeName')?.value || '';
      
      // If user typed something and it doesn't match the selected assignee name,
      // try to find a matching user or reset
      if (searchVal !== selectedName) {
        const match = this.allUsers.find(u => u.fullName.toLowerCase() === searchVal.toLowerCase());
        if (match) {
          this.selectAssignee(match);
        } else {
          // Clear selection if invalid or empty
          this.form.patchValue({
            assigneeId: '',
            assigneeName: '',
            _assigneeSearch: ''
          });
        }
      }
    }, 200);
  }

  filterUsers(): void {
    const searchVal = (this.form.get('_assigneeSearch')?.value || '').toLowerCase();
    this.filteredUsers = this.allUsers.filter(u =>
      u.fullName.toLowerCase().includes(searchVal) ||
      (u.role || '').toLowerCase().includes(searchVal)
    );
  }

  selectAssignee(user: User): void {
    // Standardize assigneeId to string, fallback to email if id is missing
    const id = user.id !== undefined && user.id !== null ? String(user.id) : user.email;
    this.form.patchValue({
      assigneeId: id,
      assigneeName: user.fullName,
      _assigneeSearch: user.fullName
    });
    this.isDropdownOpen = false;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const formVal = this.form.value;
    const taskResult: Partial<Task> = {
      title: formVal.title.trim(),
      description: formVal.description.trim(),
      priority: formVal.priority as 'HIGH' | 'MEDIUM' | 'LOW',
      dueDate: new Date(formVal.dueDate),
      assigneeId: formVal.assigneeId,
      assigneeName: formVal.assigneeName
    };

    this.dialogRef.close(taskResult);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
