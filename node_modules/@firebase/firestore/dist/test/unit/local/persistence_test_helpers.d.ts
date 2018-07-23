import { IndexedDbPersistence } from '../../../src/local/indexeddb_persistence';
import { MemoryPersistence } from '../../../src/local/memory_persistence';
/**
 * Creates and starts an IndexedDbPersistence instance for testing, destroying
 * any previous contents if they existed.
 */
export declare function testIndexedDbPersistence(): Promise<IndexedDbPersistence>;
/** Creates and starts a MemoryPersistence instance for testing. */
export declare function testMemoryPersistence(): Promise<MemoryPersistence>;
