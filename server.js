const Promise = require('bluebird');
const pm2 = Promise.promisifyAll(require('pm2'));
const cliSpinners = require('cli-spinners');
const ora = require('ora');
const path = require('path');

const cwd = process.cwd();

var server = {
    start: function () {
        const spinner = new ora({
            text: 'Starting Server',
            spinner: cliSpinners.bouncingBall,
            color: 'cyan'
        }).start();
        return pm2.connectAsync().then(() => {
            return pm2.startAsync({
                name: 'TCG_LISA',
                script: path.join(__dirname, './index.js'),
                cwd: cwd,
                output: '/dev/null',
                error: '/dev/null',
                minUptime: 5000,
                maxRestarts: 5,
                args: 'f:server.log'
            }).then(() => {
                spinner.text = 'Server started successfully';
            }).finally(() => {
                pm2.disconnect();
                spinner.succeed();
            });
        });
    },
    stop: function () {
        const spinner = new ora({
            text: 'Stopping Server',
            spinner: cliSpinners.bouncingBall,
            color: 'cyan'
        }).start();
        return pm2.connectAsync().then(() => {
            return pm2.stopAsync('TCG_LISA').then(() => {
                spinner.text = 'Server stopped successfully';
            }).finally(() => {
                pm2.disconnect();
                spinner.succeed();
            });
        }).catch(err => {
            console.log('Error: ' + err);
            process.exit(1)
        });
    },
    showHelp: function () {
        console.log('TCG LiSA server help:');
        console.log('start: start the TCG LiSA server');
        console.log('stop: stop the TCG LiSA server');
        console.log('restart: restart the TCG LiSA server');
        console.log('help: show this help');
    }
}

switch (process.argv[2]) {
    case 'start':
        server.start();
        break;
    case 'stop':
        server.stop();
        break;
    case 'restart':
        server.stop().finally(() => {
            server.start();
        });
        break;
    case 'help':
        server.showHelp();
        break;
    default:
        console.log('Error: Unknown argument');
        server.showHelp();
        break;
}