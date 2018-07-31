import { CreateObservableOptions } from "../internal";
import { IObservableDecorator } from "./observabledecorator";
export declare function extendObservable<A extends Object, B extends Object>(target: A, properties?: B, decorators?: {
    [K in keyof B]?: Function;
}, options?: CreateObservableOptions): A & B;
export declare function getDefaultDecoratorFromObjectOptions(options: CreateObservableOptions): IObservableDecorator;
export declare function extendObservableObjectWithProperties(target: any, properties: any, decorators: any, defaultDecorator: any): void;
