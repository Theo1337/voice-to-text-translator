const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const next = require('next');
const { translate } = require('bing-translate-api');

const dev = process.env.NODE_ENV !== 'production';

const nextApp = next({ dev });
const nextHandler = nextApp.getRequestHandler();

let translation_language = "pt"

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
