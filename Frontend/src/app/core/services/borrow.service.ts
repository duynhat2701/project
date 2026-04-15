import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Borrow } from '../../shared/models/borrow.model';
import { ApiResponse } from '../../shared/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class BorrowService {
  private api = 'http://localhost:8080/api/borrows';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Borrow[]> {
    return this.http.get<ApiResponse<Borrow[]>>(this.api).pipe(map((response) => response.data));
  }

  approve(id: number): Observable<Borrow> {
    return this.http.post<ApiResponse<Borrow>>(`${this.api}/approve/${id}`, {}).pipe(map((response) => response.data));
  }

  returnDevice(id: number): Observable<Borrow> {
    return this.http.post<ApiResponse<Borrow>>(`${this.api}/return/${id}`, {}).pipe(map((response) => response.data));
  }
}
