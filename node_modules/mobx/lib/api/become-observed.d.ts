import { IObservableArray } from "../types/observablearray";
import { ObservableMap } from "../types/observablemap";
import { IComputedValue } from "../core/computedvalue";
import { Lambda } from "../utils/utils";
import { IObservable } from "../core/observable";
export declare function onBecomeObserved(value: IObservable | IComputedValue<any> | IObservableArray<any> | ObservableMap<any, any>, listener: Lambda): Lambda;
export declare function onBecomeObserved<K, V = any>(value: ObservableMap<K, V> | Object, property: K, listener: Lambda): Lambda;
export declare function onBecomeUnobserved(value: IObservable | IComputedValue<any> | IObservableArray<any> | ObservableMap<any, any>, listener: Lambda): Lambda;
export declare function onBecomeUnobserved<K, V = any>(value: ObservableMap<K, V> | Object, property: K, listener: Lambda): Lambda;
