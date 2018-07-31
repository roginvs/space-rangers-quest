/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Timestamp } from '../api/timestamp';
import { User } from '../auth/user';
import { Query } from '../core/query';
import { BatchId, ProtoByteString } from '../core/types';
import { DocumentKey } from '../model/document_key';
import { Mutation } from '../model/mutation';
import { MutationBatch } from '../model/mutation_batch';
import { GarbageCollector } from './garbage_collector';
import { LocalSerializer } from './local_serializer';
import { MutationQueue } from './mutation_queue';
import { PersistenceTransaction } from './persistence';
import { PersistencePromise } from './persistence_promise';
/** A mutation queue for a specific user, backed by IndexedDB. */
export declare class IndexedDbMutationQueue implements MutationQueue {
    /**
     * The normalized userId (e.g. null UID => "" userId) used to store /
     * retrieve mutations.
     */
    private userId;
    private serializer;
    /**
     * Next value to use when assigning sequential IDs to each mutation batch.
     *
     * NOTE: There can only be one IndexedDbMutationQueue for a given db at a
     * time, hence it is safe to track nextBatchID as an instance-level property.
     * Should we ever relax this constraint we'll need to revisit this.
     */
    private nextBatchId;
    /**
     * A write-through cache copy of the metadata describing the current queue.
     */
    private metadata;
    private garbageCollector;
    constructor(
        /**
         * The normalized userId (e.g. null UID => "" userId) used to store /
         * retrieve mutations.
         */
        userId: string, serializer: LocalSerializer);
    /**
     * Creates a new mutation queue for the given user.
     * @param user The user for which to create a mutation queue.
     * @param serializer The serializer to use when persisting to IndexedDb.
     */
    static forUser(user: User, serializer: LocalSerializer): IndexedDbMutationQueue;
    start(transaction: PersistenceTransaction): PersistencePromise<void>;
    /**
     * Returns one larger than the largest batch ID that has been stored. If there
     * are no mutations returns 0. Note that batch IDs are global.
     */
    static loadNextBatchIdFromDb(txn: PersistenceTransaction): PersistencePromise<BatchId>;
    checkEmpty(transaction: PersistenceTransaction): PersistencePromise<boolean>;
    getNextBatchId(transaction: PersistenceTransaction): PersistencePromise<BatchId>;
    getHighestAcknowledgedBatchId(transaction: PersistenceTransaction): PersistencePromise<BatchId>;
    acknowledgeBatch(transaction: PersistenceTransaction, batch: MutationBatch, streamToken: ProtoByteString): PersistencePromise<void>;
    getLastStreamToken(transaction: PersistenceTransaction): PersistencePromise<ProtoByteString>;
    setLastStreamToken(transaction: PersistenceTransaction, streamToken: ProtoByteString): PersistencePromise<void>;
    addMutationBatch(transaction: PersistenceTransaction, localWriteTime: Timestamp, mutations: Mutation[]): PersistencePromise<MutationBatch>;
    lookupMutationBatch(transaction: PersistenceTransaction, batchId: BatchId): PersistencePromise<MutationBatch | null>;
    getNextMutationBatchAfterBatchId(transaction: PersistenceTransaction, batchId: BatchId): PersistencePromise<MutationBatch | null>;
    getAllMutationBatches(transaction: PersistenceTransaction): PersistencePromise<MutationBatch[]>;
    getAllMutationBatchesThroughBatchId(transaction: PersistenceTransaction, batchId: BatchId): PersistencePromise<MutationBatch[]>;
    getAllMutationBatchesAffectingDocumentKey(transaction: PersistenceTransaction, documentKey: DocumentKey): PersistencePromise<MutationBatch[]>;
    getAllMutationBatchesAffectingQuery(transaction: PersistenceTransaction, query: Query): PersistencePromise<MutationBatch[]>;
    removeMutationBatches(transaction: PersistenceTransaction, batches: MutationBatch[]): PersistencePromise<void>;
    performConsistencyCheck(txn: PersistenceTransaction): PersistencePromise<void>;
    setGarbageCollector(gc: GarbageCollector | null): void;
    containsKey(txn: PersistenceTransaction, key: DocumentKey): PersistencePromise<boolean>;
    /**
     * Creates a [userId, batchId] key for use with the DbMutationQueue object
     * store.
     */
    private keyForBatchId(batchId);
}
