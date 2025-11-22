import { routes } from './../../../app.routes';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, Router,NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule,RouterLink,RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {

  currentMode: 'login' | 'register' | 'recovery' | 'conocenos' | 'default' | 'home-hidden' = 'default';

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.url;

        if (url.startsWith('/login')) {
          this.currentMode = 'login';
        } else if (url.startsWith('/registro')) {
          this.currentMode = 'register';
        } else if (url.startsWith('/recuperacion')) {
          this.currentMode = 'recovery';
        }else if (url.startsWith('/conocenos')) {
          this.currentMode = 'conocenos';
        }else if (url.startsWith('/home')) {
          this.currentMode = 'home-hidden';
        } else {
          this.currentMode = 'default';
        }
      });
  }
}
