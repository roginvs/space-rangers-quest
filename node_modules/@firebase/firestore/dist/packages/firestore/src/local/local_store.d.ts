import { User } from '../auth/user';
import { Query } from '../core/query';
import { SnapshotVersion } from '../core/snapshot_version';
import { BatchId, ProtoByteString, TargetId } from '../core/types';
import { DocumentKeySet, DocumentMap, MaybeDocumentMap } from '../model/collections';
import { MaybeDocument } from '../model/document';
import { DocumentKey } from '../model/document_key';
import { Mutation } from '../model/mutation';
import { MutationBatch, MutationBatchResult } from '../model/mutation_batch';
import { RemoteEvent } from '../remote/remote_event';
import { GarbageCollector } from './garbage_collector';
import { LocalViewChanges } from './local_view_changes';
import { Persistence } from './persistence';
import { QueryData } from './query_data';
/** The result of a write to the local store. */
export interface LocalWriteResult {
    batchId: BatchId;
    changes: MaybeDocumentMap;
}
/**
 * Local storage in the Firestore client. Coordinates persistence components
 * like the mutation queue and remote document cache to present a
 * latency-compensated view of stored data.
 *
 * The LocalStore is responsible for accepting mutations from the Sync Engine.
 * Writes from the client are put into a queue as provisional Mutations until
 * they are processed by the RemoteStore and confirmed as having been written
 * to the server.
 *
 * The local store provides the local version of documents that have been
 * modified locally. It maintains the constraint:
 *
 *   LocalDocument = RemoteDocument + Active(LocalMutations)
 *
 * (Active mutations are those that are enqueued and have not been previously
 * acknowledged or rejected).
 *
 * The RemoteDocument ("ground truth") state is provided via the
 * applyChangeBatch method. It will be some version of a server-provided
 * document OR will be a server-provided document PLUS acknowledged mutations:
 *
 *   RemoteDocument' = RemoteDocument + Acknowledged(LocalMutations)
 *
 * Note that this "dirty" version of a RemoteDocument will not be identical to a
 * server base version, since it has LocalMutations added to it pending getting
 * an authoritative copy from the server.
 *
 * Since LocalMutations can be rejected by the server, we have to be able to
 * revert a LocalMutation that has already been applied to the LocalDocument
 * (typically done by replaying all remaining LocalMutations to the
 * RemoteDocument to re-apply).
 *
 * The LocalStore is responsible for the garbage collection of the documents it
 * contains. For now, it every doc referenced by a view, the mutation queue, or
 * the RemoteStore.
 *
 * It also maintains the persistence of mapping queries to resume tokens and
 * target ids. It needs to know this data about queries to properly know what
 * docs it would be allowed to garbage collect.
 *
 * The LocalStore must be able to efficiently execute queries against its local
 * cache of the documents, to provide the initial set of results before any
 * remote changes have been received.
 *
 * Note: In TypeScript, most methods return Promises since the implementation
 * may rely on fetching data from IndexedDB which is async.
 * These Promises will only be rejected on an I/O error or other internal
 * (unexpected) failure (e.g. failed assert) and always represent an
 * unrecoverable error (should be caught / reported by the async_queue).
 */
