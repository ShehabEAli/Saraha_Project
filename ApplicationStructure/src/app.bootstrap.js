
import { deleteKey, get, keys, set, update } from './common/services/index.js'
import { authenticationDB, connectRedis, redisClient } from './DB/index.js'
import { authRouter, messageRouter, userRouter } from './modules/index.js'
import { globalErrorHandling, sendEmail } from './common/utils/index.js'
import { ORIGINS, port } from '../config/config.service.js'
import path, { resolve } from 'node:path'
import { log } from 'node:console'
import { ipKeyGenerator, rateLimit } from 'express-rate-limit'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import axios from 'axios';
import geoip from 'geoip-lite'

async function bootstrap() {
    const app = express()

    const fromWhere = async (ip) => {
        try {
            const response = await axios.get(`http://ip-api.com/json/${ip}`)
            console.log(response.data);
            return response.data
        } catch (error) {
            console.error(error)
            return null
        }
    }
    //convert buffer data

    // var corsOptions = {
    //     origin: function (origin, callback) {

    //         if (!ORIGINS.includes(origin)) {
    //             callback(new Error("Not authorized origin", { cause: { status: 403 } }), ORIGINS)
    //         } else {
    //             callback(null, ORIGINS)
    //         }
    //     }
    // }



    // const limiter = rateLimit({
    //     windowMs: 2 * 60 * 1000,
    //     limit: async function (req) {
    //         // const { countryCode } = await fromWhere(req.ip) || {};

    //         console.log(geoip.lookup(req.ip));
    //         const { country } = geoip.lookup(req.ip)

    //         return country == "EG" ? 5 : 0
    //     },
    //     // statusCode:500,
    //     // message:"Too many trial",
    //     legacyHeaders: true,
    //     standardHeaders: "draft-8",
    //     requestPropertyName: "ratelimit",
    //     // skipFailedRequests:true,
    //     skipSuccessfulRequests: true,
    //     handler: (req, res, next) => {
    //         return res.status(429).json({ message: "Too many requests" })
    //     },
    //     keyGenerator: (req, res, next) => {
    //         const ip = ipKeyGenerator(req.ip, 56)
    //         console.log(`${ip}-${req.path}`);
    //         return `${ip}-${req.path}`
    //     },
    //     store: {
    //         async incr(key, cb) { // get called by keyGenerator
    //             try {
    //                 const count = await redisClient.incr(key);
    //                 if (count === 1) await redisClient.expire(key, 120); // 2 min TTL
    //                 cb(null, count);
    //             } catch (err) {
    //                 cb(err);
    //             }
    //         },

    //         async decrement(key) {  // called by kipFailedRequests:true ,  skipSuccessfulRequests:true,
    //             if (await redisClient.exists(key)) {
    //                 await redisClient.decr(key);
    //             }
    //         },
    //     },
    // })
    
    app.set("trust proxy", true)
    app.use(cors(), helmet(), express.json())
    app.use("/uploads", express.static(resolve("../uploads")))
    //DB Connection
    await authenticationDB()
    await connectRedis()


    //application routing
    app.get('/', async (req, res) => {
        // console.log(await fromWhere(req.ip));

        res.send('Hello World!')
    })

    app.use('/auth', authRouter)
    app.use('/user', userRouter)
    app.use('/message', messageRouter)



    //invalid routing
    app.use('{/*dummy}', (req, res) => {
        return res.status(404).json({ message: "Invalid application routing" })
    })

    //error-handling
    app.use(globalErrorHandling)

    app.listen(port, () => console.log(`Example app listening on port ${port}!`))
}
export default bootstrap