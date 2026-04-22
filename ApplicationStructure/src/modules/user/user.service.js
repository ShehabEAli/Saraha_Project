import { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from "../../../config/config.service.js";
import { LogoutEnum } from "../../common/enums/security.enum.js";
import { ConflictException, createLoginCredentials, decrypt, NotFoundException } from "../../common/utils/index.js";
import { create, deleteMany, findOne } from "../../DB/database.repository.js";
import { tokenModel, UserModel } from "../../DB/index.js";


export const logout = async ({ flag }, user, { jti, iat }) => {

    let status = 200
    switch (flag) {
        case LogoutEnum.All:
            user.changeCredentialsTime = new Date()
            await user.save()

            await deleteMany({ model: tokenModel, filter: { userId: user._id } })
            break;
        default:
            await create({
                model: tokenModel,
                data: {
                    userId: user._id,
                    jti,
                    expiresIn: new Date((iat + REFRESH_TOKEN_EXPIRES_IN) * 1000)
                }
            })
            status = 201
            break;
    }
    return status
}

export const profileImage = async (file, user) => {
    user.profilePicture = file.finalPath
    await user.save()
    return user
}

export const profileCoverImage = async (files, user) => {
    user.CoverProfilePicture = files.map(file => file.finalPath)
    await user.save()
    return user
}

export const shareProfile = async (userId) => {
    const account = findOne({ model: UserModel, filter: { _id: userId }, select: "-password" })
    if (!account) {
        throw NotFoundException({ message: "Invalid share account" })
    }
    if (account.phone) {
        account.phone = await decrypt(account.phone)
    }
    return account
}

export const profile = async (user) => {
    return user
}

export const rotateToken = async (user, { jti, iat }, issuer) => {
    if ((iat + ACCESS_TOKEN_EXPIRES_IN) * 1000 > Date.now() + (30000)) {
        throw ConflictException({ message: "Current access token still valid" })
    }
    await create({
        model: tokenModel,
        data: {
            userId: user._id,
            jti,
            expiresIn: new Date((iat + REFRESH_TOKEN_EXPIRES_IN) * 1000)
        }
    })
    return createLoginCredentials(user, issuer);
}