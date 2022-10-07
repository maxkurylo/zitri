# Zitri

We are an application for sharing files. Like the Apple AirDrop but for all systems and devices

### How to use

1. Join the same Wi-Fi on two devices
2. Open [zitri.io](https://zitri.io) on both of them
3. Send your data!

Pretty easy, isn't it?

> If you do not have a common Wi-Fi just create a room and open it in both devices (for example, [zitri.io/some-room](https://zitri.io/some-room))


### Our strength

Transferred files and messages are not stored on server. Communication between users is direct.
So if you want to share some secret information which is not intended to be stored anywhere, Zitri is a good option.

And it's fast! No need to upload and download from cloud server. No file processing. Save up to 50% of data transfer time

This app can also be useful for business. For example, an instant photo service.
There is no need anymore to pay for cloud storage - you can send photos directly to your customer. 


### Development

Application has Front End and Back End in one project. No database is used (except JS object where the room information is stored)

Use `yarn start-dev` to run the application locally.

#### Technological stack

- yarn as package manager
- Angular
- Express
- Socket.io
- WebRTC for sharing data
- TypeScript as basic language




