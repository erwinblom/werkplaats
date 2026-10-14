const assert=require('node:assert/strict');const F=require('../app/feedback.js');
const ctx={tool:'Doen',view:'Nieuwe taak'};
for(const kind of ['Bug','Request','Extension']){const s=F.shareLinks(kind,'Eigen tekst: café & links\nhttps://example.com/?a=1&b=2',ctx);const mail=new URL(s.mail);assert.equal(mail.pathname,'erwblo@gmail.com');assert.equal(mail.searchParams.get('body'),s.body);assert.ok(s.body.includes('Eigen tekst: café & links'));const git=new URL(s.github);assert.equal(git.hostname,'github.com');assert.equal(git.searchParams.get('body'),s.body);assert.ok(s.body.includes(ctx.tool));}
const s=F.shareLinks('Bug','x'.repeat(10000),ctx);assert.ok(s.body.length>10000);assert.ok(s.mail.length<500);assert.ok(s.github.length<500);assert.ok(F.markdown({created:'2026-10-14'},[{tool:'Doen',kind:'Bug',created:'2026',text:'Oude opmerking'}]).includes('Oude opmerking'));
console.log('PASS: three share routes, exact email recipient, escaped text and URLs, full preview, bounded long links, old feedback export retained.');

const unicode=F.shareLinks('Bug','😀'.repeat(1000),ctx);assert.ok(unicode.mail.length<500);assert.ok(unicode.github.length<500);assert.ok(unicode.body.includes('😀'));

assert.equal(F.toolFor('/Apps/Abonnementen/Start%20Abonnementen.html'),'Abonnementen');
