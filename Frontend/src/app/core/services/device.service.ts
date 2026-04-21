import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/api-response.model';
import { Device } from '../../shared/models/device.model';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly api = 'https://project-jet-five-10.vercel.app';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Device[]> {
    return this.http.get<ApiResponse<Device[]>>(this.api).pipe(
      map((response) => response.data ?? []),
    );
  }

  create(data: Partial<Device>): Observable<Device> {
    return this.http.post<ApiResponse<Device>>(this.api, data).pipe(
      map((response) => response.data),
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/${id}`).pipe(
      map(() => void 0),
    );
  }
}
