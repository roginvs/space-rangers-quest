export declare function iteratorSymbol(): any;
export declare const IS_ITERATING_MARKER = "__$$iterating";
export declare function declareIterator<T>(prototType: any, iteratorFactory: () => IterableIterator<T>): void;
export declare function makeIterable<T>(iterator: Iterator<T>): IterableIterator<T>;
