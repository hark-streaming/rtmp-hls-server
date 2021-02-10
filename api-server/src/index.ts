import express from 'express';
//const express = require('express');

const app = express();

// ROUTES
app.get('/', (req,res) => {
    res.send('you did it. you made a doodd!');
});

app.listen(3000);
