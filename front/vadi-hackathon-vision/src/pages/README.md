# Pages Documentation

This directory contains the main page components for the application.

## Files

- **Dashboard.tsx**: The main dashboard view showing statistics and recent files.
- **Login.tsx**: User login page.
- **Register.tsx**: User registration page.
- **MyFiles.tsx**: File management interface (list/grid view, actions).
- **FileUpload.tsx**: Interface for uploading new files.
- **NotFound.tsx**: 404 Error page.
- **Index.tsx**: Landing page / redirect handler.

## Usage

These components coincide with the routes defined in `App.tsx`. They are typically wrapped in `MainLayout` (except for auth pages) and use stores for data fetching.
