import { Atom } from "../core/atom";
import { Lambda } from "../utils/utils";
import { IInterceptable, IInterceptor } from "./intercept-utils";
import { IListenable } from "./listen-utils";
import { IEnhancer } from "./modifiers";
export interface IValueWillChange<T> {
    object: any;
    type: "update";
    newValue: T;
}
export interface IValueDidChange<T> extends IValueWillChange<T> {
    oldValue: T | undefined;
}
export declare type IUNCHANGED = {};
export declare const UNCHANGED: IUNCHANGED;
export interface IObservableValue<T> {
    get(): T;
    set(value: T): void;
    intercept(handler: IInterceptor<IValueWillChange<T>>): Lambda;
    observe(listener: (change: IValueDidChange<T>) => void, fireImmediately?: boolean): Lambda;
}
export declare class ObservableValue<T> extends Atom implements IObservableValue<T>, IInterceptable<IValueWillChange<T>>, IListenable {
    enhancer: IEnhancer<T>;
    hasUnreportedChange: boolean;
    interceptors: any;
    changeListeners: any;
    value: any;
    dehancer: any;
    constructor(value: T, enhancer: IEnhancer<T>, name?: string, notifySpy?: boolean);
    private dehanceValue(value);
    set(newValue: T): void;
    private prepareNewValue(newValue);
    setNewValue(newValue: T): void;
    get(): T;
    intercept(handler: IInterceptor<IValueWillChange<T>>): Lambda;
    observe(listener: (change: IValueDidChange<T>) => void, fireImmediately?: boolean): Lambda;
    toJSON(): T;
    toString(): string;
    valueOf(): T;
}
export declare var isObservableValue: (x: any) => x is IObservableValue<any>;
