const jwt = require('jsonwebtoken');
const moment = require('moment');
const loginModel = require('../models/loginModel');
const cryptoUtil = require('../util/crypto');
const logger = require('./logger');

var SECRET = config.secret;
var validJwt = require('express-jwt')({secret: SECRET});
let expireTime = 60;

var authTokenUtil = {
    // token 생성
    createAuthToken: function(userUuid, callback) {
        var dt = moment(new Date());
        var tokenVal = dt.format('YYYYMMDDHHmm') + userUuid;
        var loginToken = cryptoUtil.aes256CryptoIv(tokenVal);
        logger.debug('authTokenUtil > createAuthToken / loginToken :: ' + loginToken);
        return callback(jwt.sign(
            {
                id: userUuid,
                key: loginToken
            }, 
            SECRET, 
            {
                expiresIn: expireTime + 'm',
                issuer: config.domain,
                subject: 'userInfo'
            })
        );
            
    },

    // token을 해석해서 유저정보 확인
    isAuthToken: function(req, res, callback) {
        try {
            var headersToken = req.headers.authorization.split('Bearer ');
            var token = jwt.verify(headersToken[1], config.secret);
            var userUuid = token.id;
            var loginTokenKey = token.key;
            logger.debug('authTokenUtil > isAuthToken / selectUserInfo userUuid :: ' + userUuid);
            // 1. DB에 등록된 값과 일치하는지 체크
            loginModel.selectUserInfo(userUuid, function(err, result) {
                if (err) {
                    logger.error('authTokenUtil > isAuthToken / selectUserInfo error :: ' + JSON.stringify(err));
                    throw err;
                } else {
                    if (loginTokenKey) {
                        // 2. 토근생성된 기간이 말료됐는지 체크 2중 체크
                        var loginToken = cryptoUtil.deAes256CryptoIv(loginTokenKey);
                        var yyyy = loginToken.substr(0, 4);
                        var MM = loginToken.substr(4, 2);
                        var DD = loginToken.substr(6, 2);
                        var HH = loginToken.substr(8, 2);
                        var mm = loginToken.substr(10, 2);
                        var loginTime = `${MM}/${DD}/${yyyy} ${HH}:${mm}`;
                        var loginTokenTime = new Date(loginTime);

                        var now = new Date();
                        var gapTime = (now.getTime() - loginTokenTime.getTime()) / 1000 / 60;
                        logger.debug('authTokenUtil > isAuthToken / double check auth gapTime :: ' + gapTime + '    expireTime :: ' + expireTime);
                        if (gapTime == undefined || Math.floor(gapTime) > expireTime) {
                            callback(err, false);
                        } else {
                            authTokenUtil.createAuthToken(userUuid, function(refToken){
                                logger.debug('authTokenUtil > isAuthToken / createAuthToken token :: ' + token + '    refToken :: ' + refToken);
                                callback(null, true, token, refToken);
                            });
                        }

                    } else {
                        logger.debug('authTokenUtil > isAuthToken / no loginTokenKey');
                        callback(err, false);
                    }
                }
            });

        } catch (exception) {
            logger.error('authTokenUtil > isAuthToken / exception :: ' + JSON.stringify(exception));
            if (exception.name == 'TokenExpiredError') {
                res.json({'result': false, 'loginFlg': true, 'message': 'Your sign in session has expired.\nPlease sign in again.'});
            } else if (exception.name == 'JsonWebTokenError') {
                res.json({'result': false, 'loginFlg': true, 'message': 'Please sign in first.'});
            } else {
                res.json({'result': false, 'message': 'Error occurred.'});
            }
        }
    },

}

module.exports = authTokenUtil;