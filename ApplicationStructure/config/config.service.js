import { resolve } from 'node:path'
import { config } from 'dotenv'

export const NODE_ENV = process.env.NODE_ENV

const envPath = {
    development: `.env.development`,
    production: `.env.production`,
}
console.log({ en: envPath[NODE_ENV] });

config({ path: resolve(`./config/${envPath[NODE_ENV]}`) })

export const port = process.env.PORT ?? 7000

export const DB_URI = process.env.DB_URI

export const SALT_ROUND = parseInt(process.env.SALT_ROUND ?? '10')
export const IV_LENGTH = parseInt(process.env.IV_LENGTH ?? '16')
export const ENC_SECRET_KEY = Buffer.from(process.env.ENC_SECRET_KEY)

export const USER_ACCESS_TOKEN_SECRET_KEY = process.env.USER_ACCESS_TOKEN_SECRET_KEY
export const USER_REFRESH_TOKEN_SECRET_KEY = process.env.USER_REFRESH_TOKEN_SECRET_KEY

export const SYSTEM_ACCESS_TOKEN_SECRET_KEY = process.env.SYSTEM_ACCESS_TOKEN_SECRET_KEY
export const SYSTEM_REFRESH_TOKEN_SECRET_KEY = process.env.SYSTEM_REFRESH_TOKEN_SECRET_KEY

export const ACCESS_TOKEN_EXPIRES_IN = parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN)
export const REFRESH_TOKEN_EXPIRES_IN = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN)

export const REDIS_URI = process.env.REDIS_URI

export const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD
export const EMAIL_APP = process.env.EMAIL_APP

export const APPLICATION_NAME = process.env.APPLICATION_NAME

export const FACEBOOK_LINK = process.env.FACEBOOK_LINK
export const INSTAGRAM_LINK = process.env.INSTAGRAM_LINK
export const TWITTER_LINK = process.env.TWITTER_LINK

export const ORIGINS = process.env.ORIGINS?.split(",") || []
