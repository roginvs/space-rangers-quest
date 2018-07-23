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
import { SnapshotVersion } from '../core/snapshot_version';
import { AnyJs } from '../util/misc';
import { DocumentKey } from './document_key';
import { FieldValue, JsonObject, ObjectValue } from './field_value';
import { FieldPath } from './path';
export interface DocumentOptions {
    hasLocalMutations: boolean;
}
export declare class Document {
    readonly key: DocumentKey;
    readonly version: SnapshotVersion;
    readonly data: ObjectValue;
    readonly hasLocalMutations: boolean;
    constructor(key: DocumentKey, version: SnapshotVersion, data: ObjectValue, options: DocumentOptions);
    field(path: FieldPath): FieldValue | undefined;
    fieldValue(path: FieldPath): AnyJs;
    value(): JsonObject<AnyJs>;
    isEqual(other: Document | null | undefined): boolean;
    toString(): string;
    static compareByKey(d1: MaybeDocument, d2: MaybeDocument): number;
    static compareByField(field: FieldPath, d1: Document, d2: Document): number;
}
/**
 * A class representing a deleted document.
 * Version is set to 0 if we don't point to any specific time, otherwise it
 * denotes time we know it didn't exist at.
 */
export declare class NoDocument {
    readonly key: DocumentKey;
    readonly version: SnapshotVersion;
    constructor(key: DocumentKey, version: SnapshotVersion);
    toString(): string;
    isEqual(other: NoDocument): boolean;
    static compareByKey(d1: MaybeDocument, d2: MaybeDocument): number;
}
/**
 * A union type representing either a full document or a deleted document.
 * The NoDocument is used when it doesn't exist on the server.
 */
export declare type MaybeDocument = Document | NoDocument;
