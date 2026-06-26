import http from 'http';

const dateFilter = "2026-06-26";
const filterDate = new Date(dateFilter);
filterDate.setHours(0, 0, 0, 0);
const nextDay = new Date(filterDate);
nextDay.setDate(nextDay.getDate() + 1);

const req = http.request('http://localhost:4042/api/v1/billing', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
        const json = JSON.parse(data);
        const invoicesData = json.invoices;
        
        console.log("Total invoices:", invoicesData.length);
        
        const filteredInvoices = invoicesData.filter(invoice => {
            const invoiceDate = new Date(invoice.date || invoice.createdAt || new Date());
            
            const invoiceCreatedOnDate = invoiceDate >= filterDate && invoiceDate < nextDay;
            const paymentMadeOnDate = invoice.paymentBreakdown && invoice.paymentBreakdown.some((pb) => {
                const pbDate = new Date(pb.date || invoice.date || invoice.createdAt || new Date());
                return pbDate >= filterDate && pbDate < nextDay;
            });
            
            const matchesTime = invoiceCreatedOnDate || paymentMadeOnDate;
            
            if (matchesTime && invoice.id === '6a3d07c3a874bfa4eec1ebd0' || invoice._id === '6a3d07c3a874bfa4eec1ebd0') {
               console.log("MATCHED INVOICE:", invoice._id);
               console.log("invoiceDate:", invoiceDate.toISOString());
               console.log("filterDate:", filterDate.toISOString(), "nextDay:", nextDay.toISOString());
               console.log("invoiceCreatedOnDate:", invoiceCreatedOnDate);
               console.log("paymentBreakdown:", invoice.paymentBreakdown);
               invoice.paymentBreakdown.forEach(pb => {
                   const pbDate = new Date(pb.date || invoice.date || invoice.createdAt || new Date());
                   console.log("pbDate calculated:", pbDate.toISOString(), "matches:", pbDate >= filterDate && pbDate < nextDay);
               });
            }
            return matchesTime;
        });
        
        console.log("Filtered count for", dateFilter, ":", filteredInvoices.length);
    } catch(e) {
        console.error("Error parsing JSON:", e, data.substring(0, 100));
    }
  });
});
req.end();
