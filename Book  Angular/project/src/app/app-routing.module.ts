import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './core/home/home.component';

const routes: Routes = [ 
  { path: '',
  pathMatch: 'full',
  component: HomeComponent
},

{
  path: 'auth',
   loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule ),
},
{
  path: 'publication',
  loadChildren: () => import('./publications/publications.module').then(m => m.PublicationsModule)
},
{
  path: '**',
  redirectTo: '/not-found'
} 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
