var fs = require('fs');
var ejs = require('ejs');
const logger = require('./logger');

var sendMail = {
    
    // gmail을 이용한 메일 발송
    gmail: function(from,to,subject,fname,params){

        fs.readFile(__dirname + '/../email/' + fname, function(err, html){

            if(err){
                console.log(err);
            }else{
                var toHtml = new String(html);
                if (fname == 'welcome.html') {  // 회원가입
                    toHtml = toHtml.replace('{href}', params.url);

                } else if (fname == 'resetPassword.html') {  // 비밀번호 찾기
                    toHtml = toHtml.replace('{href}', params.url);

                } else {
                    toHtml = toHtml.replace('{href}','링크변경');
                }

                var nodemailer = require('nodemailer');
                var transport = nodemailer.createTransport({  
                    service: 'Gmail',
                    auth: {
                        user: config.gmailId, //config/dev.conf.js에서 설정하세요
                        pass: config.gmailPw  //config/dev.conf.js에서 설정하세요
                    }
                });
                
                var mailOptions = {  
                    'from': from,
                    'to': to,
                    'subject': subject,
                    'html': toHtml
                };

                transport.sendMail(mailOptions, function(error, response){
                    if (error){
                        console.log(error);
                    } else {
                        console.log("Message sent : " + response.message);
                    }

                    transport.close();
                });
            }
        });
    },
    //aws 메일 발송
    awsMail: async function(from, to, subject, fname, params, type) {
        logger.debug('sendMail > awsMail / from :: ' + from + ' to :: ' + to +' subject :: ' + subject + '  fname :: ' + fname + '  params :: ' + JSON.stringify(params));
        await ejs.renderFile(__dirname + '/../email/' + fname, params, function(err, data) {
            //console.log(err || data);
            if (!err) {
                var nodemailer = require('nodemailer');
                var smtpTransport = require('nodemailer-smtp-transport');
                
                var transport = nodemailer.createTransport(smtpTransport({
                    host: config.awsEmailHost,
                    port: config.awsEmailPort,
                    secure: false,
                    auth: {
                        user: config.awsEmailId,
                        pass: config.awsEmailPw
                    },
                    tls: {
                        rejectUnauthorized: false
                    }
                }));
                
                var mailOptions = {
                    from: from, // sender address
                    to: to, // list of receivers
                    subject: subject, // Subject line
                    text: '', // plaintext body
                    html: data // html body
                };
                logger.debug('sendMail > awsMail / sendMail mailOptions :: ' + JSON.stringify(mailOptions));
                transport.sendMail(mailOptions, function(error, info) {
                    if (error) {
                        logger.error('sendMail > awsMail / sendMail error :: ' + JSON.stringify(error));
                    } else {
                        logger.debug('sendMail > awsMail / sendMail sent info.response :: ' + JSON.stringify(info.response));
                    }
                });
            } else {
                logger.error('sendMail > awsMail / error :: ' + JSON.stringify(err));
            }
        });
        
    },
    //aws 메일 발송(템블릿 없음)
    awsMailNoForm: async function(mailParams) {
        logger.debug('sendMail > awsMailNoForm / mailParams :: ' + JSON.stringify(mailParams));
        var nodemailer = require('nodemailer');
        var smtpTransport = require('nodemailer-smtp-transport');
        
        var transport = nodemailer.createTransport(smtpTransport({
            host: config.awsEmailHost,
            port: config.awsEmailPort,
            secure: false,
            auth: {
                user: config.awsEmailId,
                pass: config.awsEmailPw
            },
            tls: {
                rejectUnauthorized: false
            }
        }));
        
        var mailOptions = {
            from: config.webmasterEmail, // sender address
            to: config.supportEmail, // list of receivers
            subject: mailParams.subject, // Subject line
            text: mailParams.body, // plaintext body
        };
        logger.debug('sendMail > awsMailNoForm / sendMail mailOptions :: ' + JSON.stringify(mailOptions));
        transport.sendMail(mailOptions, function(error, info) {
            if (error) {
                logger.error('sendMail > awsMail / sendMail error :: ' + JSON.stringify(error));
            } else {
                logger.debug('sendMail > awsMail / sendMail sent info.response :: ' + JSON.stringify(info.response));
            }
        });
    }

}

module.exports = sendMail;