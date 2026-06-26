import mongoose from "mongoose";
import { Billing } from "./src/models/billing.model.js";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const invoicesData = await Billing.find({ "patientName": "Rama subramanian" }).sort({ createdAt: -1 }).limit(10);
    
    const dateFilter = "2026-06-26";
    const filterDate = new Date(dateFilter);
    filterDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(filterDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const filteredInvoices = invoicesData.filter(invoice => {
        const invoiceDate = new Date(invoice.date || invoice.createdAt || new Date());
        
        const invoiceCreatedOnDate = invoiceDate >= filterDate && invoiceDate < nextDay;
        const paymentMadeOnDate = invoice.paymentBreakdown && invoice.paymentBreakdown.some((pb) => {
            const pbDate = new Date(pb.date || invoice.date || invoice.createdAt || new Date());
            return pbDate >= filterDate && pbDate < nextDay;
        });
        
        const matchesTime = invoiceCreatedOnDate || paymentMadeOnDate;
        
        if (invoice._id.toString() === '6a3d07c3a874bfa4eec1ebd0') {
           console.log("MATCHED INVOICE:", invoice._id);
           console.log("invoiceDate:", invoiceDate.toISOString());
           console.log("filterDate:", filterDate.toISOString(), "nextDay:", nextDay.toISOString());
           console.log("invoiceCreatedOnDate:", invoiceCreatedOnDate);
           console.log("paymentBreakdown:", JSON.stringify(invoice.paymentBreakdown));
           invoice.paymentBreakdown.forEach(pb => {
               const pbDate = new Date(pb.date || invoice.date || invoice.createdAt || new Date());
               console.log("pbDate calculated:", pbDate.toISOString(), "matches:", pbDate >= filterDate && pbDate < nextDay);
           });
           console.log("matchesTime:", matchesTime);
        }
        return matchesTime;
    });
    
    console.log("Filtered count for", dateFilter, ":", filteredInvoices.length);
    mongoose.disconnect();
});
