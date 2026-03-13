import { ConflictException, NotFoundException } from "../../common/utils/index.js";
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
    const user = await create({
        model: UserModel,
        data: { username, email, password, phone }
    });
    return user
}

export const login = async (inputs) => {
    const { email, password } = inputs;

    const user = await findOne({
        model: UserModel,
        filter: { email, password },
    });
    if (!user) {
        throw NotFoundException({ message: "Invalid login credentials " });
    }
    return user
}