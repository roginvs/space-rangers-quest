import { IEnhancer } from "../types/modifiers";
export declare type IObservableDecorator = {
    (target: Object, property: string, descriptor?: PropertyDescriptor): void;
    enhancer: IEnhancer<any>;
};
export declare function createDecoratorForEnhancer(enhancer: IEnhancer<any>): IObservableDecorator;
