const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');

const PORT = Number(process.env.PORT || 3100);
const BASE = `http://127.0.0.1:${PORT}`;
const API_KEY = process.env.INTERNAL_API_KEY;
if (!API_KEY) throw new Error('INTERNAL_API_KEY is required for QA');

const authHeaders = { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  let body = null;
  const text = await res.text();
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }
  return { status: res.status, body };
}

async function postMock(waId, payload) {
  const { status, body } = await request('/api/mock/message', {
    method: 'POST', headers: authHeaders,
    body: JSON.stringify({ waId, name: 'QA Bot', ...payload })
  });
  assert.equal(status, 200, `mock request failed: ${status} ${JSON.stringify(body)}`);
  assert.equal(body.mode, 'mock');
  assert.ok(Array.isArray(body.replies));
  return body;
}

async function waitForHealth() {
  for (let i = 0; i < 60; i++) {
    try {
      const { status, body } = await request('/health');
      if (status === 200 && body?.status === 'ok') return;
    } catch {}
    await sleep(250);
  }
  throw new Error('Healthcheck did not become ready');
}

async function assertPersisted(lead) {
  const { status, body } = await request(`/api/leads/${lead.id}`, { headers: { Authorization: `Bearer ${API_KEY}` } });
  assert.equal(status, 200);
  assert.equal(body.id, lead.id);
  assert.equal(body.waId, lead.waId);
}

async function runRentEs() {
  const waId = '5215551000001';
  let r = await postMock(waId, { text: 'hola' });
  assert.equal(r.lead.conversationStep, 'LANGUAGE_SELECT');
  r = await postMock(waId, { interactiveId: 'LANG_ES', interactiveTitle: 'Español' });
  assert.equal(r.lead.language, 'es'); assert.equal(r.lead.conversationStep, 'MENU');
  r = await postMock(waId, { interactiveId: 'MENU_RENT', interactiveTitle: 'Renta' });
  assert.equal(r.lead.intent, 'rent'); assert.equal(r.lead.conversationStep, 'RENT_ZONE');
  r = await postMock(waId, { text: 'Puerto Vallarta' });
  r = await postMock(waId, { text: '$25,000 MXN' });
  r = await postMock(waId, { text: '2 recámaras' });
  r = await postMock(waId, { text: '1 noviembre 2026' });
  r = await postMock(waId, { text: '2 personas' });
  r = await postMock(waId, { interactiveId: 'FURNISHED_YES', interactiveTitle: 'Sí' });
  r = await postMock(waId, { interactiveId: 'PETS_NO', interactiveTitle: 'No' });
  assert.equal(r.lead.conversationStep, 'HUMAN_HANDOFF');
  assert.equal(r.lead.status, 'qualified_pending_agent');
  assert.equal(r.lead.zone, 'Puerto Vallarta'); assert.equal(r.lead.bedrooms, 2); assert.equal(r.lead.occupants, 2);
  assert.equal(r.lead.furnished, true); assert.equal(r.lead.pets, false);
  await assertPersisted(r.lead);

  const before = r.lead.updatedAt;
  r = await postMock(waId, { text: 'mensaje que debe quedar silenciado' });
  assert.equal(r.lead.conversationStep, 'HUMAN_HANDOFF');
  r = await postMock(waId, { text: 'BOT' });
  assert.equal(r.lead.conversationStep, 'MENU'); assert.equal(r.lead.status, 'qualifying');
  r = await postMock(waId, { text: 'ASESOR' });
  assert.equal(r.lead.conversationStep, 'HUMAN_HANDOFF');
  r = await postMock(waId, { text: 'BOT' });
  assert.equal(r.lead.conversationStep, 'MENU');
  r = await postMock(waId, { text: 'INICIO' });
  assert.equal(r.lead.conversationStep, 'MENU');
  assert.ok(r.lead.updatedAt >= before);
}

async function runBuyEn() {
  const waId = '5215551000002';
  let r = await postMock(waId, { text: 'hello' });
  r = await postMock(waId, { interactiveId: 'LANG_EN', interactiveTitle: 'English' });
  assert.equal(r.lead.language, 'en');
  r = await postMock(waId, { interactiveId: 'MENU_BUY', interactiveTitle: 'Buy' });
  r = await postMock(waId, { text: 'Nuevo Vallarta' });
  r = await postMock(waId, { text: 'USD 450,000' });
  r = await postMock(waId, { interactiveId: 'PROPERTY_APARTMENT', interactiveTitle: 'Apartment' });
  r = await postMock(waId, { text: '3 bedrooms' });
  r = await postMock(waId, { interactiveId: 'PURPOSE_INVEST', interactiveTitle: 'Investment' });
  r = await postMock(waId, { text: 'Within 6 months' });
  assert.equal(r.lead.intent, 'buy'); assert.equal(r.lead.language, 'en');
  assert.equal(r.lead.propertyType, 'apartment'); assert.equal(r.lead.purchasePurpose, 'invest');
  assert.equal(r.lead.conversationStep, 'HUMAN_HANDOFF'); assert.equal(r.lead.status, 'qualified_pending_agent');
  await assertPersisted(r.lead);
  r = await postMock(waId, { text: 'BOT' });
  assert.equal(r.lead.conversationStep, 'MENU');
}

