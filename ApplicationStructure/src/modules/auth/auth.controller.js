import { Router } from 'express'
import { signup } from './auth.service.js';
import { successResponse } from '../../common/utils/index.js';
const router = Router();
router.post("/signup", async (req, res, next) => {
    const result = await signup(req.body)
    // return res.status(201).json({ message: "Done signup", result })
    return successResponse({ res, status: 201, data: result })
})



export default router