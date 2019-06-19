'use strict';

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const logger = require('./logger');

var otpAuthUtil = {

    /** secret key 생성 */
    createSecret: function(userEmail, callback) {
        var option = {
            length: 10, // Length of the secret
            name: `${userEmail.split('@')[0]}@${config.icoHost}`, // The name to use with Google Authenticator.(email의 @이후 제거)
            algorithm: 'sha1'   // Hash algorithm (sha1, sha256, sha512). -- ios에서는 sha512로 인증이 되지 않음...
        };
        logger.debug('otpAuthUtil > createSecret / userEmail :: ' + JSON.stringify(option));
        var secret = speakeasy.generateSecret(option);
        logger.debug('otpAuthUtil > createSecret / secret :: ' + JSON.stringify(secret));
        callback(secret);
    },

    /** Google OTP와 호환되는 url 생성 */
    createOtpAuthUrl: function(secret, userEmail, callback) {
        //otpauth://totp/EMAIL?secret=SECRETKEY(secret.base32)&issuer=SERVICENAME
        var option = {
            secret: secret.ascii,   // Shared secret key
            issuer: config.icoProvider, // The provider or service with which the secret key is associated.
            label: userEmail,   // Used to identify the account with which the secret key is associated, e.g. the user's email address.
            algorithm: 'sha1',  // Hash algorithm (sha1, sha256, sha512).
            period: 30  // The length of time for which a TOTP code will be valid, in seconds. Currently ignored by Google Authenticator.
        };
        logger.debug('otpAuthUtil > createOtpAuthUrl / option :: ' + JSON.stringify(option));
        var url = speakeasy.otpauthURL(option);
        logger.debug('otpAuthUtil > createOtpAuthUrl / url :: ' + url);
        callback(url);
    },

    /** QRCode 생성 */
    createQRCode: function(url, callback) {
        logger.debug('otpAuthUtil > createQRCode / url :: ' + url);
        QRCode.toDataURL(url, function(err, data_url) {
            if (err) {
                logger.error('otpAuthUtil > createQRCode / error :: ' + JSON.stringify(err));
                throw err;
            } else {
                logger.debug('otpAuthUtil > createQRCode / data_url :: ' + data_url);
                callback(data_url);
            }
        });
    }, 

    /** 입증 */
    verified: function(secretKey, otpNum, callback) {
        var option = {
            secret: secretKey,
            encoding: 'base32',
            algorithm: 'sha1',
            token: otpNum
        };
        logger.debug('otpAuthUtil > verified / option :: ' + JSON.stringify(option));
        var verify = speakeasy.totp.verify(option);
        logger.debug('otpAuthUtil > verified / verify :: ' + verify);
        callback(verify);
    }
}

module.exports = otpAuthUtil;