async function runInsurance() {
  const waId = '5215551000003';
  let r = await postMock(waId, { text: 'hola' });
  r = await postMock(waId, { interactiveId: 'LANG_ES', interactiveTitle: 'Español' });
  r = await postMock(waId, { interactiveId: 'MENU_INSURANCE', interactiveTitle: 'Seguros' });
  r = await postMock(waId, { interactiveId: 'INSURANCE_HOME', interactiveTitle: 'Hogar' });
  r = await postMock(waId, { text: 'Cliente QA' });
  r = await postMock(waId, { text: 'Bahía de Banderas' });
  r = await postMock(waId, { text: 'ESTE MISMO' });
  r = await postMock(waId, { text: 'Casa de 3 recámaras, valor aproximado 6 M MXN' });
  assert.equal(r.lead.intent, 'insurance'); assert.equal(r.lead.insuranceType, 'home');
  assert.equal(r.lead.insurancePhone, waId); assert.equal(r.lead.conversationStep, 'HUMAN_HANDOFF');
  await assertPersisted(r.lead);
}

async function runInvalidInputSecurity() {
  let r = await request('/api/mock/message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(r.status, 401);
  r = await request('/api/mock/message', { method: 'POST', headers: authHeaders, body: JSON.stringify({ waId: '123', text: 'x' }) });
  assert.equal(r.status, 400);
  r = await request('/api/mock/message', { method: 'POST', headers: authHeaders, body: JSON.stringify({ waId: '5215551000999' }) });
  assert.equal(r.status, 400);
}

async function runQueueDedupeAndRetry() {
  const { prisma } = require('../dist/db/prisma.js');
  const { enqueueInboundMessages, runInboundQueueSweep } = require('../dist/services/inboundQueue.service.js');
  const dupId = `wamid.qa.dup.${Date.now()}`;
  const msg = { id: dupId, from: '5215551000004', timestamp: String(Math.floor(Date.now()/1000)), type: 'text', text: { body: 'hola' } };
  await enqueueInboundMessages([msg], 'Queue QA');
  await enqueueInboundMessages([msg], 'Queue QA');
  assert.equal(await prisma.inboundMessageJob.count({ where: { waMessageId: dupId } }), 1);
  await runInboundQueueSweep();
  assert.equal(await prisma.processedMessage.count({ where: { waMessageId: dupId } }), 1);
  assert.equal(await prisma.inboundMessageJob.count({ where: { waMessageId: dupId } }), 0);
  await enqueueInboundMessages([msg], 'Queue QA');
  await runInboundQueueSweep();
  assert.equal(await prisma.processedMessage.count({ where: { waMessageId: dupId } }), 1);
  assert.equal(await prisma.inboundMessageJob.count({ where: { waMessageId: dupId } }), 0);

  const retryId = `wamid.qa.retry.${Date.now()}`;
  const bad = { id: retryId, timestamp: String(Math.floor(Date.now()/1000)), type: 'text', text: { body: 'force retry' } };
  await enqueueInboundMessages([bad], 'Retry QA');
  await runInboundQueueSweep();
  const retryJob = await prisma.inboundMessageJob.findUnique({ where: { waMessageId: retryId } });
  assert.ok(retryJob, 'failed job must remain queued');
  assert.equal(retryJob.attempts, 1);
  assert.equal(retryJob.failedAt, null);
  assert.ok(retryJob.nextAttemptAt.getTime() > Date.now());
  await prisma.inboundMessageJob.delete({ where: { waMessageId: retryId } });
}

async function cleanup() {
  const { prisma } = require('../dist/db/prisma.js');
  const ids = ['5215551000001','5215551000002','5215551000003','5215551000004'];
  await prisma.lead.deleteMany({ where: { waId: { in: ids } } });
  await prisma.processedMessage.deleteMany({ where: { waMessageId: { startsWith: 'wamid.qa.' } } });
  await prisma.inboundMessageJob.deleteMany({ where: { waMessageId: { startsWith: 'wamid.qa.' } } });
  await prisma.$disconnect();
}

(async () => {
  const child = spawn(process.execPath, ['dist/server.js'], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'test', WHATSAPP_MODE: 'mock', LOG_LEVEL: 'warn' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let stderr = '';
  child.stderr.on('data', d => { stderr += d.toString(); });
  try {
    await waitForHealth();
    await runInvalidInputSecurity();
    await runRentEs();
    await runBuyEn();
    await runInsurance();
    await runQueueDedupeAndRetry();
    console.log('QA PASS: ES/EN, rent/buy/insurance, persistence, handoff/reactivation, invalid inputs, dedupe and retry scheduling');
  } finally {
    child.kill('SIGTERM');
    await Promise.race([new Promise(r => child.once('exit', r)), sleep(3000)]);
    await cleanup();
  }
})().catch(err => {
  console.error('QA FAIL:', err);
  process.exitCode = 1;
});
