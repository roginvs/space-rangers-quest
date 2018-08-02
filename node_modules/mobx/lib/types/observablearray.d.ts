import { Lambda } from "../utils/utils";
import { IInterceptor } from "./intercept-utils";
import { IEnhancer } from "./modifiers";
export interface IObservableArray<T = any> extends Array<T> {
    spliceWithArray(index: number, deleteCount?: number, newItems?: T[]): T[];
    observe(listener: (changeData: IArrayChange<T> | IArraySplice<T>) => void, fireImmediately?: boolean): Lambda;
    intercept(handler: IInterceptor<IArrayWillChange<T> | IArrayWillSplice<T>>): Lambda;
    clear(): T[];
    peek(): T[];
    replace(newItems: T[]): T[];
    find(predicate: (item: T, index: number, array: IObservableArray<T>) => boolean, thisArg?: any, fromIndex?: number): T | undefined;
    findIndex(predicate: (item: T, index: number, array: IObservableArray<T>) => boolean, thisArg?: any, fromIndex?: number): number;
    remove(value: T): boolean;
    move(fromIndex: number, toIndex: number): void;
}
export interface IArrayChange<T = any> {
    type: "update";
    object: IObservableArray<T>;
    index: number;
    newValue: T;
    oldValue: T;
}
export interface IArraySplice<T = any> {
    type: "splice";
    object: IObservableArray<T>;
    index: number;
    added: T[];
    addedCount: number;
    removed: T[];
    removedCount: number;
}
export interface IArrayWillChange<T = any> {
    type: "update";
    object: IObservableArray<T>;
    index: number;
    newValue: T;
}
export interface IArrayWillSplice<T = any> {
    type: "splice";
    object: IObservableArray<T>;
    index: number;
    added: T[];
    removedCount: number;
}
export declare class StubArray {
}
export declare class ObservableArray<T> extends StubArray {
    private $mobx;
    constructor(initialValues: T[] | undefined, enhancer: IEnhancer<T>, name?: string, owned?: boolean);
    intercept(handler: IInterceptor<IArrayWillChange<T> | IArrayWillSplice<T>>): Lambda;
    observe(listener: (changeData: IArrayChange<T> | IArraySplice<T>) => void, fireImmediately?: boolean): Lambda;
    clear(): T[];
    concat(...arrays: T[][]): T[];
    replace(newItems: T[]): T[];
    /**
     * Converts this array back to a (shallow) javascript structure.
     * For a deep clone use mobx.toJS
     */
    toJS(): T[];
    toJSON(): T[];
    peek(): T[];
    find(predicate: (item: T, index: number, array: ObservableArray<T>) => boolean, thisArg?: any, fromIndex?: number): T | undefined;
    findIndex(predicate: (item: T, index: number, array: ObservableArray<T>) => boolean, thisArg?: any, fromIndex?: number): number;
    splice(index: number, deleteCount?: number, ...newItems: T[]): T[];
    spliceWithArray(index: number, deleteCount?: number, newItems?: T[]): T[];
    push(...items: T[]): number;
    pop(): T | undefined;
    shift(): T | undefined;
    unshift(...items: T[]): number;
    reverse(): T[];
    sort(compareFn?: (a: T, b: T) => number): T[];
    remove(value: T): boolean;
    move(fromIndex: number, toIndex: number): void;
    get(index: number): T | undefined;
    set(index: number, newValue: T): void;
}
export declare function reserveArrayBuffer(max: number): void;
export declare function isObservableArray(thing: any): thing is IObservableArray<any>;
