const logger = require('../util/logger');

var loginModel = {

    /* 로그인 유저 확인 정보 조회 */
    selectLoginPassword: function(loginId, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT user_uuid, login_pass, user_seq, email_verify_yn
                FROM ico_user
                WHERE login_id = ?
            `;
            logger.debug('loginModel > selectLoginPassword / sql :: ' + sql + '\n   loginId :: ' + loginId);
            connection.query(sql, loginId, callback);
            connection.release();
        });
    },

    /** 유저 추가 정보 조회 */
    selectUserInfo: function(userUuid, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT user_uuid, user_first_name, user_last_name, secret_key, tfa_use_yn, email_verify_yn
                FROM ico_user
                WHERE user_uuid = ?
            `;
            logger.debug('loginModel > selectUserInfo / sql :: ' + sql + '\n   userUuid :: ' + userUuid);
            connection.query(sql, userUuid, callback);
            connection.release();
        });
    },

    /** 사용자 비밀번호 변경 */
    updateUserPassword: function(conn, params, callback) {
        var sql = `UPDATE ico_user
            SET login_pass = ?
            WHERE user_uuid = ?
        `;
        logger.debug('loginModel > updateUserPassword / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
        conn.query(sql, [params.newPwd, params.userUuid], callback);
    },

    /** 인증메일 재발송을 위한 정보 조회 */
    selectResendVerifyEmailInfo: function(param, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT IU.user_uuid, IU.user_seq, IR.retry_key
                FROM ico_user IU
                    , ico_repassword IR
                WHERE IU.user_uuid = IR.user_uuid
                    AND IU.user_seq = IR.user_seq
                    AND IU.user_email = ?
            `;
            logger.debug('loginModel > selectResendVerifyEmailInfo / sql :: ' + sql + '\n   param :: ' + param);
            connection.query(sql, param, callback);
            connection.release();
        });
    },

    /** 메일 인증 유효 시간 재설정 */
    updateMailSendTime: function(params, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `UPDATE ico_repassword
                SET create_dttm = NOW()
                WHERE user_uuid = ?
                    AND retry_key = ?
            `;
            logger.debug('loginModel > updateMailSendTime / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
            connection.query(sql, [params[0].user_uuid, params[0].retry_key], callback);
            connection.release();
        });
    },
    deleteUserVerify: function(conn, param, callback) {
        var sql = `DELETE FROM ico_repassword
            WHERE user_uuid = ?
        `;
        logger.debug('loginModel > deleteUserVerify / sql :: ' + sql + '\n   param :: ' + param);
        conn.query(sql, param, callback);
    }

};

module.exports = loginModel;