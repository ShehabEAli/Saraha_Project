import { EmailEnum, ProviderEnum } from "../../common/enums/index.js";
import { blockOtpKey, deleteKey, get, incr, keys, maxAttemptOtpKey, otpKey, set, ttl } from "../../common/services/index.js";
import { BadRequestException, compareHash, ConflictException, createLoginCredentials, createNumberOtp, emailEvent, encrypt, generateHash, NotFoundException, sendEmail, verifyEmailTemplate } from "../../common/utils/index.js";
import { create, findOne, UserModel } from "../../DB/index.js";
import { OAuth2Client } from 'google-auth-library';



const sendEmailOtp = async ({ email, subject, title } = {}) => {
    const isBlockedTTL = await ttl(blockOtpKey({ email, subject }))
    if (isBlockedTTL > 0) {
        throw BadRequestException({ message: `Sorry you cannot request a new otp while you are blocked, please try again after ${isBlockedTTL} seconds` });
    }

    const remainingOtpTTL = await ttl(otpKey({ email, subject }))
    if (remainingOtpTTL > 0) {
        throw BadRequestException({ message: "Sorry you cannot request a new otp until the first one is expired, please try again later" });
    }

    const maxTrial = await get(maxAttemptOtpKey({ email, subject }))
    if (maxTrial >= 3) {
        await set({
            key: blockOtpKey({ email, subject }),
            value: 1,
            ttl: 420
        })
        throw BadRequestException({ message: "You have reached the the max trial" });
    }

    const code = await createNumberOtp()
    await set({
        key: otpKey({ email, subject }),
        value: await generateHash({ plainText: `${code}` }),
        ttl: 120
    })

    emailEvent.emit("sendEmail", async () => {
        await sendEmail({
            to: email,
            subject,
            html: verifyEmailTemplate({ code, title })
        })

        await incr(maxAttemptOtpKey({ email, subject }))
    })
}

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
            phone: encrypt(phone)
        }
    });

    await sendEmailOtp({ email, subject: EmailEnum.ConfirmEmail, title: "Verify Email" })
    return user
}

export const confirmEmail = async (inputs) => {
    const { email, otp } = inputs;

    const hashOtp = await get(otpKey({ email, subject: EmailEnum.ConfirmEmail }))
    if (!hashOtp) {
        throw NotFoundException({ message: "Expired or Invalid otp" });
    }

    const account = await findOne({
        model: UserModel,
        filter: { email, confirmEmail: { $exists: false }, provider: ProviderEnum.System },
    });
    if (!account) {
        throw NotFoundException({ message: "Fail to find matching account" });
    }

    if (!await compareHash({ plainText: otp, cipherText: hashOtp })) {
        throw ConflictException({ message: "Invalid otp" });
    }

    account.confirmEmail = new Date()
    await account.save()

    await deleteKey(await keys(otpKey({ email })))
    return;
}

export const resendConfirmEmail = async (inputs) => {
    const { email } = inputs;

    const account = await findOne({
        model: UserModel,
        filter: { email, confirmEmail: { $exists: false }, provider: ProviderEnum.System },
    });
    if (!account) {
        throw NotFoundException({ message: "Fail to find matching account" });
    }

    await sendEmailOtp({ email, subject: EmailEnum.ConfirmEmail, title: "Verify Email" })

    return;
}

export const login = async (inputs, issuer) => {
    const { email, password } = inputs;

    const user = await findOne({
        model: UserModel,
        filter: { email, provider: ProviderEnum.System, confirmEmail: { $exists: true } },
    });
    if (!user) {
        throw NotFoundException({ message: "Invalid login credentials " });
    }
    if (! await compareHash({ plainText: password, cipherText: user.password })) {
        throw NotFoundException({ message: "Invalid login credentials " });
    }
    return createLoginCredentials(user, issuer);
}


/*
{
  iss: 'https://accounts.google.com',
  azp: '466110454802-lg3qumtqeijm1u4s86vdrmhp7egsaeh9.apps.googleusercontent.com',
  aud: '466110454802-lg3qumtqeijm1u4s86vdrmhp7egsaeh9.apps.googleusercontent.com',
  sub: '109392006632074925525',
  email: 'shehabelsehelly@gmail.com',
  email_verified: true,
  nbf: 1775780416,
  name: 'Shehab Elsehelly',
  picture: 'https://lh3.googleusercontent.com/a/ACg8ocJTtsn9u_Kx36miWJyCe8b6q6G3BnNWq7kLU8uBoqXvF4M6h58E=s96-c',
  given_name: 'Shehab',
  family_name: 'Elsehelly',
  iat: 1775780716,
  exp: 1775784316,
  jti: '34deda9ec17a8a6d33e8709af690010d50e589fe'
}

 */
const verifyGoogleAccount = async (idToken) => {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
        idToken,
        audience: "466110454802-lg3qumtqeijm1u4s86vdrmhp7egsaeh9.apps.googleusercontent.com",
        // Specify the WEB_CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[WEB_CLIENT_ID_1, WEB_CLIENT_ID_2, WEB_CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    if (!payload?.email_verified) {
        throw BadRequestException({ message: "Fail to verify by google" })
    }
    return payload
}

export const loginWithGmail = async (idToken, issuer) => {
    const payload = await verifyGoogleAccount(idToken);
    console.log(payload);

    const user = await findOne({
        model: UserModel,
        filter: { email: payload.email, provider: ProviderEnum.Google }
    })
    if (!user) {
        throw NotFoundException({ message: "Not registered account" })
    }

    return await createLoginCredentials(user, issuer);
}

export const signupWithGmail = async (idToken, issuer) => {
    const payload = await verifyGoogleAccount(idToken);
    console.log(payload);

    const checkExist = await findOne({
        model: UserModel,
        filter: { email: payload.email }
    })
    if (checkExist) {
        if (checkExist.provider != ProviderEnum.Google) {
            throw ConflictException({ message: "Invalid login provider" })
        }
        return { status: 200, credentials: await loginWithGmail(idToken, issuer) };  //loginWithGmail
    }

    const user = await create({
        model: UserModel,
        data: {
            firstName: payload.given_name,
            lastName: payload.family_name,
            email: payload.email,
            profilePicture: payload.picture,
            confirmEmail: new Date(),
            provider: ProviderEnum.Google

        }
    })

    return { status: 201, credentials: await createLoginCredentials(user, issuer) };
}