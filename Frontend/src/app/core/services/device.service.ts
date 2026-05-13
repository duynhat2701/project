import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response.model';
import { Device } from '../../shared/models/device.model';
import { environment } from '../../../environments/environment';
import { BaseApiService } from './base-api.service';

@Injectable({ providedIn: 'root' })
export class DeviceService extends BaseApiService {
  private readonly api = `${environment.apiBaseUrl}/devices`;

  constructor(private http: HttpClient) {
    super();
  }

  getAll(): Observable<Device[]> {
    return this.handleRequest(
      this.http.get<ApiResponse<Device[]>>(this.api).pipe(
        map((response) => response.data ?? []),
      ),
    );
  }

  create(data: Partial<Device>): Observable<Device> {
    return this.handleRequest(
      this.http.post<ApiResponse<Device>>(this.api, data).pipe(
        map((response) => response.data),
      ),
    );
  }

  update(id: number, data: Partial<Device>): Observable<Device> {
    return this.handleRequest(
      this.http.put<ApiResponse<Device>>(`${this.api}/${id}`, data).pipe(
        map((response) => response.data),
      ),
    );
  }

  delete(id: number): Observable<void> {
    return this.handleRequest(
      this.http.delete<ApiResponse<void>>(`${this.api}/${id}`).pipe(
        map(() => void 0),
      ),
    );
  }
}
