const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const cron = require('node-cron');
const axios = require('axios');
const asyncRedis = require('async-redis');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const quizQuestions = require('./quiz'); // Importa as perguntas do quiz

const bibleApiUrl = 'https://api.abibliadigital.com.br/v1/versiculos/nvi/random';
const redisClient = asyncRedis.createClient();

const goodNightMessages = [
    "Boa noite! Que seu sono seja tranquilo e seus sonhos sejam doces. 🌙✨",
    "Que a paz de Deus encha seu coração e sua noite seja abençoada. Boa noite! 🌟🙏",
    "Durma bem e tenha um lindo amanhecer. Boa noite! 💫🌜",
    // Adicione mais mensagens de boa noite aqui
];

const julia = [
    "Eu?",
    "Fala benção de Deus!",
    "Fala anjo?",
    
];

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('JULIA OPERANDO 200 OK');

    // Envia uma frase bíblica a cada dia às 9h
cron.schedule('0 9 * * *', () => {
    axios.get(bibleApiUrl)
        .then(response => {
            const randomQuote = response.data.versiculo;
            users.forEach(user => {
                client.sendMessage(user, randomQuote);
            });
        })
        .catch(error => {
            console.error('Error fetching Bible verse:', error);
        });
});

cron.schedule('30 20 * * *', () => {
    const randomMessage = goodNightMessages[Math.floor(Math.random() * goodNightMessages.length)];
    users.forEach(user => {
        client.sendMessage(user, randomMessage);
    });
});cron.schedule('22 21 * * *', () => {
    const randomMessage = goodNightMessages[Math.floor(Math.random() * goodNightMessages.length)];
    sendToAllUsers(randomMessage);
});
});

const obterMusicaAleatoria = async () => {
    try {
        const response = await spotifyApi.searchTracks('genre:"gospel" genre:"evangelical"');
        const tracks = response.body.tracks.items;
        const randomIndex = Math.floor(Math.random() * tracks.length);
        return tracks[randomIndex];
    } catch (error) {
        console.error('Erro ao obter música aleatória', error);
        return { name: 'Música não disponível' };
    }
};

const blockedWords = ['funk', 'pop', 'buceta'];  // Adicione palavras que deseja bloquear

function containsBlockedWords(query) {
    return blockedWords.some(word => query.includes(word));
}

async function searchLyrics(query) {
    const response = await axios.get(`https://api.lyrics.ovh/v1/search?q=${query}`);
    return response.data.lyrics.map(lyric => lyric.url);
}


async function salvarRegras(criador, regras) {
    try {
        await redisClient.set(`regras_${criador}`, regras);
        console.log('Regras salvas com sucesso.');
    } catch (err) {
        console.error('Erro ao salvar regras:', err);
    }
}

async function obterRegras(criador, callback) {
    try {
        const regras = await redisClient.get(`regras_${criador}`);
        callback(regras);
    } catch (err) {
        console.error('Erro ao obter regras:', err);
        callback('Erro ao obter regras.');
    }
}

async function criarCarteirinha(nome, numero, fotoUrl) {
    const width = 400;
    const height = 200;
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');

    // Fundo branco
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, width, height);

    // Adicionar a foto do usuário
    const foto = await loadImage(fotoUrl);
    context.drawImage(foto, 20, 20, 160, 160);

    // Adicionar o texto
    context.fillStyle = '#000000';
    context.font = '20px Arial';
    context.fillText(`Nome: ${nome}`, 200, 80);
    context.fillText(`Número: ${numero}`, 200, 120);

    // Salvar a imagem em um arquivo temporário
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('carteirinha.png', buffer);
}



