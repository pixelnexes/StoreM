'use client';
import { useState } from 'react';

/**
 * An input that refuses to be autofilled.
 *
 * Chrome and Safari ignore `autoComplete="off"` on credential fields, but both
 * skip fields that are read-only — so the field starts read-only and unlocks on
 * the first focus/click, which is always the user's own intent. The extra data-*
 * attributes tell 1Password/LastPass/Edge to keep out as well.
 */
export function AuthInput({ onFocus, onPointerDown, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <input
      {...props}
      autoComplete="off"
      readOnly={!unlocked}
      data-1p-ignore=""
      data-lpignore="true"
      data-form-type="other"
      onFocus={(e) => { setUnlocked(true); onFocus?.(e); }}
      onPointerDown={(e) => { setUnlocked(true); onPointerDown?.(e); }}
    />
  );
}
