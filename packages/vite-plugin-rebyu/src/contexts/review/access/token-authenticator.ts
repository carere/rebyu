import { type ReviewAuthenticator, type ReviewSession, validateSession } from "./review-session";

export interface ReviewToken {
  token: string;
  session: ReviewSession;
}

async function digest(value: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

export function createTokenAuthenticator(tokens: readonly ReviewToken[]): ReviewAuthenticator {
  if (!tokens.length || tokens.some(({ token }) => token.length < 32))
    throw new Error("Configure unique review tokens with at least 32 characters each.");
  if (new Set(tokens.map(({ token }) => token)).size !== tokens.length)
    throw new Error("Review tokens must be unique.");
  const records = tokens.map(({ token, session }) => ({
    hash: digest(token),
    session: validateSession(session),
  }));
  return async (request) => {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ") || authorization.length > 4096) return null;
    const supplied = await digest(authorization.slice(7));
    let matched: ReviewSession | null = null;
    for (const record of records) {
      const expected = await record.hash;
      let difference = 0;
      for (let index = 0; index < expected.length; index++)
        difference |= expected[index] ^ supplied[index];
      if (difference === 0) matched = structuredClone(record.session);
    }
    return matched;
  };
}
