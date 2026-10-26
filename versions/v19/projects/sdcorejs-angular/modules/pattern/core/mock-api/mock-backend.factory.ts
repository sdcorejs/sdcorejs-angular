import { PatternMockBackend } from './mock-backend';
import { PATTERN_MOCK_RESOURCES } from './resources';

/** Loaded on the first mock request (see `PatternMockApiState.backend()`). */
export function createPatternMockBackend(storage: 'session' | 'none'): PatternMockBackend {
  return new PatternMockBackend(PATTERN_MOCK_RESOURCES, storage);
}
