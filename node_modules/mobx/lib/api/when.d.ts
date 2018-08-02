import { Lambda } from "../utils/utils";
import { IReactionDisposer } from "../core/reaction";
export interface IWhenOptions {
    name?: string;
    timeout?: number;
    onError?: (error: any) => void;
}
export declare function when(predicate: () => boolean, opts?: IWhenOptions): Promise<void> & {
    cancel(): void;
};
export declare function when(predicate: () => boolean, effect: Lambda, opts?: IWhenOptions): IReactionDisposer;
