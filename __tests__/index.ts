import {uws, UWSProvider, UWSProviderWithToken} from 'teckos'
import {ITeckosClient, TeckosClientWithJWT} from "../src";

const PORT = 3000

describe('Example connection using JWT', () => {
    const token = 'validtoken123'
    let server: UWSProvider
    let client: ITeckosClient

    beforeAll((done) => {
        // Create server and client
        const app = uws.App()
        server = new UWSProviderWithToken(app, (reqToken) => {
            return reqToken === token
        })
        client = new TeckosClientWithJWT(
          `ws://localhost:${PORT}`,
          {
              reconnection: false,
          },
          token,
          {
              say: 'hello',
          }
        )
        done()
    })

    afterAll((done) => {
        if (client && client.connected) {
            client.disconnect()
        }
        done()
    })

    it('Server can be started', (done) => {
        server.listen(3000)
          .then(() => done())
    })

    it('Client can connect', (done) => {
        client.once("connect", () => {
            client.disconnect()
            done()
        })
        client.connect()
    })

    it('Client can send messages', (done) => {
        server.onConnection(socket => {
            socket.once("hi", () => {
                socket.emit("hello")
            })
        })
        client.once("hello", () => {
            client.disconnect()
            done()
        })
        client.connect()
        client.once("connect", () => client.emit("hi"))
    })

    it('Example connection', (done) => {
        let gotRespond = false
        let gotCallbackAnswered = false
        let serverEmittedDisconnect = false
        let clientEmittedDisconnect = false
        server.onConnection(socket => {
            socket.on("hi", () => socket.emit("hello"))
            socket.on("asking", (callback: (result: string) => void) => {
                callback("answer")
            })
            socket.on("disconnect", () => {
                serverEmittedDisconnect = true
            })
        })

        client.on("hello", () => {
            gotRespond = true
            console.log("GOT HELLO")
        })

        client.on("disconnect", () => {
            clientEmittedDisconnect = true
            console.info("DISCONNECT")
        })

        client.on("connect", () => {
            client.emit("hi")
            client.emit("asking", ((result: string) => {
                gotCallbackAnswered = true
                expect(result).toEqual("answer")
                client.disconnect()
            }))
        })
        client.connect()

        setTimeout(() => {
            expect(gotRespond).toBeTruthy()
            expect(gotCallbackAnswered).toBeTruthy()
            expect(clientEmittedDisconnect).toBeTruthy()
            expect(serverEmittedDisconnect).toBeTruthy()
            done()
        }, 10)
    })
})
