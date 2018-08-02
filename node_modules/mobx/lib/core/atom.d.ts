export interface IAtom extends IObservable {
    reportObserved(): any;
    reportChanged(): any;
}
/**
 * Anything that can be used to _store_ state is an Atom in mobx. Atoms have two important jobs
 *
 * 1) detect when they are being _used_ and report this (using reportObserved). This allows mobx to make the connection between running functions and the data they used
 * 2) they should notify mobx whenever they have _changed_. This way mobx can re-run any functions (derivations) that are using this atom.
 */
export declare let Atom: new (name: string) => IAtom;
export declare let isAtom: (thing: any) => thing is IAtom;
export declare function declareAtom(): void;
export declare function createAtom(name: string, onBecomeObservedHandler?: () => void, onBecomeUnobservedHandler?: () => void): IAtom;
import { IObservable } from "./observable";
