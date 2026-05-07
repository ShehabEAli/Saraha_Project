import { ACCESS_TOKEN_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN } from "../../../config/config.service.js";
import { LogoutEnum } from "../../common/enums/security.enum.js";
import { baseRevokeTokenKey, deleteKey, keys, revokeTokenKey, set } from "../../common/services/index.js";
import { ConflictException, createLoginCredentials, decrypt, NotFoundException } from "../../common/utils/index.js";
import { create, deleteMany, findOne } from "../../DB/database.repository.js";
import { tokenModel, UserModel } from "../../DB/index.js";


const createRevokeToken = async ({ userId, jti, ttl }) => {
    await set({
        key: revokeTokenKey({ userId, jti }),
        value: jti,
        ttl
    })
    return;
}

export const logout = async ({ flag }, user, { jti, iat, sub }) => {

    let status = 200
    switch (flag) {
        case LogoutEnum.All:
            user.changeCredentialsTime = new Date()
            await user.save()

            await deleteKey(await keys(baseRevokeTokenKey(sub)))
            break;
        default:
            await createRevokeToken({
                userId: sub,
                jti,
                ttl: iat + REFRESH_TOKEN_EXPIRES_IN,
            })
            status = 201
            break;
    }
    return status
}

export const rotateToken = async (user, { sub, jti, iat }, issuer) => {
    if ((iat + ACCESS_TOKEN_EXPIRES_IN) * 1000 > Date.now() + (30000)) {
        throw ConflictException({ message: "Current access token still valid" })
    }
    await createRevokeToken({
        userId: sub,
        jti,
        ttl: iat + REFRESH_TOKEN_EXPIRES_IN,
    })

    return createLoginCredentials(user, issuer);
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

