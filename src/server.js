import express from "express";
import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import QRCode from "qrcode";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", async (req, res) => {
  // Initialize WhatsApp auth
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const sock = makeWASocket({ auth: state });

  // Save credentials on updates
  sock.ev.on("creds.update", saveCreds);

  // Listen for connection updates
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Show QR code in browser
    if (qr) {
      QRCode.toDataURL(qr).then((url) => {
        res.send(`<h1>Scan QR Code</h1><img src="${url}" />`);
      }).catch(err => {
        res.status(500).send("Error generating QR code");
        console.error(err);
      });
    }

    if (connection === "close") {
      console.log("Disconnected:", lastDisconnect?.error);
    } else if (connection === "open") {
      console.log("Connected to WhatsApp!");
    }
  });
});

// Start the Express server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
