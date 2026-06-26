import mongoose from 'mongoose';
import { Appointment } from './src/models/appointment.model.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const appts = await Appointment.find({ patientName: /Rama subramanian/i }).sort({ createdAt: -1 }).limit(1);
    console.log(JSON.stringify(appts, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
