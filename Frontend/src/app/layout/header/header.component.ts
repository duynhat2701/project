import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, interval, of, startWith, switchMap } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { Router } from '@angular/router';
import { AuthService, LoginResponse } from '../../core/services/auth.service';
import { BorrowService } from '../../core/services/borrow.service';
import { RequestService } from '../../core/services/request.service';
import { Borrow } from '../../shared/models/borrow.model';
import { RequestItem } from '../../shared/models/request.model';

interface HeaderNotificationItem {
  id: string;
  title: string;
  detail: string;
  status: string;
  timeLabel: string;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzIconModule, NzLayoutModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  @Input() isCollapsed = false;
  @Output() toggleMenu = new EventEmitter<void>();

  protected notificationCount = 0;
  protected isNotificationOpen = false;
  protected notificationItems: HeaderNotificationItem[] = [];
  protected hasUnreadNotifications = false;

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

  protected toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.isNotificationOpen = !this.isNotificationOpen;
    if (this.isNotificationOpen) {
      this.hasUnreadNotifications = false;
    }
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.isNotificationOpen = false;
    }
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
          const pendingRequests = (items as RequestItem[]).filter((item) => item.status === 'PENDING');
          this.notificationCount = pendingRequests.length;
          this.hasUnreadNotifications = pendingRequests.length > 0 && !this.isNotificationOpen;
          this.notificationItems = pendingRequests.map((item) => ({
            id: `request-${item.id}`,
            title: `${item.userName} gui yeu cau muon`,
            detail: `${item.deviceName} x ${item.quantity}`,
            status: 'Cho duyet',
            timeLabel: `Ma yeu cau #${item.id}`,
          }));
          return;
        }

        const approvedBorrows = (items as Borrow[]).filter((item) => {
          const status = item.status?.toUpperCase();
          return status === 'BORROWING' || status === 'APPROVED';
        });

        this.notificationCount = approvedBorrows.length;
        this.hasUnreadNotifications = approvedBorrows.length > 0 && !this.isNotificationOpen;
        this.notificationItems = approvedBorrows.map((item) => ({
          id: `borrow-${item.id}`,
          title: 'Phieu muon da duoc duyet',
          detail: `${item.deviceName} x ${item.quantity}`,
          status: item.status,
          timeLabel: this.formatDate(item.borrowDate),
        }));
      });
  }

  private formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('vi-VN');
  }
}
