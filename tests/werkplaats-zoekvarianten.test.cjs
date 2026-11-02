const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../app/mijn-gereedschappen.js'), 'utf8');
const helpers = source.slice(source.indexOf(' const normalize='), source.indexOf(' function searchExcerpt('));
const ranking = source.slice(source.indexOf('   const eligible=q?'), source.indexOf("   list.setAttribute('aria-busy'"));
assert.ok(helpers.includes('function relatedMatch') && ranking.includes('const found='), 'Zoeklogica moet aanwezig zijn');
const context = vm.createContext({});
vm.runInContext(helpers + '\nthis.match = {strictMatch, relatedMatch, fuzzyMatch};', context);
const {strictMatch, relatedMatch, fuzzyMatch} = context.match;

function search(rows, q, tool = '') {
  const buttons = [];
  const sandbox = {
    rows, q, business: () => true, businessTools: [],
    kindFilter: {value: ''}, projectFilter: {value: ''}, toolFilter: {value: tool},
    sourceFilters: {replaceChildren() {}, append(button) {buttons.push(button);}},
    I18n: {t: value => value}, catalog: {Bronnenkast: ['Verzamelen'], Werkbank: ['Schrijven']},
    button: (label, onClick) => ({label, onClick, setAttribute(name, value) {this[name] = value;}}),
    loading: false, kindOf: row => row.item.kind || row.id,
  };
  vm.runInNewContext(helpers + ranking + '\nthis.result = found;', sandbox);
  return {found: Array.from(sandbox.result), buttons};
}
const row = (id, title, text = title) => ({id, title, text, item: {}});

test('schrijfvarianten, korte woorden en alle opgegeven woorden', () => {
  assert.equal(strictMatch('Café self-driving projecten', 'cafe self driving'), true);
  assert.equal(strictMatch('nieuwsbrief ideeën', 'nieuws brief ideeen'), true);
  assert.equal(strictMatch('Café projecten', 'cafe auto'), false);
  assert.equal(strictMatch('klant', 'an'), false);
});

test('verwante begrippen vereisen ook de overige zoekwoorden', () => {
  assert.equal(relatedMatch('Self-driving bedrijven', 'zelfrijdende bedrijven'), true);
  assert.equal(relatedMatch('Autonomous driving voertuigen', 'zelfrijdend bedrijven'), false);
  assert.equal(relatedMatch('automatisch rijden', 'zelfrijdend'), false);
});

test('typefouten zijn beperkt tot één wijziging bij woorden vanaf vijf letters', () => {
  assert.equal(fuzzyMatch('zelfrijdende voertuigen', 'voertuigne'), true);
  assert.equal(fuzzyMatch('zelfrijdende voertuigen', 'voertugne'), false);
  assert.equal(fuzzyMatch('huis', 'huus'), false);
  assert.equal(fuzzyMatch('groene voertuigen', 'blauwe voertugien'), false);
});

test('directe treffers gaan boven verwante en typefouttreffers', () => {
  const rows = [row('Bronnenkast', 'Typefout', 'zelfrijdnd'), row('Werkbank', 'Verwant', 'self-driving'), row('Bronnenkast', 'Direct', 'zelfrijdend')];
  const {found} = search(rows, 'zelfrijdend');
  assert.deepEqual(found.map(r => r.title), ['Direct', 'Verwant', 'Typefout']);
});

test('bronfilters tonen aantallen en begrenzen het resultaat', () => {
  const rows = [row('Bronnenkast', 'Eén', 'zelfrijdend'), row('Werkbank', 'Twee', 'self driving')];
  const {found, buttons} = search(rows, 'zelfrijdend', 'Bronnenkast');
  assert.deepEqual(found.map(r => r.title), ['Eén']);
  assert.deepEqual(buttons.map(b => b.label), ['Alles (2)', 'Verzamelen (1)', 'Schrijven (1)']);
  assert.equal(buttons[1]['aria-pressed'], 'true');
});

test('typefouttreffers worden alleen bij minder dan drie directe of verwante treffers binnen de bron toegevoegd', () => {
  const rows = [row('Werkbank', 'A', 'zelfrijdend'), row('Werkbank', 'B', 'zelfrijdend'), row('Werkbank', 'C', 'zelfrijdend'), row('Bronnenkast', 'D', 'zelfrijdnd')];
  assert.equal(search(rows, 'zelfrijdend').found.some(r => r.title === 'D'), false);
  assert.deepEqual(search(rows, 'zelfrijdend', 'Bronnenkast').found.map(r => r.title), ['D']);
});
