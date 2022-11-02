import axios from 'axios';
import * as functions from "firebase-functions";


export async function getDmData(orderId: string, shopId: string,) {
    try {
        // functions.logger.log('vor rquest')
        const response = await axios.get(`https://spot.photoprintit.com/spotapi/orderInfo/forShop?config=1320&shop=${shopId}&order=${orderId}&language=de`);
        // functions.logger.log('nach request')
        if (response.data.summaryStateCode == "ERROR") {
            const ret = "Order ist vorgemerkt" +
                "\n\nAuftragsnummer: " + response.data.orderNo +
                "\n\nFilialnummer: " + response.data.shopNo
            return {
                returnstring: ret,
                response: response.data,
                ok: false
            }
        }
        const data = response.data.subOrders[0];
        const dates = data.stateDate.split('-');
        const date = dates[2] + "." + dates[1] + "." + dates[0]
        let description = ""
        // @ts-ignore
        data.positions.forEach(position => {
            description = description.concat(position.description).concat('\n')
        })
        let ret = `Auftrag ${data.orderNo}\n\n`+
            `Status vom: ${date}\n\n`+
            `${statusHandeler(response.data.summaryStateCode)}\n`+
            `${data.stateText}\n\n`+
            `Details zu der Bestellung:\n`+
            `${description}`+
            "Preis: " + (response.data.summaryPriceText || '--')
        // functions.logger.log("status: " + ret)
        return {
            returnstring: ret,
            ok: true,
            response: {
                stateCode: response.data.summaryStateCode || "unknown",
                stateText: response.data.summaryStateText || "unknown",
                priceText: response.data.summaryPriceText || "unknown",
                lastUpdate: response.data.summaryDate || "unknown",
                details: description || "unknown",
                markt: response.data.deliveryText || "unknown"
            }
        }
    } catch (e) {
        functions.logger.error(e)
        return {
            returnstring: "Hups kleiner fehler, ahm...nochmal versuchen vll?",
            response: e,
            ok: false
        }
    }
}

function statusHandeler(status: string) {
    const {fin, open} = emoSelector()
    switch (status) {
        case "SUBMITTED":
            return `1/5\n${fin}${open}${open}${open}${open}`
        case "PROCESSING":
            return `2/5\n${fin}${fin}${open}${open}${open}`
        case "PRODUCED":
            return `3/5\n${fin}${fin}${fin}${open}${open}`
        case "SHIPPED":
            return `4/5\n${fin}${fin}${fin}${fin}${open}`
        case "DELIVERED":
            return `5/5\n${fin}${fin}${fin}${fin}${fin}`
        default:
            return "🤪"
    }
    //:fire:
}

function emoSelector(): EmojiPair {
    const num = Math.round(Math.random()*2);
    return emojis[num] || new EmojiPair('▒', '█')
}

class EmojiPair {
    constructor(open: string, finished: string) {
        this.open = open;
        this.fin = finished;
    }
    open:string
    fin:string
}

const emojis = [
    new EmojiPair('⬜️', '✅'),
    new EmojiPair('▒', '█'),
    new EmojiPair('💧', '🔥')
]


