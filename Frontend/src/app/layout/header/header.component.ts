import { CommonModule } from '@angular/common';
import { Component, DestroyRef, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, interval, of, startWith, switchMap } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { AuthService } from '../../core/services/auth.service';
import { BorrowService } from '../../core/services/borrow.service';
import { RequestService } from '../../core/services/request.service';
import { Borrow } from '../../shared/models/borrow.model';
import { RequestItem } from '../../shared/models/request.model';
import { getBorrowStatusLabel } from '../../shared/utils/status-label.util';

interface HeaderNotificationItem {
  id: string;
  signature: string;
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
  private readonly seenStorageKey = 'headerSeenNotifications';

  @Input() isCollapsed = false;
  @Output() toggleMenu = new EventEmitter<void>();

  protected notificationCount = 0;
  protected isNotificationOpen = false;
  protected notificationItems: HeaderNotificationItem[] = [];
  protected hasUnreadNotifications = false;
  private readonly readNotificationSignatures = new Set<string>();

  constructor(
    private authService: AuthService,
    private requestService: RequestService,
    private borrowService: BorrowService,
  ) {
    this.loadSeenNotifications();
  }

  ngOnInit(): void {
    this.watchNotifications();
  }

  protected onToggleMenu(): void {
    this.toggleMenu.emit();
  }

  protected get notificationLabel(): string {
    if (this.authService.isAdmin()) {
      return this.notificationCount > 0
        ? `${this.notificationCount} yêu cầu mượn đang chờ duyệt`
        : 'Không có yêu cầu mượn mới';
    }

    return this.notificationCount > 0
      ? `${this.notificationCount} phiếu mượn đã được duyệt`
      : 'Chưa có phiếu mượn nào được duyệt';
  }

  protected toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.isNotificationOpen = !this.isNotificationOpen;
    if (this.isNotificationOpen) {
      this.markNotificationsAsRead();
    }
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (target && !this.elementRef.nativeElement.contains(target)) {
      this.isNotificationOpen = false;
    }
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
          this.notificationItems = pendingRequests.map((item) => ({
            id: `request-${item.id}`,
            signature: `admin-request-${item.id}-${item.status}`,
            title: `${item.userName} gửi yêu cầu mượn`,
            detail: `${item.deviceName} x ${item.quantity}`,
            status: 'Chờ duyệt',
            timeLabel: `Mã yêu cầu #${item.id}`,
          }));
          this.syncNotificationState();
          return;
        }

        const approvedBorrows = (items as Borrow[]).filter((item) => {
          const status = item.status?.toUpperCase();
          return status === 'BORROWING' || status === 'APPROVED';
        });

        this.notificationItems = approvedBorrows.map((item) => ({
          id: `borrow-${item.id}`,
          signature: `employee-borrow-${item.id}-${item.status}`,
          title: 'Phiếu mượn đã được duyệt',
          detail: `${item.deviceName} x ${item.quantity}`,
          status: getBorrowStatusLabel(item.status),
          timeLabel: this.formatDate(item.borrowDate),
        }));
        this.syncNotificationState();
      });
  }

  private syncNotificationState(): void {
    const activeSignatures = new Set(this.notificationItems.map((item) => item.signature));

    for (const signature of Array.from(this.readNotificationSignatures)) {
      if (!activeSignatures.has(signature)) {
        this.readNotificationSignatures.delete(signature);
      }
    }

    this.saveSeenNotifications();

    if (this.isNotificationOpen) {
      this.markNotificationsAsRead();
      return;
    }

    const unreadItems = this.notificationItems.filter(
      (item) => !this.readNotificationSignatures.has(item.signature),
    );
    this.notificationCount = unreadItems.length;
    this.hasUnreadNotifications = unreadItems.length > 0;
  }

  private markNotificationsAsRead(): void {
    for (const item of this.notificationItems) {
      this.readNotificationSignatures.add(item.signature);
    }

    this.saveSeenNotifications();
    this.notificationCount = 0;
    this.hasUnreadNotifications = false;
  }

  private loadSeenNotifications(): void {
    try {
      const rawValue = localStorage.getItem(this.seenStorageKey);
      if (!rawValue) {
        return;
      }

      const values = JSON.parse(rawValue) as string[];
      for (const value of values) {
        this.readNotificationSignatures.add(value);
      }
    } catch (error) {
      console.error('Load seen notifications error:', error);
      this.readNotificationSignatures.clear();
    }
  }

  private saveSeenNotifications(): void {
    try {
      localStorage.setItem(
        this.seenStorageKey,
        JSON.stringify(Array.from(this.readNotificationSignatures)),
      );
    } catch (error) {
      console.error('Save seen notifications error:', error);
    }
  }

  private formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString('vi-VN');
  }
}
