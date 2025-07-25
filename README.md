# LiSA-Elevator-Controller
A server which allows controlling Elevators using the LiSA-family of controllers by Schneider Steuerungstechnik GmbH.
This is not an official project by Schneider Steuerungstechnik GmbH. Use at your own risk.

## Setup
After Downloading the Files and installing the dependencies with `npm install`, the Serial Device and Webserver-Password needs to be set.

### serial Device
The Serial Device to be used get configured on line 8 in index.js: https://github.com/AI4CARE/LiSA-Elevator-Controller/blob/1f092a4a35c67b1d76f152f266457f8097392d46/index.js#L8

### Webserver-Password
Passwords are stored unencrypted (PRs are welcome) in a file called `authinfo.json`. It's easiest to rename `authinfo_example.json` and go from there.

## Starting the Server
The Server can be started as Background-Process in the terminal using `node server.js start`.
For Debugging it can also be run directly using `node main.js`

## About
This software was written based on information gathered by snooping the communication between the official management-application and the controller.
It's part of Usecase 4 of [SMART FOREST 5G Clinics](https://zaf.th-deg.de/public/project/238) which funded by the German Federal Ministry for Digital and Transport.
[Federal Ministry for Digital and Transport Logo](bdv.jpeg)
