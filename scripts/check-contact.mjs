import test from 'node:test';
import assert from 'node:assert/strict';
import { sendContact } from '../src/lib/contact.mjs';
const endpoint = 'https://formsubmit.co/ajax/test@example.com';
const values = { email: 'sender@example.com', phone: '+54 9 11 5555 0000', message: 'Consulta de prueba', _honey: '' };
const reply = (result, status = 200) => async () => new Response(JSON.stringify(result), { status });

test('sends expected fields and preserves the abort signal', async () => {
 const controller = new AbortController();
 let called = false;
 const fetcher = async (url, request) => {
  called = true;
  assert.equal(url, endpoint);
  assert.equal(request.method, 'POST');
  assert.equal(request.headers.Accept, 'application/json');
  assert.deepEqual(JSON.parse(request.body), values);
  assert.equal(request.signal, controller.signal);
  return new Response(JSON.stringify({ success: 'true', message: 'Form submitted successfully' }));
 };
 assert.equal(await sendContact(endpoint, values, { fetcher, signal: controller.signal }), 'sent');
 assert(called);
});
test('accepts a boolean success response', async () => {
 assert.equal(await sendContact(endpoint, values, { fetcher: reply({ success: true }) }), 'sent');
});
test('activation is not reported as a delivered enquiry', async () => {
 assert.equal(await sendContact(endpoint, values, { fetcher: reply({ success: 'true', message: 'Please activate your form by confirming your email' }) }), 'activation');
 assert.equal(await sendContact(endpoint, values, { fetcher: reply({ success: 'false', message: "This form needs Activation. We've sent you an email containing an 'Activate Form' link." }) }), 'activation');
});
test('HTTP failures, false success, missing success and invalid JSON reject', async () => {
 for (const fetcher of [reply({ success: true }, 429), reply({ success: false }), reply({ success: 'false' }), reply({}), async () => new Response('<html>Unavailable</html>')]) {
  await assert.rejects(sendContact(endpoint, values, { fetcher }));
 }
});
test('network failure and abort propagate instead of claiming success', async () => {
 for (const error of [new TypeError('Network error'), new DOMException('Aborted', 'AbortError')]) {
  await assert.rejects(sendContact(endpoint, values, { fetcher: async () => { throw error; } }), e => e === error);
 }
});
