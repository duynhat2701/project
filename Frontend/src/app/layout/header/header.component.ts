import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, interval, of, startWith, switchMap } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { Router } from '@angular/router';
import { AuthService, LoginResponse } from '../../core/services/auth.service';
import { BorrowService } from '../../core/services/borrow.service';
import { RequestService } from '../../core/services/request.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzIconModule, NzLayoutModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  @Input() isCollapsed = false;
  @Output() toggleMenu = new EventEmitter<void>();

  protected notificationCount = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private requestService: RequestService,
    private borrowService: BorrowService,
  ) {}

  ngOnInit(): void {
    this.watchNotifications();
  }

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

  protected get notificationLabel(): string {
    if (this.authService.isAdmin()) {
      return this.notificationCount > 0
        ? `${this.notificationCount} yeu cau muon dang cho duyet`
        : 'Khong co yeu cau muon moi';
    }

    return this.notificationCount > 0
      ? `${this.notificationCount} phieu muon da duoc duyet`
      : 'Chua co phieu muon nao duoc duyet';
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  private watchNotifications(): void {
    interval(15000)
      .pipe(
        startWith(0),
        switchMap(() =>
          this.authService.isAdmin()
            ? this.requestService.getAll().pipe(
                catchError((error) => {
                  console.error('Load admin notifications error:', error);
                  return of([]);
                }),
              )
            : this.borrowService.getMy().pipe(
                catchError((error) => {
                  console.error('Load employee notifications error:', error);
                  return of([]);
                }),
              ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((items) => {
        if (this.authService.isAdmin()) {
          this.notificationCount = items.filter((item) => item.status === 'PENDING').length;
          return;
        }

        this.notificationCount = items.filter((item) => {
          const status = item.status?.toUpperCase();
          return status === 'BORROWING' || status === 'APPROVED';
        }).length;
      });
  }
}
