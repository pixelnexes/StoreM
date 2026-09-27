import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ApiError } from './tenant';

/** Consistent success/error envelope for all API routes. */

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(code: string, message: string, status = 400) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

/** Wrap a handler and translate thrown errors into the error envelope. */
export function handle(fn: () => Promise<Response>): Promise<Response> {
  return fn().catch((err: unknown) => {
    if (err instanceof ApiError) return fail(err.code, err.message, err.status);
    if (err instanceof ZodError) {
      return fail('VALIDATION_ERROR', err.issues.map((i) => i.message).join('; '), 422);
    }
    if (err instanceof Error && /_LIMIT_REACHED$|^INSUFFICIENT_STOCK$|^INVALID_/.test(err.message)) {
      return fail(err.message, err.message, 409);
    }
    console.error('[api] unhandled', err);
    return fail('INTERNAL_ERROR', 'Something went wrong', 500);
  });
}
