import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { getActionErrorMessage } from '../../../shared/utils/http-error.util';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NzAlertModule,
    NzButtonModule,
    NzCardModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  protected currentStep: 'register' | 'verify' = 'register';
  protected isSubmitting = false;
  protected isVerifying = false;
  protected successMessage = '';
  protected errorMessage = '';
  protected verificationEmail = '';

  protected registerForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email, Validators.pattern(/^[A-Za-z0-9._%+-]+@gmail\.com$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected otpForm = this.fb.nonNullable.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  constructor() {
    if (this.authService.isAuthenticated()) {
      void this.router.navigate(['/dashboard']);
    }
  }

  protected submitRegister(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.authService
      .register(this.registerForm.getRawValue())
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => {
          this.verificationEmail = this.registerForm.controls.email.getRawValue();
          this.currentStep = 'verify';
          this.otpForm.reset({ otp: '' });
          this.successMessage = 'Tai khoan da duoc tao. Kiem tra email va nhap ma OTP de kich hoat.';
        },
        error: (error) => {
          this.errorMessage = getActionErrorMessage(error, {
            forbiddenMessage: 'Ban khong co quyen tao tai khoan.',
            fallbackMessage: 'Dang ky that bai. Vui long thu lai.',
          });
        },
      });
  }

  protected submitOtp(): void {
    if (this.otpForm.invalid || !this.verificationEmail) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.isVerifying = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.authService
      .verifyRegistrationOtp({
        email: this.verificationEmail,
        otp: this.otpForm.controls.otp.getRawValue(),
      })
      .pipe(finalize(() => (this.isVerifying = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'Xac thuc thanh cong. Dang chuyen sang trang dang nhap.';
          setTimeout(() => {
            void this.router.navigate(['/login']);
          }, 1200);
        },
        error: (error) => {
          this.errorMessage = getActionErrorMessage(error, {
            forbiddenMessage: 'Ma OTP khong hop le hoac tai khoan chua duoc phep kich hoat.',
            fallbackMessage: 'Khong xac thuc duoc OTP. Vui long thu lai.',
          });
        },
      });
  }

  protected backToRegister(): void {
    this.currentStep = 'register';
    this.otpForm.reset({ otp: '' });
    this.successMessage = '';
    this.errorMessage = '';
    this.verificationEmail = '';
  }
}
