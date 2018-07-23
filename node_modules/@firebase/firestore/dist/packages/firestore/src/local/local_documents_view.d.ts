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
import { Query } from '../core/query';
import { DocumentKeySet, DocumentMap, MaybeDocumentMap } from '../model/collections';
import { MaybeDocument } from '../model/document';
import { DocumentKey } from '../model/document_key';
import { MutationQueue } from './mutation_queue';
import { PersistenceTransaction } from './persistence';
import { PersistencePromise } from './persistence_promise';
import { RemoteDocumentCache } from './remote_document_cache';
/**
 * A readonly view of the local state of all documents we're tracking (i.e. we
 * have a cached version in remoteDocumentCache or local mutations for the
 * document). The view is computed by applying the mutations in the
 * MutationQueue to the RemoteDocumentCache.
 */
export declare class LocalDocumentsView {
    private remoteDocumentCache;
    private mutationQueue;
    constructor(remoteDocumentCache: RemoteDocumentCache, mutationQueue: MutationQueue);
    /**
     * Get the local view of the document identified by `key`.
     *
     * @return Local view of the document or null if we don't have any cached
     * state for it.
     */
    getDocument(transaction: PersistenceTransaction, key: DocumentKey): PersistencePromise<MaybeDocument | null>;
    /**
     * Gets the local view of the documents identified by `keys`.
     *
     * If we don't have cached state for a document in `keys`, a NoDocument will
     * be stored for that key in the resulting set.
     */
    getDocuments(transaction: PersistenceTransaction, keys: DocumentKeySet): PersistencePromise<MaybeDocumentMap>;
    /** Performs a query against the local view of all documents. */
    getDocumentsMatchingQuery(transaction: PersistenceTransaction, query: Query): PersistencePromise<DocumentMap>;
    private getDocumentsMatchingDocumentQuery(transaction, docPath);
    private getDocumentsMatchingCollectionQuery(transaction, query);
    /**
     * Takes a remote document and applies local mutations to generate the local
     * view of the document.
     * @param transaction The transaction in which to perform any persistence
     *     operations.
     * @param documentKey The key of the document (necessary when remoteDocument
     *     is null).
     * @param document The base remote document to apply mutations to or null.
     */
    private computeLocalDocument(transaction, documentKey, document);
    /**
     * Takes a set of remote documents and applies local mutations to generate the
     * local view of the documents.
     * @param transaction The transaction in which to perform any persistence
     *     operations.
     * @param documents The base remote documents to apply mutations to.
     * @return The local view of the documents.
     */
    private computeLocalDocuments(transaction, documents);
}
