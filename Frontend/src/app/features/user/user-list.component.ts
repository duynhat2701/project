import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule } from 'ng-zorro-antd/table';
import { catchError, finalize, of, timeout } from 'rxjs';
import { UserService, UserPayload } from '../../core/services/user.service';
import { UserModel } from '../../shared/models/user.model';
import { getActionErrorMessage, getLoadErrorMessage } from '../../shared/utils/http-error.util';
import { getRoleLabel } from '../../shared/utils/status-label.util';

@Component({
  selector: 'app-user-list',
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
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css',
})
export class UserListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  protected readonly getRoleLabel = getRoleLabel;
  protected readonly roleOptions = [
    { value: 'EMPLOYEE', label: 'Nhân viên' },
    { value: 'ADMIN', label: 'Quản trị viên' },
  ];

  protected users: UserModel[] = [];
  protected filteredUsers: UserModel[] = [];
  protected loading = false;
  protected submitting = false;
  protected errorMessage = '';
  protected successMessage = '';
  protected searchKeyword = '';
  protected editingUserId: number | null = null;

  protected form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', []],
    role: ['EMPLOYEE' as 'EMPLOYEE' | 'ADMIN', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  protected loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.userService
      .getAll()
      .pipe(
        timeout(15000),
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Load users error:', error);
          this.errorMessage = getLoadErrorMessage(error, 'Không tải được danh sách người dùng.');
          return of([] as UserModel[]);
        }),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        }),
      )
      .subscribe((users) => {
        this.users = [...users].sort((a, b) => b.id - a.id);
        this.applySearch();
        this.cdr.detectChanges();
      });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValue = this.form.getRawValue();

    if (!this.editingUserId && !rawValue.password) {
      this.errorMessage = 'Vui lòng nhập mật khẩu khi tạo người dùng mới.';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    const payload: UserPayload = {
      name: rawValue.name,
      email: rawValue.email,
      role: rawValue.role,
      ...(rawValue.password ? { password: rawValue.password } : {}),
    };

    const request$ = this.editingUserId
      ? this.userService.update(this.editingUserId, payload)
      : this.userService.create(payload);

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
          this.successMessage = this.editingUserId
            ? 'Cập nhật người dùng thành công.'
            : 'Thêm người dùng thành công.';
          this.resetForm();
          this.loadUsers();
        },
        error: (error) => {
          console.error('Save user error:', error);
          this.errorMessage = getActionErrorMessage(error, {
            forbiddenMessage: 'Bạn không có quyền thao tác với người dùng.',
            fallbackMessage: 'Lưu người dùng thất bại.',
          });
          this.cdr.detectChanges();
        },
      });
  }

  protected startEdit(user: UserModel): void {
    this.editingUserId = user.id;
    this.form.reset({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role as 'EMPLOYEE' | 'ADMIN',
    });
    this.cdr.detectChanges();
  }

  protected cancelEdit(): void {
    this.resetForm();
    this.cdr.detectChanges();
  }

  protected deleteUser(id: number): void {
    if (!confirm('Bạn có chắc muốn xóa người dùng này?')) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    this.userService
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
        next: () => {
          this.successMessage = 'Xóa người dùng thành công.';
          this.loadUsers();
        },
        error: (error) => {
          console.error('Delete user error:', error);
          this.errorMessage = getActionErrorMessage(error, {
            forbiddenMessage: 'Bạn không có quyền xóa người dùng.',
            fallbackMessage: 'Xóa người dùng thất bại.',
          });
          this.cdr.detectChanges();
        },
      });
  }

  protected onSearchChange(keyword: string): void {
    this.searchKeyword = keyword;
    this.applySearch();
    this.cdr.detectChanges();
  }

  protected getRoleClass(role: string): string {
    const normalized = role.toUpperCase();

    if (normalized === 'ADMIN') {
      return 'status-chip status-chip-success';
    }

    return 'status-chip status-chip-info';
  }

  private applySearch(): void {
    const keyword = this.searchKeyword.trim().toLowerCase();

    if (!keyword) {
      this.filteredUsers = [...this.users];
      return;
    }

    this.filteredUsers = this.users.filter((user) =>
      [user.name, user.email, user.role, getRoleLabel(user.role)].some((value) =>
        value.toLowerCase().includes(keyword),
      ),
    );
  }

  private resetForm(): void {
    this.editingUserId = null;
    this.form.reset({
      name: '',
      email: '',
      password: '',
      role: 'EMPLOYEE',
    });
  }
}
