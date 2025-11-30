import { Pool, PoolClient } from 'pg';
export declare function getPool(): Pool;
export declare function query<T = any>(text: string, params?: any[]): Promise<T[]>;
export declare function queryOne<T = any>(text: string, params?: any[]): Promise<T | null>;
export declare function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T>;
export declare function checkDatabaseHealth(): Promise<boolean>;
//# sourceMappingURL=database.d.ts.map