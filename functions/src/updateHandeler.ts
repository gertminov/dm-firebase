import * as functions from 'firebase-functions';
import {getOpenOrders, setUpdate} from "./firestoreHandeler";
import {getDmData} from "./dmHandeler";
import {bot} from "./telegramHandeler";

export async function updateHandeler() {
    const statusArray = await getOpenOrders();
    for (const order of statusArray) {
        const dmData = await getDmData(order.filial_nr, order.auftrags_nr);
        if (dmData.response.stateCode != order.state && dmData.ok) {
            functions.logger.log("hat unterschieder gefunden", order.state)
            bot.telegram.sendMessage(order.user, dmData.returnstring)
            await setUpdate(order,dmData.response)

        }
    }
}