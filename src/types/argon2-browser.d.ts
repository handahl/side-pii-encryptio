declare module 'argon2-browser' {
  export enum ArgonType {
    Argon2d = 0,
    Argon2i = 1,
    Argon2id = 2
  }
  
  export interface HashOptions {
    pass: string | Uint8Array;
    salt: string | Uint8Array;
    time: number;
    mem: number;
    hashLen: number;
    type: ArgonType;
  }
  
  export interface HashResult {
    hash: Uint8Array;
    hashHex: string;
    encoded: string;
  }
  
  export function hash(options: HashOptions): Promise<HashResult>;
  
  export const ArgonType: {
    Argon2d: 0;
    Argon2i: 1;
    Argon2id: 2;
  };
  
  const argon2: {
    hash: (options: HashOptions) => Promise<HashResult>;
    ArgonType: typeof ArgonType;
  };
  
  export default argon2;
}