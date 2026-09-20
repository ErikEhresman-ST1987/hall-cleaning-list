# Hall Cleaning

Hall Cleaning is a lightweight, local-first checklist app for After Meeting Clean and Deep Cleaning assignments. It is designed to make Hall cleaning immediately understandable on a phone or tablet without requiring training or ongoing app management.

## Project status

Increment 2 adds the reusable checklist engine and the complete After Meeting Clean checklist, including progress, automatic persistence, large touch targets, and confirmed reset. Deep Cleaning, the Cleaning Guide, schedule editing, and appearance themes are intentionally reserved for later approved increments.

## Architecture

The app uses plain HTML, CSS, and JavaScript with no runtime dependencies or build step. Browser `localStorage` owns user state. The service worker owns offline application-shell caching. The project is designed for static deployment through GitHub Pages.

The local-state schema includes a schema version, completed task IDs for both cleaning types, exactly four schedule slots, and a theme preference.

## Product boundaries

The complete initial product will include two cleaning checklists, a Cleaning Guide, four manual schedule entries, four appearance choices, responsive behavior, and offline use. It will not include accounts, history, reports, notifications, calendar integration, automatic scheduling, cloud synchronization, inventory management, or backup/restore.

## Local development

Serve the repository through a local web server so the service worker can run, then open the provided local URL.

```sh
python3 -m http.server 8000
```
