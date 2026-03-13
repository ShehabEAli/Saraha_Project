import { ConflictException, NotFoundException } from "../../common/utils/index.js";
import { UserModel } from "../../DB/model/user.model.js";




export const signup = async (inputs) => {
    const { username, email, password, phone } = inputs;

    const checkUserExist = await UserModel.findOne({ email });
    if (checkUserExist) {
        throw ConflictException({ message: "Email exist" });
    }
    const [user] = await UserModel.create([{ username, email, password, phone }]);
    return user
}

export const login = async (inputs) => {
    const { email, password } = inputs;

    const user = await UserModel.findOne({ email, password });
    if (!user) {
        throw NotFoundException({ message: "Invalid login credentials " });
    }
    return user
}