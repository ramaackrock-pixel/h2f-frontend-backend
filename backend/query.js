import mongoose from "mongoose";
import { Billing } from "./src/models/billing.model.js";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const invoices = await Billing.find({ "patientName": "Rama subramanian" }).sort({ createdAt: -1 }).limit(5);
    console.log(JSON.stringify(invoices.map(i => ({
        id: i._id,
        date: i.date,
        createdAt: i.createdAt,
        paymentBreakdown: i.paymentBreakdown
    })), null, 2));
    mongoose.disconnect();
});
