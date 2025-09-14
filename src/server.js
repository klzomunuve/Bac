import express from "express";
import makeWASocket, { useMultiFileAuthState } from "@whiskeysockets/baileys";
import QRCode from "qrcode-terminal";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("WhatsApp bot is running!");
});

// Example: initialize Baileys socket
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const sock = makeWASocket({
    auth: state,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      console.log("Disconnected", lastDisconnect.error);
    } else if (connection === "open") {
      console.log("Connected to WhatsApp!");
    }
  });
}

startBot();

app.listen(3000, () => console.log("Server running on port 3000"));
