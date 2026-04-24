import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomePageComponent } from './components/home-page/home-page.component';
import { HomeRedirectGuard } from './guards/home-redirect.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [HomeRedirectGuard],
    component: HomePageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HomeRoutingModule {}
