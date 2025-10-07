declare module 'cookie-parser' {
  import { RequestHandler } from 'express';

  function cookieParser(
    secret?: string | string[],
    options?: cookieParser.CookieParseOptions
  ): RequestHandler;

  namespace cookieParser {
    interface CookieParseOptions {
      decode?: (val: string) => string;
    }

    function JSONCookie(str: string): object | undefined;
    function JSONCookies(obj: { [key: string]: string }): { [key: string]: object | undefined };
    function signedCookie(str: string, secret: string | string[]): string | false;
    function signedCookies(
      obj: { [key: string]: string },
      secret: string | string[]
    ): { [key: string]: string | false };
  }

  export = cookieParser;
}
