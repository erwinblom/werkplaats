'use strict';
window.BtwKwartaal = (() => {
 const key = date => date.slice(0, 4) + '-Q' + (Math.floor((Number(date.slice(5, 7)) - 1) / 3) + 1);
 function summary(book, quarter) {
  const invoices = (book.invoices || []).filter(i => key(i.date) === quarter);
  const excludedInvoices = invoices.filter(i => i.vatMode === 'kor' || i.vatMode === 'vrijgesteld');
  const taxableInvoices = invoices.filter(i => !excludedInvoices.includes(i));
  const entries = book.entries.filter(i => !i.sourceInvoiceId && key(i.vatDate || i.date) === quarter);
  const manual = entries.filter(i => i.vatCents !== null && i.vatCents !== undefined);
  const sales = taxableInvoices.reduce((n, i) => n + i.netCents, 0) + manual.filter(i => i.type === 'income').reduce((n, i) => n + i.cents - i.vatCents, 0);
  const charged = taxableInvoices.reduce((n, i) => n + i.vatCents, 0) + manual.filter(i => i.type === 'income').reduce((n, i) => n + i.vatCents, 0);
  const deductible = manual.filter(i => i.type === 'expense').reduce((n, i) => n + i.vatCents, 0);
  const unchecked = entries.filter(i => i.vatCents === null || i.vatCents === undefined);
  const noReceipt = manual.filter(i => i.type === 'expense' && i.vatCents > 0 && !i.receipt);
  const rates = {};const rate=row=>rates[row.rate]||(rates[row.rate]={sales:0,vat:0});
  const unclassifiedInvoices = taxableInvoices.filter(i => !i.vatLines || i.vatMode === 'unknown');
  for (const i of taxableInvoices) for (const line of i.vatLines || []) {
   rate(line).sales += line.netCents;
   rate(line).vat += line.vatCents;
  }
  const unclassifiedIncome = manual.filter(i => i.type === 'income' && (i.vatRate === null || i.vatRate === undefined));
  for (const i of manual.filter(i => i.type === 'income' && i.vatRate !== null && i.vatRate !== undefined)) {
   rate({rate:i.vatRate}).sales += i.cents - i.vatCents;
   rate({rate:i.vatRate}).vat += i.vatCents;
  }
  return {invoices, entries, sales, charged, deductible, difference: charged - deductible, unchecked, noReceipt, rates, unclassifiedInvoices, unclassifiedIncome, excludedInvoices};
 }
 return {key, summary};
})();
