export interface IEqualsComparer<T> {
    (a: T, b: T): boolean;
}
export declare const comparer: {
    identity: (a: any, b: any) => boolean;
    structural: (a: any, b: any) => boolean;
    default: (a: any, b: any) => boolean;
};
