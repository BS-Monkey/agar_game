export declare class ObjectPool {
    freeList: any[];
    count: number;
    T: any;
    isObjectPool: boolean;
    createElement: () => any;
    constructor(T: any, initialSize: number);
    aquire(): any;
    release(item: any): void;
    expand(count: number): void;
    totalSize(): number;
    totalFree(): number;
    totalUsed(): number;
}