export declare class LocalStore {
    /** Manages our in-memory or durable persistence. */
    private persistence;
    /**
     * The garbage collector collects documents that should no longer be
     * cached (e.g. if they are no longer retained by the above reference sets
     * and the garbage collector is performing eager collection).
     */
    private garbageCollector;
    /**
     * The set of all mutations that have been sent but not yet been applied to
     * the backend.
     */
    private mutationQueue;
    /** The set of all cached remote documents. */
    private remoteDocuments;
    /**
     * The "local" view of all documents (layering mutationQueue on top of
     * remoteDocumentCache).
     */
    private localDocuments;
    /**
     * The set of document references maintained by any local views.
     */
    private localViewReferences;
    /** Maps a query to the data about that query. */
    private queryCache;
    /** Maps a targetID to data about its query. */
    private targetIds;
    /** Used to generate targetIDs for queries tracked locally. */
    private targetIdGenerator;
    /**
     * A heldBatchResult is a mutation batch result (from a write acknowledgement)
     * that arrived before the watch stream got notified of a snapshot that
     * includes the write. So we "hold" it until the watch stream catches up. It
     * ensures that the local write remains visible (latency compensation) and
     * doesn't temporarily appear reverted because the watch stream is slower than
     * the write stream and so wasn't reflecting it.
     *
     * NOTE: Eventually we want to move this functionality into the remote store.
     */
    private heldBatchResults;
    constructor(
        /** Manages our in-memory or durable persistence. */
        persistence: Persistence, initialUser: User, 
        /**
         * The garbage collector collects documents that should no longer be
         * cached (e.g. if they are no longer retained by the above reference sets
         * and the garbage collector is performing eager collection).
         */
        garbageCollector: GarbageCollector);
    /** Performs any initial startup actions required by the local store. */
    start(): Promise<void>;
    /**
     * Tells the LocalStore that the currently authenticated user has changed.
     *
     * In response the local store switches the mutation queue to the new user and
     * returns any resulting document changes.
     */
    handleUserChange(user: User): Promise<MaybeDocumentMap>;
    private startQueryCache(txn);
    private startMutationQueue(txn);
    localWrite(mutations: Mutation[]): Promise<LocalWriteResult>;
    /**
     * Acknowledge the given batch.
     *
     * On the happy path when a batch is acknowledged, the local store will
     *
     *  + remove the batch from the mutation queue;
     *  + apply the changes to the remote document cache;
     *  + recalculate the latency compensated view implied by those changes (there
     *    may be mutations in the queue that affect the documents but haven't been
     *    acknowledged yet); and
     *  + give the changed documents back the sync engine
     *
     * @returns The resulting (modified) documents.
     */
    acknowledgeBatch(batchResult: MutationBatchResult): Promise<MaybeDocumentMap>;
    /**
     * Remove mutations from the MutationQueue for the specified batch;
     * LocalDocuments will be recalculated.
     *
     * @returns The resulting modified documents.
     */
    rejectBatch(batchId: BatchId): Promise<MaybeDocumentMap>;
    /** Returns the last recorded stream token for the current user. */
    getLastStreamToken(): Promise<ProtoByteString>;
    /**
     * Sets the stream token for the current user without acknowledging any
     * mutation batch. This is usually only useful after a stream handshake or in
     * response to an error that requires clearing the stream token.
     */
    setLastStreamToken(streamToken: ProtoByteString): Promise<void>;
    /**
     * Returns the last consistent snapshot processed (used by the RemoteStore to
     * determine whether to buffer incoming snapshots from the backend).
     */
    getLastRemoteSnapshotVersion(): SnapshotVersion;
    /**
     * Update the "ground-state" (remote) documents. We assume that the remote
     * event reflects any write batches that have been acknowledged or rejected
     * (i.e. we do not re-apply local mutations to updates from this event).
     *
     * LocalDocuments are re-calculated if there are remaining mutations in the
     * queue.
     */
    applyRemoteEvent(remoteEvent: RemoteEvent): Promise<MaybeDocumentMap>;
    /**
     * Notify local store of the changed views to locally pin documents.
     */
    notifyLocalViewChanges(viewChanges: LocalViewChanges[]): Promise<void>;
    /**
     * Gets the mutation batch after the passed in batchId in the mutation queue
     * or null if empty.
     * @param afterBatchId If provided, the batch to search after.
     * @returns The next mutation or null if there wasn't one.
     */
    nextMutationBatch(afterBatchId?: BatchId): Promise<MutationBatch | null>;
    /**
     * Read the current value of a Document with a given key or null if not
     * found - used for testing.
     */
    readDocument(key: DocumentKey): Promise<MaybeDocument | null>;
    /**
     * Assigns the given query an internal ID so that its results can be pinned so
     * they don't get GC'd. A query must be allocated in the local store before
     * the store can be used to manage its view.
     */
    allocateQuery(query: Query): Promise<QueryData>;
    /** Unpin all the documents associated with the given query. */
    releaseQuery(query: Query): Promise<void>;
    /**
     * Runs the specified query against all the documents in the local store and
     * returns the results.
     */
    executeQuery(query: Query): Promise<DocumentMap>;
    /**
     * Returns the keys of the documents that are associated with the given
     * target id in the remote table.
     */
    remoteDocumentKeys(targetId: TargetId): Promise<DocumentKeySet>;
    /**
     * Collect garbage if necessary.
     * Should be called periodically by Sync Engine to recover resources. The
     * implementation must guarantee that GC won't happen in other places than
     * this method call.
     */
    collectGarbage(): Promise<void>;
    private releaseHeldBatchResults(txn, documentBuffer);
    private isRemoteUpToVersion(version);
    private shouldHoldBatchResult(version);
    private releaseBatchResults(txn, batchResults, documentBuffer);
    private removeMutationBatch(txn, batch);
    /** Removes all the mutation batches named in the given array. */
    private removeMutationBatches(txn, batches);
    private applyWriteToRemoteDocuments(txn, batchResult, documentBuffer);
}
