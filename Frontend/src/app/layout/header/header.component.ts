import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { Router } from '@angular/router';
import { AuthService, LoginResponse } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzIconModule, NzLayoutModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  @Input() isCollapsed = false;
  @Output() toggleMenu = new EventEmitter<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  protected onToggleMenu(): void {
    this.toggleMenu.emit();
  }

  protected get currentUser(): LoginResponse | null {
    return this.authService.getUser();
  }

  protected get userInitials(): string {
    const name = this.currentUser?.name?.trim();

    if (!name) {
      return 'U';
    }

    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
