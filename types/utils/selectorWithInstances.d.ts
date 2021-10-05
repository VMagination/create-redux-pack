export declare const selectorWithInstances: (prevSelector: any, name: string, initial: any, format?: (state: any) => any) => import("reselect").Selector<any, any> & {
    resultFunc: (res: any) => any;
    recomputations: () => number;
    resetRecomputations: () => number;
} & {
    instances: {};
};
