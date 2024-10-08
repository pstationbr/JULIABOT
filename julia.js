const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const RSSParser = require('rss-parser');
const axios = require('axios');
const cron = require('node-cron');
const parser = new RSSParser();

const mysql = require('mysql2');

// Configuração do banco de dados MySQL
const db = mysql.createConnection({
    host: 'LOCALHOST',
    user: 'ROOT',
    password: 'SENHA',
    database: 'BANCODEDADOS'
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
    } else {
        console.log('Conectado ao banco de dados MySQL');
    }
});

// Número do administrador
const adminPhoneNumber = '551234567890'; // Substitua pelo número de telefone do admin

// Inicializa o cliente do WhatsApp
const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

// Trata eventos de desconexão e reconexão
client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
    client.initialize();
});

client.on('auth_failure', () => {
    console.error('AUTHENTICATION FAILURE');
});

// Busca notícias do feed RSS
async function fetchNews() {
    const feed = await parser.parseURL('https://tecnoblog.net/feed/');
    let news = 'Últimas notícias:\n\n';
    feed.items.slice(0, 5).forEach(item => {
        news += `*${item.title}*\n${item.link}\n\n`;
    });
    return news;
}

// Busca frases bíblicas de uma API em português
async function fetchBibleVerse() {
    try {
        const response = await axios.get('https://www.abibliadigital.com.br/api/verses/nvi/random');
        const verse = response.data.text;
        const book = response.data.book.name;
        const chapter = response.data.chapter;
        const number = response.data.number;
        return `${verse} - ${book} ${chapter}:${number}`;
    } catch (error) {
        console.error('Erro ao buscar frase bíblica:', error);
        return 'Desculpe, não consegui buscar um versículo bíblico no momento.';
    }
}

// Envia notícias para um contato específico
async function sendNewsToContact(contactId) {
    const news = await fetchNews();
    client.sendMessage(contactId, news);
}

// Função para enviar broadcast
async function broadcastMessage(message) {
    db.query('SELECT chat_id FROM users', (err, results) => {
        if (err) throw err;

        results.forEach(row => {
            client.sendMessage(row.chat_id, message);
        });
    });
}

// Função para enviar mensagem de bom dia
async function sendGoodMorning() {
    const message = 'Bom dia! Que seu dia seja abençoado e cheio de alegria! 😊';
    db.query('SELECT chat_id FROM users', (err, results) => {
        if (err) throw err;

        results.forEach(row => {
            client.sendMessage(row.chat_id, message);
        });
    });
}

// Agendar mensagem de bom dia para às 7:00 da manhã no horário de Brasília
cron.schedule('0 7 * * *', () => {
    console.log('Enviando mensagem de bom dia');
    sendGoodMorning();
}, {
    timezone: "America/Sao_Paulo"
});

// Monitorando mensagens
client.on('message', async msg => {
    if (msg.body.toLowerCase() === 'notícias') {
        const news = await fetchNews();
        msg.reply(news);
    } else if (msg.body.toLowerCase() === 'versículo') {
        const verse = await fetchBibleVerse();
        msg.reply(verse);
    } else if (msg.body.toLowerCase() === 'start') {
        const welcomeMessage = `Olá ${msg.from.split('@')[0]}, Meu nome é Julia. Sou uma IA criada pelos Jovens da Mídia e minhas funções são falar um versículo da Bíblia, mostrar as notícias do mundo, mandar mensgaem de bom dia! Em breve terei mais funções.`;
        msg.reply(welcomeMessage);

        // Salvar novo usuário no banco de dados
        db.query('INSERT INTO users (chat_id) VALUES (?)', [msg.from], (err) => {
            if (err && err.code !== 'ER_DUP_ENTRY') {
                console.error('Erro ao salvar usuário:', err);
            }
        });
    }
});

// Administrador envia broadcast
client.on('message', async msg => {
    if (msg.from.includes(adminPhoneNumber) && msg.body.startsWith('/broadcast ')) {
        const message = msg.body.replace('/broadcast ', '');
        broadcastMessage(message);
        msg.reply('Mensagem enviada para todos os usuários.');
    }
});

client.initialize();

/*

ESSE PROJETO FOI DESENVOLVIDO POR PAULO RICARDO IG: @PAULOSTATION
COPYRIGHT 2024 - TODOS OS DIREITOS RESERVADOS A PAULO!
NODEJS, WHATSAPP-WEB.JS, QRCODE-TERMINAL.JS, AXIOS, RSS, CRONJOB, MYSQL

*/
