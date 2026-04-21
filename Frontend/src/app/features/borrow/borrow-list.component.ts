import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';
import { catchError, finalize, forkJoin, of, timeout } from 'rxjs';
import { BorrowService } from '../../core/services/borrow.service';
import { DeviceService } from '../../core/services/device.service';
import { RequestService } from '../../core/services/request.service';
import { AuthService } from '../../core/services/auth.service';
import { Borrow } from '../../shared/models/borrow.model';
import { Device } from '../../shared/models/device.model';
import { RequestItem } from '../../shared/models/request.model';

@Component({
  selector: 'app-borrow-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NzButtonModule, NzCardModule, NzFormModule, NzInputModule, NzTableModule],
  templateUrl: './borrow-list.component.html',
})
export class BorrowListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private borrowService = inject(BorrowService);
  private requestService = inject(RequestService);
  private deviceService = inject(DeviceService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  protected authService = inject(AuthService);

  protected devices: Device[] = [];
  protected requests: RequestItem[] = [];
  protected borrows: Borrow[] = [];
  protected loading = false;
  protected submitting = false;
  protected errorMessage = '';
  protected successMessage = '';

  protected requestForm = this.fb.nonNullable.group({
    deviceId: [0, [Validators.required, Validators.min(1)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.loadAllData();
  }

  protected loadAllData(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const devices$ = this.deviceService.getAll().pipe(
      timeout(15000),
      catchError((err) => {
        console.error('Load devices error:', err);
        return of([] as Device[]);
      }),
    );

    const requests$ = (this.authService.isAdmin()
        ? this.requestService.getAll()
        : this.requestService.getMy()
    ).pipe(
      timeout(15000),
      catchError((err) => {
        console.error('Load requests error:', err);
        return of([] as RequestItem[]);
      }),
    );

    const borrows$ = (this.authService.isAdmin()
        ? this.borrowService.getAll()
        : this.borrowService.getMy()
    ).pipe(
      timeout(15000),
      catchError((err) => {
        console.error('Load borrows error:', err);
        return of([] as Borrow[]);
      }),
    );

    forkJoin({
      devices: devices$,
      requests: requests$,
      borrows: borrows$,
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: ({ devices, requests, borrows }) => {
          this.devices = devices;
          this.requests = requests;
          this.borrows = borrows;

          if (!devices.length && !requests.length && !borrows.length) {
            this.errorMessage = '';
          }

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Load page data error:', err);
          this.errorMessage =
            err?.name === 'TimeoutError'
              ? 'Server đang khởi động hoặc phản hồi chậm. Vui lòng thử lại sau vài giây.'
              : err?.error?.message || 'Không tải được dữ liệu trang mượn / trả.';
          this.cdr.detectChanges();
        },
      });
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
      return;
    }

    if (formValue.quantity > selectedDevice.quantity) {
      this.errorMessage = `Không đủ số lượng. Hiện còn ${selectedDevice.quantity} thiết bị.`;
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
          this.loadAllData();
        },
        error: (err) => {
          console.error('Create request error:', err);
          this.errorMessage =
            err?.name === 'TimeoutError'
              ? 'Server phản hồi quá chậm. Vui lòng thử lại.'
              : err?.error?.message || 'Gửi yêu cầu thất bại.';
          this.cdr.detectChanges();
        },
      });
  }

  protected approveRequest(id: number): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;
    this.cdr.detectChanges();

    this.borrowService
      .approve(id)
      .pipe(
        timeout(15000),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Duyệt yêu cầu thành công.';
          this.loadAllData();
        },
        error: (err) => {
          console.error('Approve request error:', err);
          this.errorMessage =
            err?.name === 'TimeoutError'
              ? 'Server phản hồi quá chậm. Vui lòng thử lại.'
              : err?.error?.message || 'Duyệt yêu cầu thất bại.';
          this.cdr.detectChanges();
        },
      });
  }

  protected returnDevice(id: number): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;
    this.cdr.detectChanges();

    this.borrowService
      .returnDevice(id)
      .pipe(
        timeout(15000),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Trả thiết bị thành công.';
          this.loadAllData();
        },
        error: (err) => {
          console.error('Return device error:', err);
          this.errorMessage =
            err?.name === 'TimeoutError'
              ? 'Server phản hồi quá chậm. Vui lòng thử lại.'
              : err?.error?.message || 'Trả thiết bị thất bại.';
          this.cdr.detectChanges();
        },
      });
  }
}
