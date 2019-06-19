const mainModel = require('../../models/mainModel');
const logger = require('../../util/logger');
const fs = require('fs');
const cryptoUtil = require('../../util/crypto');
const sendMail = require('../../util/sendmail');

var mainController = {
    /** 프레세일 오픈 여부 및 남은 시간 */
    getSaleStatus: function(req, res) {
        mainModel.getSaleStatus(function(err, result) {
            if (err) {
                logger.error('mainController > getSaleStatus / getSaleStatus :: ' + JSON.stringify(err));
                res.json({'result': false});
            } else {
                if (result && result.length > 0) {
                    res.json({'result': true, "timeInfo": result});
                } else {
                    res.json({'result': false});
                }
            }
        })
    },
    /** 뉴스 메일링 신청 중복체크  */
    subscribeDuplEmailChk: function(req, res) {
        mainModel.subscribeDuplEmailChk(req.body.subscribeEmail, function(err, result) {
            if (err) {
                logger.error('mainController > subscribeDuplEmailChk / subscribeDuplEmailChk :: ' + JSON.stringify(err));
                res.json({'result': false});
            } else {
                if (result && result[0].emailCnt < 1) {
                    res.json({'result': true});
                } else {
                    res.json({'result': false});
                }
            }
        })
    },
    /** 공지사항 데이터 조회 */
    getNotice: function(req, res) {
        mainModel.getNotice(function(err, noticeInfo) {
            if (err) {
                logger.error('mainController > getNotice / getNotice :: ' + JSON.stringify(err));
                res.json({'result': false});
            } else {
                if (noticeInfo && noticeInfo.length > 0) {
                    res.json({'result': true, 'noticeInfo': noticeInfo[0]});
                } else {
                    res.json({'result': false});
                }
            }
        })
    },
    /** 뉴스 메일링 신청 등록  */
    addSubscribeEmail: function(req, res) {
        mainModel.addSubscribeEmail(req.body.subscribeEmail, function(err, result) {
            if (err) {
                logger.error('mainController > addSubscribeEmail / addSubscribeEmail :: ' + JSON.stringify(err));
                res.json({'result': false});
            } else {
                res.json({'result': true});
            }
        });
    },
    /** join as partner 문의 */
    getInquiryCates: function(req, res) {
        mainModel.getInquiryCates(function(err, catesList) {
            if (err) {
                logger.error('mainController > getInquiryCate / getInquiryCate :: ' + JSON.stringify(err));
                res.render('error', {layout: './layout/single-layout' });
            } else {
                var countries = JSON.parse(fs.readFileSync(__dirname + '/../../config/countryCodes.json'));
                res.render('./joinAsPartner/inquiry', {layout: './layout/main-layout', busiList: catesList[0], fieldList: catesList[1], countries: countries});
            }
        });
    },
    /** join as partner 문의 등록 */
    addInquiry: function(req, res) {
        var params = req.body;
        var busi_list = "";
        if (Array.isArray(params.busi_name)) {
            for (var i = 0; i < params.busi_name.length; i++) {
                if (busi_list == "") {
                    busi_list = params.busi_name[i];
                } else {
                    busi_list += "|" + params.busi_name[i]; 
                }
            }
        } else {
            busi_list = params.busi_name
        }
        params.busiList = busi_list;

        var field_list = "";
        if (Array.isArray(params.field_name)) {
            for (var i = 0; i < params.field_name.length; i++) {
                if (field_list == "") {
                    field_list = params.field_name[i];
                } else {
                    field_list += "|" + params.field_name[i]; 
                }
            }
        } else {
            field_list = params.field_name;
        }
        params.fieldList = field_list;
        params.aesPhone = params.phone ? cryptoUtil.aes256CryptoIv(params.phone) : null;

        mainModel.addInquiry(params, function(err, result) {
            if (err) {
                res.json({'result': false});
            } else {
                var mailParmas = {
                    subject: 'Join as partners 문의'
                    , body: `Join as partners 문의이 작성되었습니다.\n\n
                            MESSAGE:
                            ${params.message}`
                };
                sendMail.awsMailNoForm(mailParmas);

                res.json({'result': true});
            }
        })
    }

}

module.exports = mainController;