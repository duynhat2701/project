import { Injectable } from '@angular/core';
import { Borrow } from '../../shared/models/borrow.model';
import { Device } from '../../shared/models/device.model';

export interface ProductStat {
  id: number;
  name: string;
  availableQuantity: number;
  borrowedQuantity: number;
  borrowCount: number;
  rating: number;
  status: 'Còn hàng' | 'Sắp hết' | 'Hết hàng';
}

export interface SalesCategory {
  name: string;
  value: number;
  share: number;
  color: string;
}

export interface OrderStat extends Borrow {
  orderLabel: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly chartColors = ['#10b981', '#f59e0b', '#06b6d4', '#ff5b36', '#8b5cf6', '#0f766e'];

  buildDashboard(devices: Device[], borrows: Borrow[]) {
    const borrowGroups = this.groupBorrowsByDevice(borrows);
    const rankedProducts = this.rankProducts(devices, borrowGroups);

    const topProducts = this.buildTopProducts(rankedProducts);
    const salesCategories = this.buildSalesCategories(topProducts);
    const donutStyle = this.buildDonutStyle(salesCategories);
    const orders = this.buildRecentOrders(borrows);

    return {
      topProducts,
      salesCategories,
      donutStyle,
      orders,
    };
  }

  private groupBorrowsByDevice(borrows: Borrow[]): Map<number, Borrow[]> {
    const borrowGroups = new Map<number, Borrow[]>();

    for (const borrow of borrows) {
      const current = borrowGroups.get(borrow.deviceId) ?? [];
      current.push(borrow);
      borrowGroups.set(borrow.deviceId, current);
    }

    return borrowGroups;
  }

  private rankProducts(devices: Device[], borrowGroups: Map<number, Borrow[]>): ProductStat[] {
    return devices
      .map((device) => {
        const deviceBorrows = borrowGroups.get(device.id) ?? [];
        const borrowedQuantity = deviceBorrows.reduce((sum, item) => sum + item.quantity, 0);

        return {
          id: device.id,
          name: device.name,
          availableQuantity: device.quantity,
          borrowedQuantity,
          borrowCount: deviceBorrows.length,
          rating: 0,
          status: this.mapInventoryStatus(device.quantity),
        };
      })
      .filter((product) => product.borrowedQuantity > 0 || product.availableQuantity > 0)
      .sort((a, b) => {
        if (b.borrowedQuantity !== a.borrowedQuantity) {
          return b.borrowedQuantity - a.borrowedQuantity;
        }

        return b.borrowCount - a.borrowCount;
      });
  }

  private buildTopProducts(products: ProductStat[]): ProductStat[] {
    const maxBorrowedQuantity = products[0]?.borrowedQuantity ?? 0;

    return products.slice(0, 6).map((product) => ({
      ...product,
      rating: maxBorrowedQuantity > 0 ? Number(((product.borrowedQuantity / maxBorrowedQuantity) * 5).toFixed(1)) : 0,
    }));
  }

  private buildSalesCategories(products: ProductStat[]): SalesCategory[] {
    const chartItems = products.filter((product) => product.borrowedQuantity > 0).slice(0, 4);
    const totalBorrowed = chartItems.reduce((sum, item) => sum + item.borrowedQuantity, 0);

    return chartItems.map((item, index) => ({
      name: item.name,
      value: item.borrowedQuantity,
      share: totalBorrowed > 0 ? Number(((item.borrowedQuantity / totalBorrowed) * 100).toFixed(1)) : 0,
      color: this.chartColors[index % this.chartColors.length],
    }));
  }

  private buildRecentOrders(borrows: Borrow[]): OrderStat[] {
    return borrows
      .slice()
      .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime())
      .slice(0, 5)
      .map((borrow) => ({
        ...borrow,
        orderLabel: `#BR${String(borrow.id).padStart(3, '0')}`,
      }));
  }

  private buildDonutStyle(categories: SalesCategory[]): string {
    if (!categories.length) {
      return 'conic-gradient(#e2e8f0 0% 100%)';
    }

    let start = 0;
    const segments = categories.map((category) => {
      const end = start + category.share;
      const segment = `${category.color} ${start}% ${end}%`;
      start = end;
      return segment;
    });

    return `conic-gradient(${segments.join(', ')})`;
  }

  private mapInventoryStatus(quantity: number): ProductStat['status'] {
    if (quantity <= 0) {
      return 'Hết hàng';
    }

    if (quantity <= 2) {
      return 'Sắp hết';
    }

    return 'Còn hàng';
  }
}
