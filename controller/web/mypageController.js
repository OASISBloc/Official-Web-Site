const mypageModel = require('../../models/mypageModel');
const cryptoUtil = require('../../util/crypto');
const otpauthUtil = require('../../util/otpauth');
const fs = require('fs')
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({storage: storage, limits: { fileSize: 4 * 1024 * 1024 }});
const s3Upload = require('../../util/awsFileUpload');
var async = require('async');
const commonController = require('./common/commonController');
const logger = require('../../util/logger');

var mypageController = {

    /** 마이페이지 userinfo */
    myInfo: function(req, res, token, refToken, next) {
        var userUuid = token.id;
        mypageModel.selectMyInfo(userUuid, function(err, result) {
            if (err) {
                logger.error('Mypage > myInfo / selectMyInfo error :: ' + JSON.stringify(err) + '   userUuid' + userUuid);
                return res.json(401, error);
            } else {
                if (result && result.length > 0) {
                    result[0].user_phone = result[0].user_phone ? cryptoUtil.deAes256CryptoIv(result[0].user_phone) : '';
                    res.json({'result': true, 'myInfo': result[0], 'refToken': refToken});
                } else {
                    res.json({'result': false, 'loginFlg': true, 'message': 'Please sign in first.'});
                }
            }
        });
    },

    /** token sale 참여하기 위한 동의 유무 확인 */
    tokenSaleInitCheck: function(req, res, token, refToken, next) {
        mypageModel.selectTokenAgreeYn(token.id, function(err, result) {
            if (err) {
                logger.error('Mypage > tokenSaleInitCheck / selectTokenAgreeYn error :: ' + JSON.stringify(err));
                return res.json({'result': false, 'message': 'Error occurred'});
            } else {
                return res.json({'result': true, 'agreeYn': result[0].agree_token_sale_yn, 'userType': result[0].userd_type, 'refToken': refToken});
            }
        });
    },

    /** token sale 참여 동의 업데이트 */
    updateTokenSaleYn: function(req, res, token, refToken, next) {
        mypageModel.updateTokenAgreeYn(token.id, function(err, result) {
            if (err) {
                logger.error('Mypage > updateTokenSaleYn / updateTokenAgreeYn error :: ' + JSON.stringify(err));
                return res.json({'result': false, 'message': 'The email address does not exist.'});
            } else {
                mypageModel.getWalletInfo(token.id, function(err, walletInfo) {
                    if (err) {
                        logger.error('Mypage > updateTokenSaleYn / getWalletInfo error :: ' + JSON.stringify(err));
                        return res.json({'result': false, 'message': 'Error occurred.'});
                    } else {
                        if (!walletInfo[0].btc_wallet) {
                            // BTC 지갑주소 생성 요청
                            var redis = require('redis');
                            logger.debug('Mypage > updateTokenSaleYn / redis.createClient params port :: ' + config.redisPort + ' host :: ' + config.redisHost + ' pwd :: ' + config.redisPw);
                            var client = redis.createClient(config.redisPort, config.redisHost, {auth_pass: config.redisPw});
                            client.on('error', (err) => {
                                logger.error('Mypage > updateTokenSaleYn / redis client.on ' + JSON.stringify(err));
                            });
                            var redisParams = {
                                'userUuId': token.id,
                                'coinType': 'BTC',
                                'requestType': 'create'
                            };
                            client.rpush("dc:create:address", JSON.stringify(redisParams), function(err, reply) {
                                if (err) {
                                    logger.error('Mypage > updateTokenSaleYn / redis client rpush :: ' + JSON.stringify(err) + '\n params :: ' + JSON.stringify(redisParams));
                                } else {
                                    logger.debug('Mypage > updateTokenSaleYn / redis client publish :: ' +  reply);
                                    client.publish("request-address", "request");
                                }
                            });
                        }

                        return res.json({'result': true, 'message': '처리 되었습니다.', 'refToken': refToken});
                    }
                });
            }
        });
    },

    /** 마이페이지 profile */
    getMemberProfileInfo: function(req, res, token, refToken, next) {
        var userUuid = token.id;
        mypageModel.selectMyInfo(userUuid, function(err, result) {
            if (err) {
                logger.error('Mypage > getMemberProfileInfo / selectMyInfo error :: ' + JSON.stringify(err));
                return res.json(401, error);
            } else {
                logger.debug('Mypage > getMemberProfileInfo / selectPersonProfileInfo userUuid :: ' + userUuid + '  userd_type :: ' + result[0].userd_type);
                if (result[0].userd_type == 'P') {          // 개인
                    mypageModel.selectPersonProfileInfo(userUuid, function(err, memProfile) {
                        if (err) {
                            logger.error('Mypage > getMemberProfileInfo / selectPersonProfileInfo error :: ' + JSON.stringify(err));
                            res.json({'result': false, 'message': 'Error occurred.'});
                        } else {
                            memProfile[0].user_phone = memProfile[0].user_phone ? cryptoUtil.deAes256CryptoIv(memProfile[0].user_phone) : '';
                            memProfile[0].countries = JSON.parse(fs.readFileSync(__dirname + '/../../config/countryCodes.json'));
                            res.json({'result': true, 'memProfile': memProfile[0], 'refToken': refToken});
                        }
                    });

                } else if (result[0].userd_type == 'C') {   // 법인
                    mypageModel.selectCorpProfileInfo(userUuid, function(err, memProfile) {
                        if (err) {
                            logger.error('Mypage > getMemberProfileInfo / selectCorpProfileInfo error :: ' + JSON.stringify(err));
                            res.json({'result': false, 'message': 'Error occurred.'});
                        } else {
                            var abode = JSON.parse(fs.readFileSync(__dirname + '/../../config/countryCodes.json'));
                            res.json({'result': true, 'memProfile': memProfile, 'abode': abode, 'refToken': refToken});
                        }
                    });
                } else {
                    res.json({'result': false, 'message': '유효하지 않는 파라미터가 존재합니다.'});
                }
            }
        });
    },

    /** 추천인 체크 */
    profileCheckRecommend: function(req, res, next) {
        var param = req.body;
        logger.debug('Mypage > profileCheckRecommend / profileCheckRecommend param :: ' + JSON.stringify(param));
        mypageModel.profileCheckRecommend(param, function(err, result) {
            if (err) {
                logger.error('Mypage > profileCheckRecommend / profileCheckRecommend error :: ' + JSON.stringify(err));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                if (result && result[0].cnt > 0) {
                    res.json({'result': true, 'message': 'available'});
                } else {
                    res.json({'result': false, 'message': 'no data'});
                }
            }
        });

    },

    /** 개인 프로파일 등록 */
    updatePersonProfile: function(req, res, token, refToken, next) {
        var params = {
            'userUuid': token.id
            , 'user_first_name': req.body.user_first_name
            , 'user_last_name': req.body.user_last_name
            , 'country_code': req.body.country_code
            , 'abode': req.body.abode
            , 'user_phone': cryptoUtil.aes256CryptoIv(req.body.user_phone)
            , 'birth': req.body.birth
            , 'recommend': req.body.recommend
            , 'type': 'P'
            , 'completeStep': '1'
        };
        logger.debug('Mypage > updatePersonProfile / updatePersonProfile params :: ' + JSON.stringify(params));
        mypageModel.updatePersonProfile(params, function(err, result) {
            if (err) {
                logger.error('Mypage > updatePersonProfile / updatePersonProfile error :: ' + JSON.stringify(err) + '   params :: ' + JSON.stringify(params));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                // 사용자 입력 단계 등록
                config.connection.getConnection(function(err, connection) {
                    mypageModel.setUserStep(connection, params, function(err, stepResult) {
                        connection.commit(function(err) {
                            if (err) {
                                logger.error('Mypage > updatePersonProfile / transaction error :: ' + JSON.stringify(err));
                                connection.rollback(function() {
                                    throw err;
                                });
                            }
                            connection.release();
                            res.json({'result': true, 'message': 'Your profile has registered.', 'refToken': refToken});
                        });
                    });
                });
            }
        });
    },

    /** 개인 프로파일 수정 */
    editPersonProfile: function(req, res, token, refToken, next) {
        var params = {
            'userUuid': token.id
            , 'abode': req.body.abode_edit
            , 'user_phone': cryptoUtil.aes256CryptoIv(req.body.user_phone_edit)
        };
        logger.debug('Mypage > editPersonProfile / selectPersonProfileInfo params :: ' + JSON.stringify(params));
        mypageModel.selectPersonProfileInfo(token.id, function(err, memProfile) {
            if (err) {
                logger.error(`Mypage > editPersonProfile / selectPersonProfileInfo error :: ${JSON.stringify(err)}  \n  params :: ` + JSON.stringify(params));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                var logParam = {
                    'userUuid': token.id
                    , 'editFields': ''
                    , 'beforeFields': ''
                    , 'afterFields': ''
                };
                var editFields = '';
                var beforeFields = '';
                var afterFields = '';
                logger.debug('Mypage > editPersonProfile / edit data params.abode :: ' + params.abode + '   memProfile[0].abode :: ' + memProfile[0].abode);
                if (params.abode != memProfile[0].abode) {
                    editFields = '거주국가';
                    beforeFields = memProfile[0].abode;
                    afterFields = params.abode;
                }
                logger.debug('Mypage > editPersonProfile / edit data params.user_phone :: ' + params.user_phone + '   memProfile[0].user_phone :: ' + memProfile[0].user_phone);
                var oldUserPhone = memProfile[0].user_phone;
                if (params.user_phone != oldUserPhone) {
                    oldUserPhone = cryptoUtil.deAes256CryptoIv(oldUserPhone);
                    editFields ? editFields += ',연락처' : editFields = '연락처';
                    beforeFields ? beforeFields += `,${oldUserPhone}` : beforeFields = oldUserPhone;
                    afterFields ? afterFields += `,${req.body.user_phone_edit}` : afterFields = req.body.user_phone_edit;
                }

                if (editFields) {
                    logParam.editFields = editFields;
                    logParam.beforeFields = beforeFields;
                    logParam.afterFields = afterFields;
                    logParam.logType = 'M';
                    mypageModel.editPersonProfile(params, function(err, result) {
                        if (err) {
                            logger.error('Mypage > editPersonProfile / editPersonProfile error :: ' + JSON.stringify(err) + ' params :: ' + JSON.stringify(params));
                            res.json({'result': false, 'message': 'Error occurred.'});
                        } else {
                            logger.debug('Mypage > editPersonProfile / insertUserlog logParam :: ' + JSON.stringify(logParam));
                            mypageModel.insertUserlog(logParam, function(err, logResult) {});
                            res.json({'result': true, 'message': 'Your profile has changed.', 'refToken': refToken});
                        }
                    });
                } else {
                    logger.debug('Mypage > editPersonProfile / no change data');
                    res.json({'result': true, 'message': 'No changes were made.', 'refToken': refToken});
                }
            }
        });
    },

    /** 주주 유효성 체크 */
    checkShareHolder: function(req, res, refToken, next) {
        var userSeq = req.body.shareholderSeq;
        logger.debug('Mypage > checkShareHolder / userSeq :: ' + userSeq);
        mypageModel.checkShareHolder(userSeq, function(err, cnt) {
            if (err) {
                logger.error('Mypage > checkShareHolder / checkShareHolder error :: ' + JSON.stringify(err));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                res.json({'result': true, 'cnt': cnt[0].cnt, 'refToken': refToken});
            }
        });
    },

    /** 법인 프로파일 등록 */
    updateCorpProfile: function(req, res, token, refToken, next) {
        var params = req.body;
        params.userUuid = token.id;
        logger.debug('Mypage > updateCorpProfile / selectCorpCompanyInfo token.id :: ' + token.id);
        mypageModel.selectCorpCompanyInfo(token.id, function(err, companyCnt) {
            if (err) {
                logger.error('Mypage > updateCorpProfile / selectCorpCompanyInfo error :: ' + JSON.stringify(err));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                // DB Transaction 처리
                config.connection.getConnection(function(err, connection) {
                    connection.beginTransaction(function(err) {
                        if (err) {
                            logger.error('Mypage > updateCorpProfile / beginTransaction');
                            throw err;
                        } else {
                            logger.debug('Mypage > updateCorpProfile / selectCorpCompanyInfo companyCnt :: ' + companyCnt[0].cnt);
                            if (companyCnt[0].cnt > 0) {
                                // 법인 정보 수정(company_info)
                                mypageModel.updateCompanyInfo(connection, params, function(err, result) {
                                    if (err) {
                                        logger.error('Mypage > updateCorpProfile / updateCompanyInfo error :: ' + JSON.stringify(err) + '   params :: ' + JSON.stringify(params));
                                        connection.rollback(function() {
                                            throw err;
                                        });
                                    } else {
                                        logger.debug('Mypage > updateCorpProfile / insertShareholder params :: ' + JSON.stringify(params));
                                        mypageController.insertShareholder(req, res, connection, params, refToken);
                                    }
                                });
                            } else {
                                logger.debug('Mypage > updateCorpProfile / insertCompanyInfo params :: ' + JSON.stringify(params));
                                // 법인 정보 등록(company_info)
                                mypageModel.insertCompanyInfo(connection, params, function(err, result) {
                                    if (err) {
                                        logger.error('Mypage > updateCorpProfile / insertCompanyInfo error :: ' + JSON.stringify(err) + '   params :: ' + JSON.stringify(params));
                                        connection.rollback(function() {
                                            throw err;
                                        });
                                    } else {
                                        params.type = 'P';
                                        params.completeStep = '1';
                                        logger.debug('Mypage > updateCorpProfile / setUserStep params :: ' + JSON.stringify(params));
                                        mypageModel.setUserStep(connection, params, function(err, stepResult) {
                                            logger.debug('Mypage > updateCorpProfile / call insertShareholder :: ' + JSON.stringify(params));
                                            mypageController.insertShareholder(req, res, connection, params, refToken);
                                        });
                                    }
                                });
                            }
                        }
                    });
                }); // DB Transaction End
            }
        });
    },

    /** 주주정보 등록 */
    insertShareholder: function(req, res, connection, params, refToken) {
        var jsonParam = JSON.stringify(params);
        jsonParam = jsonParam.replace('shName[]', 'shName');
        jsonParam = jsonParam.replace('shUserSeq[]', 'shUserSeq');
        params = JSON.parse(jsonParam);
        logger.debug('Mypage > insertShareholder / deleteShareholder params :: ' + JSON.stringify(params));
        mypageModel.deleteShareholder(connection, params, function(err, result) {
            if (err) {
                logger.error('Mypage > insertShareholder / deleteShareholder error :: ' + JSON.stringify(err) + '   params :: ' + JSON.stringify(params));
                res.json({'result': false, 'message': 'Error occurred'});
            } else {
                if (typeof params.shName === 'string') {    // 주주가 1명인 경우
                    params.shName_ = params.shName;
                    params.shUserSeq_ = params.shUserSeq;
                    logger.debug('Mypage > insertShareholder / one shareholder insertShareholder :: ' + JSON.stringify(params));
                    mypageModel.insertShareholder(connection, params, function(err, result) {
                        if (err) {
                            logger.error('Mypage > insertShareholder / one shareholder insertShareholder error :: ' + JSON.stringify(err) + '   params :: ' + JSON.stringify(params));
                            connection.rollback(function() {
                                throw err;
                            });
                        } else {
                            connection.commit(function(err) {
                                if (err) {
                                    connection.rollback(function() {
                                        throw err;
                                    });
                                }
                                connection.release();
                                res.json({'result': true, 'message': '법인 회원 기본 정보 등록', 'refToken': refToken});
                            });
                        }
                    });
                } else {
                    for (var i = 0; i < params.shName.length; i++) {
                        // 주주정보 등록(shareholder)
                        params.shName_ = params.shName[i];
                        params.shUserSeq_ = params.shUserSeq[i];
                        logger.debug('Mypage > insertShareholder / shareholders insertShareholder :: ' + JSON.stringify(params));
                        mypageModel.insertShareholder(connection, params, function(err, result) {
                            if (err) {
                                logger.error('Mypage > insertShareholder / shareholders insertShareholder error :: ' + JSON.stringify(err) + '   params :: ' + JSON.stringify(params));
                                connection.rollback(function() {
                                    throw err;
                                });
                            }
                        });
                        if (i == (params.shName.length - 1)) {
                            connection.commit(function(err) {
                                if (err) {
                                    logger.error('Mypage > insertShareholder / shareholders commit error :: ' + JSON.stringify(err));
                                    connection.rollback(function() {
                                        throw err;
                                    });
                                }
                                logger.debug('Mypage > insertShareholder / shareholders commit complete count :: ' + (i + 1));
                                connection.release();
                                res.json({'result': true, 'message': '법인 회원 기본 정보 등록'});
                            });
                        }
                    }
                }
            }
        });
    },

    /** 법인 프로파일 파일 등록(step2) */
    corpProfileFileUpload: function(req, res, token, refToken, next) {
        var uploads = upload.fields([{ name: 'taxFile', maxCount: 1 }
                                    , { name: 'shareHolderFile', maxCount: 1 }
                                    , { name: 'delegateFile', maxCount: 1 }
                                    // , { name: 'proofFile', maxCount: 1 }
                                    , { name: 'etcFile', maxCount: 1 }]);
        logger.debug('Mypage > corpProfileFileUpload / file uploads :: ' + JSON.stringify(uploads));
        uploads(req, res, function(err) {
            var fileKeys = Object.keys(req.files);
            if (fileKeys.length === 0) {
                logger.debug('Mypage > corpProfileFileUpload / file uploads :: ' + JSON.stringify(uploads));
                res.json({'result': false, 'message': '파일을 선택해 주세요.'});
            } else {
                // 기존 등록된 파일이 있는지 체크
                mypageModel.selectKYCAttachFiles(token.id, function(err, memAttachFiles) {
                    if (err) {
                        logger.error('Mypage > corpProfileFileUpload / selectKYCAttachFiles error :: ' + JSON.stringify(err) + ' token.id :: ' + token.id);
                        res.json({'result': false, 'message': 'Error occurred.'});
                    } else {
                        logger.debug('Mypage > corpProfileFileUpload / selectKYCAttachFiles memAttachFiles.length :: ' + memAttachFiles.length);
                        if (memAttachFiles.length > 0) {
                            logger.debug('Mypage > corpProfileFileUpload / deleteKYCAttachFiles');
                            mypageModel.deleteKYCAttachFiles(token.id, function(err, delResult) {
                                var chkCnt = 1;
                                for (var i = 0; i < memAttachFiles.length; i++) {
                                    logger.debug('Mypage > corpProfileFileUpload / aws s3 file delete, folder :: CORP_ATTACH    save_filename :: ' + memAttachFiles[i].save_filename );
                                    s3Upload.delete('CORP_ATTACH', memAttachFiles[i].save_filename, function(err, awsDelResult) {
                                        if (chkCnt == memAttachFiles.length) {
                                            logger.debug('Mypage > corpProfileFileUpload / call corpProfileFileUploadSub');
                                            mypageController.corpProfileFileUploadSub(req, res, token, fileKeys, refToken);
                                        }
                                        chkCnt++;
                                    });
                                }
                            });
                        } else {
                            logger.debug('Mypage > corpProfileFileUpload / call corpProfileFileUploadSub');
                            mypageController.corpProfileFileUploadSub(req, res, token, fileKeys, refToken);
                        }
                    }
                });
            }
        });
    },

    /** 법인 프로파일 파일 등록(step2) - 실제 등록 */
    corpProfileFileUploadSub: function(req, res, token, fileKeys, refToken) {
        // DB Transaction 처리
        config.connection.getConnection(function(err, connection) {
            connection.beginTransaction(function(err) {
                logger.debug('Mypage > corpProfileFileUploadSub / beginTransaction');
                var i = 1;
                fileKeys.forEach(function(key) {
                    var file = req.files[key][0];
                    logger.debug('Mypage > corpProfileFileUploadSub / file upload file :: ' + JSON.stringify(file));
                    s3Upload.encUpload(req, res, 'CORP_ATTACH', file, function(err, file) {
                        if (err) {
                            logger.error('Mypage > corpProfileFileUploadSub / encUpload error :: ' + JSON.stringify(err));
                            // 실패하였을 경우 정책 필요
                            res.json({'result': false, 'message': 'Error occurred'});
                        } else {
                            var params = {
                                'userUuid': token.id
                                , 'attachType': file.fieldname == 'taxFile' ? 'C' : file.fieldname == 'shareHolderFile' ? 'S' : file.fieldname == 'delegateFile' ? 'D' : file.fieldname == 'proofFile' ? 'P' : 'E'
                                , 'attachUrl': file.saveFile
                                , 'saveFilename': file.encFileName
                                , 'orgFilename': file.originalname
                            };
                            logger.debug('Mypage > corpProfileFileUploadSub / insertUploadFileCorp params :: ' + JSON.stringify(params));
                            // 첨부파일 정보 DB저장
                            mypageModel.insertUploadFileCorp(connection, params, function(err, result) {
                                if (err) {
                                    logger.error('Mypage > corpProfileFileUploadSub / insertUploadFileCorp error :: ' + JSON.stringify(err) + ' params :: ' + JSON.stringify(params));
                                    connection.rollback(function() {
                                        throw err;
                                    });
                                } else {
                                    if (fileKeys.length === i) {
                                        logger.debug('Mypage > corpProfileFileUploadSub / aws file upload complete, file length :: ' + fileKeys.length);
                                        // 법인정보 등록완료 상태값 변경
                                        mypageModel.updateCompanyState(connection, params.userUuid, function(err, result) {
                                            if (err) {
                                                logger.error('Mypage > corpProfileFileUploadSub / insertUploadFileCorp error :: ' + JSON.stringify(err) + ' params :: ' + JSON.stringify(params));
                                                connection.rollback(function() {
                                                    throw err;
                                                });
                                            } else {
                                                params.completeStep = '2';
                                                params.type = 'P';
                                                logger.debug('Mypage > corpProfileFileUploadSub / setUserStep params :: ' + JSON.stringify(params));
                                                mypageModel.setUserStep(connection, params, function(err, stepResult) {
                                                    connection.commit(function(err) {
                                                        if (err) {
                                                            logger.error('Mypage > corpProfileFileUploadSub / commit error :: ' + JSON.stringify(err));
                                                            connection.rollback(function() {
                                                                throw err;
                                                            });
                                                        }
                                                        connection.release();
                                                        res.json({'result': true, 'message': '등록 처리되었습니다.', 'refToken': refToken});
                                                    });
                                                });
                                            }
                                        });
                                    }
                                    i++;
                                }
                            }); // insert
                        }   // else
                    }); // s3
                });
            }); // Connection
        });
    },

    /** 마이페이지 법인 프로파일 정보 조회 */
    profileCorpStep1: function(req, res, token, refToken, next) {
        logger.debug('Mypage > profileCorpStep1 / selectProfileCorpStep1Info token.id :: ' + token.id);
        mypageModel.selectProfileCorpStep1Info(token.id, function(err, result) {
            if (err) {
                logger.error('Mypage > profileCorpStep1 / selectProfileCorpStep1Info error :: ' + JSON.stringify(err) + '   token.id :: ' + token.id);
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                logger.debug('Mypage > profileCorpStep1 / selectProfileCorpStep1Info result :: ' + JSON.stringify(result));
                result[0].user_phone = result[0].user_phone ? cryptoUtil.deAes256CryptoIv(result[0].user_phone) : '';
                res.json({'result': true, 'corpInfo': result[0], 'refToken': refToken});
            }
        });
    },

    /** 마이페이지 법인 프로파일 수정 */
    editProfileCorpStep1: function(req, res, token, refToken, next) {
        var params = req.body;
        var editUserPhone = params.editUserPhone;
        params['userUuid'] = token.id;
        params['editUserPhone'] = cryptoUtil.aes256CryptoIv(editUserPhone);
        logger.debug('Mypage > editProfileCorpStep1 / editCorpProfile params :: ' + JSON.stringify(params));
        // 법인 회원 정보 변경
        mypageModel.editCorpProfile(params, function(err, result) {
            if (err) {
                logger.debug('Mypage > editProfileCorpStep1 / editCorpProfile error :: ' + JSON.stringify(err) + '  params :: ' + JSON.stringify(params));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                logger.debug('Mypage > editProfileCorpStep1 / editCorpProfile complete');
                res.json({'result': true, 'message': 'Your profile has changed.', 'refToken': refToken});
            }
        });
        logger.debug('Mypage > editProfileCorpStep1 / selectProfileCorpStep1Info token.id :: ' + token.id);
        // 정보 변경 history 저장
        mypageModel.selectProfileCorpStep1Info(token.id, function(err, memProfile) {
            if (err) {
                logger.error('Mypage > editProfileCorpStep1 / selectProfileCorpStep1Info error :: ' + JSON.stringify(err));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                var logParam = {
                    'userUuid': token.id
                    , 'editFields': ''
                    , 'beforeFields': ''
                    , 'afterFields': ''
                };
                var editFields = '';
                var beforeFields = '';
                var afterFields = '';
                logger.debug('Mypage > editProfileCorpStep1 / selectProfileCorpStep1Info params :: ' + JSON.stringify(params));
                logger.debug('Mypage > editProfileCorpStep1 / selectProfileCorpStep1Info result data :: ' + JSON.stringify(memProfile));
                if (params.editUserFirstName != memProfile[0].user_first_name) {
                    editFields = '이름';
                    beforeFields = memProfile[0].user_first_name;
                    afterFields = params.editUserFirstName;
                }
                if (params.editUserLastName != memProfile[0].user_last_name) {
                    editFields ? editFields += ',성' : editFields = '성';
                    beforeFields ? beforeFields += `,${memProfile[0].user_last_name}` : beforeFields = memProfile[0].user_last_name;
                    afterFields ? afterFields += `,${params.editUserLastName}` : afterFields = params.editUserLastName;
                }
                var oldUserPhone = memProfile[0].user_phone? cryptoUtil.deAes256CryptoIv(memProfile[0].user_phone)  : '';
                if (editUserPhone != oldUserPhone) {
                    editFields ? editFields += ',연락처' : editFields = '연락처';
                    beforeFields ? beforeFields += `,${oldUserPhone}` : beforeFields = oldUserPhone;
                    afterFields ? afterFields += `,${editUserPhone}` : afterFields = editUserPhone;
                }

                if (editFields) {
                    logParam.editFields = editFields;
                    logParam.beforeFields = beforeFields;
                    logParam.afterFields = afterFields;
                    logParam.logType = 'M';
                    logger.debug('Mypage > editProfileCorpStep1 / insertUserlog history params :: ' + JSON.stringify(logParam.logType));
                    mypageModel.insertUserlog(logParam, function(err, logResult) {});
                }

            }
        });
    },

    /** 마이페이지 법인 프로파일 정보 조회(step2) */
    profileCorpStep2: function(req, res, token, refToken, next) {
        var userUuid = token.id;
        logger.debug('Mypage > profileCorpStep2 / selectCorpProfileInfo userUuid :: ' + userUuid);
        mypageModel.selectCorpProfileInfo(userUuid, function(err, memProfile) {
            if (err) {
                logger.error('Mypage > profileCorpStep2 / selectCorpProfileInfo error :: ' + JSON.stringify(err));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                logger.debug('Mypage > profileCorpStep2 / selectKYCAttachFiles userUuid :: ' + userUuid);
                mypageModel.selectKYCAttachFiles(userUuid, function(err, memAttachFiles) {
                    if (err) {
                        logger.error('Mypage > profileCorpStep2 / selectKYCAttachFiles error :: ' + JSON.stringify(err));
                        res.json({'result': false, 'message': 'Error occurred.'});
                    } else {
                        logger.debug('Mypage > profileCorpStep2 / selectKYCAttachFiles memProfile :: ' + JSON.stringify(memProfile) + ' memAttachFiles :: ' + JSON.stringify(memAttachFiles));
                        var abode = JSON.parse(fs.readFileSync(__dirname + '/../../config/countryCodes.json'));
                        res.json({'result': true, 'memProfile': memProfile, 'abode': abode, 'memAttachFiles': memAttachFiles, 'refToken': refToken});
                    }
                });
            }
        });
    },

    /** 마이페이지 법인 프로파일 정보 조회(step3) */
    profileCorpStep3: function(req, res, token, refToken, next) {
        var userUuid = token.id;
        logger.debug('Mypage > profileCorpStep3 / selectCorpProfileInfo userUuid :: ' + userUuid);
        mypageModel.selectCorpProfileInfo(userUuid, function(err, memProfile) {
            if (err) {
                logger.error('Mypage > profileCorpStep3 / selectCorpProfileInfo error :: ' + JSON.stringify(err));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                logger.debug('Mypage > profileCorpStep3 / selectKYCAttachFiles userUuid :: ' + userUuid);
                mypageModel.selectKYCAttachFiles(userUuid, function(err, memAttachFiles) {
                    if (err) {
                        logger.error('Mypage > profileCorpStep3 / selectKYCAttachFiles error :: ' + JSON.stringify(err));
                        res.json({'result': false, 'message': 'Error occurred.'});
                    } else {
                        logger.debug('Mypage > profileCorpStep3 / selectKYCAttachFiles memProfile :: ' + JSON.stringify(memProfile) + ' memAttachFiles :: ' + JSON.stringify(memAttachFiles));
                        res.json({'result': true, 'memProfile': memProfile, 'memAttachFiles': memAttachFiles, 'refToken': refToken});
                    }
                });
            }
        });
    },

    // /** Token Sale 개인/법인 구분(Step1) */
    // tokenSaleUserType: function(res, res, token, next) {
    //     var userUuid = token.id;
    //     mypageModel.selectMyInfo(userUuid, function(err, result) {
    //         res.json({'result': true, 'myInfo': result[0]});
    //     });
    // },

    /** Token Sale 법인의 주주정보 조회(Step1) */
    corpShareHolderInfo: function(req, res, token, refToken, next) {
        var userUuid = token.id;
        logger.debug('Mypage > corpShareHolderInfo / selectCorpProfileInfo userUuid :: ' + userUuid);
        mypageModel.selectCorpProfileInfo(userUuid, function(err, shareHolderInfo) {
            if (err) {
                logger.error('Mypage > corpShareHolderInfo / selectCorpProfileInfo error :: ' + JSON.stringify(err));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                logger.debug('Mypage > corpShareHolderInfo / selectCorpProfileInfo shareHolderInfo :: ' + JSON.stringify(shareHolderInfo));
                res.json({'result': true, 'shareHolderInfo': shareHolderInfo, 'refToken': refToken});
            }
        });
    },

    /** 사용자 스텝 저장 */
    proceedSetStep: function(req, res, token, refToken, next) {
        var params = {
            'userUuid': token.id
            , 'type': req.body.type
            , 'completeStep': req.body.step
        }
        config.connection.getConnection(function(err, connection) {
            logger.debug('Mypage > proceedSetStep / setUserStep params :: ' + JSON.stringify(params));
            mypageModel.setUserStep(connection, params, function(err, stepResult) {
                connection.commit(function(err) {
                    if (err) {
                        logger.error('Mypage > proceedSetStep / setUserStep error :: ' + JSON.stringify(err));
                        connection.rollback(function() {
                            throw err;
                        });
                    }
                    connection.release();
                    
                    if (req.body.dType && req.body.dType == 'I') {
                        logger.debug('Mypage > proceedSetStep / tokenSalePartiCancel :: ' + JSON.stringify(params));
                        mypageModel.tokenSalePartiCancel(token.id, function(err, delRes) {
                        });
                    }
                    res.json({'result': true, 'message': 'Step이 등록(변경)되었습니다.', 'refToken': refToken});
                });
            });
        });
    },

    /** Token Sale 개인 KYC 인증 파일 업로드(step1) */
    tokenSaleKYCUpload: function(req, res, token, refToken, next) {
        var uploads = upload.fields([{ name: 'identityCard', maxCount: 1 }
                                    , { name: 'photoPassport', maxCount: 1 }]);
        logger.debug('Mypage > tokenSaleKYCUpload / tokenSaleKYCUpload uploads :: ' + JSON.stringify(uploads));
        uploads(req, res, function(err) {
            var fileKeys = Object.keys(req.files);
            if (fileKeys.length < 2) {
                logger.debug('Mypage > tokenSaleKYCUpload / uploads fileKeys.length :: ' + fileKeys.length);
                if (fileKeys.length === 0) {
                    res.json({'result': false, 'message': '파일을 선택해 주세요.'});
                } else {
                    res.json({'result': false, 'message': '파일을 모두 선택해 주세요.'});
                }
            } else {
                // 기존 등록된 파일이 있는지 체크
                mypageModel.selectKYCAttachFiles(token.id, function(err, memAttachFiles) {
                    if (err) {
                        logger.error('Mypage > tokenSaleKYCUpload / selectKYCAttachFiles error :: ' + JSON.stringify(err));
                        res.json({'result': false, 'message': 'Error occurred.'});
                    } else {
                        mypageModel.deleteKYCAttachFiles(token.id, function(err, delResult) {
                            if (err) {
                                logger.error('Mypage > tokenSaleKYCUpload / deleteKYCAttachFiles error :: ' + JSON.stringify(err));
                            } else {
                                for (var i = 0; i < memAttachFiles.length; i++) {
                                    logger.debug('Mypage > tokenSaleKYCUpload / deleteKYCAttachFiles for s3 folder :: KYC_ATTACH    save_filename :: ' + memAttachFiles[i].save_filename);
                                    s3Upload.delete('KYC_ATTACH', memAttachFiles[i].save_filename, function(err, awsDelResult) {               
                                    });
                                }
                                // DB Transaction 처리
                                config.connection.getConnection(function(err, connection) {
                                    connection.beginTransaction(function(err) {
                                        var i = 1;
                                        logger.debug('Mypage > tokenSaleKYCUpload / beginTransaction');
                                        fileKeys.forEach(function(key) {
                                            var file = req.files[key][0];
                                            logger.debug('Mypage > tokenSaleKYCUpload / encUpload file :: ' + JSON.stringify(file));
                                            s3Upload.encUpload(req, res, 'KYC_ATTACH', file, function(err, file) {
                                                if (err) {
                                                    logger.error('Mypage > tokenSaleKYCUpload / encUpload error :: ' + JSON.stringify(err));
                                                    // 실패하였을 경우 정책 필요
                                                    res.json({'result': false, 'message': 'Error occurred.'});
                                                } else {
                                                    var params = {
                                                        'userUuid': token.id
                                                        , 'attachType': file.fieldname == 'identityCard' ? 'IDC' : 'IDH'
                                                        , 'attachUrl': file.saveFile
                                                        , 'saveFilename': file.encFileName
                                                        , 'orgFilename': file.originalname
                                                    };
                                                    logger.debug('Mypage > tokenSaleKYCUpload / insertUploadFileCorp params :: ' + JSON.stringify(params));
                                                    // 첨부파일 정보 DB저장
                                                    mypageModel.insertUploadFileCorp(connection, params, function(err, result) {
                                                        if (err) {
                                                            logger.error('Mypage > tokenSaleKYCUpload / insertUploadFileCorp error :: ' + JSON.stringify(err) + '  params :: ' + JSON.stringify(params));
                                                            connection.rollback(function() {
                                                                // S3 파일 삭제도???
                                                                throw err;
                                                            });
                                                        } else {
                                                            if (fileKeys.length === i) {
                                                                logger.debug('Mypage > tokenSaleKYCUpload / sa upload complete, db update start');
                                                                logger.debug('Mypage > tokenSaleKYCUpload / updateUserDegree params :: ' + JSON.stringify(params));
                                                                // ico_user에 회차 update
                                                                mypageModel.updateUserDegree(connection, params, function(err, degreeRst) {
                                                                    logger.debug('Mypage > tokenSaleKYCUpload / insertIcoKycLog params :: ' + JSON.stringify(params));
                                                                    // KYC 인증 history 등록
                                                                    mypageModel.insertIcoKycLog(connection, params, function(err, degreeRst) {
                                                                        params.type = 'T';
                                                                        params.completeStep = '1';
                                                                        logger.debug('Mypage > tokenSaleKYCUpload / setUserStep params :: ' + JSON.stringify(params));
                                                                        mypageModel.setUserStep(connection, params, function(err, stepResult) {
                                                                            // transaction commit
                                                                            connection.commit(function(err) {
                                                                                if (err) {
                                                                                    connection.rollback(function() {
                                                                                        throw err;
                                                                                    });
                                                                                }
                                                                                connection.release();
                                                                                res.json({'result': true, 'message': '등록 처리되었습니다.', 'refToken': refToken});
                                                                            });
                                                                        });
                                                                    });
                                                                });
                                                            }
                                                            i++;
                                                        }
                                                    }); // insert
                                                }   // else
                                            }); // s3
                                        });
                                    }); // Connection
                                });
                            }
                        });
                    }
                });
            }
        })
    },

    /** Token Sale 인증 상태 확인 step2 */
    checkCertified: function(req, res, token, refToken, next) {
        mypageModel.checkCertified(token.id, function(err, resultInfo) {
            if (err) {
                logger.debug('Mypage > checkCertified / checkCertified error :: ' + JSON.stringify(err));
                res.json({'result': false, 'message': 'Error occurred'});
            } else {
                var userdType;
                var kycResult = 'E';
                var agreeAdminResult = resultInfo[0].agree_admin == 'N' ? 'Reviewing' : resultInfo[0].agree_admin == 'Y' ? 'Successful' : 'Declined';
                var kycFailCd = resultInfo[0].kyc_fail;
                var declinedFlg = false;
                var successfulFlg = false;
                var reviewFlg = false;

                // 기업의 주주 상태 체크
                for (var i = 0; i < resultInfo.length; i++) {
                    logger.debug('Mypage > checkCertified / checkCertified status userd_type :: ' + resultInfo[i].userd_type + '    p_kyc_yn :: ' + resultInfo[i].p_kyc_yn + '  c_kyc_yn :: ' + resultInfo[i].c_kyc_yn);
                    if (resultInfo[i].userd_type == 'P') {
                        userdType = 'person';
                        kycResult = resultInfo[i].p_kyc_yn == 'N' || resultInfo[i].p_kyc_yn == 'I' ? 'Reviewing' : resultInfo[i].p_kyc_yn == 'Y' ? 'Successful' : 'Declined';
                    } else {
                        userdType = 'corp';
                        if (resultInfo[i].c_kyc_yn == 'F') {
                            declinedFlg = true;
                            break;
                        } else if (resultInfo[i].c_kyc_yn == 'Y') {
                            successfulFlg = true;
                        } else {
                            reviewFlg = true;
                        }
                    }
                }

                if (resultInfo[0].userd_type == 'C') {
                    if (declinedFlg || agreeAdminResult == 'Declined') {
                        kycResult = 'Declined';
                    } else if (successfulFlg && !reviewFlg && agreeAdminResult == 'Successful') {
                        kycResult = 'Successful';
                    } else {
                        kycResult = 'Reviewing';
                    }
                }
                logger.debug('Mypage > checkCertified / checkCertified userdType :: ' + userdType + '    kycResult :: ' + kycResult + '     kycFailCd :: ' + kycFailCd);

                res.json({'result': true, 'userdTypeTxt': userdType, 'kycResult': kycResult, 'kycFailCd': kycFailCd, 'refToken': refToken});
            }
        });
    },

    /** token sale 참여수량 ICO 정보 조회 */
    tokenSaleExchangeInfo: function(req, res) {
        var coinType = req.body.coinType;
        logger.debug('Mypage > tokenSaleExchangeInfo / tokenSaleIcoPlanInfo coinType :: ' + coinType);
        mypageModel.tokenSaleIcoPlanInfo(coinType, function(err, result) {
            if (err) {
                logger.error('Mypage > tokenSaleExchangeInfo / tokenSaleIcoPlanInfo error :: ' + JSON.stringify(err));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                if (coinType) {
                    mypageModel.tokenSaleCoinPlan(coinType, function(err, coinPlan) {
                        logger.debug('Mypage > tokenSaleExchangeInfo / tokenSaleCoinPlan icoInfo :: ' + JSON.stringify(result[0]));
                        res.json({'result': true, 'icoInfo': result[0], 'coinPlan': coinPlan});
                    });
                } else {
                    res.json({'result': true, 'icoInfo': result});
                }
                
            }
        });
    },

    /** 투자중인 데이터 있는지 확인 */
    tokenSaleInvestInfo: function(req, res, token, refToken) {
        logger.debug('Mypage > tokenSaleInvestInfo / tokenSaleInvestInfo token.id :: ' + token.id);
        mypageModel.tokenSaleInvestInfo(token.id, function(err, investInfo) {
            logger.debug('Mypage > tokenSaleInvestInfo / tokenSaleInvestInfo investInfo :: ' + JSON.stringify(investInfo));
            res.json({'result': true, 'investInfo': investInfo, 'refToken': refToken});
        });
    },
    
    /** token sale 참여수량 등록 */
    tokenSalePartiInput: function(req, res, token, refToken, next) {
        var params = req.body;
        params.investAmt = params.partiAmount;
        params.userUuid = token.id;

        mypageModel.selectMyInfo(params.userUuid, function(err, checkKYC) {
            if (err) {
                ogger.debug('Mypage > tokenSalePartiInput / selectMyInfo ERROR :: ' + JSON.stringify(err));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                if (checkKYC && checkKYC.length > 0) {
                    if ((checkKYC[0].userd_type == 'P' && checkKYC[0].kyc_yn != 'Y') || (checkKYC[0].userd_type == 'C' && checkKYC[0].agree_admin != 'Y')) {
                        logger.debug('Mypage > tokenSalePartiInput / selectMyInfo KYC FAIL :: ' + JSON.stringify(checkKYC));
                        res.json({'result': false, 'falseKYC': true, 'message': 'Not yet completed KYC.'});
                    } else {
                        logger.debug('Mypage > tokenSalePartiInput / tokenSaleEnableYN params :: ' + JSON.stringify(params));
                        // 투자 상태 체크(투자하려는 코인 종류가 입금대기 상태이면 투자 불가)
                        mypageModel.tokenSaleEnableYN(params, function(err, tokenSaleEnableYN) {
                            logger.debug('Mypage > tokenSalePartiInput / tokenSaleEnableYN standByCnt :: ' + tokenSaleEnableYN[0].standByCnt);
                            if (tokenSaleEnableYN[0].standByCnt < 1) {
                                mypageModel.tokenSalePartiCancel(token.id, function(err, delRes) {
                                    if (err) {
                                        logger.error('Mypage > tokenSalePartiInput / tokenSalePartiCancel error :: ' + JSON.stringify(err));
                                        res.json({'result': false, 'message': 'Error occurred.'});
                                    } else {
                                        mypageModel.tokenSalePartiInput(params, function(err, result) {
                                            if (err) {
                                                logger.error('Mypage > tokenSalePartiInput / tokenSalePartiInput error :: ' + JSON.stringify(err));
                                                res.json({'result': false, 'message': 'failed'});
                                            } else {
                                                params.type = 'T';
                                                params.completeStep = '3';
                                                logger.debug('Mypage > tokenSalePartiInput / setUserStep params :: ' + JSON.stringify(params));
                                                config.connection.getConnection(function(err, connection) {
                                                    mypageModel.setUserStep(connection, params, function(err, stepResult) {
                                                        connection.commit(function(err) {
                                                            if (err) {
                                                                
                                                                connection.rollback(function() {
                                                                    throw err;
                                                                });
                                                            }
                                                            connection.release();
                                                            res.json({'result': true, 'message': '참여수량 등록이 완료되었습니다.', 'refToken': refToken});
                                                        });
                                                    });
                                                });
                                            }
                                        });
                                    }
                                });
                            } else {
                                logger.debug('Mypage > tokenSalePartiInput / Deposit standby :: ' + params.coinType);
                                res.json({'result': false, 'message': `You have a incompleted participation.` });
                            }
                        });
                    }
                }
            }
        });
    },

    /** Token Sale step4 사용자 참여 토근 및 제공자 wallet 정보 조회 */
    tokenSalePartiInfo: function(req, res, token, refToken, next) {
        logger.debug('Mypage > tokenSalePartiInfo / tokenSalePartiInfo token.id :: ' + token.id);
        mypageModel.tokenSalePartiInfo(token.id, function(err, result) {
            if (err || result.length != 1) {
                logger.error('Mypage > tokenSalePartiInfo / tokenSalePartiInfo error :: ' + JSON.stringify(err));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                var wallet;
                if (result && result.length > 0) {
                    logger.debug('Mypage > tokenSalePartiInfo / getWalletInfo result :: ' + JSON.stringify(result[0]));
                    // 입금할 지갑 조회
                    if (result[0].coin_type == 'BTC') {
                        mypageModel.getWalletInfo(token.id, function(err, walletRes) {
                            if (err || walletRes.length < 1) {
                                logger.error('Mypage > tokenSalePartiInfo / getWalletInfo error :: ' + JSON.stringify(err));
                                res.json({'result': false, 'message': 'Error occurred.'});
                            } else {
                                wallet = walletRes[0].btc_wallet;
                                if (!wallet) {
                                    logger.debug('Mypage > tokenSalePartiInfo / getWalletInfo empty wallet');
                                    res.json({'result': false, 'message': 'BTC wallet has not created.\nPlease try later.'});
                                } else {
                                    // 지갑 정보 QRCode 생성
                                    logger.debug('Mypage > tokenSalePartiInfo / createQRCode BTC wallet :: ' + wallet);
                                    otpauthUtil.createQRCode(wallet, function(qrCode) {
                                        result[0].wallet = wallet;
                                        result[0].walletQrcode = qrCode;
                                        res.json({'result': true, 'tokenSalePartiInfo': result[0], 'refToken': refToken});
                                    });
                                }
                            }
                        });
                    } else {
                        wallet = config.ETHWallet;
                        // 지갑 정보 QRCode 생성
                        logger.debug('Mypage > tokenSalePartiInfo / createQRCode ETH wallet :: ' + wallet);
                        otpauthUtil.createQRCode(wallet, function(qrCode) {
                            result[0].wallet = wallet;
                            result[0].walletQrcode = qrCode;
                            res.json({'result': true, 'tokenSalePartiInfo': result[0], 'refToken': refToken});
                        });
                    }
                } else {
                    res.json({'result': false});
                }
            }
        });
    },

    /** Token Sale step4 토큰 세일 참여하기 */
    tokenSaleParticipated: function(req, res, token, refToken, next) {
        var params = req.body;
        params.userUuid = token.id;

        mypageModel.selectMyInfo(params.userUuid, function(err, checkKYC) {
            if (err) {
                ogger.debug('Mypage > tokenSaleParticipated / selectMyInfo ERROR :: ' + JSON.stringify(err));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                if (checkKYC && checkKYC.length > 0) {
                    if ((checkKYC[0].userd_type == 'P' && checkKYC[0].kyc_yn != 'Y') || (checkKYC[0].userd_type == 'C' && checkKYC[0].agree_admin != 'Y')) {
                        logger.debug('Mypage > tokenSaleParticipated / selectMyInfo KYC FAIL :: ' + JSON.stringify(checkKYC));
                        res.json({'result': false, 'falseKYC': true, 'message': 'Not yet completed KYC.'});
                    } else {
                        var coinType = params.coinType;
                        logger.debug('Mypage > tokenSaleParticipated / coin type :: ' + coinType);
                        // 지갑주소 유효성 체크
                        var userSendWallet;
                        if (coinType == 'BTC') {
                            userSendWallet = params.BTCUserWalletAddr;
                        } else if (coinType == 'ETH') {
                            userSendWallet = params.ETHUserWalletAddr;
                        } else {
                            logger.debug('Mypage > tokenSaleParticipated / coinType not match. coinType :: ' + coinType);
                            res.json({'result': false, 'message': 'Error Conin type.'});
                        }
                        
                        if (coinType == 'BTC') {
                            mypageModel.getWalletInfo(token.id, function(err, walletRes) {
                                if (err || walletRes.length < 1) {
                                    logger.error('Mypage > tokenSaleParticipated / getWalletInfo error :: ' + JSON.stringify(err));
                                    res.json({'result': false, 'message': 'Error occurred.'});
                                } else {
                                    // BTC의 경우 입금주소 확인
                                    if (params.investAddress == walletRes[0].btc_wallet) {
                                        params.sendAddress = userSendWallet;  // 투자자 출금주소
                                        logger.debug('Mypage > tokenSaleParticipated / BTC updateTokenSalePartiInfo params :: ' + JSON.stringify(params));
                                        mypageModel.updateTokenSalePartiInfo(params, function(err, result) {
                                            if (err) {
                                                logger.error('Mypage > tokenSaleParticipated / BTC updateTokenSalePartiInfo error :: ' + JSON.stringify(err));
                                                res.json({'result': false, 'message': 'Error occurred.'});
                                            } else {
                                                params.type = 'T';
                                                params.completeStep = '4';
                                                config.connection.getConnection(function(err, connection) {
                                                    logger.debug('Mypage > tokenSaleParticipated / BTC setUserStep params :: ' + JSON.stringify(params));
                                                    mypageModel.setUserStep(connection, params, function(err, stepResult) {
                                                        connection.commit(function(err) {
                                                            if (err) {
                                                                logger.error('Mypage > tokenSaleParticipated / BTC commit error :: ' + JSON.stringify(err));
                                                                connection.rollback(function() {
                                                                    throw err;
                                                                });
                                                            }
                                                            connection.release();
                                                            // 메일 발송
                                                            //mypageController.transactionParticipationSendMail(req, res, params);
                                                            res.json({'result': true, 'message': '토큰 세일에 참여되었습니다.', 'refToken': refToken});
                                                        });
                                                    });
                                                });
                                            }
                                        });
                                    } else {
                                        logger.debug('Mypage > tokenSaleParticipated / BTC wallet not match');
                                        res.json({'result': false, 'message': '입금할 지갑주소가 상이하여 참여할 수 없습니다.'});
                                    }
                                }
                            });
            
                        } else if (coinType == 'ETH') {
                            // ETH의 경우 입력한 출금 주소와 실제 출금주소 대조
                            if (params.investAddress == config.ETHWallet) {  // 입금주소 확인
                                params.sendAddress = userSendWallet;
                                logger.debug('Mypage > tokenSaleParticipated / ETH updateTokenSalePartiInfo params :: ' + JSON.stringify(params));
                                mypageModel.updateTokenSalePartiInfo(params, function(err, result) {
                                    if (err) {
                                        logger.error('Mypage > tokenSaleParticipated / ETH updateTokenSalePartiInfo error :: ' + JSON.stringify(err));
                                        res.json({'result': false, 'message': 'Error occurred.'});
                                    } else {
                                        params.type = 'T';
                                        params.completeStep = '4';
                                        config.connection.getConnection(function(err, connection) {
                                            logger.debug('Mypage > tokenSaleParticipated / ETH setUserStep params :: ' + JSON.stringify(params));
                                            mypageModel.setUserStep(connection, params, function(err, stepResult) {
                                                connection.commit(function(err) {
                                                    if (err) {
                                                        logger.error('Mypage > tokenSaleParticipated / ETH commit error :: ' + JSON.stringify(err));
                                                        connection.rollback(function() {
                                                            throw err;
                                                        });
                                                    }
                                                    connection.release();
                                                    // 메일 발송
                                                    //mypageController.transactionParticipationSendMail(req, res, params);
                                                    res.json({'result': true, 'message': '토큰 세일에 참여되었습니다.'});
                                                });
                                            });
                                        });
                                    }
                                });
                            }
                        }
                    }
                }
            }
        });
    },

    /** 투자 완료 메일 발송 */
    transactionParticipationSendMail: function(req, res, params) {
        config.connection.getConnection(function(err, connection) {
            logger.debug('Mypage > transactionParticipationSendMail / transactionParticipationSendMail params :: ' + JSON.stringify(params));
            mypageModel.transactionParticipationSendMail(connection, params, function(err, particInfo) {
                var mailParmas = {
                    'planSeq' : params.planSeq
                    , 'userUuid' : params.userUuid
                    , 'userEmail' : particInfo[0].user_email
                    , 'sendYn' : 'Y'
                    , 'sendType' : 'participation'
                    , 'changeParam': particInfo[0]
                    , emailSubject : '[OASISBloc Presale] Your participation'
                    , emailFormNm : 'participation.html'
                    , emailSendMsg : '투자에 참여하였습니다.'
                }
                logger.debug('Mypage > transactionParticipationSendMail / commEmailSend mailParmas :: ' + JSON.stringify(mailParmas));
                commonController.commEmailSend(req, res, connection, mailParmas);
            });
        });
    },

    /** 지갑주소 중복 체크 */
    checkWalletDupl: function(req, res, token, refToken, next) {
        var params = req.body;
        params.userUuid = token.id;
        logger.debug('Mypage > checkWalletDupl / params :: ' + JSON.stringify(params));
        var WAValidator = require('wallet-address-validator');
        var coninValid = WAValidator.validate(params.walletAddress, params.coinType, config.WalletNetworkType);
        logger.debug('Mypage > tokenSaleParticipated / coin validate result :: ' + coninValid);
        if (!coninValid) {
            res.json({'result': false, 'coninInvalid': true, 'message': `Invalid ${params.coinType} Wallet address.`});
        } else {
            mypageModel.checkWalletDupl(params, function(err, duplCnt) {
                if (err) {
                    logger.error('Mypage > checkWalletDupl / checkWalletDupl error :: ' + JSON.stringify(err) + ' params :: ' + JSON.stringify(params));
                    res.json({'result': false, 'message': 'Error occurred.'});
                } else {
                    res.json({'result': true, 'duplCnt': duplCnt[0].duplCnt, 'refToken': refToken});
                }
            });
        }
    },

    /** 투자 통계 맟 KYC 결과 조회 */
    transactionParticipateInfo: function(req, res, token, refToken, next) {
        var params = req.body;
        params.userUuid = token.id;
        logger.debug('Mypage > transactionParticipateInfo / tokenSaleStats params :: ' + JSON.stringify(params));
        mypageModel.tokenSaleStats(params, function(err, statsInfoList) {   // 투자자가 입력한 투자 통계 및 KYC 결과
            if (err) {
                logger.error('Mypage > transactionParticipateInfo / tokenSaleStats error :: ' + JSON.stringify(err) + ' params :: ' + JSON.stringify(params));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                logger.debug('Mypage > transactionParticipateInfo / tokenSaleStats statsInfoList :: ' + JSON.stringify(statsInfoList));
                res.json({'result': true, 'statsInfoList': statsInfoList, 'refToken': refToken});
            }
        });
    },
    
    /** 차수 조회 */
    transactionDegreeList: function(req, res, token, refToken, next) {
        var params = req.body;
        params.userUuid = token.id;
        logger.debug('Mypage > transactionDegreeList / transactionDegreeList params :: ' + JSON.stringify(params));
        mypageModel.transactionDegreeList(params, function(err, degreeList) { // 투자 계획 및 계획 당 유효 투자 결과
            if (err) {
                logger.error('Mypage > transactionDegreeList / transactionDegreeList eerror :: ' + JSON.stringify(err) + ' params :: ' + JSON.stringify(params));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                if (degreeList && degreeList.length > 0) {
                    var degrees = [];    // 차수(차수별 텝 구성)
                    var idx = 0;
                    for (var i = 0; i < degreeList.length; i++) {
                        if (i == 0) {
                            degrees[idx] = degreeList[i].degree;
                            idx++;
                        } else {
                            if (degrees[idx -1] != degreeList[i].degree) {
                                degrees[idx] = degreeList[i].degree;
                                idx++;
                            }
                        }
                    }
                    logger.debug('Mypage > transactionDegreeList / transactionDegreeList result degrees :: ' + degrees + ' curDegree :: ' + degreeList[0].curDegree);
                    res.json({'result': true, 'degrees': degrees, 'curDegree': degreeList[0].curDegree, 'refToken': refToken});
                } else {
                    res.json({'result': false});
                }
            }
        });

    },

    /** 투자내역 조회 */
    transactionDegreeHistList: function(req, res, token, refToken, next) {
        var params = req.body;
        params.degree = params.degree ? params.degree : '1';
        params.userUuid = token.id;
        logger.debug('Mypage > transactionDegreeHistList / transactionDegreeHistList params degree :: ' + params.degree + ' userUuid :: ' + params.userUuid);
        mypageModel.transactionDegreeHistList(params, function(err, degreeResultList) { // 투자 내역 리스트의 상태
            if (err) {
                logger.error('Mypage > transactionDegreeHistList / transactionDegreeHistList error :: ' + JSON.stringify(err));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                var totBTCAmt = 0;
                var totETHAmt = 0;
                var totOSBAmt = 0;
                var bonusRate = 0;
                for (var i = 0; i < degreeResultList.length; i++) {
                    if (degreeResultList[i].invest_status == 'Y' || degreeResultList[i].invest_status == 'C') {
                        if (degreeResultList[i].coin_type == 'BTC') {
                            totBTCAmt += degreeResultList[i].receivedAmt;
                            
                        } else if (degreeResultList[i].coin_type == 'ETH') {
                            totETHAmt += degreeResultList[i].receivedAmt;
                        }
                        degreeResultList[i].osbAmt = (degreeResultList[i].receivedAmt * degreeResultList[i].per_amt) + (degreeResultList[i].receivedAmt * degreeResultList[i].per_amt * degreeResultList[i].bonus_rate * 0.01) ;
                        totOSBAmt += degreeResultList[i].osbAmt;
                    } else {
                        degreeResultList[i].osbAmt = 0;
                    }
                    bonusRate = degreeResultList[i].bonus_rate;
                    
                }
                logger.debug('Mypage > transactionDegreeHistList / transactionDegreeHistList degreeResultList :: ' + JSON.stringify(degreeResultList) + '   totBTCAmt :: ' + totBTCAmt + '  totETHAmt :: ' + totETHAmt + '  totOSBAmt :: ' + totOSBAmt + '  bonusRate :: ' + bonusRate);
                res.json({'result': true, 'degreeResultList': degreeResultList, 'totBTCAmt': totBTCAmt, 'totETHAmt': totETHAmt, 'totOSBAmt': totOSBAmt, 'bonusRate': bonusRate, 'refToken': refToken});
            }
        });
    },

    /** QRCdoe Image 생성 */
    transactionQRImg: function(req, res, token, refToken, next) {
        var qrCode = req.body.qrCode ? req.body.qrCode : '';
        logger.debug('Mypage > transactionQRImg / createQRCode :: ' + qrCode);
        otpauthUtil.createQRCode(qrCode, function(qrCodeImg) {
            res.json({'result': true, 'qrCodeImg': qrCodeImg, 'refToken': refToken});
        });
    },

    /** 토큰 교환 내역 */
    exchangeInfo: function(req, res, token, refToken, next) {
        var params = req.body;
        params.userUuid = token.id;
        logger.debug('Mypage > exchangeInfo / selectMyInfo token.id :: ' + token.id);
        mypageModel.selectMyInfo(token.id, function(err, myInfo) {
            if (err) {
                logger.error('Mypage > exchangeInfo / selectMyInfo error :: ' + JSON.stringify(err));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                logger.debug('Mypage > exchangeInfo / selectMyInfo :: ' + JSON.stringify(myInfo));
                if (myInfo && myInfo[0].tfa_use_yn == 'Y') {
                    logger.debug('Mypage > exchangeInfo / tokenSaleStats params :: ' + JSON.stringify(params));
                    mypageModel.tokenSaleStats(params, function(err, statsInfoList) {
                        if (err) {
                            logger.error('Mypage > exchangeInfo / tokenSaleStats error :: ' + JSON.stringify(err) + '   params :: ' + JSON.stringify(params));
                            res.json({'result': false, 'message': 'Error occurred.'});
                        } else {
                            mypageModel.exchangeInfoList(params, function(err, exchangeList) {
                                if (err) {
                                    logger.error('Mypage > exchangeInfo / exchangeInfoList error :: ' + JSON.stringify(err) + '   params :: ' + JSON.stringify(params));
                                    res.json({'result': false, 'message': 'Error occurred.'});
                                } else {
                                    mypageModel.getWalletInfo(token.id, function(err, walletInfo) {
                                        if (err) {
                                            logger.error('Mypage > exchangeInfo / getWalletInfo error :: ' + JSON.stringify(err));
                                            res.json({'result': false, 'message': 'Error occurred.'});
                                        } else {
                                            logger.debug('Mypage > exchangeInfo / tokenSaleStats statsInfoList :: ' + JSON.stringify(statsInfoList) + ' exchangeList :: ' + JSON.stringify(exchangeList) + '    walletInfo:: ' + JSON.stringify(walletInfo[0]));
                                            res.json({'result': true, 'OTP': 'Y', 'statsInfoList': statsInfoList, 'exchangeList': exchangeList, 'walletInfo': walletInfo[0], 'refToken': refToken});
                                        }
                                    });
                                }
                            })
                        }
                    });
                } else {
                    logger.debug('Mypage > exchangeInfo / not setting OTP');
                    res.json({'result': true, 'OTP': 'N'});
                }
            }
        });
    },

    /** 지갑주소 변경 */
    changeWalletAddr: function(req, res, token, refToken, next) {
        var params = req.body;
        params.userUuid = token.id;
        logger.debug('Mypage > changeWalletAddr / getWalletInfo params :: ' + JSON.stringify(params));
        mypageModel.getWalletInfo(params.userUuid, function(err, walletInfo) {
            if (err) {
                logger.debug('Mypage > changeWalletAddr / getWalletInfo error :: ' + JSON.stringify(err));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                if (walletInfo && walletInfo.length > 0) {
                    if (walletInfo[0].mat_wallet == params.walletAddr) {
                        logger.debug('Mypage > changeWalletAddr / getWalletInfo Not Chanaged beforeWallet :: ' + walletInfo[0].mat_wallet + '   afterWallet :: ' + params.walletAddr);
                        res.json({'result': false, 'message': 'Not changed OSB wallet address'});
                    } else if (walletInfo[0].exchangeStatus == 'N' || walletInfo[0].exchangeStatus == 'R') {
                        logger.debug('Mypage > changeWalletAddr / changeWalletAddr params :: ' + JSON.stringify(params));
                        mypageModel.changeWalletAddr(params, function(err, result) {
                            if (err) {
                                logger.error('Mypage > changeWalletAddr / changeWalletAddr error :: ' + JSON.stringify(err) + ' params :: ' + JSON.stringify(params));
                                res.json({'result': false, 'message': 'Error occurred.'});
                            } else {
                                params.editFields = '회원 OSB 지갑주소';
                                params.beforeFields = walletInfo[0].mat_wallet;
                                params.afterFields = params.walletAddr;
                                params.logType = 'W';
                                logger.debug('Mypage > changeWalletAddr / insertUserlog params :: ' + JSON.stringify(params));
                                mypageModel.insertUserlog(params, function(err, insertResult) {
                                    if (err) {
                                        logger.error('Mypage > changeWalletAddr / insertUserlog error :: ' + JSON.stringify(err) + ' params :: ' + JSON.stringify(params));
                                        res.json({'result': false, 'message': 'Error occurred.'});
                                    } else {
                                        logger.debug('Mypage > changeWalletAddr / insertUserlog result :: ' + JSON.stringify(insertResult));
                                        res.json({'result': true, 'message': 'Your wallet address has changed.', 'data': insertResult, 'refToken': refToken});
                                    }
                                });
                            }
                        });
                    } else {
                        logger.debug('Mypage > changeWalletAddr / getWalletInfo The wallet address is cannot be changed.');
                        res.json({'result': false, 'message': 'The wallet address is cannot be changed.', 'refToken': refToken});
                    }
                } else {
                    res.json({'result': false, 'message': 'No data.'});
                }
            }
        });
        
    },

    /** QRcode 생성 */
    createQRcode: function(req, res, token, refToken, next) {
        var userUuid = token.id;
        mypageModel.selectMyInfo(userUuid, function(err, result) {
            if (err) {
                logger.error('Mypage > createQRcode / selectMyInfo error :: ' + JSON.stringify(err));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                logger.debug('Mypage > createQRcode / selectMyInfo result :: ' + JSON.stringify(result[0]));
                if (result.length > 0) {
                    var userEmail = result[0].user_email;
                    logger.debug('Mypage > createQRcode / call createSecret userEmail :: ' + JSON.stringify(userEmail));
                    otpauthUtil.createSecret(userEmail, function(secretObj) {
                        logger.debug('Mypage > createQRcode / call createOtpAuthUrl secretObj :: ' + JSON.stringify(secretObj) + '  userEmail :: ' + userEmail);
                        otpauthUtil.createOtpAuthUrl(secretObj, userEmail, function(otpAuthUrl) {
                            logger.debug('Mypage > createQRcode / call createOtpAuthUrl otpAuthUrl :: ' + otpAuthUrl);
                            otpauthUtil.createQRCode(otpAuthUrl, function(qrCode) {
                                logger.debug('Mypage > createQRcode / result secretKey :: ' + secretObj.base32 + '  qrcode :: ' + qrCode);
                                res.json({'result': true, 'secretKey': secretObj.base32 , 'qrcode': qrCode, 'tfaUseYn': result[0].tfa_use_yn, 'secretKeyDB': result[0].secret_key, 'refToken': refToken});
                            });
                        });
                    });
                } else {
                    logger.debug('Mypage > createQRcode / no data');
                    res.json({'result': false, 'message': 'No data.'});
                }
                
            }
        });
    },


    /** OTP 등록 */
    createOTP: function(req, res, token, refToken, next) {
        var userUuid = token.id;
        var secretKey = req.body.secretKey;
        var userPwd = req.body.user_pwd;
        userPwd = cryptoUtil.sha256Crypto(cryptoUtil.sha256Crypto(userPwd));
        var userOtp = req.body.user_otp;
        logger.debug('Mypage > createOTP / selectMyInfo userUuid :: ' + userUuid);
        mypageModel.selectMyInfo(userUuid, function(err, result) {
            if (err) {
                logger.error('Mypage > createOTP / selectMyInfo error :: ' + JSON.stringify(err));
                throw err;
            } else {
                logger.debug('Mypage > createOTP / selectMyInfo result :: ' + JSON.stringify(result));
                if (result.length > 0 && result[0].login_pass == userPwd) {
                    logger.debug('Mypage > createOTP / verified secretKey :: ' + secretKey + '  userOtp :: ' + userOtp);
                    otpauthUtil.verified(secretKey, userOtp, function(result) {
                        if (result) {
                            var params = {
                                'secretKey': secretKey,
                                'userUuid': userUuid,
                                'tfaUseYn': 'Y'
                            }
                            logger.debug('Mypage > createOTP / updateUserSecretKey params :: ' + JSON.stringify(params));
                            mypageModel.updateUserSecretKey(params, function(err, result) {
                                if (err) {
                                    logger.error('Mypage > createOTP / updateUserSecretKey error :: ' + JSON.stringify(err));
                                    throw err;
                                } else {
                                    logger.debug('Mypage > createOTP / two-factor OK');
                                    res.json({'result': true, 'message': 'two-factor 인증이 처리되었습니다.', 'refToken': refToken});
                                }
                            });

                        } else {
                            logger.debug('Mypage > createOTP / two-factor Invalid code.');
                            res.json({'result': false, 'type': 'INVALID', 'message': 'Incorrect OTP code. Please try again.', 'refToken': refToken});
                        }
                    });
                    
                } else {
                    logger.debug('Mypage > createOTP / no selectMyInfo');
                    res.json({'result': false, 'type': 'INVALID', 'message': 'Incorrect password. Please try again.'});
                }
            }
        })

    },

    /** OTP 해제 */
    removeOTPAuth: function(req, res, token, refToken, next) {
        var userPwd = req.body.remove_user_pwd;
        userPwd = cryptoUtil.sha256Crypto(cryptoUtil.sha256Crypto(userPwd));
        var userOtp = req.body.remove_user_otp;
        logger.debug('Mypage > removeOTPAuth / selectMyInfo token.id :: ' + token.id);
        mypageModel.selectMyInfo(token.id, function(err, infoResult) {
            if (err) {
                logger.error('Mypage > removeOTPAuth / selectMyInfo error :: ' + JSON.stringify(err));
                res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                logger.debug('Mypage > removeOTPAuth / selectMyInfo result :: ' + JSON.stringify(infoResult));
                if (infoResult.length > 0 && infoResult[0].login_pass == userPwd) {
                    logger.debug('Mypage > removeOTPAuth / verified secret_key :: ' + infoResult[0].secret_key + '  userOtp :: ' + userOtp);
                    otpauthUtil.verified(infoResult[0].secret_key, userOtp, function(verifyResult) {
                        if (verifyResult) {
                            var params = {};
                            params.userUuid = token.id;
                            params.secretKey = null;
                            params.tfaUseYn = 'N'
                            logger.debug('Mypage > removeOTPAuth / updateUserSecretKey params :: ' + JSON.stringify(params));
                            mypageModel.updateUserSecretKey(params, function(err, result) {
                                if (err) {
                                    logger.error('Mypage > removeOTPAuth / updateUserSecretKey error :: ' + JSON.stringify(err) + ' params :: ' + JSON.stringify(params));
                                    throw err;
                                } else {
                                    logger.debug('Mypage > removeOTPAuth / two-factor Release OK');
                                    res.json({'result': true, 'message': 'two-factor 인증이 해제 처리되었습다.', 'refToken': refToken});
                                }
                            });

                        } else {
                            logger.debug('Mypage > removeOTPAuth / two-factor Invalid code');
                            res.json({'result': false, 'type': 'INVALID', 'message': 'Incorrect OTP code. Please try again.', 'refToken': refToken});
                        }
                    });

                } else {
                    logger.debug('Mypage > removeOTPAuth / no data selectMyInfo');
                    res.json({'result': false, 'type': 'INVALID', 'message': 'Incorrect password. Please try again.'});
                }
            }
        });
    }, 

    // /** OTP 재사용/재등록 */
    // recycleOTPAuth: function(req, res, token, next) {
    //     var userPwd = req.body.recycle_user_pwd;
    //     userPwd = cryptoUtil.sha256Crypto(cryptoUtil.sha256Crypto(userPwd));
    //     var userOtp = req.body.recycle_user_otp;
    //     var recycleType = req.body.recycle_type;

    //     mypageModel.selectMyInfo(token.id, function(err, infoResult) {
    //         if (err) {
    //             res.json({'result': false, 'message': '오류가 발생하였습니다.'});
    //         } else {
    //             if (infoResult.length > 0) {// && infoResult[0].login_pass == userPwd) {
    //                 var params = {
    //                     userUuid: token.id
    //                 }
    //                 if (recycleType == 'C') {   // 재등록
    //                     params.secretKey = '';
    //                     params.tfaUseYn = 'N';
    //                 } else {                    // 재사용
    //                     params.secretKey = infoResult[0].secret_key;
    //                     params.tfaUseYn = 'Y';
    //                 }

    //                 if (recycleType == 'C') {
    //                     mypageModel.updateUserSecretKey(params, function(err, result) {
    //                         if (err) {
    //                             throw err;
    //                         } else {
    //                             res.json({'result': true, 'message': '처리되었습니다.'});
    //                         }
    //                     });
    //                 } else {
    //                     if (infoResult[0].login_pass == userPwd) {
    //                         otpauthUtil.verified(infoResult[0].secret_key, userOtp, function(verifyResult) {
    //                             if (verifyResult) {
    //                                 mypageModel.updateUserSecretKey(params, function(err, result) {
    //                                     if (err) {
    //                                         throw err;
    //                                     } else {
    //                                         res.json({'result': true, 'message': '처리되었습니다.'});
    //                                     }
    //                                 });
        
    //                             } else {
    //                                 res.json({'result': false, 'message': 'OTP 번호가 일치하지 않습니다.'});
    //                             }
    //                         });
    //                     } else {
    //                         res.json({'result': false, 'message': '사용자 정보가 불일치 합니다.'});
    //                     }
    //                 }

    //             } else {
    //                 res.json({'result': false, 'message': '사용자 정보가 불일치 합니다.'});
    //             }
    //         }
    //     });
    // }
    
    refundWallet: function(req, res, token, refToken, next) {
        var params = req.body;
        if (!params.userUuid || !params.coinType) {
            res.json({'result': false, 'type': 'PARAM', 'message': 'Invalid parameter.', 'refToken': refToken});
        } else {
            logger.debug('Mypage > refundWallet / updateRefundWallet params :: ' + JSON.stringify(params));
            mypageModel.updateRefundWallet(params, function(err, updateResult) {
                if (err) {
                    logger.error('Mypage > refundWallet / updateRefundWallet error :: ' + err);
                    res.json({'result': false, 'type': 'ERRUPDATE', 'message': 'Error occurred.', 'refToken': refToken});
                } else {
                    res.json({'result': true, 'refToken': refToken});
                }
            });
        }
    },

    refundRegChk: function(req, res, token, refToken) {
        var params = req.body;
        if (!params.userUuid || !params.coinType || params.userUuid != token.id) {
            res.json({'result': false, 'type': 'PARAM', 'message': 'Invalid parameter.', 'refToken': refToken});
        } else {
            logger.debug('Mypage > refundRegChk / refundRegChk params :: ' + JSON.stringify(params));
            mypageModel.refundRegChk(params, function(err, result) {
                if (err) {
                    logger.error('Mypage > refundWallet / refundRegChk error :: ' + err);
                    res.json({'result': false, 'type': 'ERRUPDATE', 'message': 'Error occurred.', 'refToken': refToken});
                } else {
                    if (result[0][0].userCnt > 0) {
                        if (result[1][0].cnt < 1) {
                            res.json({'result': true, 'refToken': refToken});
                        } else {
                            res.json({'result': false, 'type': 'EXPIRE', 'message': 'Register wallet address has expired.', 'refToken': refToken});
                        }
                    } else {
                        res.json({'result': false, 'type': 'PARAM', 'message': 'Invalid parameter.', 'refToken': refToken});
                    }
                }
            });
        }
    }
}

module.exports = mypageController;