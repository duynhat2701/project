import { ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { NgIf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '../shared/pipes/CurrencyPipe.pipe';
import { Product } from '../products/product.model';
import { ProductService } from '../products/product.service';

@Component({
  selector: 'app-detail',
  imports: [NgIf, RouterLink, CurrencyPipe],
  templateUrl: './detail.component.html',
  styleUrl: './detail.component.css',
})
export class DetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  protected product?: Product;
  protected isLoading = true;
  protected errorMessage = '';

  constructor() {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const routeId = params.get('id');
        const productId = routeId ? Number(routeId) : NaN;

        if (Number.isNaN(productId)) {
          this.product = undefined;
          this.errorMessage = 'ID san pham khong hop le.';
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
          return;
        }

        this.isLoading = true;
        this.errorMessage = '';
        this.productService.getProductById(productId).subscribe({
          next: (product) => {
            this.product = product;
            this.isLoading = false;
            this.changeDetectorRef.detectChanges();
          },
          error: () => {
            this.product = undefined;
            this.errorMessage = 'Khong tim thay san pham hoac backend khong phan hoi.';
            this.isLoading = false;
            this.changeDetectorRef.detectChanges();
          },
        });
      });
  }
}

