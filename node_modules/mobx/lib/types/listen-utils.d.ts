import { Lambda } from "../utils/utils";
export interface IListenable {
    changeListeners: Function[] | undefined;
    observe(handler: (change: any, oldValue?: any) => void, fireImmediately?: boolean): Lambda;
}
export declare function hasListeners(listenable: IListenable): boolean;
export declare function registerListener(listenable: IListenable, handler: Function): Lambda;
export declare function notifyListeners<T>(listenable: IListenable, change: T): void;
