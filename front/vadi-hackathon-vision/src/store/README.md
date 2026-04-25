# Store Documentation

This directory contains Zustand stores for global state management.

## Files

- **useAuthStore.ts**: Manages user authentication state (user object, login/logout methods, token persistence).
- **useFileStore.ts**: Manages file data (list of files, upload actions, sharing logic, file removal/renaming).

## Usage

Stores are used via hooks in components:
```typescript
import { useAuthStore } from '@/store/useAuthStore';
const { user } = useAuthStore();
```
