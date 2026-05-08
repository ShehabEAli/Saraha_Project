import { Router } from 'express'
import { confirmEmail, login, requestForgetPasswordOtp, resendConfirmEmail, resetForgetPasswordOtp, signup, signupWithGmail, verifyForgetPasswordOtp } from './auth.service.js';
import { successResponse } from '../../common/utils/index.js';
import * as validators from './auth.validation.js'
import { validation } from '../../middleware/validation.middleware.js';

const router = Router();

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

router.post("/login", validation(validators.login), async (req, res, next) => {
    const credentials = await login(req.body, `${req.protocol}://${req.host}`)
    return successResponse({ res, data: { ...credentials } })
})

router.post("/signup/gmail", async (req, res, next) => {
    const { status, credentials } = await signupWithGmail(req.body.idToken, `${req.protocol}://${req.host}`);
    return successResponse({ res, status, data: { ...credentials } });
})

export default router