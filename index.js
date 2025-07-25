const { SerialPort } = require('serialport');
const iconv = require('iconv-lite');
const express = require('express');
const http = require('http');
const api = require('./api');

const port = new SerialPort({
    path: '/dev/serial/by-id/usb-FTDI_FT232R_USB_UART_AQ01E4NQ-if00-port0',
    baudRate: 19200
});

//console.log("\033[2J");

const app = express();
const httpServer = http.createServer(app);

api.init(app);

httpServer.listen(1666, function () {
    console.log('Server started on Port 1666');
});


port.on('error', function (err) {
    console.log('Error: ', err.message);
});

var curReadType = 0;
curStatusBlock = "";


port.on('readable', function () {
    var input = port.read().toString('hex');

    var startChars = input[0] + input[1];
    var endChars = input[input.length - 2] + input[input.length - 1];

    if (startChars == "15") {
        //Statusblock start
        curStatusBlock = "";
        curReadType = "15";
    }

    if (curReadType == "15") {
        curStatusBlock += input;
    } else {
        console.log("unhandled serial input:" + input);
    }

    if (endChars == "16") {
        //Statusblock end
        curReadType = 0;

        //Handle statusblock
        parseStatus(curStatusBlock);
    }
})

//Get Status every second
var statuscnt = 9;
function getStatus() {

    if (api.interrupt) {
        if (statuscnt < 5) statuscnt = 5;
        switch (api.interrupt.type) {
            case "I":
                var tBuff = Buffer.from([0x49, 0x31, 0x0D]);
                switch (api.interrupt.val) {
                    case 1:
                        tBuff[1] = 0x31;
                        break;
                    case 2:
                        tBuff[1] = 0x32;
                        break;
                    case 3:
                        tBuff[1] = 0x33;
                        break;
                    case 4:
                        tBuff[1] = 0x34;
                        break;
                }
                //Gotta send it multiple times for some reason. I'm probably doing something wrong.
                //but doing it like this is faster than looking for a proper fix.
                port.write(tBuff, 'ascii');
                port.write(tBuff, 'ascii');
                port.write(tBuff, 'ascii');
                break;
        }
        api.interrupt = false;
    }

    if (statuscnt >= 10) {
        port.write("J", 'ascii');
        statuscnt = 0;
    }
    statuscnt++;

    setTimeout(() => {
        getStatus();
    }, 100);
}
getStatus();

const statusFields = [
    "magic_start",
    "btn_internal", //doesn't make sense, but changes on every button press
    "_B",
    "_C",
    "_D",
    "_E",
    "_F",
    "_G",
    "_H",
    "cabin_moving", //D=static, everything else= moving (maybe a countdown?)
    "floor_loc", // 1=UG, 4=
    "door_stat", // 0=closed, 4=open, 2=opening, 1=just before closing, 3=closing
    "door_timer", //0= static; everything else = moving, counting down
    "door_contact",//4=any kind of open, 0=closed
    "_L",
    "_M",
    "queued_destinations", //1=active queue, 0=no queue
    "_O",
    "_P",
    "_Q",
    "_R",
    "_S",
    "_T",
    "_U",
    "_V",
    "_W",
    "_X",
    "_Y",
    "_Z",
    "_1A",
    "_1B",
    "_1C",
    "limit_top",
    "_1D",
    "_1E",
    "_1F",
    "limit_bottom",
    "_1G",
    "_1H",
    "_1I",
    "_1J",
    "_1K",
    "_1L",
    "_1M",
    "hr_counter",
    "min_counter",
    "sec_counter",
    "_1P",
    "_1Q",
    "_1R",
    "_1S",
    "_1T",
    "_1U",
    "_1V",
    "_1W",
    "_1X",
    "_1Y",
    "_1Z",
    "magic_end"
];


function parseStatus(statusString) {
    var statusStringArr = statusString.match(/.{1,2}/g) ?? [];
    var statusTempstr = "";
    var statusPoints = [];

    for (let index = 0; index < statusStringArr.length; index++) {
        if (statusStringArr[index] != "24") {
            statusTempstr += statusStringArr[index];
        } else {
            statusPoints.push(statusTempstr);
            statusTempstr = "";
        }
    }
    statusPoints.push(statusTempstr);

    var statusObj = {};
    var newPublicStatus = {};

    for (let index = 0; index < statusPoints.length; index++) {

        var d = { format: "", hex: statusPoints[index] };


        //Formatted handling for hex-data

        var dAsAscii = "";
        var spoints = statusPoints[index].split(" ");
        spoints.forEach(sp => {
            dAsAscii += iconv.decode(Buffer.from(sp, "hex"), "UTF-8");
        });

        if (statusFields[index] == "btn_internal") {
            var b = parseInt(statusPoints[index]).toString(2);
            d.format = JSON.stringify([b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7]]);
        } else if (statusFields[index] == "cabin_moving") {
            if (dAsAscii == "D") {
                d.format = "stationary";
            } else {
                d.format = "moving (" + dAsAscii + ")";
            }
        }
        else if (statusFields[index] == "floor_loc") {
            switch (dAsAscii) {
                case "1":
                    d.format = "UG";
                    break;
                case "2":
                    d.format = "EG";
                    break;
                case "3":
                    d.format = "1OG";
                    break;
                case "4":
                    d.format = "2OG";
                    break;
            }

        }
        else if (statusFields[index] == "door_stat") {
            switch (dAsAscii) {
                case "0":
                    d.format = "Closed";
                    break;
                case "1":
                    d.format = "About to Close";
                    break;
                case "2":
                    d.format = "Opening";
                    break;
                case "3":
                    d.format = "Closing";
                    break;
                case "4":
                    d.format = "Open";
                    break;
            }
        }
        else if (statusFields[index] == "door_contact") {
            switch (dAsAscii) {
                case "0":
                    d.format = "Closed";
                    break;
                case "4":
                    d.format = "Open";
                    break;
            }
        }
        else if (statusFields[index] == "queued_destinations") {
            //1=active queue, 0=no queue
            switch (dAsAscii) {
                case "0":
                    d.format = "Active";
                    break;
                case "1":
                    d.format = "Inactive";
                    break;
            }
        }
        else {
            d.format = dAsAscii;
        }

        statusObj[statusFields[index]] = d;

        if (!statusFields[index].startsWith("_")) {
            newPublicStatus[statusFields[index]] = d;
        }
    }

    newPublicStatus["_date"] = new Date().toISOString();
    api.lastStatus = newPublicStatus;

    //console.log('\033[1;1H');
    //console.table(statusObj);
}