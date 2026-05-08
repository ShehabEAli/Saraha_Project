import joi from 'joi';
import { generalValidationFields } from '../../common/utils/index.js';

export const login = {
    body: joi.object().keys({
        email: generalValidationFields.email.required(),
        password: generalValidationFields.password.required(),

    }).required()
}

export const signup = {
    body: login.body.append().keys({
        username: generalValidationFields.username.required(),
        phone: generalValidationFields.phone.required(),
        confirmPassword: generalValidationFields.confirmPassword("password").required()
    }).required()

}

export const resendConfirmEmail = {
    body: joi.object().keys({
        email: generalValidationFields.email.required(),
    }).required()
}

export const confirmEmail = {
    body: resendConfirmEmail.body.append({
        otp: generalValidationFields.otp.required()
    }).required()
}

export const resetForgetPasswordCode = {
    body: confirmEmail.body.append({
        password: generalValidationFields.password.required(),
        confirmPassword: generalValidationFields.confirmPassword("password").required()
    }).required()
}
