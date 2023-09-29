import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { IBook } from 'src/app/shared/interfaces';

@Component({
  selector: 'app-mybook',
  templateUrl: './mybook.component.html',
  styleUrls: ['./mybook.component.css']
})
export class MybookComponent implements OnInit {
title = 'pagination';
Books: any;
page: number = 1;
count: number = 1;
tableSize: number = 10;
tableSizes: any = [5, 10, 15, 20];
  bookList: IBook[] | any;
  errorFetcingData = false;
  dataBooks = false;
  constructor(private apiService: ApiService, private authService: AuthService){}
   
  ngOnInit(): void {
   this.booksList();
  }

  booksList(): void  {
    this.apiService.loadMyAllBooks()
  .subscribe({
    next: (value) => {
     console.log(value)
      this.bookList = value;
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
    this.tableSize = event.target.value;
    this.page = 1;
    this.booksList();
  }
}
