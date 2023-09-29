import { RouterModule, Routes } from "@angular/router";
import { HomeComponent } from "../core/home/home.component";
import { CreateComponent } from "./create/create.component";
import { DetailsComponent } from "./details/details.component";
import { EditComponent } from "./edit/edit.component";
import { MybookComponent } from "./mybook/mybook.component";
import { LiberyComponent } from "./libery/libery.component";





const routes: Routes =[
    {
        path: 'home',
        component: HomeComponent,
       
    },
    {
        path: 'create',
        component: CreateComponent,
       
    }, 
    {
        path: 'edit/:id', 
        component: EditComponent,
       
    },
    {
        path: 'details/:id',
        component: DetailsComponent,
        
    },
    {
        path: 'mybooks',
        component: MybookComponent,
        
    },
    {
        path: 'libery',
        component: LiberyComponent,
        
    }
    

    
]

export const publicationRouterModule = RouterModule.forChild(routes);