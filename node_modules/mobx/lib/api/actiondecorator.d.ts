import { BabelDescriptor } from "../utils/decorators2";
export declare function namedActionDecorator(name: string): (target: any, prop: any, descriptor: BabelDescriptor) => any;
export declare function actionFieldDecorator(name: string): (target: any, prop: any, descriptor: any) => void;
export declare function boundActionDecorator(target: any, propertyName: any, descriptor: any, applyToInstance?: boolean): {
    configurable: boolean;
    enumerable: boolean;
    get(): any;
    set: () => void;
} | {
    enumerable: boolean;
    configurable: boolean;
    set(v: any): void;
    get(): undefined;
} | null;
