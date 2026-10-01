import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { Script } from 'node:vm';
import ts from 'typescript';

const layout = await readFile(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');
const scripts = [...layout.matchAll(/<script\s*>([\s\S]*?)<\/script>/g)];
assert(scripts.length > 0, 'BaseLayout debe incluir su script de interacción.');
const { outputText, diagnostics = [] } = ts.transpileModule(scripts.at(-1)[1], {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  reportDiagnostics: true,
});
assert.equal(diagnostics.filter((item) => item.category === ts.DiagnosticCategory.Error).length, 0,
  'El script de interacción debe ser TypeScript válido.');
const interactionScript = new Script(outputText, { filename: 'BaseLayout.analytics.js' });

class Element {
  constructor(dataset = {}) {
    this.dataset = dataset;
    this.hidden = false;
    this.listeners = new Map();
    this.focused = false;
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  click() {
    for (const listener of this.listeners.get('click') ?? []) {
      listener({ type: 'click', target: this, currentTarget: this });
    }
  }

  focus() { this.focused = true; }
}

function visit({ withBanner = true, storedConsent = null, storageUnavailable = false, doNotTrack = '0' } = {}) {
  const measurementId = 'G-TEST1234';
  const buttons = { denied: new Element({ consent: 'denied' }), granted: new Element({ consent: 'granted' }) };
  const preferences = new Element();
  const contacts = { whatsapp: new Element({ contact: 'whatsapp' }), email: new Element({ contact: 'email' }) };
  const banner = withBanner ? new Element({ gaId: measurementId }) : null;
  if (banner) {
    banner.hidden = true;
    banner.querySelectorAll = (selector) => {
      assert.equal(selector, '[data-consent]');
      return Object.values(buttons);
    };
    banner.querySelector = (selector) => {
      assert.equal(selector, 'button');
      return buttons.denied;
    };
  }
  const saved = new Map(storedConsent === null ? [] : [['lg-analytics-consent', storedConsent]]);
  const networkRequests = [];
  const browserWindow = {
    location: {
      origin: 'https://lgdesign.com.ar',
      pathname: '/servicios/diseno-desarrollo-web/',
      search: '?utm_source=demo&email=cliente%40example.com',
      hash: '#contacts',
    },
  };
  const document = {
    querySelector(selector) {
      if (selector === '#analytics-consent') return banner;
      if (selector === '[data-analytics-preferences]') return preferences;
      throw new Error(`Selector de documento inesperado: ${selector}`);
    },
    querySelectorAll(selector) {
      assert.equal(selector, '[data-contact]');
      return Object.values(contacts);
    },
    createElement(tagName) { return { tagName }; },
    head: {
      // Registrar la solicitud observable sin cargar ni ejecutar Google Analytics.
      appendChild(element) {
        if (element.src) networkRequests.push({ tagName: element.tagName, src: element.src, async: element.async });
        return element;
      },
    },
  };
  const localStorage = {
    getItem(key) {
      if (storageUnavailable) throw new Error('Storage unavailable');
      return saved.get(key) ?? null;
    },
    setItem(key, value) {
      if (storageUnavailable) throw new Error('Storage unavailable');
      saved.set(key, value);
    },
  };
  interactionScript.runInNewContext({ window: browserWindow, navigator: { doNotTrack }, document, localStorage }, { timeout: 1000 });
  const calls = () => Array.from(browserWindow.dataLayer ?? [], (entry) => Array.from(entry));
  const contactEvents = () => calls().filter(([command, name]) => command === 'event' && name === 'contact_click');
  return { banner, buttons, preferences, contacts, saved, networkRequests, browserWindow, measurementId, calls, contactEvents };
}

test('sin ID de analytics y sin banner no carga recursos ni registra contactos', () => {
  const page = visit({ withBanner: false });
  page.contacts.whatsapp.click();
  page.contacts.email.click();
  assert.equal(page.networkRequests.length, 0);
  assert.equal(page.calls().length, 0);
  assert.equal(page.saved.size, 0);
});

test('sin consentimiento previo muestra la elección sin cargar Analytics', () => {
  const page = visit();
  assert.equal(page.banner.hidden, false);
  page.contacts.whatsapp.click();
  assert.equal(page.networkRequests.length, 0);
  assert.equal(page.calls().length, 0);
});

test('rechazar guarda la elección y no genera solicitudes ni eventos', () => {
  const page = visit();
  page.buttons.denied.click();
  page.contacts.whatsapp.click();
  assert.equal(page.saved.get('lg-analytics-consent'), 'denied');
  assert.equal(page.banner.hidden, true);
  assert.equal(page.networkRequests.length, 0);
  assert.equal(page.calls().length, 0);
});

test('aceptar carga un único script y mide el canal sin incluir querystring', () => {
  const page = visit();
  page.buttons.granted.click();
  page.buttons.granted.click();
  assert.equal(page.saved.get('lg-analytics-consent'), 'granted');
  assert.equal(page.banner.hidden, true);
  assert.deepEqual(page.networkRequests, [{
    tagName: 'script',
    src: `https://www.googletagmanager.com/gtag/js?id=${page.measurementId}`,
    async: true,
  }]);
  const configurations = page.calls().filter(([command]) => command === 'config');
  assert.equal(configurations.length, 1);
  assert.equal(configurations[0][1], page.measurementId);
  assert.equal(configurations[0][2].page_location, 'https://lgdesign.com.ar/servicios/diseno-desarrollo-web/');
  assert.equal(configurations[0][2].allow_google_signals, false);
  assert.equal(configurations[0][2].allow_ad_personalization_signals, false);
  page.contacts.whatsapp.click();
  page.contacts.email.click();
  assert.deepEqual(page.contactEvents().map((call) => call[2].contact_method), ['whatsapp', 'email']);
  for (const call of page.contactEvents()) assert.deepEqual(Object.keys(call[2]), ['contact_method']);
});

test('revocar consentimiento bloquea contactos y volver a aceptar los reactiva sin duplicar carga', () => {
  const page = visit();
  page.buttons.granted.click();
  page.contacts.whatsapp.click();
  assert.equal(page.contactEvents().length, 1);
  page.preferences.click();
  assert.equal(page.banner.hidden, false);
  assert.equal(page.buttons.denied.focused, true);
  page.buttons.denied.click();
  assert.equal(page.saved.get('lg-analytics-consent'), 'denied');
  assert.equal(page.browserWindow[`ga-disable-${page.measurementId}`], true);
  page.contacts.whatsapp.click();
  page.contacts.email.click();
  assert.equal(page.contactEvents().length, 1);
  page.preferences.click();
  page.buttons.granted.click();
  assert.equal(page.saved.get('lg-analytics-consent'), 'granted');
  assert.equal(page.browserWindow[`ga-disable-${page.measurementId}`], false);
  page.contacts.email.click();
  assert.equal(page.contactEvents().length, 2);
  assert.equal(page.contactEvents().at(-1)[2].contact_method, 'email');
  assert.equal(page.networkRequests.length, 1);
  assert.equal(page.calls().filter(([command]) => command === 'config').length, 1);
});

test('respeta las preferencias guardadas entre visitas', () => {
  const denied = visit({ storedConsent: 'denied' });
  assert.equal(denied.banner.hidden, true);
  assert.equal(denied.networkRequests.length, 0);
  const granted = visit({ storedConsent: 'granted' });
  assert.equal(granted.banner.hidden, true);
  assert.equal(granted.networkRequests.length, 1);
  granted.contacts.email.click();
  assert.equal(granted.contactEvents().length, 1);
});

test('storage inaccesible no provoca errores ni carga sin aceptación', () => {
  const page = visit({ storageUnavailable: true });
  assert.equal(page.networkRequests.length, 0);
  assert.doesNotThrow(() => page.buttons.denied.click());
  assert.equal(page.networkRequests.length, 0);
  assert.doesNotThrow(() => page.buttons.granted.click());
  assert.equal(page.networkRequests.length, 1);
  page.contacts.whatsapp.click();
  assert.equal(page.contactEvents().length, 1);
});

test('Do Not Track evita la carga automática cuando no hay consentimiento previo', () => {
  for (const storageUnavailable of [false, true]) {
    const page = visit({ doNotTrack: '1', storageUnavailable });
    assert.equal(page.banner.hidden, true);
    assert.equal(page.networkRequests.length, 0);
    page.contacts.email.click();
    assert.equal(page.contactEvents().length, 0);
  }
});
