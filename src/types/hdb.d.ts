declare module 'hdb' {
  interface ClientOptions {
    host: string;
    port: number | string;
    user: string;
    password?: string;
    useTLS?: boolean;
    rejectUnauthorized?: boolean;
    schema?: string;
    [key: string]: any;
  }

  interface Client {
    connect(callback: (err?: any) => void): void;
    disconnect(callback?: (err?: any) => void): void;
    exec(sql: string, callback: (err: any, rows: any[]) => void): void;
    exec(sql: string, params: any[], callback: (err: any, rows: any[]) => void): void;
    prepare(sql: string, callback: (err: any, statement: any) => void): void;
    setAutoCommit(autoCommit: boolean): void;
    commit(callback: (err?: any) => void): void;
    rollback(callback: (err?: any) => void): void;
    on(event: string, listener: (...args: any[]) => void): void;
  }

  export function createClient(options: ClientOptions): Client;
  export class Client {
    constructor(options: ClientOptions);
  }
  const hdb: {
    createClient: (options: ClientOptions) => Client;
    Client: typeof Client;
  };
  export default hdb;
}
