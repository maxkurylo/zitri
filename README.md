# Zitri

We are an application for sharing files. Like Apple AirDrop but for all systems and devices

### Our strength

Transferred files and messages are not stored on server. All communication between users is direct.
So if you want to share some secret information which is not intended to be store anywhere - Zitri is a good option.

And it's fast! No need to upload and download from cloud server. No file processing. Save up to 50% of data transfer time

This app is useful for business. For example, an instant photo service.
There is no need anymore to pay for cloud storage - you can send photos directly to your customer. 

### How to use

1. Join https://zitri.io
2. Scan QR code with another device or give another person a link to your private room
3. Select user to send files and send them

Pretty easy, isn't it?

#### Tips and Tricks

If you are connected to the same Wi-Fi as another device or person there is no need to share the link.
Just join https://zitri.io on both devices and it will detect them automatically!

You can put QR-code to your Zitri room everywhere. So that your customer can quickly scan it and get the files from you

### Development

Now it's gonna be boring, developers only information

Application has Front End and Back End in one project. No database is used (except JS object where room information stored)

Use `yarn start-dev` to run the application locally.

#### Technological stack

- yarn as package manager
- Angular
- Express
- Socket.io
- WebRTC for sharing data
- TypeScript as basic language




