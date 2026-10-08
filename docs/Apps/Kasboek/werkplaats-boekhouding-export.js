(function(root,factory){
 const api=factory();
 if(typeof window!=='undefined')root.WerkplaatsBoekhoudingExport=api;
 else if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const safe=value=>{let text=String(value??'');if(/^[\s]*[=+@-]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"'};
 const csv=rows=>'\uFEFF'+rows.map(row=>row.map(safe).join(';')).join('\r\n')+'\r\n';
 const euro=cents=>(Number(cents||0)/100).toFixed(2);
 const rate=value=>value===null||value===undefined?'':Number(value)/100;
 const paidDate=(invoice,entries)=>entries.filter(entry=>entry.sourceInvoiceId===invoice.sourceInvoiceId).map(entry=>entry.date).sort().at(-1)||'';
 const incomeRows=data=>{
  const rows=[['Datum','Klant','Omschrijving','Factuurnummer','Btw-tarief','Excl. btw','Btw','Incl. btw','Betaaldatum','Notitie']];
  for(const invoice of data.invoices||[]){
   const lines=invoice.vatLines?.length?invoice.vatLines:[{rate:invoice.vatCents&&invoice.netCents?Math.round(invoice.vatCents/invoice.netCents*100):0,netCents:invoice.netCents,vatCents:invoice.vatCents}];
   for(const line of lines)rows.push([invoice.date,invoice.customer,invoice.title+(lines.length>1?' · '+line.rate+'% btw':''),invoice.number,rate(line.rate),euro(line.netCents),euro(line.vatCents),euro(line.netCents+line.vatCents),paidDate(invoice,data.entries||[]),invoice.kind==='credit'?'Credit op '+invoice.creditFor:'']);
  }
  for(const entry of (data.entries||[]).filter(item=>item.type==='income'&&!item.sourceInvoiceId)){const vat=entry.vatCents||0;rows.push([entry.vatDate||entry.date,entry.party,entry.description,'',rate(entry.vatRate),euro(entry.cents-vat),euro(vat),euro(entry.cents),entry.date,entry.receipt?.name?'Bon: '+entry.receipt.name:'Losse ontvangst']);}
  return rows;
 };
 const expenseRows=data=>[['Datum','Leverancier','Omschrijving','Categorie','Incl. btw','Btw','Excl. btw','Betaaldatum','Bon','Notitie'],...(data.entries||[]).filter(item=>item.type==='expense').map(entry=>{const vat=entry.vatCents||0;return [entry.vatDate||entry.date,entry.party,entry.description,entry.category||'',euro(entry.cents),euro(vat),euro(entry.cents-vat),entry.date,entry.receipt?.name||'',''];})];
 function build(data){const income=incomeRows(data),expenses=expenseRows(data);return {incomeCsv:csv(income),expenseCsv:csv(expenses),incomeCount:income.length-1,expenseCount:expenses.length-1};}
 return {build};
});
