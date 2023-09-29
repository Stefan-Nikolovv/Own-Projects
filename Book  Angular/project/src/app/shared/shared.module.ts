import {  NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// import { AppEmailDirective } from './validators';
import {  RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxPaginationModule } from 'ngx-pagination';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule,
    NgxPaginationModule
  ], 
  exports:[
    
  ]
})
export class SharedModule { 
 
}
