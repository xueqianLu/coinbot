// coinBot.ts
import { PuppetPadlocal } from "wechaty-puppet-padlocal";
import { Contact, log, Message, ScanStatus, Wechaty } from "wechaty";
const puppet = new PuppetPadlocal({}) 
const bot = new Wechaty({
    name: "CoinBot",
    puppet,
})
.on("scan", (qrcode: string, status: ScanStatus) => {
    if (status === ScanStatus.Waiting && qrcode) {
        const qrcodeImageUrl = [
            'https://wechaty.js.org/qrcode/',
            encodeURIComponent(qrcode),
        ].join('')

        log.info("CoinBot", `onScan: ${ScanStatus[status]}(${status}) - ${qrcodeImageUrl}`);

        require('qrcode-terminal').generate(qrcode, { small: true })  // show qrcode on console
    } else {
        log.info("CoinBot", `onScan: ${ScanStatus[status]}(${status})`);
    }
})

.on("login", (user: Contact) => {
    log.info("CoinBot", `${user} login`);
})

.on("logout", (user: Contact, reason: string) => {
    log.info("CoinBot", `${user} logout, reason: ${reason}`);
})

.on("message", async (message: Message) => {
    const contact = message.talker()
    const text = message.text()
    const room = message.room()
    if (room) {
        const topic = await room.topic()
        console.log(`Room: ${topic} Contact: ${contact.name()} Text: ${text}`)
    } else {
        // message.say(${text}); // 回复消息
        console.log(`Contact: ${contact.name()} Text: ${text}`)
    }
    
    if (CheckCoin(text)) {
        console.log("is coin", text)
    } else {
        console.log("not coin", text)
    }

    if(CheckCoin(text)) { 
        const token = message.text().toString();
        
        let result = await coinBot(token);
        const member = message.talker();
        if(result != null)
        {
            if (room){
                message.room().say("\n" + result,member);
            } else {
                message.say(result)
            }
        }
        else{
            log.info(message.toString());
            if (room) {
                message.room().say("\n" + "没这币",member);
            } else {
                message.say("\n" + "没这币");
            }
        }    
    }
})

.on("error", (error) => {
    log.error("CoinBot", 'on error: ', error.stack);
})

bot.start().then(() => {
    log.info("CoinBot", "started.");
});

// const supportMap = new Map([
//     ["key1", ],
//     ["key2", "value2"]
// ]); 

function CheckCoin(msg :string) {
    var lower = msg.toLowerCase()
    let reg = /[0-9a-z]+/;
    if(!reg.test(lower)){
        return false;
    }
    return true
}

async function coinBot(coin){
    var result;
    const rp = require('request-promise');
    const requestOptions = {
        method: 'GET',
        uri: 'https://fxhapi.feixiaohao.com/public/v1/ticker', // 这里使用的非小号的API
        qs: {
            'start': '0',
            'limit': '5000',  //非小号最高数据5000
            'convert': 'USD'
        },
        json: true,
        gzip: true
    };

    let response = await rp(requestOptions);
    let find = false
    console.log("got response", response)
    for(var each in response)
    {
        if(response[each]["symbol"].toLowerCase() == coin)
        {
            var mytrade = response[each]["price_usd"]
            var mdex    = response[each]["price_usd"]
            find = true
            result = "为您报价" + response[each]["symbol"] + `\n` + 
                     "来源：MyTrade" + `\n` + 
                     "价格：" + mytrade + "USDT" + `\n` + 
                     "来源：MDEX" + `\n` + 
                     "价格：" + mdex + "USDT" + `\n` + 
                     "[MyTrade报价机器人，来MyTrade挂单交易，0手续费]" + `\n`
            //result = "[币种]: " + response[each]["symbol"] +`\n` + "[价格]: " +response[each]["price_usd"] + '\n' + "[24小时涨幅]: " + response[each]["percent_change_24h"] + "%";
            break;
        }
    }
    return result;
}
