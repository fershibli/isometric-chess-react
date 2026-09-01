/* global __APP_VERSION__ */

/** Replaced at build time with the version in package.json. */
export const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0-dev'
