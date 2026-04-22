import { decode } from "jsonwebtoken";
import { TokenTypeEnum } from "../common/enums/index.js";
import { BadRequestException, decodeToken, ForbiddenException } from "../common/utils/index.js";
import { login } from "../modules/auth/auth.service.js";

export const authentication = (tokenType = TokenTypeEnum.Access) => {
    return async (req, res, next) => {

        const [key, credential] = req.headers?.authorization?.split(" ") || [];
        console.log({ key, credential });

        switch (key) {
            case "Basic":
                const [email, password] = Buffer.from(credential, 'base64')?.toString()?.split(":")
                await login({ email, password }, `${req.protocol}://${req.host}`)
                console.log(data);
                break;
            default:
                const { user, decoded } = await decodeToken({ token: credential, tokenType })
                req.user = user;
                req.decoded = decoded;
                break;

        }
        next()
    }
}

export const authorization = (accessRoles = []) => {
    return async (req, res, next) => {
        if (!accessRoles.includes(req.user.role)) {
            throw ForbiddenException({ message: "Not authorized account" })
        }
        next()
    }
}