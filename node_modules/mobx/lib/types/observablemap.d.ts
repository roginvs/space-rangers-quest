import { $mobx, IEnhancer, IInterceptable, IInterceptor, IListenable, Lambda } from "../internal";
export interface IKeyValueMap<V = any> {
    [key: string]: V;
}
export declare type IMapEntry<K = any, V = any> = [K, V];
export declare type IMapEntries<K = any, V = any> = IMapEntry<K, V>[];
export declare type IMapDidChange<K = any, V = any> = {
    object: ObservableMap<K, V>;
    name: K;
    type: "update";
    newValue: V;
    oldValue: V;
} | {
    object: ObservableMap<K, V>;
    name: K;
    type: "add";
    newValue: V;
} | {
    object: ObservableMap<K, V>;
    name: K;
    type: "delete";
    oldValue: V;
};
export interface IMapWillChange<K = any, V = any> {
    object: ObservableMap<K, V>;
    type: "update" | "add" | "delete";
    name: K;
    newValue?: V;
}
export declare type IObservableMapInitialValues<K = any, V = any> = IMapEntries<K, V> | IKeyValueMap<V> | Map<K, V>;
export declare class ObservableMap<K = any, V = any> implements Map<K, V>, IInterceptable<IMapWillChange<K, V>>, IListenable {
    enhancer: IEnhancer<V>;
    name: string;
    [$mobx]: {};
    private _data;
    private _hasMap;
    private _keysAtom;
    interceptors: any;
    changeListeners: any;
    dehancer: any;
    constructor(initialData?: IObservableMapInitialValues<K, V>, enhancer?: IEnhancer<V>, name?: string);
    private _has;
    has(key: K): boolean;
    set(key: K, value: V): this;
    delete(key: K): boolean;
    private _updateHasMapEntry;
    private _updateValue;
    private _addValue;
    get(key: K): V | undefined;
    private dehanceValue;
    keys(): IterableIterator<K>;
    values(): IterableIterator<V>;
    entries(): IterableIterator<IMapEntry<K, V>>;
    [Symbol.iterator](): IterableIterator<[K, V]>;
    forEach(callback: (value: V, key: K, object: Map<K, V>) => void, thisArg?: any): void;
    /** Merge another object into this object, returns this. */
    merge(other: ObservableMap<K, V> | IKeyValueMap<V> | any): ObservableMap<K, V>;
    clear(): void;
    replace(values: ObservableMap<K, V> | IKeyValueMap<V> | any): ObservableMap<K, V>;
    readonly size: number;
    /**
     * Returns a plain object that represents this map.
     * Note that all the keys being stringified.
     * If there are duplicating keys after converting them to strings, behaviour is undetermined.
     */
    toPOJO(): IKeyValueMap<V>;
    /**
     * Returns a shallow non observable object clone of this map.
     * Note that the values migth still be observable. For a deep clone use mobx.toJS.
     */
    toJS(): Map<K, V>;
    toJSON(): IKeyValueMap<V>;
    toString(): string;
    [Symbol.toStringTag]: "Map";
    /**
     * Observes this object. Triggers for the events 'add', 'update' and 'delete'.
     * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/observe
     * for callback details
     */
    observe(listener: (changes: IMapDidChange<K, V>) => void, fireImmediately?: boolean): Lambda;
    intercept(handler: IInterceptor<IMapWillChange<K, V>>): Lambda;
}
export declare var isObservableMap: (thing: any) => thing is ObservableMap<any, any>;
