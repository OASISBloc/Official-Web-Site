const logger = require('../util/logger');

var joinModel = {
    /* 이메일 중복체크 */
    selectDuplEmail: function(param, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT COUNT(user_email) as emailCnt
                FROM ico_user
                WHERE user_email = ?
            `;
            logger.debug('joinModel > selectDuplEmail / sql :: ' + sql + '\n   param :: ' + param);
            connection.query(sql, param, callback);
            connection.release();
        });
    },

    /* 회원일련번호 채번 */
    insertNumseq: function(callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `INSERT INTO numseq(gubun) values('MJ')`;
            logger.debug('joinModel > insertNumseq / sql :: ' + sql);
            connection.query(sql, callback);
            connection.release();
        });
    },

    /* 회원 등록 */
    insertMemberInfos: function(conn, params, callback) {
        var sql = `INSERT INTO ico_user (
                user_uuid, login_id, login_pass, user_email, user_first_name
                , user_last_name, user_phone, userd_type, agree_terms_yn, agree_privacy_yn
                , agree_marketing_yn, create_dttm, user_seq, country_code
            ) VALUES (
                ?, ?, ?, ?, ?
                , ?, ?, ?, ?, ?
                , ?, now(), ?, ?
            )
        `;
        logger.debug('joinModel > insertMemberInfos / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
        conn.query(sql, [params.userUuid, params.loginId, params.loginPass, params.userEmail, params.userFirstName
                        , params.userLastName, params.userPhone, params.userdType, params.agreeTermsYn, params.agreePrivacyYn
                        , params.agreeMarketingYn, params.seq, params.userCountrycode], callback);
    },

    // 회원 확인을 위한 메일 인증키 등록
    insertEmailCertification: function(conn, params, callback) {
        var sql = `INSERT INTO ico_repassword (
                user_uuid, retry_key, create_dttm, user_seq
            ) VALUES (
                ?, ?, now(), ?
            )ON DUPLICATE KEY UPDATE retry_key=?, create_dttm=now()
        `;
        logger.debug('joinModel > insertEmailCertification / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
        conn.query(sql, [params.userUuid, params.retryKey, params.userSeq, params.retryKey], callback);
    },

    /* 메일 인증키 확인 */
    selectMailCertify: function(parmas, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT COUNT(user_uuid) AS count
                    , TIMESTAMPDIFF(MINUTE, create_dttm, now()) AS timeDiff
                FROM ico_repassword
                WHERE user_uuid = ?
                    AND retry_key = ?
            `;
            logger.debug('joinModel > selectMailCertify / sql :: ' + sql + '\n   params :: ' + JSON.stringify(parmas));
            connection.query(sql, [parmas.userUuid, parmas.retryKey], callback);
            connection.release();
        });
    },

    /* 유저정보에 메일 인증키 정상 업데이트 */
    updateUserEmailVerify: function(conn, params, callback) {
        var sql = `UPDATE ico_user
            SET email_verify_yn = 'Y'
            WHERE user_uuid = ?
        `;
        logger.debug('joinModel > updateUserEmailVerify / sql :: ' + sql + '\n   params.userUuid :: ' + params.userUuid);
        conn.query(sql, [params.userUuid], callback);
    },

    /* 메일 인증을 위한 키값 삭제 */
    deleteUserEmailCertification: function(conn, params, callback) {
        var sql = `DELETE FROM ico_repassword
            WHERE user_uuid = ?
                AND retry_key = ?
        `;
        logger.debug('joinModel > deleteUserEmailCertification / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
        conn.query(sql, [params.userUuid, params.retryKey], callback);
    },

    /** 정책 약관 버전 조회 */
    selectPolicyVer: function(params, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT board_id, board_type, terms_type, terms_version, DATE_FORMAT(create_dttm, '%d.%m.%Y') AS createDate
                        FROM ico_board
                        WHERE board_type = ?
                            AND terms_type = ?
                            AND board_view = 'Y'
                        ORDER BY terms_version DESC, board_id DESC
                            `;
            logger.debug('joinModel > selectPolicyVer / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
            connection.query(sql, [params.boardType, params.termsType], callback);
            connection.release();
        });
    },

    /** 정책 약관 조회 */
    selectPolicyData: function(params, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT board_id, board_type, board_content, terms_type, terms_version
                        FROM ico_board
                        WHERE board_id = ?
                            AND board_view = 'Y'
                            `;
            logger.debug('joinModel > selectPolicyData / sql :: ' + sql + '\n   params boardId:: ' + params.boardId);
            connection.query(sql, params.boardId, callback);
            connection.release();
        });
    }

};

module.exports = joinModel;