import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../core/config/api.config';
import { SidebarLink, SidebarLinkInput } from '../models/sidebar-link';

@Injectable({
  providedIn: 'root',
})
export class SidebarLinksService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_URL}/sidebar-links`;

  getLinks(): Observable<SidebarLink[]> {
    return this.http.get<SidebarLink[]>(this.apiUrl);
  }

  createLink(input: SidebarLinkInput): Observable<SidebarLink> {
    return this.http.post<SidebarLink>(this.apiUrl, input);
  }

  updateLink(id: string, input: SidebarLinkInput): Observable<SidebarLink> {
    return this.http.put<SidebarLink>(`${this.apiUrl}/${id}`, input);
  }

  deleteLink(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
