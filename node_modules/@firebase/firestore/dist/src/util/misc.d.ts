export declare type EventHandler<E> = (value: E) => void;
/**
 * A union of all of the standard JS types, useful for cases where the type is
 * unknown. Unlike "any" this doesn't lose all type-safety, since the consuming
 * code must still cast to a particular type before using it.
 */
export declare type AnyJs = null | undefined | boolean | number | string | object;
export declare type AnyDuringMigration = any;
export declare class AutoId {
    static newId(): string;
}
export declare function primitiveComparator<T>(left: T, right: T): number;
/** Duck-typed interface for objects that have an isEqual() method. */
export interface Equatable<T> {
    isEqual(other: T): boolean;
}
/** Helper to compare nullable (or undefined-able) objects using isEqual(). */
export declare function equals<T>(left: Equatable<T> | null | undefined, right: T | null | undefined): boolean;
/** Helper to compare arrays using isEqual(). */
export declare function arrayEquals<T>(left: Array<Equatable<T>>, right: T[]): boolean;
/**
 * Returns the largest lexicographically smaller string of equal or smaller
 * length. Returns an empty string if there is no such predecessor (if the input
 * is empty).
 *
 * Strings returned from this method can be invalid UTF-16 but this is sufficent
 * in use for indexeddb because that depends on lexicographical ordering but
 * shouldn't be used elsewhere.
 */
export declare function immediatePredecessor(s: string): string;
/**
 * Returns the immediate lexicographically-following string. This is useful to
 * construct an inclusive range for indexeddb iterators.
 */
export declare function immediateSuccessor(s: string): string;
