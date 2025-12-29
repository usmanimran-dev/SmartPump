import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(AuthService);

  email = '';
  password = '';
  errorMessage = signal('');
  isSubmitting = this.authService.isLoading;

  async login() {
    this.errorMessage.set('');
    try {
      await this.authService.login(this.email, this.password);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Login failed. Please check your credentials.');
    }
  }

  async googleLogin() {
    this.errorMessage.set('');
    try {
      await this.authService.googleLogin();
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Google Login failed.');
    }
  }
}
