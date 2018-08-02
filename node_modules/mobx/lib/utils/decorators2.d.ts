export declare type BabelDescriptor = PropertyDescriptor & {
    initializer?: () => any;
};
export declare type PropertyCreator = (instance: any, propertyName: string, descriptor: BabelDescriptor | undefined, decoratorTarget: any, decoratorArgs: any[]) => void;
export declare function initializeInstance(target: any): any;
export declare function createPropDecorator(propertyInitiallyEnumerable: boolean, propertyCreator: PropertyCreator): Function;
export declare function quacksLikeADecorator(args: IArguments): boolean;
