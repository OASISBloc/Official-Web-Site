const joinModel = require('../../../models/joinModel');
const sendMail = require('../../../util/sendmail');
const mypageModel = require('../../../models/mypageModel');
const logger = require('../../../util/logger');

var commonController = {
    /* 인증관련 메일 발송 */
    commEmailCertification: function(req, res, connection, mailParams) {
        // 메일인증을 위한 DB저장
        logger.debug(`commonController > commEmailCertification / mailParams :: ${JSON.stringify(mailParams)}`);
        joinModel.insertEmailCertification(connection, mailParams, function(err, result) {
            if (err) {
                logger.error(`commonController > commEmailCertification / insertEmailCertification :: ${JSON.stringify(err)}\n  mailParams :: ${JSON.stringify(mailParams)}`);
                connection.rollback(function() {
                    res.send({'result' : err.code});
                });
                
            } else {
                connection.commit(function(err) {
                    if (err) {
                        logger.error('commonController > commEmailCertification / commit insertEmailCertification :: ' + JSON.stringify(err));
                        connection.rollback(function() {
                            throw err;
                        });
                    } else {
                        // 메일 발송 처리
                        logger.debug(`commonController > commEmailCertification / call awsMail webmasterEmail :: ${config.webmasterEmail}\n mailParams :: ${JSON.stringify(mailParams)}`);
                        sendMail.awsMail(config.webmasterEmail, mailParams.userEmail, mailParams.emailSubject, mailParams.emailFormNm, mailParams);
                        res.send({'result' : 'OK', 'message' : mailParams.emailSendMsg});
                    }
                })
                
                connection.release();
            }
        });
    },
    /** 일반 메일 발송 */
    commEmailSend: function(req, res, connection, mailParams) {
        logger.debug(`commonController > commEmailSend / mailParams :: ${JSON.stringify(mailParams)}`);
        mypageModel.insertEmailHistory(connection, mailParams, function(err, result) {
            if (err) {
                logger.error(`commonController > commEmailSend / insertEmailHistory :: ${JSON.stringify(err)}\n mailParams :: ${JSON.stringify(mailParams)}`);
                connection.rollback(function() {
                    logger.error(`send email fail.`);
                });
            } else {
                connection.commit(function(err) {
                    if (err) {
                        logger.error('commonController > commEmailSend / Error commit :: ' + JSON.stringify(err));
                        connection.rollback(function() {
                            throw err;
                        });
                    } else {
                        logger.debug('commonController > commEmailSend / call awsMail webmasterEmail :: ' + config.webmasterEmail + '\n mailParams :: ' + JSON.stringify(mailParams));
                        sendMail.awsMail(config.webmasterEmail, mailParams.userEmail, mailParams.emailSubject, mailParams.emailFormNm, mailParams, 'PARTICIPATION');
                    }
                });
                connection.release();
            }
        });
    },


}

module.exports = commonController;
