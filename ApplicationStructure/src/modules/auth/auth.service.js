import { SALT_ROUND } from "../../../config/config.service.js";
import { HashApproachEnum } from "../../common/enums/security.enum.js";
import { compareHash, ConflictException, generateHash, NotFoundException } from "../../common/utils/index.js";
import { create, findOne, UserModel } from "../../DB/index.js";




export const signup = async (inputs) => {
    const { username, email, password, phone } = inputs;

    const checkUserExist = await findOne({
        model: UserModel,
        filter: { email },
        options: { lean: true }
    });
    if (checkUserExist) {
        throw ConflictException({ message: "Email exist" });
    }
    // const salt = await genSalt(SALT_ROUND, 'a')  not used currently
    const user = await create({
        model: UserModel,
        data: {
            username,
            email,
            password: await generateHash({ plainText: password }),
            phone
        }
    });
    return user
}

export const login = async (inputs) => {
    const { email, password } = inputs;

    const user = await findOne({
        model: UserModel,
        filter: { email },
    });
    if (!user) {
        throw NotFoundException({ message: "Invalid login credentials " });
    }
    if (! await compareHash({ plainText: password, cipherText: user.password })) {
        throw NotFoundException({ message: "Invalid login credentials " });
    }
    return user
}