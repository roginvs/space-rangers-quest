import { Lambda } from "../utils/utils";
export declare function isSpyEnabled(): boolean;
export declare function spyReport(event: any): void;
export declare function spyReportStart(event: any): void;
export declare function spyReportEnd(change?: any): void;
export declare function spy(listener: (change: any) => void): Lambda;
