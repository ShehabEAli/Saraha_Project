import { NotFoundException } from "../../common/utils/index.js";
import { create, find, findOne, findOneAndDelete } from "../../DB/database.repository.js";
import { MessageModel, UserModel } from "../../DB/index.js";



export const sendMessage = async (receiverId, { content = undefined } = {}, files, user) => {
    const account = await findOne({
        model: UserModel,
        filter: { _id: receiverId, confirmEmail: { $exists: true } }
    })
    if (!account) {
        throw NotFoundException({ message: "Fail to find matched receiver account" })
    }
    const message = await create({
        model: MessageModel,
        data: {
            content,
            attachments: files.map((file) => file.finalPath),
            receiverId,
            senderId: user ? user._id : undefined
        }
    })
    return message;
}

export const deleteMessage = async (messageId, user) => {
    const message = await findOneAndDelete({
        model: MessageModel,
        filter: {
            _id: messageId,
            receiverId: user._id
        },
        select: "-senderId"
    })
    if (!message) {
        throw NotFoundException({ message: "Invalid message or not authorized action" })
    }
    return message;
}

export const getMessage = async (messageId, user) => {
    const message = await findOne({
        model: MessageModel,
        filter: {
            _id: messageId,
            $or: [
                { senderId: user._id },
                { receiverId: user._id }
            ]
        },
        select: "-senderId"
    })
    if (!message) {
        throw NotFoundException({ message: "Invalid message or not authorized action" })
    }
    return message;
}

export const getMessages = async (user) => {
    const messages = await find({
        model: MessageModel,
        filter: {
            $or: [
                { senderId: user._id },
                { receiverId: user._id }
            ]
        },
        select: "-senderId"
    })

    return messages;
}