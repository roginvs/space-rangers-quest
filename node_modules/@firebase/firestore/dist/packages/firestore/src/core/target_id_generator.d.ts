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
import { TargetId } from './types';
/**
 * TargetIdGenerator generates monotonically increasing integer IDs. There are
 * separate generators for different scopes. While these generators will operate
 * independently of each other, they are scoped, such that no two generators
 * will ever produce the same ID. This is useful, because sometimes the backend
 * may group IDs from separate parts of the client into the same ID space.
 */
export declare class TargetIdGenerator {
    private generatorId;
    private previousId;
    constructor(generatorId: number, initAfter?: TargetId);
    next(): TargetId;
    static forLocalStore(initAfter?: TargetId): TargetIdGenerator;
    static forSyncEngine(): TargetIdGenerator;
}
