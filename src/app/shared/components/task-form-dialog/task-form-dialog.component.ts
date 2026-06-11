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
    // Initialize form with defaults
    this.form = this.fb.group({
      title: ['', Validators.required],
      description: [
        '',
        [Validators.required, Validators.minLength(10), Validators.maxLength(500)]
      ],
      priority: ['', Validators.required],
      dueDate: ['', Validators.required],
      assigneeId: ['', Validators.required],
      assigneeName: ['', Validators.required],
      _assigneeSearch: [''],
      isComplete: [false]
    });

    const role = this.authService.getRole() || 'USER';

    // Populate form if task is being edited
    if (this.data.task) {
      let initialDateStr = '';
      if (this.data.task.dueDate) {
        const dateObj = new Date(this.data.task.dueDate);
        if (!isNaN(dateObj.getTime())) {
          initialDateStr = dateObj.toISOString().split('T')[0];
        }
      }

      this.form.patchValue({
        title: this.data.task.title ?? '',
        description: this.data.task.description ?? '',
        priority: this.data.task.priority ?? '',
        dueDate: initialDateStr,
        assigneeId: this.data.task.assigneeId ?? '',
        assigneeName: this.data.task.assigneeName ?? '',
        _assigneeSearch: this.data.task.assigneeName ?? '',
        isComplete: this.data.task.isComplete ?? false
      });

      if ((role === 'HR' || role === 'USER') && !this.isAssignedToCurrentUser(this.data.task)) {
        this.form.get('isComplete')?.disable();
      }
    } else {
      // Auto-fill logged in user if USER role is creating a task
      if (role === 'USER') {
        const currentUser = this.authService.getCurrentUser();
        const email = currentUser?.email;
        const raw = localStorage.getItem('users');
        let foundUser: User | null = null;
        if (raw && email) {
          try {
            const users = JSON.parse(raw) as User[];
            foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
          } catch {}
        }
        if (foundUser) {
          const id = foundUser.id !== undefined && foundUser.id !== null ? String(foundUser.id) : foundUser.email;
          this.form.patchValue({
            assigneeId: id,
            assigneeName: foundUser.fullName,
            _assigneeSearch: foundUser.fullName
          });
        }
      }
    }

    // Disable assignment selection for regular user
    if (role === 'USER') {
      this.form.get('_assigneeSearch')?.disable();
    }

    this.loadUsers();
  }

  isAssignedToCurrentUser(task: Task | undefined): boolean {
    if (!task) return false;
    const email = this.authService.getCurrentUserEmail();
    if (!email) return false;
    
    let loggedInId: string | null = null;
    const raw = localStorage.getItem('users');
    if (raw) {
      try {
        const users = JSON.parse(raw) as any[];
        const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (found) loggedInId = String(found.id);
      } catch {}
    }

    if (loggedInId && task.assigneeId && String(task.assigneeId) === String(loggedInId)) {
      return true;
    }
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      if (task.assigneeName && currentUser.fullName && task.assigneeName.toLowerCase() === currentUser.fullName.toLowerCase()) {
        return true;
      }
      if (task.assigneeId && currentUser.email && String(task.assigneeId).toLowerCase() === currentUser.email.toLowerCase()) {
        return true;
      }
    }
    return false;
  }

  loadUsers(): void {
    this.authService.getAllUsers().subscribe({
      next: (users) => {
        const role = this.authService.getRole() || 'USER';
        if (role === 'ADMIN') {
          this.allUsers = users;
        } else if (role === 'HR') {
          // HR can assign to any user except ADMIN
          this.allUsers = users.filter(u => u.role?.toUpperCase() !== 'ADMIN');
        } else {
          // USER can only assign to self
          const currentUser = this.authService.getCurrentUser();
          const email = currentUser?.email;
          const found = users.find(u => u.email.toLowerCase() === email?.toLowerCase());
          this.allUsers = found ? [found] : [];
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

  get isTaskInProgress(): boolean {
    return this.data.task?.status?.toLowerCase() === 'in progress';
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const formVal = this.form.getRawValue();

    // Security check: USER role can only assign to themselves.
    const role = this.authService.getRole() || 'USER';
    let finalAssigneeId = formVal.assigneeId;
    let finalAssigneeName = formVal.assigneeName;
    if (role === 'USER') {
      const currentUser = this.authService.getCurrentUser();
      const email = currentUser?.email;
      const raw = localStorage.getItem('users');
      let foundUser: User | null = null;
      if (raw && email) {
        try {
          const users = JSON.parse(raw) as User[];
          foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
        } catch {}
      }
      if (foundUser) {
        finalAssigneeId = foundUser.id !== undefined && foundUser.id !== null ? String(foundUser.id) : foundUser.email;
        finalAssigneeName = foundUser.fullName;
      }
    }

    // Security check: HR cannot assign tasks to Admin.
    if (role === 'HR') {
      const raw = localStorage.getItem('users');
      let isSelAdmin = false;
      if (raw && formVal.assigneeId) {
        try {
          const users = JSON.parse(raw) as User[];
          const sel = users.find(u => String(u.id) === String(formVal.assigneeId) || u.email.toLowerCase() === String(formVal.assigneeId).toLowerCase());
          if (sel?.role?.toUpperCase() === 'ADMIN') {
            isSelAdmin = true;
          }
        } catch {}
      }
      if (isSelAdmin) {
        alert("HR is not allowed to assign tasks to Admin.");
        return;
      }
    }

    const taskResult: Partial<Task> = {
      title: formVal.title.trim(),
      description: formVal.description.trim(),
      priority: formVal.priority as 'HIGH' | 'MEDIUM' | 'LOW',
      dueDate: new Date(formVal.dueDate),
      assigneeId: finalAssigneeId,
      assigneeName: finalAssigneeName,
      isComplete: formVal.isComplete === true,
      isCompleted: formVal.isComplete === true
    };

    this.dialogRef.close(taskResult);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
