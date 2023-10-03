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
  constructor(private apiService: ApiService, private authService: AuthService){}
   
  ngOnInit(): void {
    this.apiService.loadAll()
    .subscribe({
      next: (value) => {
        console.log(value)
       this.bookList = value;
       let pageIndex = (this.selectedPage - 1) * this.itemsPerPage;
       this.products = this.bookList.slice(pageIndex, this.itemsPerPage);
        
      },
      error: (err) => {
        this.errorFetcingData = true;
        this.dataBooks = true
      }
    })
    
  }

  onTableSizeChange(event: any){
    const newSize = (event.target as HTMLInputElement).value
    this.itemsPerPage = Number(newSize);
    this.changePage(1);
  }

  changePage(page : any){
    this.selectedPage = page;
    this.slicedItems();
  }
  get pageNumbers(): number[]{
   
  let items = Array(Math.ceil(this.bookList.length / this.itemsPerPage))
    .fill(0).map((x,i) => i + 1)
   
    return items;
  }
  slicedItems(){
    let pageIndex = (this.selectedPage - 1) * this.itemsPerPage;
    let endIndex = (this.selectedPage - 1) * this.itemsPerPage + this.itemsPerPage;
    this.products = [];
    this.products = this.bookList.slice(pageIndex, endIndex);
  }
}

