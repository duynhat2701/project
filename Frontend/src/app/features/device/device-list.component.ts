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
})
export class DeviceListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly deviceService = inject(DeviceService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly authService = inject(AuthService);

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
        catchError((err) => {
          console.error('Load devices error:', err);
          this.errorMessage =
            err?.status === 0
              ? 'Khong ket noi duoc server.'
              : err?.status === 504 || err?.name === 'TimeoutError'
                ? 'Server dang khoi dong, vui long thu lai sau it giay.'
                : err?.error?.message || 'Khong tai duoc danh sach thiet bi.';
          return of([] as Device[]);
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe((res) => {
        this.devices = [...res];
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
        error: (err) => {
          console.error('Save device error:', err);
          this.errorMessage =
            err?.status === 403
              ? 'Ban khong co quyen thao tac voi thiet bi.'
              : err?.status === 401
                ? 'Phien dang nhap het han. Vui long dang nhap lai.'
                : err?.status === 0
                  ? 'Khong ket noi duoc server.'
                  : err?.name === 'TimeoutError'
                    ? 'Server phan hoi qua cham, vui long thu lai.'
                    : err?.error?.message || 'Luu thiet bi that bai.';
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
    if (!confirm('Ban co chac muon xoa thiet bi nay?')) {
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
        error: (err) => {
          console.error('Delete device error:', err);
          this.errorMessage = err?.error?.message || 'Xoa thiet bi that bai.';
          this.cdr.detectChanges();
        },
      });
  }

  private applySearch(): void {
    const keyword = this.searchKeyword.trim().toLowerCase();

    if (!keyword) {
      this.filteredDevices = [...this.devices];
      return;
    }

    this.filteredDevices = this.devices.filter((device) =>
      [device.name, device.code, device.status].some((value) =>
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
