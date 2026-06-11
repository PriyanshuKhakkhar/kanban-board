import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Diagnostics: log startup and show any uncaught errors in-page for debugging
window.addEventListener('error', (ev) => {
  console.error('Global error', ev.error || ev.message, ev);
  const el = document.getElementById('static-fallback');
  if (el) el.textContent = 'Global error: ' + (ev.error?.message || ev.message || ev.toString());
});
window.addEventListener('unhandledrejection', (ev) => {
  console.error('Unhandled rejection', ev.reason || ev);
  const el = document.getElementById('static-fallback');
  if (el) el.textContent = 'Unhandled rejection: ' + (ev.reason?.message || ev.reason || ev.toString());
});

bootstrapApplication(AppComponent, appConfig)
  .then(() => console.log('Angular bootstrapped'))
  .catch((err) => {
    console.error('Bootstrap failed', err);
    const el = document.getElementById('static-fallback');
    if (el) el.textContent = 'Bootstrap failed: ' + (err?.message || err?.toString());
  });
