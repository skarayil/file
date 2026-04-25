# Layout Components

Components that define the structural layout of the application.

## Files

- **MainLayout.tsx**: The primary wrapper for authenticated pages. Includes `Header`.
- **Header.tsx**: The top navigation bar containing links and user profile info.
- **Sidebar.tsx**: (If present) Side navigation.

## Usage

Wrap page content in `MainLayout`:
```tsx
<MainLayout>
  <PageContent />
</MainLayout>
```
