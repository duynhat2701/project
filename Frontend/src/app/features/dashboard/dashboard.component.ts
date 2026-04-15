import { Component } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NzCardModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {}
