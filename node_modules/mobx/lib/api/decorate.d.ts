export declare function decorate<T>(clazz: new (...args: any[]) => T, decorators: {
    [P in keyof T]?: MethodDecorator | PropertyDecorator;
}): void;
export declare function decorate<T>(object: T, decorators: {
    [P in keyof T]?: MethodDecorator | PropertyDecorator;
}): T;
