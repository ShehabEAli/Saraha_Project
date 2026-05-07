
import { port } from '../config/config.service.js'
import { globalErrorHandling, sendEmail } from './common/utils/index.js'
import { authenticationDB, connectRedis, redisClient } from './DB/index.js'
import { authRouter, userRouter } from './modules/index.js'
import { resolve } from 'node:path'
import express from 'express'
import cors from 'cors'
import { log } from 'node:console'
import { deleteKey, get, keys, set, update } from './common/services/index.js'

async function bootstrap() {
    const app = express()
    //convert buffer data
    app.use(cors(), express.json())
    app.use("/uploads", express.static(resolve("../uploads")))
    //DB Connection
    await authenticationDB()
    await connectRedis()

    // await sendEmail({
    //     to: "nnmamdouh456@gmail.com",
    //     cc: ["menna123mamdouh@gmail.com"],
    //     bcc: ["eltawhed148@gmail.com"],
    //     subject: "Test",
    //     html: "<h2>HELLO</h2>"
    // })

    //application routing
    app.get('/', (req, res) => res.send('Hello World!'))
    app.use('/auth', authRouter)
    app.use('/user', userRouter)


    //invalid routing
    app.use('{/*dummy}', (req, res) => {
        return res.status(404).json({ message: "Invalid application routing" })
    })

    //error-handling
    app.use(globalErrorHandling)

    app.listen(port, () => console.log(`Example app listening on port ${port}!`))
}
export default bootstrap