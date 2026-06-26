const invoiceDate = new Date("2026-06-25T10:49:39.652Z");
const dateFilter = "2026-06-26";
const filterDate = new Date(dateFilter);
filterDate.setHours(0, 0, 0, 0);
const nextDay = new Date(filterDate);
nextDay.setDate(nextDay.getDate() + 1);

const invoiceCreatedOnDate = invoiceDate >= filterDate && invoiceDate < nextDay;
console.log({
  invoiceDate: invoiceDate.toISOString(),
  filterDate: filterDate.toISOString(),
  nextDay: nextDay.toISOString(),
  invoiceCreatedOnDate
});

const invoice = {
  paymentBreakdown: [
    { mode: "Cash", amount: 34497 }
  ]
};

const paymentMadeOnDate = invoice.paymentBreakdown.some((pb) => {
  const pbDate = new Date(pb.date || invoiceDate || new Date());
  console.log("pbDate:", pbDate.toISOString());
  return pbDate >= filterDate && pbDate < nextDay;
});

console.log({ paymentMadeOnDate });
