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
  isLoading = false;
  hidePassword = true;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      usernameOrEmail: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(50)]],
      remember: [false]
    });
  }
// When user clicks login performLogin() is called check the login form and is loading true or not if form is invalid then marks all as touched and show validation errro but if valid then 
// username and password is get from form and check auth.service and wait for server response if invalid then show invalid credentials but if valid then login success and navigate to dashboard 
   performLogin(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      const { usernameOrEmail, password } = this.loginForm.value;

      const email = (usernameOrEmail || '').trim();
      const pass = (password || '').trim();

      this.authService.login(email, pass).subscribe({
        next: (user) => {
          this.isLoading = false;
          if (!user) {
            this.loginForm.setErrors({ invalidCredentials: true });
          }
        },
        error: () => {
          this.isLoading = false;
          this.loginForm.setErrors({ invalidCredentials: true });
        }
      });
    } else if (!this.loginForm.valid) {
      this.loginForm.markAllAsTouched();
    }
  }

  onCreateAccount(event?: Event): void {
    event?.preventDefault();
    this.router.navigate(['/register']);
  }
}
