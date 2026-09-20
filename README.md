# Hall Cleaning

Hall Cleaning is a lightweight, local-first checklist app for After Meeting Clean and Deep Cleaning assignments. It is designed to make Hall cleaning immediately understandable on a phone or tablet without requiring training or ongoing app management.

## Status

The planned functional core is complete:

- After Meeting Clean checklist with seven approved tasks
- Deep Cleaning checklist with 19 approved tasks in four sections
- independent checklist progress, persistence, and confirmed reset
- Cleaning Guide with product, trash, laundry, and supply instructions
- four manually maintained Schedule entries with chronological display
- Green, Blue, Orange, and Dark appearance choices
- responsive phone, tablet, and desktop presentation
- installable PWA metadata and offline application-shell operation

## Use

Open **Cleaning**, choose the appropriate cleaning type, and mark each task as it is completed. Checklist state remains on the device until that checklist is intentionally reset.

Open **Schedule** to maintain up to four upcoming assignments. Each entry has a date, cleaning type, and optional note. The app saves changes automatically and displays dated entries chronologically; it does not calculate recurrence, advance dates, or remove entries.

Use the sun button in the header to select Green, Blue, Orange, or Dark appearance. The selected theme is saved locally and does not alter the meaning of the RED and GREEN cleaning-product labels.

## Install and offline use

The app remains fully usable as a normal website. On iPhone or iPad, open it in Safari and use **Share → Add to Home Screen** to install it. After the application shell has loaded successfully once, the core app can reopen and operate without an Internet connection.

## Architecture and data ownership

The app uses plain HTML, CSS, and JavaScript with no runtime dependencies or build step. Browser `localStorage` owns checklist state, four Schedule entries, the selected theme, and the schema version. The versioned service worker owns offline application-shell caching. No account, backend, database, or third-party service is used.

Checklist definitions are structured application data with stable task IDs. After Meeting Clean and Deep Cleaning share one renderer for task sections, progress, persistence, and reset behavior. Progress is derived rather than stored separately.

## Product boundaries

The app intentionally does not include cleaning history, cleaner assignments, reports, statistics, notifications, calendar integration, automatic scheduling, cloud synchronization, inventory management, administrative management, or backup/restore.

## Failure and update behavior

- Missing or unreadable local state falls back to safe defaults.
- Unknown task IDs do not count toward progress.
- Invalid theme values fall back to Green.
- Invalid Schedule structures return to four safe empty entries.
- A versioned cache replaces older application-shell files while preserving compatible local data.

## Local development

Serve the repository through a local web server so the service worker can run:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Release verification

Before treating a new version as a recovery point, verify both checklists, independent reset, Schedule editing and ordering, all four themes, responsive layouts, persistence after close/reopen, installation, and real-device Airplane Mode operation.
