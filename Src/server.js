import express from 'express';
import bodyParser from 'body-parser';
import makeWASocket, { useMultiFileAuthState } from '@adiwajshing/baileys';
import qrcode from 'qrcode-terminal';
import makeWASocket, { useMultiFileAuthState } from '@whiskeysockets/baileys';
import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

let sock;
let messages = [];

async function connectWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');
  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, qr } = update;
    if (qr) {
      console.log('📱 Scan this QR to connect WhatsApp:');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'open') {
      console.log('✅ WhatsApp connected!');
    }
  });

  sock.ev.on('messages.upsert', (m) => {
    const msg = m.messages[0];
    if (!msg.key.fromMe && msg.message?.conversation) {
      messages.push({
        from: msg.key.remoteJid,
        text: msg.message.conversation
      });
      if (messages.length > 10) messages.shift(); // keep last 10
      console.log('📩 New message:', msg.message.conversation);
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

connectWhatsApp();

// API endpoint: root
app.get('/', (req, res) => {
  res.send('🚀 Alfred Bot Backend is running with WhatsApp integration!');
});

// API endpoint: send message
app.post('/send', async (req, res) => {
  try {
    const { number, message } = req.body;
    if (!number || !message) {
      return res.status(400).send({ error: 'number and message are required' });
    }
    const jid = number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
    res.send({ success: true, to: number, message });
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to send message' });
  }
});

// API endpoint: fetch messages
app.get('/messages', (req, res) => {
  res.send(messages);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
