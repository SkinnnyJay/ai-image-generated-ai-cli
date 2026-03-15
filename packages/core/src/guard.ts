import { PROMPT_GUARD_DENYLIST } from "./constants.js";

export interface GuardResult {
  ok: boolean;
  reason?: string;
}

/**
 * Basic prompt injection guard: denylist of patterns that suggest
 * system override or instruction injection. Call before sending prompt to API.
 */
export function checkPromptGuard(prompt: string): GuardResult {
  const trimmed = prompt.trim();
  if (trimmed.length === 0) {
    return { ok: false, reason: "Empty prompt" };
  }

  for (const pattern of PROMPT_GUARD_DENYLIST) {
    if (pattern.test(trimmed)) {
      return { ok: false, reason: `Prompt rejected: matched guard pattern` };
    }
  }

  return { ok: true };
}
