export declare const OBFUSCATED_ERROR = "An invariant failed, however the error is obfuscated because this is an production build.";
export declare const EMPTY_ARRAY: never[];
export declare const EMPTY_OBJECT: {};
export declare function getGlobal(): any;
export interface Lambda {
    (): void;
    name?: string;
}
export declare function getNextId(): number;
export declare function fail(message: string | boolean): never;
export declare function invariant(check: false, message: string | boolean): never;
export declare function invariant(check: true, message: string | boolean): void;
export declare function invariant(check: any, message: string | boolean): void;
export declare function deprecated(msg: string): boolean;
export declare function deprecated(thing: string, replacement: string): boolean;
/**
 * Makes sure that the provided function is invoked at most once.
 */
export declare function once(func: Lambda): Lambda;
export declare const noop: () => void;
export declare function unique<T>(list: T[]): T[];
export declare function isObject(value: any): boolean;
export declare function isPlainObject(value: any): boolean;
export declare function hasOwnProperty(object: Object, propName: string): any;
export declare function makeNonEnumerable(object: any, propNames: string[]): void;
export declare function addHiddenProp(object: any, propName: PropertyKey, value: any): void;
export declare function addHiddenFinalProp(object: any, propName: string, value: any): void;
export declare function isPropertyConfigurable(object: any, prop: string): boolean;
export declare function assertPropertyConfigurable(object: any, prop: string): void;
export declare function createInstanceofPredicate<T>(name: string, clazz: new (...args: any[]) => T): (x: any) => x is T;
export declare function areBothNaN(a: any, b: any): boolean;
/**
 * Returns whether the argument is an array, disregarding observability.
 */
export declare function isArrayLike(x: any): x is Array<any> | IObservableArray<any>;
export declare function isES6Map(thing: any): boolean;
export declare function getMapLikeKeys<K, V>(map: ObservableMap<K, V>): ReadonlyArray<K>;
export declare function getMapLikeKeys<V>(map: IKeyValueMap<V> | any): ReadonlyArray<string>;
export declare function iteratorToArray<T>(it: Iterator<T>): ReadonlyArray<T>;
export declare function primitiveSymbol(): symbol | "@@toPrimitive";
export declare function toPrimitive(value: any): any;
import { IObservableArray } from "../types/observablearray";
import { ObservableMap, IKeyValueMap } from "../types/observablemap";