client.on('message', async msg => {
    const from = msg.author || msg.from;
    const { body } = msg;


    if (body.startsWith('!salvarRegras ')) {
        const regras = body.replace('!salvarRegras ', '');
        await salvarRegras(from, regras);
        msg.reply('Regras salvas com sucesso!');
    } else if (msg.fromMe === false && msg.body.toLowerCase().includes('regras')) {
        obterRegras(from, (regras) => {
            msg.reply(regras || 'Nenhuma regra encontrada.');
        });
    } else if (body.startsWith('!biblia')) {
        const query = body.replace('!biblia ', '');
        try {
            const response = await axios.get('https://api.bible/v1/search', {
                params: { query: query }
            });
            const bibleVerse = response.data.results[0].text; // Ajuste conforme a estrutura da API
            msg.reply(`Aqui está um versículo bíblico para você: ${bibleVerse}`);
        } catch (error) {
            console.error(error);
            msg.reply('Desculpe, algo deu errado ao buscar o versículo bíblico.');
        }
    } else if (body.startsWith('!fun ')) {
        const text = body.replace('!fun ', '');
        const funTranslation = 'yoda'; // ou 'pirate', 'minion', etc.

        try {
            const response = await axios.get(`https://api.funtranslations.com/translate/${funTranslation}.json`, {
                params: { text: text }
            });
            const translatedText = response.data.contents.translated;
            msg.reply(translatedText);
        } catch (error) {
            console.error(error);
            msg.reply('Desculpe, algo deu errado ao processar sua tradução.');
        }
    } else if (body.startsWith('!carteirinha ')) {
        const params = body.replace('!carteirinha ', '').split(',');
        if (params.length < 3) {
            msg.reply('Formato incorreto. Use: !carteirinha nome, numero, urlFoto');
            return;
        }
        
        const [nome, numero, fotoUrl] = params.map(param => param.trim());
        try {
            await criarCarteirinha(nome, numero, fotoUrl);
            const media = MessageMedia.fromFilePath('carteirinha.png');
            await client.sendMessage(media);
        } catch (error) {
            console.error(error);
            msg.reply('Desculpe, algo deu errado ao criar a carteirinha.');
        }
    } else if (msg.fromMe === false && msg.body.toLowerCase().includes('ola')) {
        client.sendMessage(msg.from, 'Oi! Meu nome é *JULIA*\n\nMeu comandos são:\n\n*!regras* - enviar regras do grupo\n\n*!biblia* - pesquisar um versículo da biblia nvi(em manutenção)\n\n*!carteirinha* - em construção\n\n*@quiz* - quiz bíblico\n\n*!letra* - pesquisar uma letra de louvor\n\nEspero que goste 😊');
    } else if (msg.fromMe === false && msg.body.toLowerCase().includes('julia')) {
        const randomju = julia[Math.floor(Math.random() * julia.length)];
        client.sendMessage(msg.from, randomju);
    } else if (body.startsWith('!versículo ')) {
        const query = body.replace('!versículo ', '');
        
        try {
            const response = await axios.get(`https://api.bible-edge.com/v1/versiculos?query=${query}`);
            const versiculo = response.data.versiculo;

            message.reply(versiculo);
        } catch (error) {
            message.reply('Não consegui encontrar um versículo para o tema solicitado.');
        }
    } else if (body.startsWith('!letra ')) {
        const query = body.replace('!letra ', '');
        
        if (containsBlockedWords(query)) {
            message.reply('Essa palavra está bloqueada.');
            return;
        }

        try {
            const links = await searchLyrics(query);
            const response = links.length ? links.join('\n') : 'Não encontrei nenhuma letra para sua busca.';
            body.reply(response);
        } catch (error) {
            body.reply('Ocorreu um erro ao buscar a letra.');
        }
    } else if (body.startsWith('!cast ')) {
        const broadcastMessage = body.slice(6); // Remove o comando e obtém a mensagem
        await sendBroadcastMessage(broadcastMessage);
    } else if (body.startsWith('@quiz')) {
        currentQuestion = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
        msg.reply(currentQuestion.question);
    } else if (currentQuestion && message.body.toLowerCase() === currentQuestion.answer.toLowerCase()) {
        msg.reply('Correto! O quiz está encerrado.');
        currentQuestion = null;
    } else if (currentQuestion && message.body.toLowerCase() !== currentQuestion.answer.toLowerCase()) {
        msg.reply('Errado! Tente novamente.');
    }
});




client.on('message', msg => {
    if (msg.from === '5519981905977@s.whatsapp.net' && msg.body.startsWith('!broadcast ')) {
        const broadcastMessage = msg.body.slice(11);
        users.forEach(user => {
            client.sendMessage(user, broadcastMessage);
        });
    }
});

