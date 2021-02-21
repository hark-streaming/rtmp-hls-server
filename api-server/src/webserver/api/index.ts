import { Router } from 'express';
import chalk from 'chalk';
import rp from 'request-promise';

import { streamAuth } from '../../classes/StreamAuth';
import { serverData } from '../../classes/ServerData';

import logger from '../../classes/Logger';
const apiLogger = logger('APIv1');
import Timeout = NodeJS.Timeout;



interface ILiveTimer {
    user: string;
    timer: Timeout;
}

let liveTimers: ILiveTimer[] = [];
const updateDelay: number = 15; // 15 seconds

let notificationTimers: ILiveTimer[] = [];
const notificationDelay: number = 60; // 60 seconds



//#region Set Up

const router = Router();

export const streamauth = streamAuth({
    hostServer: process.env['HARK_SERVER'] || 'stream.bitrave.tv',
    cdnServer: process.env['HARK_CDN'] || 'cdn.stream.bitrave.tv',
});

//#endregion



//#region ROUTES



/*********************************
 * Authorize Streams
 */

/**
 * Authorize livestream
 */
router.post('/stream/authorize', async (req, res) => {

    const app = req.body.app;
    const name = req.body.name;
    const key = req.body.key;

    if (!app) return res.status(404).send(`Invalid route for authorization`);

    // jeremy note: ok i have no clue why this is here, but it seems like a 
    //              security issue so i'm not going to use it
    // Check if we need to check streamkey
    //if (app !== 'live') return res.status(200).send(`${[app]} Auth not required`);

    //#region live endpoint stuff

    // block new connections if user is already connected
    const streamer = serverData.getStreamer(name);
    if (streamer) {
        apiLogger.error(`Streamer '${name}' is already connected! Denying new connection.`);
        return res
            .status(500)
            .send(`Failed to start HLS ffmpeg process`);
    }

    // The following code only runs on the live endpoint
    // and requires both a name & key to authorize publish
    if (!name) {
        apiLogger.error(`Stream authorization missing username.`);
        return res
            .status(422)
            .send(`Authorization missing username.`);
    }
    if (!key) {
        apiLogger.error(`[${name}] Stream authorization missing key`);
        return res
            .status(422)
            .send(`Missing authorization key`);
    }

    //#endregion

    // Verify stream key
    const checkKey: boolean = await streamauth.checkStreamKey(name, key);
    //const checkKey: boolean = true;

    if (!checkKey) {
        return res
            .status(403)
            .send(`${name} denied.`);
    }

    /**
     * Respond as quickly as possible to the client while
     * the server continues to process the connection.
     */
    res
        .status(200)
        .send(`${name} authorized.`);

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

    // If authorized, pre-fetch archive status
    // TODO: utilize check archive
    const checkArchive: boolean = false; //await streamauth.checkArchive( name );

    // Wait for a few seconds before updating state and starting archive
    const timer: Timeout = setTimeout(async () => {

        // Update live status
        await streamauth.setLiveStatus(name, true);

        /*
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
  
        */

    }, updateDelay * 1000);

    liveTimers.push({
        user: name,
        timer: timer,
    });

    //#endregion
});

/**
 * Livestream disconnect
 */
router.post('/stream/end', async (req, res) => {
    const app = req.body.app;
    const name = req.body.name;

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
});

/**
 * Publish HLS stream, send notification callback
 */
router.post(
    '/stream/publish',
  
    async ( req, res ) => {
      const app  = req.body.app;  // Always HLS
      const name = req.body.name; // Stream name
  
      // Basic sanity check
      if ( app !== 'hls' ) return res.status(404).send(`Unknown stream endpoint ${app}.`);
  
      if ( name ) {
        const timer: Timeout = setTimeout( async () => {
          apiLogger.info(`[${app}] ${chalk.cyanBright.bold(name)} is now ${chalk.greenBright.bold('sending notification request')}.`);
          // Send notifications
          const options = { form: { streamer: name } };
          try {
            await rp.post( 'https://api.hark.tv/api/notification/live', options );
          } catch ( error ) {
            apiLogger.error( error.message );
          }
          // remove finished timer
          liveTimers = liveTimers.filter( val => val.user.toLowerCase() !== name.toLowerCase() );
        }, notificationDelay * 1000 );
  
        notificationTimers.push({
          user: name.toLowerCase(),
          timer: timer,
        });
      }
  
      apiLogger.info(`[${app}] ${chalk.cyanBright.bold(name)} is now ${chalk.greenBright.bold('PUBLISHED')}.`);
      res.send( `[${name}] Published ${name}.` );
    },
  );



/*********************************
 * Server Data
 */

/**
 * Get all streamers' data
 */
router.get(
    '/server/data',
    async (req, res) => {
        const data = serverData.getStreamerList();
        res.send(data);
    },
);

/**
 * Get a certain streamer's data
 */
router.get(
    '/server/data/:streamer',
    async (req, res) => {
        const streamer = req.params.streamer;
        const data = serverData.getStreamerData(streamer);

        // Verify we got data
        if (!data) return res.status(404).send('Error: streamer not found');

        // Update streamer's data
        // serverData.updateStreamer( streamer ); // Prevent potential DDoS

        // Send results
        res.send(data);
    },
);


//#endregion



//#region shit routes

router.get('/', (req, res) => {
    res.send('what did it cost? everything.');
});

/**
 * all this shit below here? yeah that's shit.
 * the api server is a firebase thing, not this server
 * this current server is only for the rtmp/hls not that
 * 
 * this server updates the firebase, which is where the channel info is being taken
 * from on the front end
 * the front end never accesses this api ever!
 */

// right now it's assuming that it's localhost. need to get docker-compose to work oof
router.get('/v1/stream', (req, res) => {
    res.send('http://127.0.0.1:8080/hls/test1.m3u8');
});

router.get('/v1/stream/:user', (req, res) => {
    let user = req.params.user;

    if (user == "test2") {
        res.send('http://127.0.0.1:8080/hls/test2.m3u8');
    }
    else {
        res.send('http://127.0.0.1:8080/hls/test1.m3u8');
    }
});

// get live channels except it's just kevin's right now
router.get('/v1/channels/live', (req, res) => {
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

//#endregion


export default router;
