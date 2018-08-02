import { IEnhancer } from "../types/modifiers";
import { IObservableValue } from "../types/observablevalue";
import { IObservableArray } from "../types/observablearray";
import { IObservableDecorator } from "./observabledecorator";
import { IObservableObject } from "../types/observableobject";
import { IObservableMapInitialValues, ObservableMap } from "../types/observablemap";
export declare type CreateObservableOptions = {
    name?: string;
    deep?: boolean;
    defaultDecorator?: IObservableDecorator;
};
export declare const defaultCreateObservableOptions: CreateObservableOptions;
export declare const shallowCreateObservableOptions: {
    deep: boolean;
    name: undefined;
    defaultDecorator: undefined;
};
export declare function asCreateObservableOptions(thing: any): CreateObservableOptions;
export declare const deepDecorator: IObservableDecorator;
export declare const refDecorator: IObservableDecorator;
export interface IObservableFactory {
    (value: number | string | null | undefined | boolean): never;
    (target: Object, key: string | symbol, baseDescriptor?: PropertyDescriptor): any;
    <T = any>(value: T[], options?: CreateObservableOptions): IObservableArray<T>;
    <K = any, V = any>(value: Map<K, V>, options?: CreateObservableOptions): ObservableMap<K, V>;
    <T extends Object>(value: T, decorators?: {
        [K in keyof T]?: Function;
    }, options?: CreateObservableOptions): T & IObservableObject;
}
export interface IObservableFactories {
    box<T = any>(value?: T, options?: CreateObservableOptions): IObservableValue<T>;
    shallowBox<T = any>(value?: T, options?: CreateObservableOptions): IObservableValue<T>;
    array<T = any>(initialValues?: T[], options?: CreateObservableOptions): IObservableArray<T>;
    shallowArray<T = any>(initialValues?: T[], options?: CreateObservableOptions): IObservableArray<T>;
    map<K = any, V = any>(initialValues?: IObservableMapInitialValues<K, V>, options?: CreateObservableOptions): ObservableMap<K, V>;
    shallowMap<K = any, V = any>(initialValues?: IObservableMapInitialValues<K, V>, options?: CreateObservableOptions): ObservableMap<K, V>;
    object<T = any>(props: T, decorators?: {
        [K in keyof T]?: Function;
    }, options?: CreateObservableOptions): T & IObservableObject;
    shallowObject<T = any>(props: T, decorators?: {
        [K in keyof T]?: Function;
    }, options?: CreateObservableOptions): T & IObservableObject;
    /**
     * Decorator that creates an observable that only observes the references, but doesn't try to turn the assigned value into an observable.ts.
     */
    ref: IObservableDecorator;
    /**
     * Decorator that creates an observable converts its value (objects, maps or arrays) into a shallow observable structure
     */
    shallow: IObservableDecorator;
    deep: IObservableDecorator;
    struct: IObservableDecorator;
}
export declare const observable: IObservableFactory & IObservableFactories & {
    enhancer: IEnhancer<any>;
};
