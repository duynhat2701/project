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
import { DeviceService } from '../../core/services/device.service';
import { Device } from '../../shared/models/device.model';

@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [
    CommonModule,
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
  private fb = inject(FormBuilder);
  private deviceService = inject(DeviceService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  protected authService = inject(AuthService);

  protected devices: Device[] = [];
  protected loading = false;
  protected submitting = false;
  protected errorMessage = '';

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
        timeout(10000),
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          console.error('Load devices error:', err);
          this.errorMessage = err?.error?.message || 'Không tải được danh sách thiết bị.';
          return of([]);
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe((res) => {
        this.devices = [...res];
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

    this.deviceService
      .create(this.form.getRawValue())
      .pipe(
        timeout(10000),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.submitting = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.form.reset({
            name: '',
            code: '',
            quantity: 0,
            status: 'AVAILABLE',
          });
          this.loadData();
        },
        error: (err) => {
          console.error('Create device error:', err);
          this.errorMessage = err?.error?.message || 'Thêm thiết bị thất bại.';
          this.cdr.detectChanges();
        },
      });
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
        timeout(10000),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe({
        next: () => {
          this.loadData();
        },
        error: (err) => {
          console.error('Delete device error:', err);
          this.errorMessage = err?.error?.message || 'Xóa thiết bị thất bại.';
          this.cdr.detectChanges();
        },
      });
  }
}
