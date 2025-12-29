import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private authService = inject(AuthService);

  user = this.authService.userSignal;
  userRole = this.authService.userRole;
  isAuthenticated = computed(() => !!this.user());
  userInitial = computed(() => this.user()?.email?.charAt(0).toUpperCase() || 'U');
  roleLabel = computed(() => {
    const role = this.userRole();
    return role.charAt(0).toUpperCase() + role.slice(1);
  });

  logout() {
    this.authService.logout();
  }
}
