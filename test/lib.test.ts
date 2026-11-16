import { test } from 'node:test';
import assert from 'node:assert/strict';
import { API_URL, buildDraftBody, createDraft, noteToText, settingsProblem, stripFrontmatter, type Requester } from '../src/lib.ts';

const good = { apiKey: 'smk_' + 'a'.repeat(30), workspaceId: '11111111-2222-3333-4444-555555555555' };

test('stripFrontmatter removes only a leading block', () => {
  assert.equal(stripFrontmatter('---\ntitle: x\n---\nHello'), 'Hello');
  assert.equal(stripFrontmatter('Hello\n---\nnot front matter\n---\n'), 'Hello\n---\nnot front matter\n---\n');
});

test('noteToText prefers the selection and tidies blank lines', () => {
  assert.equal(noteToText('---\na: b\n---\nWhole note', 'Picked'), 'Picked');
  assert.equal(noteToText('---\na: b\n---\nOne\n\n\n\nTwo\n', ''), 'One\n\nTwo');
  assert.equal(noteToText('   ', '  '), '');
});

test('settingsProblem checks key and workspace', () => {
  assert.equal(settingsProblem(good), null);
  assert.match(settingsProblem({ ...good, apiKey: 'nope' })!, /API key/);
  assert.match(settingsProblem({ ...good, workspaceId: 'x' })!, /workspace/i);
});

test('buildDraftBody makes a draft with no accounts', () => {
  assert.deepEqual(buildDraftBody('hi'), { text: 'hi', account_ids: [], media_ids: [], draft: true });
});

test('createDraft sends one authorised POST and returns the id', async () => {
  const calls: any[] = [];
  const req: Requester = async (r) => {
    calls.push(r);
    return { status: 201, json: { post_id: 'p1' } };
  };
  const out = await createDraft(req, good, 'Hello', 'key1');
  assert.equal(out.postId, 'p1');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `${API_URL}/workspaces/${good.workspaceId}/posts`);
  assert.equal(calls[0].headers.Authorization, `Bearer ${good.apiKey}`);
  assert.equal(calls[0].headers['Idempotency-Key'], 'key1');
  assert.equal(JSON.parse(calls[0].body).draft, true);
});

test('createDraft turns API errors into plain messages', async () => {
  const mk = (status: number, json: any): Requester => async () => ({ status, json });
  await assert.rejects(createDraft(mk(401, null), good, 'x', 'k'), /did not accept the API key/);
  await assert.rejects(createDraft(mk(404, null), good, 'x', 'k'), /workspace/);
  await assert.rejects(createDraft(mk(422, { error: { message: 'Too long' } }), good, 'x', 'k'), /Too long/);
  await assert.rejects(createDraft(mk(201, {}), good, 'x', 'k'), /did not return its ID/);
  await assert.rejects(createDraft(mk(201, { id: 'a' }), good, '', 'k'), /no text/);
});
