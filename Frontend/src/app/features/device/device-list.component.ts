import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTableModule } from 'ng-zorro-antd/table';
import { DeviceService } from '../../core/services/device.service';
import { Device } from '../../shared/models/device.model';

@Component({
  selector: 'app-device-list',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzTableModule],
  templateUrl: './device-list.component.html',
})
export class DeviceListComponent implements OnInit {
  devices: Device[] = [];

  constructor(private deviceService: DeviceService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.deviceService.getAll().subscribe((res: Device[]) => {
      this.devices = res;
    });
  }
}
