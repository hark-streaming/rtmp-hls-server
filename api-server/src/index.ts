import express from 'express';
//const express = require('express');

const app = express();

// ROUTES
app.get('/', (req,res) => {
    res.send('kevin');
});

// right now it's assuming that it's localhost. need to get docker-compose to work oof
app.get('/stream', (req,res) => {
    res.send('http://127.0.0.1:8080/hls/test1.m3u8');
});

app.get('/stream/:user', (req,res) => {
    let user = req.params.user;
    res.send('http://127.0.0.1:8080/hls/test1.m3u8');
});

app.listen(3000);
