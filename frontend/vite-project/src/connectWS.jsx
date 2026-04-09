import {io} from 'socket.io-client'
export const connectionWS = ()=>{
    return io('http://localhost:3000')
}