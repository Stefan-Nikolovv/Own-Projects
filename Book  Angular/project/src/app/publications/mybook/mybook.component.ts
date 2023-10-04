import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/api.service';
import { AuthService } from 'src/app/auth/auth.service';
import { IBook } from 'src/app/shared/interfaces';

@Component({
  selector: 'app-mybook',
  templateUrl: './mybook.component.html',
  styleUrls: ['./mybook.component.css']
})
export class MybookComponent implements OnInit {
  bookList: IBook[] | any;
  products: any[] = [];
  errorFetcingData = false;
  dataBooks = false;
  Books: any;
  public selectedPage = 1;
  count: number = 1;
  itemsPerPage: number = 5;
  tableSizes: any = [5, 10, 15, 20];
  totalProducts: number = 1;
  pageNumbers: number[] = [];
  
  constructor(private apiService: ApiService){
  }
 
  ngOnInit(): void {
   
    this.apiService.loadMyAllBooks()
    .subscribe({
      next: (value) => {
       this.bookList = value;
       let pageIndex = (this.selectedPage - 1) * this.itemsPerPage;
       this.products = this.bookList.slice(pageIndex, this.itemsPerPage);
       this.pageNumbers = Array(Math.ceil(this.bookList.length / this.itemsPerPage)).fill(0).map((x,i) => i + 1)
      },
      error: (err) => {
        this.errorFetcingData = true;
        this.dataBooks = true;
      }
    })
    
  }

  onTableSizeChange(event: any){
   
    if(event.target.attributes[0].value > 0){
      const newSize = (event.target.attributes[0].nodeValue as HTMLInputElement)
      this.itemsPerPage = Number(newSize);
      this.changePage(1);

    };
   
  };

  changePage(page : any){
    this.selectedPage = page;
    this.slicedItems();
  }

  slicedItems(){
    let pageIndex = (this.selectedPage - 1) * this.itemsPerPage;
    let endIndex = (this.selectedPage - 1) * this.itemsPerPage + this.itemsPerPage;
    this.products = [];
    this.products = this.bookList.slice(pageIndex, endIndex);
  }

  authorSort(event:any){
    let value = event.target.attributes[0].value
    if(value === 'acn'){
     this.products.sort(function(a, b){
                const nameA = a.author[0].toLowerCase();
                const nameB = b.author[0].toLowerCase();
                  return nameA > nameB ? 1 : -1;   
            });
    };
    if(value === 'desc'){
      this.products.sort(function(a, b){
                 const nameA = a.author[0].toLowerCase();
                 const nameB = b.author[0].toLowerCase();
                   return nameA < nameB ? 1 : -1;  
             });
     };

  };

  titleSort(event:any){
    let value = event.target.attributes[0].value
    if(value === 'acn'){
     this.products.sort(function(a, b){
                const nameA = a.title[0].toLowerCase();
                const nameB = b.title[0].toLowerCase();
                  return nameA > nameB ? 1 : -1;   
            });
    };
    if(value === 'desc'){
      this.products.sort(function(a, b){
                 const nameA = a.title[0].toLowerCase();
                 const nameB = b.title[0].toLowerCase();
                   return nameA < nameB ? 1 : -1;  
             });
     };

  };
 

};

