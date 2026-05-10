import { Router } from "express";
import { logout, profile, profileCoverImage, profileImage, rotateToken, shareProfile, updatePassword } from "./user.service.js";
import { fileFieldValidation, localFileUpload, successResponse } from "../../common/utils/index.js";
import { validation, authentication, authorization } from "../../middleware/index.js";
import { RoleEnum, TokenTypeEnum } from "../../common/enums/index.js";
import * as validators from './user.validation.js'
import { messageRouter } from "../message/index.js";
const router = Router()

router.use("/:receiverId/message", messageRouter)
router.post("/logout",
    authentication(),
    async (req, res, next) => {
        const status = await logout(req.body, req.user, req.decoded);
        return successResponse({ res, status })
    })

router.patch("/password",
    authentication(),
    validation(validators.updatePassword),
    async (req, res, next) => {
        const credentials = await updatePassword(req.body, req.user, `${req.protocol}://${req.host}`)
        return successResponse({ res, status: 201, data: { ...credentials } })

    })

router.patch("/profile-image",
    authentication(),
    localFileUpload({
        customPath: 'user/profile',
        validation: fileFieldValidation.image,
        maxSize: 5
    }).single("attachment"),
    validation(validators.profileImage),
    async (req, res, next) => {
        const account = await profileImage(req.file, req.user)
        return successResponse({ res, data: { account } })
    })

router.patch("/profile-cover-image",
    authentication(),
    localFileUpload({
        customPath: 'user/profile/cover',
        validation: fileFieldValidation.image,
        maxSize: 5
    }).array("attachments"),
    validation(validators.profileCoverImage),
    async (req, res, next) => {
        const account = await profileCoverImage(req.files, req.user)
        return successResponse({ res, data: { account } })
    })

router.get("/",
    authentication(),
    authorization([RoleEnum.User]),
    async (req, res, next) => {
        const account = await profile(req.user)
        return successResponse({ res, data: account })
    })

router.get("/:userId/share-profile",
    validation(validators.shareProfile),
    async (req, res, next) => {
        const account = await shareProfile(req.params.userId)
        return successResponse({ res, data: account })
    })

router.post("/rotate-token",
    authentication(TokenTypeEnum.Refresh), async (req, res, next) => {
        const credentials = await rotateToken(req.user, req.decoded, `${req.protocol}://${req.host}`)
        return successResponse({ res, status: 201, data: { ...credentials } })
    })

export default router