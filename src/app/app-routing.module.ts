import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { UsersComponent } from './pages/users/users.component';
import { ConfigComponent } from './pages/config/config.component';
import { ActivityComponent } from './pages/activity/activity.component';
import { GenerationsComponent } from './pages/generations/generations.component';
import { BulkUploadsComponent } from './pages/bulk-uploads/bulk-uploads.component';
import { NewsletterComponent } from './pages/newsletter/newsletter.component';
import { AdvertsComponent } from './pages/adverts/adverts.component';
import { ReferralsComponent } from './pages/referrals/referrals.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: HomeComponent },
      { path: 'users', component: UsersComponent },
      { path: 'config', component: ConfigComponent },
      { path: 'activity', component: ActivityComponent },
      { path: 'generations', component: GenerationsComponent },
      { path: 'bulk-uploads', component: BulkUploadsComponent },
      { path: 'newsletter', component: NewsletterComponent },
      { path: 'adverts', component: AdvertsComponent },
      { path: 'referrals', component: ReferralsComponent },
    ]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
