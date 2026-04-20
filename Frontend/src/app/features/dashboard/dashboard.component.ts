import { Component } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NzCardModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  constructor(public authService: AuthService) {}
}
