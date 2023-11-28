const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const next = require('next');
const { translate } = require('bing-translate-api');

const dev = process.env.NODE_ENV !== 'production';

const Discord = require("discord.js");
const client = new Discord.Client({ intents: ["DIRECT_MESSAGES", "GUILD_MESSAGES", "GUILDS", "GUILD_MEMBERS", "GUILD_PRESENCES", "GUILD_VOICE_STATES"], partials: ["CHANNEL"]});
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, StreamType, AudioPlayerStatus, VoiceConnectionStatus } = require("@discordjs/voice")

const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

let translation_language = "pt"
const say = require('say')


const player = createAudioPlayer();

function playSong() {
	const resource = createAudioResource(say.speak("Hello"), {
		inputType: StreamType.Arbitrary,
	});
	player.play(resource);
	return entersState(player, AudioPlayerStatus.Playing, 5000);
}

async function connectToChannel(channel) {
	const connection = joinVoiceChannel({
		channelId: channel.id,
		guildId: channel.guild.id,
		adapterCreator: channel.guild.voiceAdapterCreator,
	});
	try {
		await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
		return connection;
	} catch (error) {
		connection.destroy();
		throw error;
	}
}


client.on('ready', async () => {
	console.log('Discord.js client is ready!');
	try {
		await playSong();
		console.log('Song is ready to play!');
	} catch (error) {
		console.error(error);
	}
});

client.on('messageCreate', async (message) => {
	if (!message.guild) return;

	if (message.content === '-join') {
		const channel = message.member?.voice.channel;

		if (channel) {
			try {
				const connection = await connectToChannel(channel);
				connection.subscribe(player);
				await message.reply('Playing now!');
			} catch (error) {
				console.error(error);
			}
		} else {
			void message.reply('Join a voice channel then try again!');
		}
	}
});


io.on('connect', socket => {
    socket.on('room:join', roomName => {
        return socket.join(roomName);
    });

    socket.on('change_language', (e) => {
        translation_language = e.language;
    })

    socket.on(`teste`, async(e) => {
        translate(e.text, null, translation_language).then(res => {
            socket.emit('resTranslate', {text: res, finalText: res});
        }).catch(err => {
            console.error(err);
        });;
    })
    socket.on(`final`, async(e) => {
        translate(e.finalTranscript, null, translation_language).then(res => {
            socket.emit('resFinal', { finalText: res});
        }).catch(err => {
            console.error(err);
        });;
    })
});

nextApp.prepare().then(() => {
    app.all('*', (req, res) => {
        return nextHandler(req, res);
    });
    
    server.listen(process.env.PORT || 3000, err => {
        if(err) {
            throw err;
        }
        
        console.log('[Server] Successfully started on port', process.env.PORT || 3000);
    });
})

client.login("MTA2MzQ3NTg0Njg1MTA2Nzk4NQ.GcYQor.31caebiuCjoldY52qRvljUlH_zD44zgU_2t-LM");