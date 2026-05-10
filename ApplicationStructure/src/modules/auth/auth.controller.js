import { Router } from 'express'
import { confirmEmail, login, requestForgetPasswordOtp, resendConfirmEmail, resetForgetPasswordOtp, signup, signupWithGmail, verifyForgetPasswordOtp } from './auth.service.js';
import { successResponse } from '../../common/utils/index.js';
import * as validators from './auth.validation.js'
import { validation } from '../../middleware/validation.middleware.js';
import geoip from 'geoip-lite'
import { redisClient } from '../../DB/redis.connection.db.js';
import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { deleteKey } from '../../common/services/redis.service.js';
const router = Router();

const loginLimiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    limit: async function (req) {
        // const { countryCode } = await fromWhere(req.ip) || {};

        console.log(geoip.lookup(req.ip));
        const { country } = geoip.lookup(req.ip)

        return country == "EG" ? 5 : 0
    },
    // statusCode:500,
    // message:"Too many trial",
    legacyHeaders: true,
    standardHeaders: "draft-8",
    requestPropertyName: "ratelimit",
    // skipFailedRequests: true,
    skipSuccessfulRequests: true,
    handler: (req, res, next) => {
        return res.status(429).json({ message: "Too many requests" })
    },
    keyGenerator: (req, res, next) => {
        const ip = ipKeyGenerator(req.ip, 56)
        console.log(`${ip}-${req.path}`);
        return `${ip}-${req.path}`
    },
    store: {
        async incr(key, cb) { // get called by keyGenerator
            try {
                const count = await redisClient.incr(key);
                if (count === 1) await redisClient.expire(key, 120); // 2 min TTL
                cb(null, count);
            } catch (err) {
                cb(err);
            }
        },

        async decrement(key) {  // called by skipFailedRequests:true ,  skipSuccessfulRequests:true,
            if (await redisClient.exists(key)) {
                await redisClient.decr(key);
            }
        },
    },
})

router.post("/login", loginLimiter, validation(validators.login), async (req, res, next) => {
    const credentials = await login(req.body, `${req.protocol}://${req.host}`)
    await deleteKey(`${req.ip}-${req.path}`)
    return successResponse({ res, data: { ...credentials } })
})

router.post(
    "/signup",
    validation(validators.signup),
    async (req, res, next) => {
        const account = await signup(req.body)
        return successResponse({ res, status: 201, data: { account } })
    })

router.patch(
    "/confirm-email",
    validation(validators.confirmEmail),
    async (req, res, next) => {
        await confirmEmail(req.body)
        return successResponse({ res })
    })

router.patch(
    "/resend-confirm-email",
    validation(validators.resendConfirmEmail),
    async (req, res, next) => {
        await resendConfirmEmail(req.body)
        return successResponse({ res })
    })

router.post(
    "/request-forget-password-code",
    validation(validators.resendConfirmEmail),
    async (req, res, next) => {
        await requestForgetPasswordOtp(req.body)
        return successResponse({ res })
    })

router.patch(
    "/verify-forget-password-code",
    validation(validators.confirmEmail),
    async (req, res, next) => {
        await verifyForgetPasswordOtp(req.body)
        return successResponse({ res })
    })

router.patch(
    "/reset-forget-password-code",
    validation(validators.resetForgetPasswordCode),
    async (req, res, next) => {
        await resetForgetPasswordOtp(req.body)
        return successResponse({ res })
    })

router.post("/signup/gmail", async (req, res, next) => {
    const { status, credentials } = await signupWithGmail(req.body.idToken, `${req.protocol}://${req.host}`);
    return successResponse({ res, status, data: { ...credentials } });
})

export default router