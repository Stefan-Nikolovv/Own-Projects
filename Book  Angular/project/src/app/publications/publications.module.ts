import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateComponent } from './create/create.component';
import { publicationRouterModule } from './publications-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { EditComponent } from './edit/edit.component';
import { DetailsComponent } from './details/details.component';
import { MybookComponent } from './mybook/mybook.component';
import { NgxPaginationModule } from 'ngx-pagination';
import { LiberyComponent } from './libery/libery.component';
import { DialogCompComponent } from './dialog-comp/dialog-comp.component';


@NgModule({
  declarations: [
    CreateComponent,
    EditComponent,
    DetailsComponent,
    MybookComponent,
    LiberyComponent,
    DialogCompComponent,
   
  ],
  imports: [
    CommonModule,
    publicationRouterModule,
    ReactiveFormsModule,
   
  ],
  
})
export class PublicationsModule { }
