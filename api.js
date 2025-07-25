const fs = require('fs');
const path = require('path');

var api = {
    lastStatus: {},
    interrupt: false,
    init: function (app) {

        //https://stackoverflow.com/questions/23616371/basic-http-authentication-with-node-and-express-4
        app.use((req, res, next) => {

            // -----------------------------------------------------------------------
            // authentication middleware

            var authInfo = false;

            try {
                var ai = fs.readFileSync(path.join(__dirname, './authinfo.json'));
                ai = JSON.parse(ai);
                authInfo = { login: ai.name, password: ai.pass }
            } catch (error) {
                console.error(error);
            }

            if (!authInfo) {
                process.exit(1);
            }

            const auth = authInfo

            // parse login and password from headers
            const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
            const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')

            // Verify login and password are set and correct
            if (login && password && login === auth.login && password === auth.password) {
                // Access granted...
                return next()
            }

            // Access denied...
            res.set('WWW-Authenticate', 'Basic realm="401"') // change this
            res.status(401).send('Authentication required.') // custom message

            // -----------------------------------------------------------------------

        })

        app.get('/api/ping', function (req, res) {
            console.log('recieved an request on /api/ping');
            res.status(200).send("pong");
        });

        app.get('/api/status', function (req, res) {
            console.log('recieved an request on /api/status');
            res.status(200).send(JSON.stringify(api.lastStatus));
        });

        app.get('/api/gotofloor', function (req, res) {
            console.log('recieved an request on /api/gotofloor');
            if (req.headers.floornr) {
                var ok = api.gotoFloor(req.headers.floornr);
                if (ok) {
                    res.status(200).send("ok");
                } else {
                    res.status(400).send("floornr out of range");
                }
            } else {
                res.status(400).send("missing argument");
            }
        });
    },
    gotoFloor: function (floorNr) {
        floorNr = Math.round(parseInt(floorNr));
        if (floorNr < 1 || floorNr > 4) {
            return false;
        }
        api.interrupt = { type: "I", val: floorNr };
        return true;
    }
}
module.exports = api;