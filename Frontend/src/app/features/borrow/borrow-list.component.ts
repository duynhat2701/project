import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';
import { finalize } from 'rxjs';
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
  protected loading = false;
  protected submitting = false;
  protected errorMessage = '';
  protected successMessage = '';

  protected requestForm = this.fb.nonNullable.group({
    deviceId: [0, [Validators.required, Validators.min(1)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.loadDevices();
    this.loadPageData();
  }

  protected loadDevices(): void {
    this.deviceService.getAll().subscribe({
      next: (res) => (this.devices = res),
      error: (err) => {
        console.error('Load devices error:', err);
      },
    });
  }

  protected loadPageData(): void {
    this.loading = true;

    if (this.authService.isAdmin()) {
      this.requestService.getAll().subscribe({
        next: (res) => (this.requests = res),
        error: (err) => console.error('Load requests error:', err),
      });

      this.borrowService
        .getAll()
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: (res) => {
            this.borrows = res;
          },
          error: (err) => {
            console.error('Load borrows error:', err);
            this.errorMessage = err?.error?.message || 'Không tải được danh sách mượn / trả.';
          },
        });

      return;
    }

    this.requestService.getMy().subscribe({
      next: (res) => (this.requests = res),
      error: (err) => console.error('Load my requests error:', err),
    });

    this.borrowService
      .getMy()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.borrows = res;
        },
        error: (err) => {
          console.error('Load my borrows error:', err);
          this.errorMessage = err?.error?.message || 'Không tải được phiếu mượn của bạn.';
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

    const selectedDevice = this.devices.find(
      (d) => d.id === formValue.deviceId
    );

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
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.successMessage = 'Gửi yêu cầu thành công.';

          this.requestForm.reset({
            deviceId: 0,
            quantity: 1,
          });

          this.loadDevices();
          this.loadPageData();
        },
        error: (err) => {
          console.error('Create request error:', err);
          this.errorMessage =
            err?.error?.message || 'Gửi yêu cầu thất bại.';
        },
      });
  }

  protected approveRequest(id: number): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.borrowService.approve(id).subscribe({
      next: () => {
        this.successMessage = 'Duyệt yêu cầu thành công.';
        this.loadDevices();
        this.loadPageData();
      },
      error: (err) => {
        console.error('Approve request error:', err);
        this.errorMessage =
          err?.error?.message || 'Duyệt yêu cầu thất bại.';
      },
    });
  }

  protected returnDevice(id: number): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.borrowService.returnDevice(id).subscribe({
      next: () => {
        this.successMessage = 'Trả thiết bị thành công.';
        this.loadDevices();
        this.loadPageData();
      },
      error: (err) => {
        console.error('Return device error:', err);
        this.errorMessage =
          err?.error?.message || 'Trả thiết bị thất bại.';
      },
    });
  }
}
