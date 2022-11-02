import {Context, Markup, Telegraf} from 'telegraf';
import * as functions from "firebase-functions";
// @ts-ignore
import {getUpdateForOrder, setUpFirebase, writeFeedbackToDB, writeOrderToDB, writeUserToDB} from "./firestoreHandeler";
import {getDmData} from "./dmHandeler";

const startReply: string = "Hi was geht?\n\n mit /newphotos (oder dem Knopf unter der Nachricht) kannst du eine neue Bestellung anlegen.\n" +
    "der Bot schickt dir Updates wenn sich etwas am Status geändert hat.\n\n" +
    "Für alle weitern Funktionen gibt gib /commands ein";
const newPhotosreply: string = "Na aber Klar. Bitte gib die beiden Nummern in folgendem Format ein:\nAuftragsnummer:Filialnummer  (123456:1234)"
const unknownText = "bidde was?🤨";
const nachBestellungSchauen = "Großartig, ich schau mal wie weit die Bestellung ist";
const commands = "mit /newphotos kannst du eine neue Bestellung anlegen,\n\n"+
    "mit /update bekommst du den status deiner letzten Bestellung\n"+
    "mit /update {Auftragsnummer}\n (/update 123456) gibt den Status für eine bestimmte Bestellung\n\n" +
    "mit /feedback {dein feedbacktext...} kannst du Feedback geben\n"

const fakeDMResponse = {
    stateCode: "unknown",
    stateText: "unknown",
    priceText: "unknown",
    lastUpdate: "unknown",
    details: "unknown",
    markt: "unknown"
};


export const bot = new Telegraf(functions.config().telegram.token, {telegram: {webhookReply: true}})

bot.catch((err, ctx) => {
    functions.logger.error('[Bot] Errlr', err)
})

bot.command('/start', async (ctx) => {
    let button = Markup.button.callback("Neue Bestellung", "hallo");
    await ctx.reply(startReply, Markup.inlineKeyboard([button]))
    await writeUserToDB(ctx.message)
});

bot.command('/newphotos', (ctx) => {
    ctx.reply(newPhotosreply)
    writeUserToDB(ctx.message)
})

bot.command('/update', async (ctx) => {
    const number = cleanMessage(ctx, ['/update', ' '])
    const nachschauenProm = ctx.reply(nachBestellungSchauen);
    const updateProm = await getUpdateForOrder(ctx.message.chat.id.toString(), number);
    const [nachschauen, update] = await Promise.all([nachschauenProm, updateProm])

    ctx.telegram.editMessageText(nachschauen.chat.id, nachschauen.message_id, undefined, update)
    // await ctx.reply(ctx.chat.id, update)
})


bot.command('/testupdate', async (ctx:Context) => {
    let button = Markup.button.callback("Neue Order", "hallo");
    ctx.reply("hallo", Markup.inlineKeyboard([button]))
    console.log("gehtn")
    // functions.logger.info("das ist ctx.message: " +ctx.message)
    // setUpFirebase()
})

bot.command('/force', async (ctx) => {
    const numbers = cleanMessage(ctx, ['/force', ' '])
    if (isNumber(ctx, ['/force', ' '])) {
        let orderAndShopNo = getOrderAndShopNo(numbers);

        orderAndShopNo.id = ctx.chat.id.toString();

        ctx.reply('Order ist Vorgemerkt');
        await writeOrderToDB(orderAndShopNo, fakeDMResponse);
    }
})

bot.command('/feedback', async (ctx: Context) => {
    await ctx.reply("Danke für das Feedback")
    // @ts-ignore
    await writeFeedbackToDB(ctx.message.text, ctx.chat.id.toString())
})

bot.command('/commands', async (ctx: Context) => {
    await ctx.reply(commands)
})

bot.on('message', async (ctx) => {
    if (isNumber(ctx)) {
        await auftragsNummerHandeler(ctx)
    } else {
        ctx.reply(unknownText);
    }
});

bot.on('callback_query', (ctx) => {
    ctx.reply(newPhotosreply)
})


async function auftragsNummerHandeler(ctx: Context) {
    if (ctx.chat) {
        //@ts-ignore
        const chatData = getOrderAndShopNo(ctx.message.text)
        chatData.id = ctx.chat.id.toString()
        functions.logger.log("vor getDMData")
        const responseProm = getDmData(chatData.orderNo, chatData.shopNo);
        const schauenProm = await ctx.reply(nachBestellungSchauen);
        const response = await Promise.resolve(responseProm)
        functions.logger.log('nach getDmData')
        ctx.telegram.editMessageText(schauenProm.chat.id, schauenProm.message_id, undefined, response.returnstring)
        // ctx.reply(response.returnstring)

        functions.logger.log("response war ok, schreibt jetzt in database")
        await writeOrderToDB(chatData, fakeDMResponse);
        functions.logger.log("hat in Database geschrieben")


    }
}


function isNumber(ctx: Context, cleaner?: string[]) {
    if (ctx.chat) {
        let text: string

        if (cleaner) {
            // @ts-ignore
            text = cleanMessage(ctx, cleaner);
        } else {
            // @ts-ignore
            text = ctx.message.text;
        }

        if (!(text.length >= 10 && text.length <= 12)) {
            ctx.telegram.sendMessage(ctx.chat.id, "eingegebene Nachricht zu kurz oder zu lang")
            return false
        }
        const strings = text.split(':');
        const orderNo = !isNaN(parseInt(strings[0], 10)) && isFinite(Number(strings[0]));
        const shopNo = !isNaN(parseInt(strings[1], 10)) && isFinite(Number(strings[1]));
        if (!orderNo && !shopNo) {
            ctx.telegram.sendMessage(ctx.chat.id, "Das' Blödsinn")
            return false
        } else if (!shopNo || parseInt(strings[1]) > 3000) {
            ctx.telegram.sendMessage(ctx.chat.id, "Filialnummer ungültig")
            return false
        } else if (!orderNo) {
            ctx.telegram.sendMessage(ctx.chat.id, "Auftragsnummer ungültig")
            return false
        }
        return orderNo && shopNo
    }
    return false
}

function cleanMessage(ctx: any, toBeRemovedWords: string[]) {
    let message: string = ctx.message.text
    for (const word of toBeRemovedWords) {
        message = message.replace(word, '')
    }
    return message
}

function getOrderAndShopNo(unseperaded: string): { orderNo: string, shopNo: string, id?: string } {
    const nummern: string[] = unseperaded.split(':');
    return {
        orderNo: nummern[0],
        shopNo: nummern[1]
    }
}

// async function delay(ms:number){
//     return new Promise((resolve) => {
//         setTimeout(()=> resolve("hallo"), ms);
//
//     });
// }