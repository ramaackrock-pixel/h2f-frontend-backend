import mongoose from 'mongoose';
import { Appointment } from './src/models/appointment.model.js';
import { Patient } from './src/models/patient.model.js';
import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const appointment = await Appointment.findOne({ patientName: /Rama subramanian/i }).sort({ createdAt: -1 });
    if (!appointment) return console.log("No appointment found");
    
    let recipientPhone = (appointment.details?.phone || '').replace(/\D/g, '');
    if (recipientPhone && !recipientPhone.startsWith('91')) {
        recipientPhone = `91${recipientPhone}`;
    }
    if (!recipientPhone) recipientPhone = '919385500546';

    const formattedDate = appointment.appointmentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const messageText = `Hello ${appointment.patientName},\n\nYour appointment with ${appointment.therapistName} at ${appointment.branch} has been successfully scheduled for ${formattedDate} at ${appointment.time}.\n\nThank you,\nH2F Rehab 🚀`;

    console.log("Sending to:", recipientPhone);
    console.log("Message:", messageText);

    try {
        const form = new FormData();
        form.append('secret', process.env.WHATSAPP_API_SECRET);
        form.append('account', process.env.WHATSAPP_API_ACCOUNT);
        form.append('recipient', recipientPhone);
        form.append('type', 'text');
        form.append('message', messageText);

        const res = await axios.post("https://wtservices.ackrock.com/api/send/whatsapp", form, {
            headers: form.getHeaders(),
        });
        console.log("WhatsApp message sent successfully!", res.data);
    } catch (e) {
        if (e.response) console.error("API Error:", e.response.status, e.response.data);
        else console.error("Error:", e.message);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
