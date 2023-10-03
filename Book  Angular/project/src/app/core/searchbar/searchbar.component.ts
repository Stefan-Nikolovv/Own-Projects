import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/api.service';
import { IBook } from 'src/app/shared/interfaces/book';
@Component({
  selector: 'app-searchbar',
  templateUrl: './searchbar.component.html',
  styleUrls: ['./searchbar.component.css']
})
export class SearchbarComponent implements OnInit {
  keyword: object = {}
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
  constructor(private route: ActivatedRoute, private apiService: ApiService) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params =>{
      this.keyword = { ...params };
      
    let keyword =   Object.values(this.keyword)[0];
    this.apiService.searchBook(keyword)
    .subscribe({
      next: (value) => {
       
       this.bookList = value;
       let pageIndex = (this.selectedPage - 1) * this.itemsPerPage;
       this.products = this.bookList.slice(pageIndex, this.itemsPerPage);
        
      },
      error: (err) => {
        this.errorFetcingData = true;
        this.dataBooks = true
      }
    })
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

  AlphabetDown (e:any){
    let value = e.target.value
    console.log(value, "AlphabetDown")
    if(value === 'author'){
    this.products.sort((a, b) => {
  return a.author > b.author ? 1 : -1; 
 })
    }
    this.products.sort((a, b) => {
      return a.title > b.title ? 1 : -1;
    })


  }

  AlphabetUp(e:any){
    let value = e.target.value
    console.log(value, "AlphabetUp")
    if(value === 'author'){
      this.products.sort(function (a, b) {
        return a.author < b.author ? 1 : -1;
      })
      console.log(this.products)
    }
    this.products.sort(function (a, b) {
      return a.title < b.title ? 1 : -1;
    })
  }
} 
