// Pure logic, no Obsidian imports, so it can be tested with plain node.

export const API_URL = 'https://app.solmarrow.com/api/v1';

export interface HttpRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}
export interface HttpResponse {
  status: number;
  json: unknown;
}
export type Requester = (req: HttpRequest) => Promise<HttpResponse>;

export interface Settings {
  apiKey: string;
  workspaceId: string;
}

/** Removes a leading YAML front matter block (between two --- lines). */
export function stripFrontmatter(md: string): string {
  const m = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(\r?\n|$)/.exec(md);
  return m ? md.slice(m[0].length) : md;
}

/** The text to post: the selection if there is one, otherwise the whole note without front matter. */
export function noteToText(note: string, selection?: string): string {
  const base = selection && selection.trim() ? selection : stripFrontmatter(note);
  return base.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Returns a plain message when the settings are not usable, otherwise null. */
export function settingsProblem(s: Settings): string | null {
  if (!/^smk_[A-Za-z0-9_-]{20,}$/.test((s.apiKey || '').trim())) {
    return 'Add your SolMarrow API key (it starts with smk_) in the plugin settings.';
  }
  if (!/^[0-9a-f-]{36}$/i.test((s.workspaceId || '').trim())) {
    return 'Add your SolMarrow workspace ID (36 characters) in the plugin settings.';
  }
  return null;
}

/** Reads a nested string field from an unknown JSON value. */
function pick(value: unknown, ...path: string[]): string | null {
  let cur: unknown = value;
  for (const key of path) {
    if (typeof cur !== 'object' || cur === null) return null;
    cur = (cur as Record<string, unknown>)[key];
  }
  return typeof cur === 'string' || typeof cur === 'number' ? String(cur) : null;
}

export function buildDraftBody(text: string) {
  return { text, account_ids: [] as string[], media_ids: [] as string[], draft: true };
}

export interface DraftResult {
  postId: string;
}

/** Saves one draft. Throws a plain message the user can read. */
export async function createDraft(request: Requester, s: Settings, text: string, idempotencyKey: string): Promise<DraftResult> {
  const problem = settingsProblem(s);
  if (problem) throw new Error(problem);
  if (!text) throw new Error('There is no text to send. Open a note or select some text.');
  const res = await request({
    url: `${API_URL}/workspaces/${s.workspaceId.trim()}/posts`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${s.apiKey.trim()}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey.slice(0, 200),
    },
    body: JSON.stringify(buildDraftBody(text)),
  });
  if (res.status === 401) throw new Error('SolMarrow did not accept the API key. Check the key in the plugin settings.');
  if (res.status === 403 || res.status === 404) throw new Error('SolMarrow could not find that workspace for this key. Check the workspace ID.');
  if (res.status < 200 || res.status >= 300) {
    const msg = pick(res.json, 'error', 'message');
    throw new Error(`SolMarrow said (${res.status}): ${msg || 'no details'}`);
  }
  const id = pick(res.json, 'post_id') || pick(res.json, 'id');
  if (!id) throw new Error('SolMarrow saved the draft but did not return its ID.');
  return { postId: String(id) };
}
