const loginModel = require('../../models/loginModel');
const joinModel = require('../../models/joinModel');
const cryptoUtil = require('../../util/crypto');
const authToken = require('../../util/authToken');
const jwt = require('jsonwebtoken');
const commonController = require('../../controller/web/common/commonController');
const cryptoRandomString = require('crypto-random-string');
const otpauthUtil = require('../../util/otpauth');
const logger = require('../../util/logger');

var loginController = {
    /** token 생성 */
    loginCheck: function(req, res, user) {
        logger.debug('Login > loginCheck / selectUserInfo param :: ' + user.id);
        loginModel.selectUserInfo(user.id, function(err, result) {
            if (err || result.length < 1) {
                logger.error('Login > loginCheck / selectUserInfo :: ' + JSON.stringify(err) + '\n param :: ' + user.id);
                throw err;

            } else {
                // 메일인증 완료 여부
                if (result[0].email_verify_yn == 'N') {
                    logger.debug('Login > loginCheck / not Yet verify email');
                    res.json({'result': false, 'status': 'notYetEmail'});
                } else {
                    // two-factor 인증 or 단일 인증 구분
                    var secretKey = result[0].secret_key;
                    var tfaUseYn = result[0].tfa_use_yn;
                    logger.debug('Login > loginCheck / securetKey :: ' + secretKey + '  tfaUseYn :: ' + tfaUseYn);
                    if (secretKey && secretKey.length == 16 && tfaUseYn == 'Y') {
                        var otpNum = req.body.otpNum;
                        logger.debug('Login > loginCheck / used OTP otpNum :: ' + otpNum);
                        if (!otpNum) {
                            // otp 입력 화면으로 변환
                            res.json({'result': true, 'otpflg': true});
                        } else {
                            // 토큰 인증
                            otpauthUtil.verified(secretKey, otpNum, function(result) {
                                logger.debug('Login > loginCheck / otpauthUtil.verified result :: ' + result);
                                if (result) {
                                    // 토큰 생성하여 반환
                                    authToken.createAuthToken(user.id, function(token) {
                                        logger.debug('Login > loginCheck / createAuthToken');
                                        res.json({'result': true, 'message': '로그인이 확인되었습니다.', 'token': token});
                                    });
                                } else {
                                    res.json({'result': false, 'message': 'Incorrect OTP code. Please try again.'});
                                }
                            });
                        }
                    } else {
                        logger.debug('Login > loginCheck / unused OTP');
                        // 토큰 생성하여 반환
                        authToken.createAuthToken(user.id, function(token) {
                            logger.debug('Login > loginCheck / createAuthToken');
                            res.json({'result': true, 'otpflg': false, 'message': '로그인이 확인되었습니다.', 'token': token});
                        });
                    }
                }
            }
        });
    },

    /** 비밀번호 찾기 메일 발송(변경) */
    fogotPassword: function(req, res, next) {
        var body = req.body;
        var mailCrypt = cryptoUtil.aes256CryptoIv(body.user_mail);
        logger.debug('Login > fogotPassword / mailCrypt :: ' + mailCrypt);
        // 받은 메일의 사용자 검색(있을 경우, 없을 경우)
        loginModel.selectLoginPassword(mailCrypt, function(err, result) {
            if (err) {
                logger.error('Login > fogotPassword / selectLoginPassword error :: ' + JSON.stringify(err) + '  mailCrypt :: ' + mailCrypt);
                res.send({'result' : '비밀번호 변경을 진행할 수 없습니다.'});
            } else {
                if (result.length > 0) {
                    logger.debug('Login > fogotPassword / selectLoginPassword email_verify_yn :: ' + result[0].email_verify_yn);
                    if (result[0].email_verify_yn == 'N') {
                        res.send({'result' : '회원가입 인증이 되지 않은 상태에서 비밀번호 변경은 진행할 수 없습니다.\n회원가입 인증을 먼저 진행해 주세요.(메일 확인)'});
                    } else {
                        var certificationKey = cryptoRandomString(16);
                        var uuid = result[0].user_uuid;
                        var mailParams = {
                            'userUuid' : result[0].user_uuid
                            , 'userSeq' : result[0].user_seq
                            , 'retryKey' : certificationKey
                            , 'url' : `${config.homeUrl}/login/resetPassword?userUuid=${uuid}&retryKey=${certificationKey}`
                            , userEmail : body.user_mail
                            , emailSubject : 'Please reset your password.'
                            , emailFormNm : 'resetPassword.html'
                            , emailSendMsg : 'Password reset email has sent.'
                        }
                        logger.debug('Login > fogotPassword / deleteUserVerify mailParams :: ' + JSON.stringify(mailParams));
                        // 공통 인증관련 메일 발송 처리
                        config.connection.getConnection(function(err, connection) {
                            // 기존에 비밀번호 찾기 했던 데이터에 대해서 삭제 처리 후 다음 진행(데이터는 있을 수도 있고 없을 수도 있음)
                            loginModel.deleteUserVerify(connection, result[0].user_uuid, function(err, delResult) {
                                if (err) {
                                    logger.error('Login > fogotPassword / call commEmailCertification error :: ' + JSON.stringify(err) + '  user_uuid :: ' + result[0].user_uuid);
                                    throw err;
                                } else {
                                    logger.debug('Login > fogotPassword / call commEmailCertification mailParams :: ' + JSON.stringify(mailParams));
                                    commonController.commEmailCertification(req, res, connection, mailParams);
                                }
                            });
                        });
                    }
                } else {
                    logger.debug('Login > fogotPassword / not registed member');
                    res.send({'result': '미등록된 회원입니다.'});
                }
            }
        });
    },

    /** 비밀번호 변경 메일 확인 후 변경 페이지 이동 */
    resetPassword: function(req, res, next) {
        var userUuid = req.query.userUuid;
        var retryKey = req.query.retryKey;

        if (!userUuid || !retryKey) {
            res.render('404',{ layout: './layout/single-layout' });
        } else {
            var params = {
                'userUuid': userUuid
                , 'retryKey': retryKey
            };
            logger.debug('Login > resetPassword / selectMailCertify params :: ' + JSON.stringify(params));
            joinModel.selectMailCertify(params, function(err, result) {
                if (err) {
                    logger.error('Login > resetPassword / selectMailCertify error :: ' + JSON.stringify(err) + '\n    params :: ' + JSON.stringify(params));
                    throw err;
                } else {
                    var resultCnt = result[0].count;
                    var timeDiff = result[0].timeDiff;
                    logger.debug('Login > resetPassword / selectMailCertify resultCnt :: ' + resultCnt + '  timeDiff :: ' + timeDiff);
                    if (resultCnt > 0 && timeDiff <= 10) {
                        res.render('./login/resetPassword', {'title': 'change password', 'result': 'OK', 'userUuid': params.userUuid, 'retryKey': params.retryKey});
                    } else {
                        if (timeDiff) {
                            res.render('./login/resetPassword', {'title': '비밀변경 유효 시간 만료', 'result': 'expire', 'userUuid': params.userUuid, 'retryKey': ''});
                        } else {
                            res.render('./login/resetPassword', {'title': '비밀변경 실패', 'result': 'fail', 'userUuid': params.userUuid, 'retryKey': ''});
                        }
                    }
                }
            });
        }
    },

    /** 새로운 비밀번호로 변경 처리 */
    resetPasswordAjax: function(req, res, next) {
        var newPwd = req.body.newPwd;
        var userUuid = req.body.userUuid;
        var retryKey = req.body.retryKey;

        if (!newPwd || !userUuid || !retryKey) {
            res.json({"result": false, "message": 'Incorrect access. Please try again through the received email.'});
        } else {
            var params = {
                'newPwd': cryptoUtil.sha256Crypto(cryptoUtil.sha256Crypto(newPwd)),
                'userUuid': userUuid,
                'retryKey': retryKey
            };
            logger.debug('Login > resetPasswordAjax / updateUserPassword params :: ' + JSON.stringify(params));
            // DB Transaction 처리
            config.connection.getConnection(function(err, connection) {
                connection.beginTransaction(function(err) {
                    if (err) {
                        logger.error('Login > resetPasswordAjax / transaction error :: ' + JSON.stringify(err) + '\n  params :: ' + JSON.stringify(params));
                        throw err;
                    } else {
                        loginModel.updateUserPassword(connection, params, function(err, result) {
                            if (err) {
                                logger.error('Login > resetPasswordAjax / updateUserPassword error :: ' + JSON.stringify(err) + '\n  params :: ' + JSON.stringify(params));
                                connection.rollback(function() {
                                    res.json({'result': false, 'message': 'Error occurred.'});
                                });
                            } else {
                                joinModel.deleteUserEmailCertification(connection, params, function(err, result) {
                                    if (err) {
                                        logger.error('Login > resetPasswordAjax / deleteUserEmailCertification error :: ' + JSON.stringify(err) + '  params :: ' + JSON.stringify(params));
                                        connection.rollback(function() {
                                            res.json({'result': false, 'message': 'Error occurred.'});
                                        });
                                    } else {
                                        connection.commit(function(err) {
                                            if (err) {
                                                logger.error('Login > resetPasswordAjax / commit error :: ' + JSON.stringify(err));
                                                connection.rollback(function() {
                                                    res.json({'result': false, 'message': 'Error occurred.'});
                                                });
                                            }
                                            connection.release();
                                            res.json({'result': true, 'message': '변경되었습니다.', 'url': `${req.get('host')}/login`});
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            });
        }
    },

    /** 회원가입 인증메일 재전송 */
    resendVerifyEmail: function(req, res, next) {
        var email = req.body.user_mail;
        logger.debug('Login > resendVerifyEmail / selectResendVerifyEmailInfo param :: ' + email);
        loginModel.selectResendVerifyEmailInfo(email, function(err, result) {
            if (err) {
                logger.error('Login > resendVerifyEmail / selectResendVerifyEmailInfo error :: ' + JSON.stringify(err));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                if (result.length < 1) {
                    res.json({'result': false, 'message': 'The email address does not exist.'});
                } else {
                    var mailParams = {
                        'userEmail': email,
                        'url' : `${config.homeUrl}/join/certifyEmail?userUuid=${result[0].user_uuid}&retryKey=${result[0].retry_key}`
                    }
                    logger.debug('Login > resendVerifyEmail / updateMailSendTime mailParams :: ' + JSON.stringify(mailParams));
                    // 시간 업데이트
                    loginModel.updateMailSendTime(result, function(err, upResult) {
                        if (err) {
                            logger.error('Login > resendVerifyEmail / updateMailSendTime error :: ' + JSON.stringify(err));
                            res.send({'result' : 'NG', 'message' : 'Error occurred.'});
                        } else {
                            // 메일 발송 처리
                            var sendMail = require('../../util/sendmail');
                            logger.debug('Login > resendVerifyEmail / call awsMail mailParams :: ' + JSON.stringify(mailParams));
                            sendMail.awsMail(config.webmasterEmail, email, '[RESEND] Get started with OASISBloc!', 'welcome.html', mailParams);
                            res.send({'result' : 'OK', 'message' : 'Authentication email has sent, the email will be valid for only 2 hours.'});
                        }
                    });
                }
            }
        });
    },

    /** 로그아웃 */
    logout: function(req, res, next) {
        var token = req.body.token;
        //req.session.destory();  // 세션 삭제
        //res.clearCookie(token); // 세션 쿠키 삭제
        res.json({'result': true});
    },


    // authTokenCheck: function(req, res, next) {
    //     // read the token from header or url 
    //     const token = req.headers['x-access-token'] || req.query.token

    //     // token does not exist
    //     if(!token) {
    //         return res.status(403).json({
    //             success: false,
    //             message: 'not logged in'
    //         })
    //     }

    //     // create a promise that decodes the token
    //     const p = new Promise(
    //         (resolve, reject) => {
    //             jwt.verify(token, req.app.get('jwt-secret'), (err, decoded) => {
    //                 if(err) reject(err)
    //                 resolve(decoded)
    //             })
    //         }
    //     )

    //     // if it has failed to verify, it will return an error message
    //     const onError = (error) => {
    //         res.status(403).json({
    //             success: false,
    //             message: error.message
    //         })
    //     }

    //     // process the promise
    //     p.then((decoded)=>{
    //         req.decoded = decoded
    //         next()
    //     }).catch(onError)
    // },


}

module.exports = loginController;