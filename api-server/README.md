# Hark NGINX Node.js API
This is an API that handles RTMP ingest. It makes sure that only people who have authorization can stream, helps 
redirect with CDNs, and archives videos.  

# Setup

## Building the Server
This is a docker project, but we have some npm commands to help.  
Building the Container: `npm run docker:build`  
Pushing the Container:  `npm run docker:push`

## Environment Variables
Environment variables are handled in this project by editing the *config.json* file, found under *src/conf/config.json*. 
Follow the format to add the environment variables of your choice. Since this is a private repo, secrets are shared. So 
don't leak anything!  

## Firebase Authentication
You'll have to [make a service account](https://firebase.google.com/docs/admin/setup#add_firebase_to_your_app). Take the 
json file from this process and rename it *service-account.json*. Place it under *src/conf/service-account.json*. If you 
do not already have a *creds* folder, make it. This way, you'll be able to make admin changes from the localhost. 

from https://firebase.google.com/docs/admin/setup#add_firebase_to_your_app
To generate a private key file for your service account:

1. In the Firebase console, open Settings > Service Accounts.

2. Click Generate New Private Key, then confirm by clicking Generate Key.

3. Securely store the JSON file containing the key.


# Systems  

## Streamers & Firebase  
Firebase stores information on each user within the user collection, but to
store whether or not the user is currently streamer, the streams collection
is referenced.  
Each document within the streams collection represents an active scene, and
will be removed if the user stops streaming.
