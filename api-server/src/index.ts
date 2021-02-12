import express from 'express';
//const express = require('express');

const app = express();

//#region Middlewares
// they're functions that fire whenever a specific route is hit

/*
app.use('/posts', () => {
    console.log("This is a middleware running!");
});
*/

//#endregion



//#region ROUTES

app.get('/', (req, res) => {
    res.send('kevin');
});

// right now it's assuming that it's localhost. need to get docker-compose to work oof
app.get('/stream', (req, res) => {
    res.send('http://127.0.0.1:8080/hls/test1.m3u8');
});

app.get('/stream/:user', (req, res) => {
    let user = req.params.user;

    if (user == "test2") {
        res.send('http://127.0.0.1:8080/hls/test2.m3u8');
    }
    else {
        res.send('http://127.0.0.1:8080/hls/test1.m3u8');
    }
});

// get live channels except it's just kevin's right now
app.get('/v1/channels/live', (req, res) => {
    res.send(
        {
            "success": true,
            "live": [
                {
                    "viewCount": 209,
                    "src": "https://cdn.stream.bitwave.tv/hls/britbong/index.m3u8",
                    "name": "britbong",
                    "type": "application/x-mpegURL",
                    "nsfw": false
                },
            ],
            "streamers": [
                {
                    "viewCount": 215,
                    "title": " 🔴Britbong.com: Britbong never dies",
                    "name": "britbong",
                    "avatar": "https://cdn.bitwave.tv/uploads/v2/avatar/8c663568-f407-4f13-b427-3e035cfb3484-128.jpg",
                    "poster": "https://bitwave.s3.us-west.stackpathstorage.com/img/cover/b71bc591-2f6f-4638-8638-757cbe22d71b-1280x720.png",
                    "thumbnail": "https://cdn.stream.bitwave.tv/preview/britbong.jpg",
                    "to": "/britbong",
                    "live": true,
                    "nsfw": false,
                    "url": "https://cdn.stream.bitwave.tv/hls/britbong/index.m3u8",
                    "owner": "ARbj6Q32wMVsbulZq2N1Mbe6j8A3",

                    "banned": false
                },
            ]
        }
    );
});

app.post('/posts', (req, res) => {
    res.send("We are on home");
});

//#endregion



app.listen(3000);
