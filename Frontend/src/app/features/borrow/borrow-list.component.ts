import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { BorrowService } from '../../core/services/borrow.service';
import { Borrow } from '../../shared/models/borrow.model';

@Component({
  selector: 'app-borrow-list',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzTableModule],
  templateUrl: './borrow-list.component.html',
})
export class BorrowListComponent implements OnInit {
  list: Borrow[] = [];

  constructor(private service: BorrowService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.service.getAll().subscribe((res: Borrow[]) => {
      this.list = res;
    });
  }

  returnDevice(id: number): void {
    this.service.returnDevice(id).subscribe(() => this.load());
  }
}
