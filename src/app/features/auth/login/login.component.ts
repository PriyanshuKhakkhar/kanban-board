import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { 
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms'
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatCheckboxModule, MatDividerModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent {
  loginForm: FormGroup;
  

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      usernameOrEmail: ['', Validators.required],
      password: ['', Validators.required],
      remember: [false]
    });
    console.log('LoginComponent constructed');
  }
  onSubmit(): void {
    if (this.loginForm.valid) {
      const { usernameOrEmail, password } = this.loginForm.value;
      const success = this.authService.login(usernameOrEmail, password);
      if (!success) {
        this.loginForm.setErrors({ invalidCredentials: true });
      }
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  onLogin(): void {
    if (this.loginForm.valid) {
      const { usernameOrEmail, password } = this.loginForm.value;
      const success = this.authService.login(usernameOrEmail, password);
      if (!success) {
        this.loginForm.setErrors({ invalidCredentials: true });
      }
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
  onLoginWithGoogle(): void {
    if (this.loginForm.valid) {
      this.router.navigate(['/dashboard']);
    }
  }

  onCreateAccount(event?: Event): void {
    event?.preventDefault();
    this.router.navigate(['/register']);
  }
}
