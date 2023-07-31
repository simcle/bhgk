const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt')
const app = express();
app.use(cors());
app.use(express.json())

const adamPlc = require('./modbus')
adamPlc.connectTCP('192.168.100.121', {port: 502})
adamPlc.setID(1);


const client  = mqtt.connect('mqtt://m9m3ohlehyci-ifk8otj1ej1z.cedalo.dev:1883', {
    username: 'bhgk',
    password: 'pwlan123'
})

client.subscribe(['level', 'valve', 'mode']);

setInterval(() => {
    // 2136  Water level Thomson #5
    adamPlc.readHoldingRegisters(2135, 1, function (err, data) {
        if(err) {
            console.log(err)
        }
        const val = data.buffer.readInt16BE(0)
        client.publish('level', `${val}`)
        console.log('water level', val)
    })
    // 2216  Valve Feedback Thomson #5
    adamPlc.readHoldingRegisters(2215, 1, function(err, data) {
        if(err) {
            console.log(err)
        }
        const val = data.buffer.readInt16BE(0)
        client.publish('valveFeedback', `${val}`)
        // console.log('valve Feedback', val)
    })

    // 2314 Valve Status @ Thomson #5
    adamPlc.readHoldingRegisters(2313, 1, function(err, data) {
        if(err) {
            console.log(err)
        }
        const val = data.buffer.readInt16BE(0)
        client.publish('valveStatus', `${val}`)
        // console.log('valve status', val)
    })


    // 2009  Mode Valve Thomson #5 FC COIL
    adamPlc.readCoils(2008, 1, function(err, data) {
        if(err) {
            console.log(err)
        }
        const val = data.data[0]
        client.publish('valveMode', `${val}`)
        // console.log('valve mode', val)

    })
}, 500)


client.on('message', (topic, message) => {
    // 2132	 Manual input dari HMI
    if(topic == 'valve') {
        let val = parseInt(message.toString())
        console.log(val)
        adamPlc.writeRegister(2131, val)
        .then(data => {
            console.log('response', data)
        })
        .catch(e => {
            console.log(e.message)
        })
    }

    // 2009  Mode Valve Thomson #5 FC COIL
    if(topic == 'mode') {
        let val = message.toString()
       
        if(val == 'true') {
            val = 1

        }
        if(val == 'false') {
            val = 0
        }
        console.log(val)
        adamPlc.writeCoil(2008, val)
        .then(data => {
            console.log('response', data)
        })
        .catch(e => {
            console.log(e.message)
        })
    }
})


const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=> console.log('server running on port '+PORT))