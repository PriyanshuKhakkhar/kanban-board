import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Router } from '@angular/router';
import { ThemeSwitcherComponent } from '../../shared/components/theme-switcher/theme-switcher.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCheckboxModule,
    ThemeSwitcherComponent
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {
  heroForm!: FormGroup;
  isScrolled = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  constructor(private fb: FormBuilder, private router: Router) {
    this.heroForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  gotoLogin(): void {
    this.router.navigate(['/login']);
  }

  onCreateAccount() {
    this.router.navigate(['/register']);
  }

  start() {
    if (this.heroForm.valid) {
      // Redirect email to signup route
      this.router.navigate(['/register'], { queryParams: { email: this.heroForm.value.email } });
    } else {
      this.heroForm.markAllAsTouched();
    }
  }
}
