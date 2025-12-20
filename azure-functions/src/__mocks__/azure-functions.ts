// Mock for @azure/functions

export class HttpRequest {
  private _headers: Map<string, string>;
  private _body: any;
  public method: string;
  public url: string;

  constructor(options: { method?: string; url?: string; headers?: Record<string, string>; body?: any } = {}) {
    this.method = options.method || 'GET';
    this.url = options.url || 'http://localhost/api/test';
    this._headers = new Map(Object.entries(options.headers || {}));
    this._body = options.body;
  }

  get headers() {
    return {
      get: (name: string) => this._headers.get(name.toLowerCase()),
    };
  }

  async json() {
    return this._body;
  }

  async text() {
    return JSON.stringify(this._body);
  }
}

export interface HttpResponseInit {
  status?: number;
  headers?: Record<string, string>;
  body?: string;
}

export interface InvocationContext {
  log: (...args: any[]) => void;
  error: (...args: any[]) => void;
  warn: (...args: any[]) => void;
}

export function createMockContext(): InvocationContext {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  };
}

export const app = {
  http: jest.fn(),
};
