import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';
import { catchError, finalize, of, timeout } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { BorrowService } from '../../core/services/borrow.service';
import { DeviceService } from '../../core/services/device.service';
import { RequestService } from '../../core/services/request.service';
import { Borrow } from '../../shared/models/borrow.model';
import { Device } from '../../shared/models/device.model';
import { RequestItem } from '../../shared/models/request.model';
import { getBorrowStatusLabel } from '../../shared/utils/status-label.util';

@Component({
  selector: 'app-borrow-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzButtonModule, NzCardModule, NzFormModule, NzInputModule, NzTableModule],
  templateUrl: './borrow-list.component.html',
  styleUrl: './borrow-list.component.css',
})
export class BorrowListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private borrowService = inject(BorrowService);
  private requestService = inject(RequestService);
  private deviceService = inject(DeviceService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  protected authService = inject(AuthService);
  protected readonly getBorrowStatusLabel = getBorrowStatusLabel;

  protected devices: Device[] = [];
  protected requests: RequestItem[] = [];
  protected borrows: Borrow[] = [];

  protected loadingRequests = false;
  protected loadingBorrows = false;
  protected submitting = false;

  protected errorMessage = '';
  protected successMessage = '';

  protected requestForm = this.fb.nonNullable.group({
    deviceId: [0, [Validators.required, Validators.min(1)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.loadData();
  }

  protected loadData(): void {
    this.loadingRequests = true;
    this.loadingBorrows = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.deviceService
      .getAll()
      .pipe(
        timeout(15000),
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          console.error('Load devices error:', err);
          this.errorMessage =
            err?.status === 0
              ? 'Không kết nối được server.'
              : err?.status === 504 || err?.name === 'TimeoutError'
                ? 'Server đang khởi động, vui lòng thử lại sau vài giây.'
                : err?.error?.message || 'Không tải được danh sách thiết bị.';
          return of([] as Device[]);
        }),
      )
      .subscribe((res) => {
        this.devices = [...res];
        this.cdr.detectChanges();
      });

    const requests$ = this.authService.isAdmin()
      ? this.requestService.getAll()
      : this.requestService.getMy();

    requests$
      .pipe(
        timeout(15000),
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          console.error('Load requests error:', err);
          this.errorMessage =
            err?.status === 0
              ? 'Không kết nối được server.'
              : err?.status === 504 || err?.name === 'TimeoutError'
                ? 'Server đang khởi động, vui lòng thử lại sau vài giây.'
                : err?.error?.message || 'Không tải được danh sách yêu cầu.';
          return of([] as RequestItem[]);
        }),
        finalize(() => {
          this.loadingRequests = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe((res) => {
        this.requests = [...res];
        this.cdr.detectChanges();
      });

    const borrows$ = this.authService.isAdmin()
      ? this.borrowService.getAll()
      : this.borrowService.getMy();

    borrows$
      .pipe(
        timeout(15000),
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          console.error('Load borrows error:', err);
          this.errorMessage =
            err?.status === 0
              ? 'Không kết nối được server.'
              : err?.status === 504 || err?.name === 'TimeoutError'
                ? 'Server đang khởi động, vui lòng thử lại sau vài giây.'
                : err?.error?.message || 'Không tải được danh sách mượn / trả.';
          return of([] as Borrow[]);
        }),
        finalize(() => {
          this.loadingBorrows = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe((res) => {
        this.borrows = [...res];
        this.cdr.detectChanges();
      });
  }

  protected reloadAll(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.loadData();
  }

  protected submitRequest(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.requestForm.getRawValue();
    const selectedDevice = this.devices.find((d) => d.id === formValue.deviceId);

    if (!selectedDevice) {
      this.errorMessage = 'Vui lòng chọn thiết bị.';
      this.cdr.detectChanges();
      return;
    }

    if (formValue.quantity > selectedDevice.quantity) {
      this.errorMessage = `Không đủ số lượng. Hiện còn ${selectedDevice.quantity} thiết bị.`;
      this.cdr.detectChanges();
      return;
    }

    this.submitting = true;
    this.cdr.detectChanges();

    this.requestService
      .create(formValue)
      .pipe(
        timeout(15000),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.submitting = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Gửi yêu cầu thành công.';
          this.requestForm.reset({
            deviceId: 0,
            quantity: 1,
          });
          this.loadData();
        },
        error: (err) => {
          console.error('Create request error:', err);
          this.errorMessage =
            err?.status === 403
              ? 'Bạn không có quyền gửi yêu cầu.'
              : err?.status === 401
                ? 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
                : err?.status === 0
                  ? 'Không kết nối được server.'
                  : err?.name === 'TimeoutError'
                    ? 'Server phản hồi quá chậm, vui lòng thử lại.'
                    : err?.error?.message || 'Gửi yêu cầu thất bại.';
          this.cdr.detectChanges();
        },
      });
  }

  protected approveRequest(id: number): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.loadingRequests = true;
    this.cdr.detectChanges();

    this.borrowService
      .approve(id)
      .pipe(
        timeout(15000),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loadingRequests = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Duyệt yêu cầu thành công.';
          this.loadData();
        },
        error: (err) => {
          console.error('Approve request error:', err);
          this.errorMessage =
            err?.status === 403
              ? 'Bạn không có quyền duyệt yêu cầu.'
              : err?.status === 401
                ? 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
                : err?.status === 0
                  ? 'Không kết nối được server.'
                  : err?.name === 'TimeoutError'
                    ? 'Server phản hồi quá chậm, vui lòng thử lại.'
                    : err?.error?.message || 'Duyệt yêu cầu thất bại.';
          this.cdr.detectChanges();
        },
      });
  }

  protected returnDevice(id: number): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.loadingBorrows = true;
    this.cdr.detectChanges();

    this.borrowService
      .returnDevice(id)
      .pipe(
        timeout(15000),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loadingBorrows = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Trả thiết bị thành công.';
          this.loadData();
        },
        error: (err) => {
          console.error('Return device error:', err);
          this.errorMessage =
            err?.status === 403
              ? 'Bạn không có quyền trả thiết bị.'
              : err?.status === 401
                ? 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
                : err?.status === 0
                  ? 'Không kết nối được server.'
                  : err?.name === 'TimeoutError'
                    ? 'Server phản hồi quá chậm, vui lòng thử lại.'
                    : err?.error?.message || 'Trả thiết bị thất bại.';
          this.cdr.detectChanges();
        },
      });
  }

  protected getStatusClass(status: string): string {
    const normalized = status.toUpperCase();

    if (normalized === 'PENDING') {
      return 'status-chip status-chip-warning';
    }

    if (normalized === 'APPROVED' || normalized === 'RETURNED') {
      return 'status-chip status-chip-success';
    }

    if (normalized === 'BORROWING') {
      return 'status-chip status-chip-info';
    }

    if (normalized === 'REJECTED' || normalized === 'CANCELLED' || normalized === 'CANCELED') {
      return 'status-chip status-chip-danger';
    }

    return 'status-chip';
  }
}
