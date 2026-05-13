import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';
import { catchError, finalize, of, timeout } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { DeviceService } from '../../core/services/device.service';
import { Device } from '../../shared/models/device.model';
import { getActionErrorMessage, getLoadErrorMessage } from '../../shared/utils/http-error.util';
import { getDeviceStatusLabel } from '../../shared/utils/status-label.util';

@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzCardModule,
    NzFormModule,
    NzInputModule,
    NzTableModule,
  ],
  templateUrl: './device-list.component.html',
  styleUrl: './device-list.component.css',
})
export class DeviceListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly deviceService = inject(DeviceService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly authService = inject(AuthService);
  protected readonly getDeviceStatusLabel = getDeviceStatusLabel;
  protected readonly statusOptions = [
    { value: 'AVAILABLE', label: 'Có sẵn' },
    { value: 'LOW_STOCK', label: 'Sắp hết' },
    { value: 'OUT_OF_STOCK', label: 'Hết hàng' },
  ];

  protected devices: Device[] = [];
  protected filteredDevices: Device[] = [];
  protected loading = false;
  protected submitting = false;
  protected errorMessage = '';
  protected searchKeyword = '';
  protected editingDeviceId: number | null = null;

  protected form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    code: ['', [Validators.required]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    status: ['AVAILABLE', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadData();
  }

  protected loadData(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.deviceService
      .getAll()
      .pipe(
        timeout(15000),
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Load devices error:', error);
          this.errorMessage = getLoadErrorMessage(error, 'Không tải được danh sách thiết bị.');
          return of([] as Device[]);
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe((devices) => {
        this.devices = [...devices].sort((a, b) => b.id - a.id);
        this.applySearch();
        this.cdr.detectChanges();
      });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    const payload = this.form.getRawValue();
    const request$ = this.editingDeviceId
      ? this.deviceService.update(this.editingDeviceId, payload)
      : this.deviceService.create(payload);

    request$
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
          this.resetForm();
          this.loadData();
        },
        error: (error) => {
          console.error('Save device error:', error);
          this.errorMessage = getActionErrorMessage(error, {
            forbiddenMessage: 'Bạn không có quyền thao tác với thiết bị.',
            fallbackMessage: 'Lưu thiết bị thất bại.',
          });
          this.cdr.detectChanges();
        },
      });
  }

  protected onSearchChange(keyword: string): void {
    this.searchKeyword = keyword;
    this.applySearch();
  }

  protected startEdit(device: Device): void {
    this.editingDeviceId = device.id;
    this.form.reset({
      name: device.name,
      code: device.code,
      quantity: device.quantity,
      status: device.status,
    });
    this.cdr.detectChanges();
  }

  protected cancelEdit(): void {
    this.resetForm();
    this.cdr.detectChanges();
  }

  protected deleteDevice(id: number): void {
    if (!confirm('Bạn có chắc muốn xóa thiết bị này?')) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.deviceService
      .delete(id)
      .pipe(
        timeout(15000),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => this.loadData(),
        error: (error) => {
          console.error('Delete device error:', error);
          this.errorMessage = getActionErrorMessage(error, {
            forbiddenMessage: 'Bạn không có quyền xóa thiết bị.',
            fallbackMessage: 'Xóa thiết bị thất bại.',
          });
          this.cdr.detectChanges();
        },
      });
  }

  protected getStatusClass(status: string): string {
    const normalized = status.toUpperCase();

    if (normalized === 'AVAILABLE') {
      return 'status-chip status-chip-success';
    }

    if (normalized === 'LOW_STOCK') {
      return 'status-chip status-chip-warning';
    }

    if (normalized === 'OUT_OF_STOCK') {
      return 'status-chip status-chip-danger';
    }

    return 'status-chip';
  }

  private applySearch(): void {
    const keyword = this.searchKeyword.trim().toLowerCase();

    if (!keyword) {
      this.filteredDevices = [...this.devices];
      return;
    }

    this.filteredDevices = this.devices.filter((device) =>
      [device.name, device.code, device.status, getDeviceStatusLabel(device.status)].some((value) =>
        value.toLowerCase().includes(keyword),
      ),
    );
  }

  private resetForm(): void {
    this.editingDeviceId = null;
    this.form.reset({
      name: '',
      code: '',
      quantity: 0,
      status: 'AVAILABLE',
    });
  }
}
