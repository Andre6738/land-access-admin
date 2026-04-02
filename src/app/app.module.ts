import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';

import { QuillModule } from 'ngx-quill';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
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
import { AuthInterceptor } from './services/auth.interceptor';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    HomeComponent,
    UsersComponent,
    ConfigComponent,
    ActivityComponent,
    GenerationsComponent,
    BulkUploadsComponent,
    NewsletterComponent,
    AdvertsComponent,
    ReferralsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    QuillModule.forRoot(),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth())
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
