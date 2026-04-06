require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const bodyParser = require('body-parser');
const OpenAI = require('openai');
const fs = require('fs');
const { Readable } = require('stream');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/five9ai', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const callLogSchema = new mongoose.Schema({
  contactId: String,
  agentId: String,
  recordingId: String,
  transcript: String,
  sentiment: String,
  score: Number,
  tip: String,
  tags: [String],
  timestamp: Date,
});
const CallLog = mongoose.model('CallLog', callLogSchema);

const contactSchema = new mongoose.Schema({
  contactId: String,
  name: String,
  email: String,
  phone: String,
  lastSentiment: String,
  lastScore: Number,
  lastTags: [String],
  lastTip: String,
  lastInteraction: Date,
});
const Contact = mongoose.model('Contact', contactSchema);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function getDicaDeAtendimento(sentimento) {
  switch (sentimento) {
    case 'negativo':
      return 'Seja calmo, escute atentamente e evite interromper.';
    case 'positivo':
      return 'Mantenha o bom atendimento e reforce soluções.';
    case 'neutro':
    default:
      return 'Conduza a conversa com empatia e clareza.';
  }
}

async function transcribeAudioFromBuffer(buffer) {
  const stream = Readable.from(buffer);
  const response = await openai.audio.transcriptions.create({
    file: stream,
    model: 'whisper-1',
  });
  return response.text;
}

async function analyzeSentiment(text) {
  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: 'Classifique o sentimento do cliente como positivo, negativo ou neutro. Dê também uma pontuação de 0 a 100. Responda no formato: sentimento:positivo\npontuacao:85' },
      { role: 'user', content: text },
    ],
    model: 'gpt-3.5-turbo',
  });
  const lines = completion.choices[0].message.content.split('\n');
  const sentimento = lines[0].split(':')[1]?.trim().toLowerCase();
  const score = parseInt(lines[1].split(':')[1]);
  return { sentimento, score };
}

async function extractTags(text) {
  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: 'Extraia até 5 palavras-chave principais do texto, como se fossem tags, separadas por vírgula.' },
      { role: 'user', content: text },
    ],
    model: 'gpt-3.5-turbo',
  });
  return completion.choices[0].message.content.split(',').map(tag => tag.trim().toLowerCase());
}

async function fetchRecordingUrl(agentId, recordingId) {
  const url = `https://app.five9.com/agents/${agentId}/recordings/${recordingId}`;
  const resp = await axios.get(url, {
    auth: {
      username: process.env.FIVE9_USER,
      password: process.env.FIVE9_PASS,
    },
    responseType: 'arraybuffer',
  });
  return resp.data;
}

app.post('/webhook/five9', async (req, res) => {
  const { contactId, recordingId, agentId } = req.body;
  try {
    const audioBuffer = await fetchRecordingUrl(agentId, recordingId);
    const transcript = await transcribeAudioFromBuffer(audioBuffer);
    const { sentimento, score } = await analyzeSentiment(transcript);
    const tags = await extractTags(transcript);
    const tip = getDicaDeAtendimento(sentimento);

    const log = await CallLog.create({ contactId, agentId, recordingId, transcript, sentimento, score, tags, tip, timestamp: new Date() });

    const contact = await Contact.findOneAndUpdate(
      { contactId },
      {
        lastSentiment: sentimento,
        lastScore: score,
        lastTags: tags,
        lastTip: tip,
        lastInteraction: new Date(),
      },
      { upsert: true, new: true }
    );

    io.emit('cliente-avaliado', { contactId, sentimento, score, tags, tip });
    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro no processamento');
  }
});

app.get('/api/client-summary/:contactId', async (req, res) => {
  const contact = await Contact.findOne({ contactId: req.params.contactId });
  if (!contact) return res.status(404).send('Sem dados');
  res.send({
    sentiment: contact.lastSentiment,
    score: contact.lastScore,
    tags: contact.lastTags,
    dica: contact.lastTip,
  });
});

app.get('/api/client-history/:contactId', async (req, res) => {
  const logs = await CallLog.find({ contactId: req.params.contactId }).sort({ timestamp: -1 });
  res.send(logs);
});

server.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});