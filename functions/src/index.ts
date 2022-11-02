import * as functions from 'firebase-functions';
import {bot} from './telegramHandeler'
import {updateHandeler} from './updateHandeler';


// export const scheduleUpdates = functions.region('europe-west1').pubsub.topic('dmphotochecker').onPublish(async message =>{
//     updateHandeler()
// })

// optional: every 3 hours from 09:00 to 20:00

export const lookForUpdates = functions.region('europe-west1').pubsub.schedule('every 3 hours').onRun((async context => {
   await updateHandeler()
}))

export const derBot = functions.region('europe-west1').https.onRequest(async (request, response)=>{
    functions.logger.log("Incomming message: ", request.body);
    try {
        await bot.handleUpdate(request.body)
    } finally {
        functions.logger.log('jetzt sind wir am ende angekommmen')
        response.status(200).end()
    }

})