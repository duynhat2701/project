import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';
import { catchError, finalize, of, timeout } from 'rxjs';
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
  protected authService = inject(AuthService);

  protected devices: Device[] = [];
  protected requests: RequestItem[] = [];
  protected borrows: Borrow[] = [];

  protected loadingDevices = false;
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
    this.loadDevices();
    this.loadRequests();
    this.loadBorrows();
  }

  protected loadDevices(): void {
    this.loadingDevices = true;

    this.deviceService
      .getAll()
      .pipe(
        timeout(15000),
        catchError((err) => {
          console.error('Load devices error:', err);
          return of([] as Device[]);
        }),
        finalize(() => (this.loadingDevices = false)),
      )
      .subscribe((res) => {
        this.devices = res;
      });
  }

  protected loadRequests(): void {
    this.loadingRequests = true;

    const request$ = this.authService.isAdmin()
      ? this.requestService.getAll()
      : this.requestService.getMy();

    request$
      .pipe(
        timeout(15000),
        catchError((err) => {
          console.error('Load requests error:', err);
          this.errorMessage =
            err?.name === 'TimeoutError'
              ? 'Server phản hồi chậm, vui lòng thử lại.'
              : err?.error?.message || 'Không tải được danh sách yêu cầu.';
          return of([] as RequestItem[]);
        }),
        finalize(() => (this.loadingRequests = false)),
      )
      .subscribe((res) => {
        this.requests = res;
      });
  }

  protected loadBorrows(): void {
    this.loadingBorrows = true;

    const borrow$ = this.authService.isAdmin()
      ? this.borrowService.getAll()
      : this.borrowService.getMy();

    borrow$
      .pipe(
        timeout(15000),
        catchError((err) => {
          console.error('Load borrows error:', err);
          this.errorMessage =
            err?.name === 'TimeoutError'
              ? 'Server phản hồi chậm, vui lòng thử lại.'
              : err?.error?.message || 'Không tải được danh sách mượn / trả.';
          return of([] as Borrow[]);
        }),
        finalize(() => (this.loadingBorrows = false)),
      )
      .subscribe((res) => {
        this.borrows = res;
      });
  }

  protected reloadAll(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.loadDevices();
    this.loadRequests();
    this.loadBorrows();
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

    this.requestService
      .create(formValue)
      .pipe(
        timeout(15000),
        finalize(() => (this.submitting = false)),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Gửi yêu cầu thành công.';
          this.requestForm.reset({
            deviceId: 0,
            quantity: 1,
          });
          this.reloadAll();
        },
        error: (err) => {
          console.error('Create request error:', err);
          this.errorMessage =
            err?.name === 'TimeoutError'
              ? 'Server phản hồi chậm, vui lòng thử lại.'
              : err?.error?.message || 'Gửi yêu cầu thất bại.';
        },
      });
  }

  protected approveRequest(id: number): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.loadingRequests = true;

    this.borrowService
      .approve(id)
      .pipe(
        timeout(15000),
        finalize(() => (this.loadingRequests = false)),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Duyệt yêu cầu thành công.';
          this.loadRequests();
          this.loadBorrows();
          this.loadDevices();
        },
        error: (err) => {
          console.error('Approve request error:', err);
          this.errorMessage =
            err?.name === 'TimeoutError'
              ? 'Server phản hồi chậm, vui lòng thử lại.'
              : err?.error?.message || 'Duyệt yêu cầu thất bại.';
        },
      });
  }

  protected returnDevice(id: number): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.loadingBorrows = true;

    this.borrowService
      .returnDevice(id)
      .pipe(
        timeout(15000),
        finalize(() => (this.loadingBorrows = false)),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Trả thiết bị thành công.';
          this.loadBorrows();
          this.loadDevices();
        },
        error: (err) => {
          console.error('Return device error:', err);
          this.errorMessage =
            err?.name === 'TimeoutError'
              ? 'Server phản hồi chậm, vui lòng thử lại.'
              : err?.error?.message || 'Trả thiết bị thất bại.';
        },
      });
  }
}
