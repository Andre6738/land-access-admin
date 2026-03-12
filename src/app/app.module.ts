import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HomeComponent } from './pages/home/home.component';
import { UsersComponent } from './pages/users/users.component';
import { ConfigComponent } from './pages/config/config.component';
import { ActivityComponent } from './pages/activity/activity.component';
import { GenerationsComponent } from './pages/generations/generations.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
    HomeComponent,
    UsersComponent,
    ConfigComponent,
    ActivityComponent,
    GenerationsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
