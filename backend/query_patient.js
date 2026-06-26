import mongoose from 'mongoose';
import { Patient } from './src/models/patient.model.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const patient = await Patient.findOne({ name: /Rama subramanian/i });
    console.log("Patient whatsappConsent:", patient ? patient.whatsappConsent : 'Not Found');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
