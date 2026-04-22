import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, forkJoin, of, timeout } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { BorrowService } from '../../core/services/borrow.service';
import { DeviceService } from '../../core/services/device.service';
import { Borrow } from '../../shared/models/borrow.model';
import { Device } from '../../shared/models/device.model';

interface ProductStat {
  id: number;
  name: string;
  availableQuantity: number;
  borrowedQuantity: number;
  borrowCount: number;
  rating: number;
  status: 'Con hang' | 'Sap het' | 'Het hang';
  accent: string;
}

interface SalesCategory {
  name: string;
  value: number;
  share: number;
  color: string;
}

interface OrderStat extends Borrow {
  orderLabel: string;
}

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
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly chartColors = ['#10b981', '#f59e0b', '#06b6d4', '#ff5b36', '#8b5cf6', '#0f766e'];

  readonly authService = this.auth;

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

    return `status-pill-${status.toLowerCase().replace(/\s+/g, '-')}`;
  }

  getRatingLabel(rating: number): string {
    return `${rating.toFixed(rating % 1 === 0 ? 0 : 1)}/5`;
  }

  get totalBorrowedUnits(): number {
    return this.topProducts.reduce((sum, product) => sum + product.borrowedQuantity, 0);
  }

  private buildDonutStyle(categories: SalesCategory[]): string {
    if (!categories.length) {
      return 'conic-gradient(#e2e8f0 0% 100%)';
    }

    let start = 0;
    const segments = categories.map((category) => {
      const end = start + category.share;
      const segment = `${category.color} ${start}% ${end}%`;
      start = end;
      return segment;
    });

    return `conic-gradient(${segments.join(', ')})`;
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
        catchError((err) => {
          console.error('Load dashboard error:', err);
          this.errorMessage =
            err?.status === 0
              ? 'Khong ket noi duoc server.'
              : err?.status === 504 || err?.name === 'TimeoutError'
                ? 'Server dang khoi dong, vui long thu lai sau it giay.'
                : err?.error?.message || 'Khong tai duoc du lieu dashboard.';
          return of({ devices: [] as Device[], borrows: [] as Borrow[] });
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe(({ devices, borrows }) => {
        this.buildDashboard(devices, borrows);
        this.cdr.detectChanges();
      });
  }

  private buildDashboard(devices: Device[], borrows: Borrow[]): void {
    const borrowGroups = new Map<number, Borrow[]>();

    for (const borrow of borrows) {
      const current = borrowGroups.get(borrow.deviceId) ?? [];
      current.push(borrow);
      borrowGroups.set(borrow.deviceId, current);
    }

    const products = devices.map((device, index) => {
      const deviceBorrows = borrowGroups.get(device.id) ?? [];
      const borrowedQuantity = deviceBorrows.reduce((sum, item) => sum + item.quantity, 0);
      const borrowCount = deviceBorrows.length;

      return {
        id: device.id,
        name: device.name,
        availableQuantity: device.quantity,
        borrowedQuantity,
        borrowCount,
        rating: 0,
        status: this.mapInventoryStatus(device.quantity),
        accent: this.buildAccent(index),
      };
    });

    const rankedProducts = products
      .filter((product) => product.borrowedQuantity > 0 || product.availableQuantity > 0)
      .sort((a, b) => {
        if (b.borrowedQuantity !== a.borrowedQuantity) {
          return b.borrowedQuantity - a.borrowedQuantity;
        }

        return b.borrowCount - a.borrowCount;
      });

    const maxBorrowedQuantity = rankedProducts[0]?.borrowedQuantity ?? 0;

    this.topProducts = rankedProducts.slice(0, 6).map((product) => ({
      ...product,
      rating: maxBorrowedQuantity > 0 ? Number(((product.borrowedQuantity / maxBorrowedQuantity) * 5).toFixed(1)) : 0,
    }));

    const chartItems = this.topProducts
      .filter((product) => product.borrowedQuantity > 0)
      .slice(0, 4);

    const totalBorrowed = chartItems.reduce((sum, item) => sum + item.borrowedQuantity, 0);

    this.salesCategories = chartItems.map((item, index) => ({
      name: item.name,
      value: item.borrowedQuantity,
      share: totalBorrowed > 0 ? Number(((item.borrowedQuantity / totalBorrowed) * 100).toFixed(1)) : 0,
      color: this.chartColors[index % this.chartColors.length],
    }));

    this.donutStyle = this.buildDonutStyle(this.salesCategories);

    this.orders = borrows
      .slice()
      .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime())
      .slice(0, 5)
      .map((borrow) => ({
        ...borrow,
        orderLabel: `#BR${String(borrow.id).padStart(3, '0')}`,
      }));
  }

  getOrderStatusLabel(status: string): string {
    const normalized = status.toUpperCase();

    if (normalized === 'BORROWING') {
      return 'Dang muon';
    }

    if (normalized === 'RETURNED') {
      return 'Da tra';
    }

    if (normalized === 'PENDING') {
      return 'Cho duyet';
    }

    if (normalized === 'CANCELLED' || normalized === 'CANCELED') {
      return 'Da huy';
    }

    return status;
  }

  private mapInventoryStatus(quantity: number): ProductStat['status'] {
    if (quantity <= 0) {
      return 'Het hang';
    }

    if (quantity <= 2) {
      return 'Sap het';
    }

    return 'Con hang';
  }

  private buildAccent(index: number): string {
    const accents = [
      'linear-gradient(135deg, #f59e0b, #f97316)',
      'linear-gradient(135deg, #10b981, #0f766e)',
      'linear-gradient(135deg, #06b6d4, #2563eb)',
      'linear-gradient(135deg, #8b5cf6, #ec4899)',
      'linear-gradient(135deg, #fde047, #84cc16)',
      'linear-gradient(135deg, #94a3b8, #475569)',
    ];

    return accents[index % accents.length];
  }
}
