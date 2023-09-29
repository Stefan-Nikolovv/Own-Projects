import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { IBook } from 'src/app/shared/interfaces/book';

@Component({
  selector: 'app-libery',
  templateUrl: './libery.component.html',
  styleUrls: ['./libery.component.css']
})
export class LiberyComponent {
  get isLoggedIn() {
    return this.authService.isLoggedIn;
  }
  bookList: IBook[] | any;
  errorFetcingData = false;
  dataBooks = false;
  Books: any;
  page: number = 1;
  count: number = 1;
  itemsPerpage: number = 4;
  tableSizes: any = [5, 10, 15, 20];
  totalProducts: number = 1;
  
  constructor(private apiService: ApiService, private authService: AuthService){}

  ngOnInit(): void {
    this.booksList();
  }

  booksList():void{
    this.apiService.loadAll()
    .subscribe({
      next: (value) => {
        
        this.bookList = value;
        this.totalProducts = value.length;
        
      },
      error: (err) => {
        this.errorFetcingData = true;
        this.dataBooks = true
      }
    })
  } 

  onTableDataChange(event: any){
    this.page = event;
    this.booksList();
  }
  onTableSizeChange(event: any){
    console.log(event)
    this.itemsPerpage = event.target.value;
    this.page = 1;
    this.booksList();
  }
}