client.on('group_join', async notification => {
    const chat = await notification.getChat();
    const newMemberId = notification.recipientIds[0];
    const newMemberContact = await client.getContactById(newMemberId);

    const welcomeMessage = `Olá @${newMemberContact.pushname}, seja muito bem vindo(a)!
    Digite regras para saber as regras do grupo!

    posso advertir em caso de não cumprimento de regras, limite de 3 adv por membro, caso contrario banimento imediato...

    igvjta.org | jovensdamidia.com.br
    `;

    chat.sendMessage(welcomeMessage);
});

async function sendToAllUsers(message) {
const users = await redisClient.smembers('users');
users.forEach(user => {
    client.sendMessage(user, message);
    console.log(`Sent to ${user}: ${message}`);
});
}

const quizApiUrl = 'https://quizapi.io/api/v1/questions';
const quizApiKey = 'JtAJFqj4Eo7Gqpmv6FR6wpHpoTG1hJWpTeshW3tN'; // Substitua pela sua chave de API

const warningLimit = 3;

client.on('message', async (msg) => {
    // Log message received
    console.log(`JULIA LOGS: ${msg.from}: ${msg.body}`);

    if (msg.fromMe === false) {
        await redisClient.sadd('users', msg.from);
    }

    if (msg.body.startsWith('!advertir ')) {
        const chat = await msg.getChat();
        if (chat.isGroup) {
            const usernameToWarn = msg.body.split(' ')[1];

            const userToWarn = chat.participants.find(participant => participant.id.user === usernameToWarn + '@c.us');

            const isAdmin = chat.participants.some(participant => participant.id._serialized === msg.author && participant.isAdmin);

            if (isAdmin) {
                const warnings = await redisClient.get(`warnings_${userToWarn.id._serialized}`) || 0;
                await redisClient.set(`warnings_${userToWarn.id._serialized}`, parseInt(warnings) + 1);

                const newWarnings = parseInt(await redisClient.get(`warnings_${userToWarn.id._serialized}`));

                if (newWarnings >= warningLimit) {
                    client.sendMessage(userToWarn.id._serialized, 'Você foi banido por atingir o limite de advertências.');
                    await redisClient.srem('users', userToWarn.id._serialized);
                } else {
                    client.sendMessage(userToWarn.id._serialized, `Advertência ${newWarnings}: Por favor, siga as regras do grupo.`);
                }
            } else {
                msg.reply('Somente administradores podem emitir advertências.');
            }
        }
    }

    if (msg.body === '!quizbiblico') {
        try {
            const response = await axios.get(quizApiUrl, {
                headers: {
                    'X-Api-Key': quizApiKey
                },
                params: {
                    category: 'Bible',
                    difficulty: 'easy', // Você pode ajustar o nível de dificuldade
                    limit: 1
                }
            });

            const quizQuestion = response.data[0];
            const question = quizQuestion.question;
            const answers = Object.values(quizQuestion.answers).filter(answer => answer !== null);

            let quizMessage = `*Pergunta:* ${question}\n`;
            answers.forEach((answer, index) => {
                quizMessage += `${String.fromCharCode(65 + index)}. ${answer}\n`;
            });

            client.sendMessage(msg.from, quizMessage);
        } catch (error) {
            console.error('Error fetching quiz question:', error);
            client.sendMessage(msg.from, 'Desculpe, não foi possível obter uma pergunta do quiz no momento.');
        }
    }
});

const sendBroadcastMessage = async (broadcastMessage) => {
    try {
        const users = await client.lrange('users', 0, -1);
        for (const userId of users) {
            client.get(`phone:${userId}`, async (err, phoneNumber) => {
                if (err) {
                    console.error(`Erro ao obter telefone do usuário ${userId}`, err);
                    return;
                }
                
                try {
                    await whatsappClient.sendMessage(phoneNumber, broadcastMessage);
                    console.log(`Mensagem enviada para ${phoneNumber}`);
                } catch (err) {
                    console.error(`Erro ao enviar mensagem para ${phoneNumber}`, err);
                }
            });
        }
    } catch (error) {
        console.error('Erro ao enviar mensagens de broadcast', error);
    }
};

client.initialize();
