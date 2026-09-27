import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { handle, ok, fail } from '@/lib/api';
import { requireTenant } from '@/lib/tenant';

export const runtime = 'nodejs';

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_BYTES = 3 * 1024 * 1024; // 3 MB

/**
 * Upload a product image. Stored under /public/uploads and served at /uploads/<file>.
 * On a VPS/Docker host, mount /app/public/uploads as a volume to persist images.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const ctx = await requireTenant();
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return fail('NO_FILE', 'No file uploaded', 400);
    if (!ALLOWED.includes(file.type)) return fail('BAD_TYPE', 'Only PNG, JPG, WEBP or GIF images are allowed', 415);
    if (file.size > MAX_BYTES) return fail('TOO_LARGE', 'Image must be 3 MB or smaller', 413);

    const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
    const name = `${ctx.tenantId}_${randomUUID()}.${ext}`;
    const dir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, name), buffer);

    return ok({ url: `/uploads/${name}` }, 201);
  });
}
