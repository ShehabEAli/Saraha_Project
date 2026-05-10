import joi from "joi";
import { generalValidationFields } from "../../common/utils/validation.js";
import { fileFieldValidation } from "../../common/utils/index.js";


export const getMessage = {
    params: joi.object().keys({
        messageId: generalValidationFields.id.required()
    }).required(),
}

export const sendMessage = {
    params: joi.object().keys({
        receiverId: generalValidationFields.id.required()
    }).required(),
    body: joi.object().keys({
        content: joi.string().min(2).max(10000)
    }),
    files: joi.array().items(generalValidationFields.file(fileFieldValidation.image)).min(0).max(2)
}