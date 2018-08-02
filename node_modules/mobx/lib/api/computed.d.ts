import { IComputedValueOptions } from "../core/computedvalue";
import { IComputedValue } from "../core/computedvalue";
export interface IComputed {
    <T>(options: IComputedValueOptions<T>): any;
    <T>(func: () => T, setter: (v: T) => void): IComputedValue<T>;
    <T>(func: () => T, options?: IComputedValueOptions<T>): IComputedValue<T>;
    (target: Object, key: string | symbol, baseDescriptor?: PropertyDescriptor): void;
    struct(target: Object, key: string | symbol, baseDescriptor?: PropertyDescriptor): void;
}
export declare const computedDecorator: Function;
/**
 * Decorator for class properties: @computed get value() { return expr; }.
 * For legacy purposes also invokable as ES5 observable created: `computed(() => expr)`;
 */
export declare var computed: IComputed;
