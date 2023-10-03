import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs';

const apiURL = environment.apiURL;

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private httpClient: HttpClient ) { }

      loadAll(){
        return this.httpClient.get<any>(`${apiURL}/books`)
      };

      searchBook(keyword :string){
        return this.httpClient.post<any>(`${apiURL}/books/search`, { keyword })
      }


      getOneBook(id: number){
        return this.httpClient.get<any>(`${apiURL}/books/${id}`);
      };

      createBook(createFile: string,author: string, title: string,description: string, type: string ){
        //const Fifi = btoa(file.toString());
       return this.httpClient.post<any>(`${apiURL}/books`,{createFile, author:author, title:title, description: description, type: type}, {withCredentials: true})
      };

      updateBook(id: string, createFile: string, author: string, title: string,description: string, type: string) {
        return this.httpClient.put<any>(`${apiURL}/books/` + id, {createFile, author:author, title:title, description: description, type: type}, {withCredentials: true});
      };
      deleteBook(id: string) {
        console.log('delete')
        return this.httpClient.delete<any>(`${apiURL}/books/` + id, {withCredentials: true});
      }
      loadMyAllBooks(): Observable<any>{
        return this.httpClient.get<any>(`${apiURL}/books/mybooks`, {withCredentials:true})
      };


};
