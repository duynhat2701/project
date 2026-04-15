import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe } from '../shared/pipes/CurrencyPipe.pipe';
import { NgFor, NgIf } from '@angular/common';
import { Product, ProductFormValue } from '../products/product.model';
import { ProductService } from '../products/product.service';

@Component({
  selector: 'app-home',
  imports: [CurrencyPipe, NgFor, NgIf, RouterLink, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private readonly productService = inject(ProductService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  products: Product[] = [];
  searchTerm = '';
  isLoading = false;
  isSubmitting = false;
  isModalOpen = false;
  isEditMode = false;
  editingProductId: number | null = null;
  errorMessage = '';
  pageErrorMessage = '';
  productForm: ProductFormValue = this.createEmptyForm();
  selectedImageFile: File | null = null;
  previewUrl = '';
  existingImageUrl = '';

  constructor() {
    this.loadProducts();
  }

  protected openCreateModal(): void {
    this.isModalOpen = true;
    this.isEditMode = false;
    this.editingProductId = null;
    this.errorMessage = '';
    this.existingImageUrl = '';
    this.resetImageState();
    this.productForm = this.createEmptyForm();
  }

  protected openEditModal(product: Product): void {
    this.isModalOpen = true;
    this.isEditMode = true;
    this.editingProductId = product.id;
    this.errorMessage = '';
    this.existingImageUrl = product.imageUrl;
    this.resetImageState(product.imageUrl);
    this.productForm = {
      name: product.name,
      price: product.price,
    };
  }

  protected closeModal(): void {
    this.isModalOpen = false;
    this.isEditMode = false;
    this.editingProductId = null;
    this.errorMessage = '';
    this.existingImageUrl = '';
    this.resetImageState();
    this.productForm = this.createEmptyForm();
  }

  protected submitForm(): void {
    if (!this.productForm.name.trim() || this.productForm.price <= 0) {
      this.errorMessage = 'Vui long nhap day du ten va gia hop le.';
      return;
    }

    if (!this.isEditMode && !this.selectedImageFile) {
      this.errorMessage = 'Vui long chon hinh anh.';
      return;
    }

    this.isSubmitting = true;
    const payload = this.buildFormData();

    if (this.isEditMode && this.editingProductId !== null) {
      this.productService.updateProduct(this.editingProductId, payload).subscribe({
        next: () => {
          this.loadProducts();
          this.closeModal();
          this.changeDetectorRef.detectChanges();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.extractErrorMessage(error, 'Cap nhat that bai vi san pham khong ton tai hoac backend loi.');
          this.isSubmitting = false;
          this.changeDetectorRef.detectChanges();
        },
      });
      return;
    } else {
      this.productService.createProduct(payload).subscribe({
        next: () => {
          this.loadProducts();
          this.closeModal();
          this.changeDetectorRef.detectChanges();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = this.extractErrorMessage(error, 'Tao san pham that bai. Khong ket noi duoc backend.');
          this.isSubmitting = false;
          this.changeDetectorRef.detectChanges();
        },
      });
    }
  }

  protected deleteProduct(id: number): void {
    this.pageErrorMessage = '';
    this.productService.deleteProduct(id).subscribe({
      next: () => this.loadProducts(),
      error: () => {
        this.pageErrorMessage = 'Xoa san pham that bai. Khong ket noi duoc backend.';
      },
    });
  }

  protected onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Chi duoc chon file hinh anh.';
      this.clearSelectedImage();
      input.value = '';
      return;
    }

    this.revokePreviewUrl();
    this.selectedImageFile = file;
    this.previewUrl = URL.createObjectURL(file);
    this.errorMessage = '';
  }

  protected clearSelectedImage(): void {
    this.resetImageState(this.isEditMode ? this.existingImageUrl : '');
    this.errorMessage = '';
  }

  protected get displayImageUrl(): string {
    return this.previewUrl;
  }

  protected get filteredProducts(): Product[] {
    const normalizedSearchTerm = this.searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return this.products;
    }

    return this.products.filter((product) =>
      product.name.toLowerCase().includes(normalizedSearchTerm),
    );
  }

  private createEmptyForm(): ProductFormValue {
    return {
      name: '',
      price: 0,
    };
  }

  private loadProducts(): void {
    this.isLoading = true;
    this.pageErrorMessage = '';
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.isLoading = false;
        this.isSubmitting = false;
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.products = [];
        this.pageErrorMessage = 'Khong tai duoc danh sach san pham tu backend.';
        this.isLoading = false;
        this.isSubmitting = false;
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  private extractErrorMessage(error: HttpErrorResponse, fallbackMessage: string): string {
    const apiMessage = error.error?.message;

    if (typeof apiMessage === 'string' && apiMessage.trim()) {
      return apiMessage;
    }

    return fallbackMessage;
  }

  private buildFormData(): FormData {
    const formData = new FormData();
    formData.append('name', this.productForm.name.trim());
    formData.append('price', String(Number(this.productForm.price)));

    if (this.selectedImageFile) {
      formData.append('image', this.selectedImageFile);
    }

    return formData;
  }

  private resetImageState(nextPreviewUrl = ''): void {
    this.revokePreviewUrl();
    this.selectedImageFile = null;
    this.previewUrl = nextPreviewUrl;
  }

  private revokePreviewUrl(): void {
    if (this.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.previewUrl);
    }
  }
}

