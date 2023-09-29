import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IBook } from '../shared/interfaces/book';

@Injectable({
  providedIn: 'root'
})
export class BookService {

  constructor(private httpClient: HttpClient) { }

  getBook(id: string) {
    return this.httpClient.get<IBook>('/api/books/' + id);
  };
  
  
  updateBook(id: string, title: string, description: string, imageUrl: string, type: string) {
    return this.httpClient.put<IBook>('/api/books/' + id, { title, description, imageUrl, type });
  }

  

  }

