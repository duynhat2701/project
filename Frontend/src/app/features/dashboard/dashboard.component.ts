import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, forkJoin, of, timeout } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { BorrowService } from '../../core/services/borrow.service';
import { DashboardService, OrderStat, ProductStat, SalesCategory } from '../../core/services/dashboard.service';
import { DeviceService } from '../../core/services/device.service';
import { Borrow } from '../../shared/models/borrow.model';
import { Device } from '../../shared/models/device.model';
import { getLoadErrorMessage } from '../../shared/utils/http-error.util';
import { getBorrowStatusLabel, getRoleLabel } from '../../shared/utils/status-label.util';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly borrowService = inject(BorrowService);
  private readonly deviceService = inject(DeviceService);
  private readonly dashboardService = inject(DashboardService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly authService = this.auth;
  readonly getRoleLabel = getRoleLabel;

  topProducts: ProductStat[] = [];
  salesCategories: SalesCategory[] = [];
  orders: OrderStat[] = [];
  donutStyle = '';

  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loadDashboard();
  }

  getStatusClass(status: ProductStat['status']): string {
    return `status-pill-${status.toLowerCase().replace(/\s+/g, '-')}`;
  }

  getOrderStatusClass(status: string): string {
    const normalized = status.toUpperCase();

    if (normalized === 'BORROWING') {
      return 'status-pill-borrowing';
    }

    if (normalized === 'RETURNED') {
      return 'status-pill-returned';
    }

    if (normalized === 'PENDING') {
      return 'status-pill-pending';
    }

    if (normalized === 'CANCELLED' || normalized === 'CANCELED') {
      return 'status-pill-cancel';
    }

    if (normalized === 'APPROVED') {
      return 'status-pill-completed';
    }

    return `status-pill-${status.toLowerCase().replace(/\s+/g, '-')}`;
  }

  getRatingLabel(rating: number): string {
    return `${rating.toFixed(rating % 1 === 0 ? 0 : 1)}/5`;
  }

  get totalBorrowedUnits(): number {
    return this.topProducts.reduce((sum, product) => sum + product.borrowedQuantity, 0);
  }

  getOrderStatusLabel(status: string): string {
    return getBorrowStatusLabel(status);
  }

  private loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const borrows$ = this.authService.isAdmin()
      ? this.borrowService.getAll()
      : this.borrowService.getMy();

    forkJoin({
      devices: this.deviceService.getAll(),
      borrows: borrows$,
    })
      .pipe(
        timeout(15000),
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Load dashboard error:', error);
          this.errorMessage = getLoadErrorMessage(error, 'Không tải được dữ liệu tổng quan.');
          return of({ devices: [] as Device[], borrows: [] as Borrow[] });
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe(({ devices, borrows }) => {
        const dashboardData = this.dashboardService.buildDashboard(devices, borrows);

        this.topProducts = dashboardData.topProducts;
        this.salesCategories = dashboardData.salesCategories;
        this.donutStyle = dashboardData.donutStyle;
        this.orders = dashboardData.orders;

        this.cdr.detectChanges();
      });
  }
}
