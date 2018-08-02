import { CreateObservableOptions } from "./observable";
export declare function extendShallowObservable<A extends Object, B extends Object>(target: A, properties: B, decorators?: {
    [K in keyof B]?: Function;
}): A & B;
export declare function extendObservable<A extends Object, B extends Object>(target: A, properties: B, decorators?: {
    [K in keyof B]?: Function;
}, options?: CreateObservableOptions): A & B;
