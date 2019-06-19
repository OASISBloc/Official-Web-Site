const joinModel = require('../../models/joinModel');
const cryptoRandomString = require('crypto-random-string');
const cryptoUtil = require('../../util/crypto');
const commonController = require('../../controller/web/common/commonController');
const request = require('request');
const logger = require('../../util/logger');

var joinController = {
    /* 회원 등록 기능 */
    insertMemberInfo: function(req, res) {
        var body = req.body;
        logger.debug('Join > insertMemberInfo / verify params scret :: ' + config.recaptchaSecret + ' response :: ' + body.recaptcha);
        var verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${config.recaptchaSecret}&response=${body.recaptcha}`;

        request(verificationURL, function(err, response, result) {
            result = JSON.parse(result);
            if (result.success !== undefined && !result.success) {
                logger.debug('Join > insertMemberInfo / verify result :: ' + result.success);
                res.json({"result" : false, "type": "reCaptcha", "message" : "Check the box for reCAPTCHA."});
            } else {
                const uuid = cryptoRandomString(32);
                var mailCrypt = cryptoUtil.aes256CryptoIv(body.user_mail);
                var firstPwd = cryptoUtil.sha256Crypto(body.user_password);
                var secondPwd = cryptoUtil.sha256Crypto(firstPwd);
                var userPhone =  body.user_phonenum ? cryptoUtil.aes256CryptoIv(body.user_phonenum) : null;

                var params = {
                    'userUuid' : uuid
                    , 'loginId' : mailCrypt
                    , 'loginPass' : secondPwd
                    , 'userEmail' : body.user_mail
                    , 'userFirstName': body.user_firstname
                    , 'userLastName': body.user_lastlame
                    , 'userCountrycode': body.user_countrycode
                    , 'userPhone': userPhone
                    , 'userdType': body.user_firstname ? 'C' : 'P'
                    , 'agreeTermsYn': body.agree_1
                    , 'agreePrivacyYn': body.agree_2
                    , 'agreeMarketingYn': body.agree_3
                };
                
                // 회원일련번호 채번
                joinModel.insertNumseq(function(err, numseqObj) {
                    logger.debug('Join > insertMemberInfo / get insertNumseq :: ' + numseqObj.insertId);
                    var pad = require('pad-left');
                    var insertId = 'OBP0401' + pad(numseqObj.insertId, 6, '0');
                    params['seq'] = insertId;
                    // DB Transaction 처리
                    config.connection.getConnection(function(err, connection) {
                        connection.beginTransaction(function(err) {
                            if (err) {
                                logger.error('Join > insertMemberInfo / transaction error :: ' + JSON.stringify(err));
                                throw err;
                            }
                            logger.debug('Join > insertMemberInfo / insertMemberInfos params :: ' + JSON.stringify(params));
                            // 회원 등록
                            joinModel.insertMemberInfos(connection, params, function(err, result) {
                                if (err) {
                                    logger.error('Join > insertMemberInfo / insertMemberInfos error :: ' + JSON.stringify(err));
                                    connection.rollback(function() {
                                        res.send({'result' : err});
                                    });
                                } else {
                                    // BTC 지갑주소 생성 요청
                                    var redis = require('redis');
                                    logger.debug('Join > insertMemberInfo / redis.createClient params port :: ' + config.redisPort + ' host :: ' + config.redisHost + ' pwd :: ' + config.redisPw);
                                    var client = redis.createClient(config.redisPort, config.redisHost, {auth_pass: config.redisPw});
                                    client.on('error', (err) => {
                                        logger.error('Join > insertMemberInfo / redis client.on ' + JSON.stringify(err));
                                    });
                                    var redisParams = {
                                        'userUuId': uuid,
                                        'coinType': 'BTC',
                                        'requestType': 'create'
                                    };
                                    client.rpush("dc:create:address", JSON.stringify(redisParams), function(err, reply) {
                                        if (err) {
                                            logger.error('Join > insertMemberInfo / redis client rpush :: ' + JSON.stringify(err) + '\n params :: ' + JSON.stringify(redisParams));
                                        } else {
                                            logger.debug('Join > insertMemberInfo / redis client publish :: ' +  reply);
                                            client.publish("request-address", "request");
                                        }
                                    });
                                    
                                    // 메일 인증번호 생성 및 DB등록
                                    var certificationKey = cryptoRandomString(16);
                                    var mailParmas = {
                                        'userUuid' : uuid
                                        , 'retryKey' : certificationKey
                                        , 'userSeq' : insertId
                                        , 'url' : `${config.homeUrl}/join/certifyEmail?userUuid=${uuid}&retryKey=${certificationKey}`
                                        , userEmail : body.user_mail
                                        , emailSubject : 'Get started with OASISBloc!'
                                        , emailFormNm : 'welcome.html'
                                        , emailSendMsg : 'Authentication email has sent, the email will be valid for only 2 hours.'
                                    }
                                    logger.debug('Join > insertMemberInfo / call commEmailCertification params :: ' +  JSON.stringify(mailParmas));
                                    // 공통 인증관련 메일 발송 처리
                                    commonController.commEmailCertification(req, res, connection, mailParmas);
                                }
                            });
                        }); // DB Transaction End
                    });
                });
            }

        });

    },

    duplEmailChk: function(req, res) {
        var email = req.body.email;
        logger.debug('Join > duplEmailChk / selectDuplEmail email :: ' +  email);
        joinModel.selectDuplEmail(email, function(err, result) {
            if (err) {
                logger.error('Join > duplEmailChk / selectDuplEmail error :: ' +  JSON.stringify(err) + '\n param :: ' + email);
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                if (result[0].emailCnt < 1) {
                    res.json({'result': true});
                } else {
                    logger.debug('Join > duplEmailChk / duplecate email :: ' +  email);
                    res.json({'result': false, 'message': 'Duplicated emails exist.'});
                }
            }
        })
    },

    /* 회원 등록 후 메일 인증 기능 */
    memberCertifyEmail: function(req, res) {
        var userUuid = req.param('userUuid');
        var retryKey = req.query.retryKey;
        var params = {
            'userUuid' : userUuid
            , 'retryKey' : retryKey
        };
        logger.debug('Join > memberCertifyEmail / selectMailCertify params :: ' +  JSON.stringify(params));
        joinModel.selectMailCertify(params, function(err, result) {
            if (err) {
                logger.error('Join > memberCertifyEmail / selectMailCertify error :: ' +  JSON.stringify(err) + ' \n params :: ' + JSON.stringify(params));
                throw err;
            } else {
                var resultCnt = result[0].count;
                var timeDiff = result[0].timeDiff;

                logger.debug('Join > memberCertifyEmail / selectMailCertify resultCnt :: ' +  resultCnt + ' timeDiff :: ' + timeDiff);
                if (resultCnt > 0 && timeDiff <= 120) {  // 120 회원인증 메일 유효시간

                    // DB Transaction 처리
                    config.connection.getConnection(function(err, connection) {
                        connection.beginTransaction(function(err) {
                            if (err) {
                                logger.error('Join > memberCertifyEmail / get transaction error :: ' +  JSON.stringify(err));
                                throw err;
                            } else {
                                logger.debug('Join > memberCertifyEmail / updateUserEmailVerify params :: ' +  JSON.stringify(params));
                                // Email 인증 확인 값 업데이트
                                joinModel.updateUserEmailVerify(connection, params, function(err, result) {
                                    if (err) {
                                        logger.error('Join > memberCertifyEmail / get transaction error :: ' +  JSON.stringify(err) + '\n params :: ' + JSON.stringify(params));
                                        connection.rollback(function() {
                                            throw err;
                                        });
                                    } else {
                                        logger.debug('Join > memberCertifyEmail / in deleteUserEmailCertification params :: ' + JSON.stringify(params));
                                        // 메일 인증을 완료 후 인증용 키값 삭제
                                        joinModel.deleteUserEmailCertification(connection, params, function(err, result) {
                                            if (err) {
                                                logger.error('Join > memberCertifyEmail / deleteUserEmailCertification error :: ' +  JSON.stringify(err) + '\n params :: ' + JSON.stringify(params));
                                                connection.rollback(function() {
                                                    throw err;
                                                });
                                            } else {
                                                connection.commit(function(err) {
                                                    if (err) {
                                                        logger.error('Join > memberCertifyEmail / commit error :: ' + JSON.stringify(err));
                                                        connection.rollback(function() {
                                                            throw err;
                                                        });
                                                    }
                                                    connection.release();
                                                    res.redirect('/join/joinComplete');
                                                });
                                                
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }); // DB Transaction End

                } else {
                    if (timeDiff) {
                        logger.debug('Join > memberCertifyEmail / certifyEmail EXPIRE   Authentication timed out');
                        res.render('./login/login', {'title': 'Authentication timed out.', 'kind': 'expire', 'callPage': ''});
                    } else {
                        logger.debug('Join > memberCertifyEmail / certifyEmail ALREADY  Already processed');
                        res.render('./login/login', {'title': 'Already processed.', 'kind': 'already', 'callPage': ''});
                    }
                }
            }
        });
    },

    /** 정책 약관 조회 */
    policyData: function(req, res) {
        var params = {
            'boardType': 'CD_TERMS'
            , 'termsType': req.body.termsType
            , 'boardId': req.body.boardId
        }
        logger.debug('Join > policyData / selectPolicyVer params :: ' + JSON.stringify(params));
        joinModel.selectPolicyVer(params, function(err, verList) {
            if (err) {
                logger.error('Join > policyData / selectPolicyVer error :: ' + JSON.stringify(err) + '\n params :: ' + JSON.stringify(params));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                if (verList && verList.length > 0) {
                    if (!req.body.boardId) {
                        params.boardId = verList[0].board_id;
                    }
                    logger.debug('Join > policyData / selectPolicyData params :: ' + JSON.stringify(params));
                    joinModel.selectPolicyData(params, function(err, policyData) {
                        if (err) {
                            logger.error('Join > policyData / selectPolicyData error :: ' + JSON.stringify(err) + '\n params :: ' + JSON.stringify(params));
                            res.json({'result': false, 'message': 'Error occurred.'});
                        } else {
                            res.json({'result': true, 'verList': verList, 'policyData': policyData[0]});
                        }
                    });
                    
                } else {
                    logger.debug('Join > policyData / selectPolicyVer No data');
                    res.json({'result': false, 'message': 'No data.'});
                }
            }
        })
    }
}

module.exports = joinController;