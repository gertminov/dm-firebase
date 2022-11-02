import {firestore} from "firebase-admin";
import * as functions from 'firebase-functions';
import {getDmData} from "./dmHandeler";
import {bot} from "./telegramHandeler";

const admin = require('firebase-admin')
admin.initializeApp()
const db = admin.firestore();

const usersDB = db.collection('users')


// @ts-ignore
export async function writeUserToDB(telMessage) {
    const firstName = telMessage.chat.first_name;
    const lastName = telMessage.chat.last_name;
    const username = telMessage.chat.username;
    const id = telMessage.chat.id.toString();
    if (firstName && lastName) {
        await usersDB.doc(id).set({
            first_name: firstName,
            name: lastName,
            user_name: username || "undifined",
        });
    } else {
        await usersDB.doc(id).set({
            user_name: username || "undifined",
        });
    }
}

// @ts-ignore
export async function writeOrderToDB(teleMessage, dmResponse) {
    const auftragsNr = teleMessage.orderNo
    const id = teleMessage.id

    const timeElapsed = Date.now();
    const today = new Date(timeElapsed);
    const date = formatDate(today, "dd.mm.yy");

    const timestamp = firestore.Timestamp.now()


    await usersDB.doc(id).collection('orders').doc(auftragsNr).set(
        {
            auftrags_nr: teleMessage.orderNo || "empty",
            filial_nr: teleMessage.shopNo || "empty",
            registered: date || "empty",
            status: dmResponse.stateText || "empty",
            state: dmResponse.stateCode || "empty",
            price: dmResponse.priceText || "empty",
            last_update: dmResponse.lastUpdate || "empty",
            details: dmResponse.details || "empty",
            markt: dmResponse.markt || "empty",
            timestamp: timestamp,
            orderOpen: true
        }
    )
    functions.logger.log("hat in DB geschrieben geht zurück nach TelegramHandeler")
}


export async function getUpdateForOrder(id: string, auftragsNr: string):Promise<string> {
    let data;
    if (auftragsNr == "") {
        data = await lastOrderStatus(id);
    } else {
        data = await specificOrderStatus(id, auftragsNr)
    }
    return data.returnstring
}

async function lastOrderStatus(id: string) {
    let data
    const lastOrder = await usersDB.doc(id)
        .collection('orders').orderBy('timestamp', "desc").limit(1).get();
    // @ts-ignore
    lastOrder.forEach(doc => {
        if (doc.exists) {
            data = doc.data();
        }
    });

    // @ts-ignore
    return await getDmData(data.auftrags_nr, data.filial_nr)
}

/**
 * returns the data for the order with the given orderNo
 * @param id the Telegram chat ID
 * @param orderNo the DM order number
 * @return Order an Order Object
 */
async function specificOrderStatus(id: string, orderNo: string) {
    const snapshot = await usersDB.doc(id).collection('orders').doc(orderNo).get();
    if (snapshot.exists) {
        const data = snapshot.data()
        return await getDmData(data.auftrags_nr, data.filial_nr);
    } else {
        return {returnstring:"diese bestellung gibts noch gar nicht. Nutze /newphotos um eine neue Bestellung anzuleben"}
    }
}

// @ts-ignore
export async function setUpdate(orderData, dmRes) {
    let orderOpen = true
    if (dmRes.stateCode == "DELIVERED") {
        orderOpen = false
    }

    const auftragsNr = orderData.auftrags_nr;
    const id = orderData.user

    await usersDB.doc(id).collection('orders').doc(auftragsNr).update(
        {
            auftrags_nr: orderData.auftrags_nr || "",
            filial_nr: orderData.filial_nr || "",
            status: dmRes.stateText || "",
            state: dmRes.stateCode || "",
            price: dmRes.priceText || "",
            last_update: dmRes.lastUpdate || "",
            details: dmRes.lastUpdate || "",
            markt: dmRes.markt || "",
            orderOpen: orderOpen || "",
        }
    )
}


export async function getOpenOrders() {
    const timestamp = firestore.Timestamp.now()
    let statusArray: { user: string, state: string; auftrags_nr: string; filial_nr: string; }[] = []
    const openOrders = await db.collectionGroup('orders').where('orderOpen', '==', true).get()
    // @ts-ignore
    openOrders.forEach((order) => {
        const data = order.data();
        if ((timestamp.seconds - data.timestamp.seconds) > 1209600 && data.state == "unknown") {
            functions.logger.info("for Order: " + order.id + " timeDifference is: " + (timestamp.seconds - data.timestamp.seconds));
            usersDB.doc(order.ref.parent.parent.id).collection('orders').doc(data.auftrags_nr).delete();
            bot.telegram.sendMessage(order.ref.parent.parent.id, "Die Order: " + data.auftrags_nr + " wurde für mehr als 14 tage nicht von DM erkannt und wird deswegen gelöscht")
        } else {
            // console.log(order.id, "=> ", data);
            statusArray.push({
                user: order.ref.parent.parent.id,
                state: data.state,
                auftrags_nr: data.auftrags_nr,
                filial_nr: data.filial_nr
            });
        }

    })
    return statusArray
}

export async function writeFeedbackToDB(message: string, id: string) {
    db.collection('feedback').doc(id).collection('feedbacks').add({
        id: id,
        message: message
    })
}

export async function setUpFirebase() {
    const ding = await db.collectionGroup('orders').where('orderOpen', '==', true).get()
    // @ts-ignore
    ding.forEach((order) => {
        console.log(order.ref.parent.parent.id)
        console.log(order.data())
    })
}

function formatDate(date: Date, format: string) {
    const map = {
        mm: date.getMonth() + 1,
        dd: date.getDate(),
        yy: date.getFullYear(),
        yyyy: date.getFullYear()
    }
    // @ts-ignore
    return format.replace(/mm|dd|yy|yyy/gi, matched => map[matched])
}