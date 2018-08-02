import { IAction } from "../core/action";
export interface IActionFactory {
    <A1, R, T extends (a1: A1) => R>(fn: T): T & IAction;
    <A1, A2, R, T extends (a1: A1, a2: A2) => R>(fn: T): T & IAction;
    <A1, A2, A3, R, T extends (a1: A1, a2: A2, a3: A3) => R>(fn: T): T & IAction;
    <A1, A2, A3, A4, R, T extends (a1: A1, a2: A2, a3: A3, a4: A4) => R>(fn: T): T & IAction;
    <A1, A2, A3, A4, A5, R, T extends (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => R>(fn: T): T & IAction;
    <A1, A2, A3, A4, A5, A6, R, T extends (a1: A1, a2: A2, a3: A3, a4: A4, a6: A6) => R>(fn: T): T & IAction;
    <A1, R, T extends (a1: A1) => R>(name: string, fn: T): T & IAction;
    <A1, A2, R, T extends (a1: A1, a2: A2) => R>(name: string, fn: T): T & IAction;
    <A1, A2, A3, R, T extends (a1: A1, a2: A2, a3: A3) => R>(name: string, fn: T): T & IAction;
    <A1, A2, A3, A4, R, T extends (a1: A1, a2: A2, a3: A3, a4: A4) => R>(name: string, fn: T): T & IAction;
    <A1, A2, A3, A4, A5, R, T extends (a1: A1, a2: A2, a3: A3, a4: A4, a5: A5) => R>(name: string, fn: T): T & IAction;
    <A1, A2, A3, A4, A5, A6, R, T extends (a1: A1, a2: A2, a3: A3, a4: A4, a6: A6) => R>(name: string, fn: T): T & IAction;
    <T extends Function>(fn: T): T & IAction;
    <T extends Function>(name: string, fn: T): T & IAction;
    (customName: string): (target: Object, key: string, baseDescriptor?: PropertyDescriptor) => void;
    (target: Object, propertyKey: string, descriptor?: PropertyDescriptor): void;
    bound(target: Object, propertyKey: string, descriptor?: PropertyDescriptor): void;
}
export declare var action: IActionFactory;
export declare function runInAction<T>(block: () => T): T;
export declare function runInAction<T>(name: string, block: () => T): T;
export declare function isAction(thing: any): boolean;
export declare function defineBoundAction(target: any, propertyName: string, fn: Function): void;
