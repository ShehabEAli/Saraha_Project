import { Router } from "express";
import { profile } from "./user.service.js";
import { successResponse } from "../../common/utils/index.js";
const router = Router()

router.get("/", (req, res, next) => {
    const result = profile(req.query.id)
    // return res.status(200).json({ message: "Profile", result })
    return successResponse({ res, data: result })
})
export default router