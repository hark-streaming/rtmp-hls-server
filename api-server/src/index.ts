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

/**
 * Authorize livestream
 */
app.post('/stream/authorize', async (req, res) => {
    const app = req.body.app;
    const name = req.body.name;
    const key = req.body.key;

    if (!app) return res.status(404).send(`Invalid route for authorization`);

    // Check if we need to check streamkey
    if (app !== 'live') return res.status(200).send(`${[app]} Auth not required`);

    //#region live endpoint stuff

    /*
    // block new connections if user is already connected
    const streamer = serverData.getStreamer( name );
    if ( streamer ) {
      apiLogger.error( `Streamer '${name}' is already connected! Denying new connection.` );
      return res
        .status( 500 )
        .send( `Failed to start HLS ffmpeg process` );
    }
    */

    /*
    // The following code only runs on the live endpoint
    // and requires both a name & key to authorize publish
    if ( !name ) {
      apiLogger.error( `Stream authorization missing username.` );
      return res
        .status( 422 )
        .send(`Authorization missing username.`);
    }
    if ( !key ) {
      apiLogger.error( `[${name}] Stream authorization missing key` );
      return res
        .status( 422 )
        .send( `Missing authorization key` );
    }
    */

    //#endregion

    // Verify stream key
    //const checkKey: boolean = await streamauth.checkStreamKey ( name, key );
    const checkKey: boolean = true;

    if (!checkKey) {
        return res
            .status(403)
            .send(`${name} denied.`);
    }

    /**
     * Respond as quickly as possible to the client while
     * the server continues to process the connection.
     */
    // We are authorized
    res
        .status(200)
        .send(`${name} authorized oh yeah.`);


    /*
    // Relay stream to HLS endpoint
    const relaySuccessful: boolean = await hlsRelay.startRelay( name );

    // Verify we were able to start the HLS ffmpeg process
    if ( !relaySuccessful ) {
      apiLogger.error( `[${name}] Failed to start HLS relay` );
      return;
    }
    */

    //#region Pre fetch archive status

    /*
    // If authorized, pre-fetch archive status
    const checkArchive: boolean = await streamauth.checkArchive( name );

    // Wait for a few seconds before updating state and starting archive
    const timer: Timeout = setTimeout( async () => {

      // Update live status
      await streamauth.setLiveStatus( name, true );

      // Check if we should archive stream
      if ( !checkArchive ) {
        apiLogger.info( `Archiving is disabled for ${chalk.cyanBright.bold(name)}` );
        return;
      }

      // Start stream archive
      const attempts = 5;
      let response;
      for ( let i: number = 0; i <= attempts; i++ ) {

        // response = await rp( `${host}/${control}/record/start?app=live&name=${name}&rec=archive` );
        response = await archiver.startArchive( name, 'replay' );

        if ( !response ) {
          await new Promise( resolve => setTimeout( resolve, 1000 * 10 ) );
          apiLogger.info( `${chalk.redBright('Failed to start archive')}, attempting again in 10 seconds (${i}/${attempts})` );
          if ( i === attempts ) apiLogger.info( `${chalk.redBright('Giving up on archive.')} (out of attempts)` );
        } else {
          apiLogger.info( `Archiving ${chalk.cyanBright.bold(name)} to: ${chalk.greenBright(response)}` );
          break;
        }
      }
    }, updateDelay * 1000 );

    liveTimers.push({
      user: name,
      timer: timer,
    });
    */

    //#endregion
});

/**
 * Livestream disconnect
 */
app.post('/stream/end', async (req, res) => {
    const app = req.body.app;
    const name = req.body.name;

    /*
    // Streamer has  fully disconnected
    if (app === 'live') {
        // Prevent timer from firing when stream goes offline
        liveTimers.map(val => {
            if (val.user.toLowerCase() === name.toLowerCase())
                clearTimeout(val.timer);
            else
                return val;
        });

        // Prevent live timers from firing if we go offline
        liveTimers = liveTimers
            .filter(val => {
                if (val.user.toLowerCase() === name.toLowerCase()) clearTimeout(val.timer);
                else return val;
            });

        // Prevent notifications timers from firing if we go offline too soon
        notificationTimers = notificationTimers
            .filter(val => {
                if (val.user.toLowerCase() === name.toLowerCase()) clearTimeout(val.timer);
                else return val;
            });

        // Set offline status
        await streamauth.setLiveStatus(name, false);

        res.send(`[${app}] ${name} is now OFFLINE`);
    }
    */
});



app.get('/', (req, res) => {
    res.send('kevin');
});

// right now it's assuming that it's localhost. need to get docker-compose to work oof
app.get('/v1/stream', (req, res) => {
    res.send('http://127.0.0.1:8080/hls/test1.m3u8');
});

app.get('/v1/stream/:user', (req, res) => {
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
