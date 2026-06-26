import axios from 'axios';
import FormData from 'form-data';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    try {
        const form = new FormData();
        form.append('secret', process.env.WHATSAPP_API_SECRET);
        form.append('account', process.env.WHATSAPP_API_ACCOUNT);
        form.append('recipient', '916369115525');
        form.append('type', 'text');
        form.append('message', 'Test message from backend');

        const res = await axios.post("https://wtservices.ackrock.com/api/send/whatsapp", form, {
            headers: form.getHeaders(),
        });
        console.log("Success:", res.data);
    } catch (e) {
        if (e.response) {
            console.error("Error:", e.response.status, e.response.data);
        } else {
            console.error("Error:", e.message);
        }
    }
}
test();
