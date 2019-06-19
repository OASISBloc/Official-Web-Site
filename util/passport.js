'use strict';

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;   // token 생성을 위함
const passportJWT = require('passport-jwt');
const loginModel = require('../models/loginModel');
const cryptoUtil = require('../util/crypto');
const logger = require('./logger');

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

var SECRET = config.secret;

// Login Passport (인증방법 지원하기에 사용...)
exports.setup = function () {

    passport.use(new LocalStrategy({
            usernameField: 'user_mail',   // 값은 html의 name 맞추기
            passwordField: 'user_pwd'
        },
        function(user_mail, user_pwd, cb) {
            logger.debug('passport > LocalStrategy / user_mail :: ' + user_mail + ' user_pwd :: ' + user_pwd);
            // 인증 정보 체크 로직
            var encryptUserId = cryptoUtil.aes256CryptoIv(user_mail);
            var encryptUserPwd = cryptoUtil.sha256Crypto(cryptoUtil.sha256Crypto(user_pwd));
            logger.debug('passport > LocalStrategy / encryptUserId :: ' + encryptUserId + ' encryptUserPwd :: ' + encryptUserPwd);
            // 로그인 정보 DB 조회
            loginModel.selectLoginPassword(encryptUserId, function(err, result) {
                if (err) {
                    logger.error('passport > LocalStrategy / selectLoginPassword error :: ' + JSON.stringify(err));
                    return cb(err, false, {message: 'Select DB Error.'});
                }

                if (!result) {
                    logger.debug('passport > LocalStrategy / selectLoginPassword no data');
                    return cb(null, false, {message: 'Incorrect email or password.'});
                } else {
                    if (result.length > 0) {
                        var loginPass = result[0].login_pass;
                        if (loginPass === encryptUserPwd) {
                            logger.debug('passport > LocalStrategy / login password check OK');
                            var user = {id: result[0].user_uuid};
                            return cb(null, user);
                        } else if (result[0].email_verify_yn == 'N') { 
                            logger.debug('passport > LocalStrategy / login not Yet Email confirm');
                            return cb(null, false, {message: 'Fail to login', status: 'notYetEmail'});
                        } else {
                            logger.debug('passport > LocalStrategy / not match login data');
                            return cb(null, false, {message: 'Fail to login'});
                        }
                    } else {
                        logger.debug('passport > LocalStrategy / no login data');
                        return cb(null, false, {message: '회원 가입을 먼저 해 주세요.'});
                    }
                }
            });
        }
    ));

    // 인증이 필요한 일부 특수 경로에 액세스
    passport.use(new JWTStrategy({
            jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
            secretOrKey   : SECRET
        },
        function (jwtPayload, cb) {
            logger.debug('passport > JWTStrategy / jwtPayload :: ' + JSON.stringify(jwtPayload));
            loginModel.selectUserInfo(jwtPayload.id, function(err, result) {
                if (err) {
                    logger.error('passport > JWTStrategy / selectUserInfo error :: ' + JSON.stringify(err));
                    return cb(err);
                } else {
                    logger.debug('passport > JWTStrategy / selectUserInfo :: ' + JSON.stringify(result));
                    return cb(null, result)
                }
            });
        }
    ));

  };