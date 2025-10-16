
import type { App } from 'firebase-admin/app';

// This file is intentionally left simplified to avoid premature initialization.
// Admin app initialization should be handled within the specific API routes that need it.
// This prevents errors related to environment variable loading in serverless environments.

export type { App };
