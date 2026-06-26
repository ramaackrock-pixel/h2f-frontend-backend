import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });
const apiUrl = process.env.WHATSAPP_API_URL || 'https://wtservices.ackrock.com/api/send/whatsapp';
const apiSecret = process.env.WHATSAPP_API_SECRET || process.env.WHATSAPP_SECRET || '';
const accountId = process.env.WHATSAPP_API_ACCOUNT || process.env.WHATSAPP_ACCOUNT_ID || process.env.WHATSAPP_ACCOUNT || '';

console.log('API URL:', apiUrl);
console.log('API Secret (truncated):', apiSecret ? apiSecret.substring(0, 5) + '...' : 'not set');
console.log('Account ID (truncated):', accountId ? accountId.substring(0, 5) + '...' : 'not set');

function normalizeRecipient(recipient) {
    let num = String(recipient).replace(/\D/g, '').trim();
    if (num.length === 10) {
        num = '91' + num;
    } else if (!num.startsWith('91') && num.length > 10) {
        num = '91' + num.slice(-10);
    }
    // Notice: I added the '+' prefix here to see if Ackrock requires it
    return num ? '+' + num : recipient;
}

async function testSend() {
    // Testing with the Rama Subramanian number that failed in the screenshot
    const recipient = '+916369115525';
    const message = 'Test message from Antigravity debugger (Testing with + prefix)';

    const form = new FormData();
    form.append('secret', apiSecret);
    form.append('account', accountId);
    form.append('recipient', normalizeRecipient(recipient));
    form.append('type', 'text');
    form.append('message', message);

    try {
        console.log('Sending request to WhatsApp API with recipient:', normalizeRecipient(recipient));
        const response = await axios.post(apiUrl, form, {
            headers: form.getHeaders(),
            maxBodyLength: Infinity,
        });
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error occurred:');
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error message:', error.message);
        }
    }
}
testSend();
