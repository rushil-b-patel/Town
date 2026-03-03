declare module 'sql.js' {
  export interface SqlJsStatic {
    Database: typeof Database;
  }

  export interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }

  export interface ParamsObject {
    [key: string]: string | number | null | Uint8Array;
  }

  export type BindParams = (string | number | null | Uint8Array)[] | ParamsObject;

  export class Statement {
    bind(params?: BindParams): boolean;
    step(): boolean;
    getAsObject(): Record<string, string | number | null | Uint8Array>;
    get(): (string | number | null | Uint8Array)[];
    free(): boolean;
    reset(): void;
    run(params?: BindParams): void;
  }

  export class Database {
    constructor(data?: ArrayLike<number> | Buffer | null);
    run(sql: string, params?: BindParams): Database;
    exec(sql: string, params?: BindParams): QueryExecResult[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
    getRowsModified(): number;
  }

  export interface SqlJsInitOptions {
    locateFile?: (filename: string) => string;
  }

  export default function initSqlJs(options?: SqlJsInitOptions): Promise<SqlJsStatic>;
}
