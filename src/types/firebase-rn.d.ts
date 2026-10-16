// `firebase/auth` re-exports `@firebase/auth`, and Metro resolves its React
// Native build (which has getReactNativePersistence). The wrapper package only
// publishes web typings, so declare the RN-only export here.
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
