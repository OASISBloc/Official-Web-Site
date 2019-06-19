const logger = require('../util/logger');

var mypageModel = {

    /** 유저 정보 조회 */
    selectMyInfo: function(userUuid, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT IU.user_uuid, IU.user_email, IU.login_pass, IU.user_first_name, IU.user_last_name
                        , IU.country_code, IU.user_phone, IU.secret_key, IU.tfa_use_yn, IU.userd_type
                        , IU.user_seq, IU.kyc_yn, IU.agree_admin
                        , (SELECT complete_yn FROM company_info CI WHERE CI.user_uuid = IU.user_uuid) AS completeYn
                        , IFNULL((SELECT IUS.complete_step FROM ico_user_step IUS WHERE IUS.user_uuid = IU.user_uuid AND IUS.type = 'T'), '0') AS completeSep
                        , IFNULL((SELECT IUS.complete_step FROM ico_user_step IUS WHERE IUS.user_uuid = IU.user_uuid AND IUS.type = 'P'), '0') AS profileStep
                FROM ico_user IU
                WHERE IU.user_uuid = ?
            `;
            logger.debug('mypageModel > selectMyInfo / sql :: ' + sql + '\n   userUuid :: ' + userUuid);
            connection.query(sql, userUuid, callback);
            connection.release();
        });
    },

    /** token sale 참여하기 위한 동의 유무 */
    selectTokenAgreeYn:function(userUuid, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT agree_token_sale_yn, userd_type
                FROM ico_user
                WHERE user_uuid = ?
            `;
            logger.debug('mypageModel > selectTokenAgreeYn / sql :: ' + sql + '\n   userUuid :: ' + userUuid);
            connection.query(sql, userUuid, callback);
            connection.release();
        });
    },

    /** token sale 참여 유의사항 동의 업데이트 */
    updateTokenAgreeYn: function(userUuid, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `UPDATE ico_user
                SET agree_token_sale_yn = 'Y'
                WHERE user_uuid = ?
            `;
            logger.debug('mypageModel > updateTokenAgreeYn / sql :: ' + sql + '\n   userUuid :: ' + userUuid);
            connection.query(sql, userUuid, callback);
            connection.release();
        });
    },

    /** OTP 정보 변경 */
    updateUserSecretKey: function(params, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `UPDATE ico_user
                SET secret_key = ?
                    , tfa_use_yn = ?
                    , otp_his_dttm = NOW()
                WHERE user_uuid = ?
            `;
            logger.debug('mypageModel > updateUserSecretKey / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
            connection.query(sql, [params.secretKey, params.tfaUseYn, params.userUuid], callback);
            connection.release();
        });
    },

    /** 개인회원 프로파일 정보 조회 */
    selectPersonProfileInfo: function(userUuid, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT IU.user_first_name, IU.user_last_name, IU.country_code, IU.abode, IU.user_phone
                            , IU.userd_type, IU.birthday, substring(IU.birthday, 1, 4) AS yyyy, substring(IU.birthday, 5, 2) AS mm, substring(IU.birthday, 7, 2) AS dd
                            , IU.recommend
                            , CI.company_nm, CI.tax_no, CI.company_no, CI.abode AS corpAbode, CI.addr1, CI.addr2, CI.gugun, CI.sido, CI.zipcode, CI.complete_yn
                            , SH.sh_name, SH.sh_user_seq
                            , (SELECT IUS.complete_step FROM ico_user_step IUS WHERE IUS.user_uuid = IU.user_uuid AND IUS.type = 'P') AS completeSep
                        FROM ico_user IU
                            LEFT OUTER JOIN company_info CI
                                ON IU.user_uuid = CI.user_uuid
                            LEFT OUTER JOIN shareholder SH
                                ON IU.user_uuid = SH.user_uuid
                        WHERE IU.user_uuid = ?`;
            logger.debug('mypageModel > selectPersonProfileInfo / sql :: ' + sql + '\n   userUuid :: ' + userUuid);
            connection.query(sql, userUuid, callback);
            connection.release();
        });
    },

    /** 개인 프로파일 등록 */
    updatePersonProfile: function(params, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `UPDATE ico_user
                SET user_first_name = ?
                    , user_last_name = ?
                    , country_code = ?
                    , abode = ?
                    , user_phone = ?
                    , birthday = ?
                    , recommend = ? 
                WHERE user_uuid = ?
            `;
            logger.debug('mypageModel > updatePersonProfile / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
            connection.query(sql, [params.user_first_name, params.user_last_name, params.country_code, params.abode, params.user_phone, params.birth, params.recommend, params.userUuid], callback);
            connection.release();
        });
    },

    /** 개인 프로파일 수정 */
    editPersonProfile: function(params, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `UPDATE ico_user
                SET abode = ?
                    , user_phone = ?
                WHERE user_uuid = ?
            `;
            logger.debug('mypageModel > editPersonProfile / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
            connection.query(sql, [params.abode, params.user_phone, params.userUuid], callback);
            connection.release();
        });
    },

    /** 법인 프로파일 정보 조회 */
    selectCorpProfileInfo: function(userUuid, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT IU.userd_type, CI.company_nm, CI.tax_no, CI.company_no, CI.abode AS corpAbode, CI.addr1, CI.addr2, CI.gugun, CI.sido, CI.zipcode
                            , SH.sh_name, SH.sh_user_seq, CI.complete_yn
                            , (SELECT sIU.kyc_yn FROM ico_user sIU WHERE sIU.user_seq = SH.sh_user_seq) AS kyc_yn
                            , (SELECT IUS.complete_step FROM ico_user_step IUS WHERE IUS.user_uuid = IU.user_uuid AND IUS.type = 'P') AS completeSep
                        FROM ico_user IU
                            LEFT OUTER JOIN company_info CI
                            ON IU.user_uuid = CI.user_uuid
                            LEFT OUTER JOIN shareholder SH
                            ON IU.user_uuid = SH.user_uuid
                        WHERE IU.user_uuid = ?`;
            logger.debug('mypageModel > selectCorpProfileInfo / sql :: ' + sql + '\n   userUuid :: ' + userUuid);
            connection.query(sql, userUuid, callback);
            connection.release();
        });
    },

    /** 추천인 유효성 체크 */
    profileCheckRecommend: function(param, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT COUNT(*) AS cnt
                        FROM ico_recommend
                        WHERE re_code = ?`;
            logger.debug('mypageModel > profileCheckRecommend / sql :: ' + sql + '\n   param.recommend :: ' + param.recommend);
            connection.query(sql, param.recommend, callback);
            connection.release();
        });
    },

    /** 주주 요효성 체크 */
    checkShareHolder: function(userSeq, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT COUNT(*) AS cnt
                        FROM ico_user
                        WHERE user_seq = ?
                            AND drop_yn = 'N'`;
            logger.debug('mypageModel > checkShareHolder / sql :: ' + sql + '\n   userSeq :: ' + userSeq);
            connection.query(sql, userSeq, callback);
            connection.release();
        });
    },

    /** 법인 정보 등록 유무 */
    selectCorpCompanyInfo: function(userUuid, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT COUNT(*) AS cnt
                        FROM company_info
                        WHERE user_uuid = ?`;
            logger.debug('mypageModel > selectCorpCompanyInfo / sql :: ' + sql + '\n   userUuid :: ' + userUuid);
            connection.query(sql, userUuid, callback);
            connection.release();
        });
    },

    /** 법인 기본정보 등록 */
    insertCompanyInfo: function(conn, params, callback) {
        var sql = `INSERT INTO company_info (
                user_uuid, user_seq, company_nm, company_no, tax_no
                , abode, addr1, addr2, sido, gugun
                , zipcode, create_dttm
            ) SELECT ?, user_seq, ?, ?, ?
                , ?, ?, ?, ?, ?
                , ?, NOW()
            FROM ico_user
            WHERE user_uuid = ?
        `;
        logger.debug('mypageModel > insertCompanyInfo / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
        conn.query(sql, [params.userUuid, params.companyNm, params.companyNo, params.taxNo
            , params.corpAbode, params.addr1, params.addr2, params.sido, params.gugun
            , params.zipcode, params.userUuid], callback);
    },

    /** 법인 기본정보 등록(서류 파일) */
    insertUploadFileCorp: function(conn, params, callback) {
        var sql = `INSERT INTO kyc_attach (
                user_uuid, user_seq, attach_type, attach_url, save_filename
                , org_filename, create_dttm
            ) SELECT ?, user_seq, ?, ?, ?
                , ?, NOW()
            FROM ico_user
            WHERE user_uuid = ?
        `;
        logger.debug('mypageModel > insertUploadFileCorp / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
        conn.query(sql, [params.userUuid, params.attachType, params.attachUrl, params.saveFilename
            , params.orgFilename, params.userUuid], callback);
    },

    /** 개인인 경우 KYC 인증할 때 회차 업데이트 */
    updateUserDegree: function(conn, params, callback) {
        var sql = `UPDATE ico_user
                SET degree = (SELECT degree 
                                FROM ico_plan 
                                WHERE open_yn = 'Y')
                    , kyc_yn = 'I'
                    , kyc_dttm = NOW()
                WHERE user_uuid = ?
        `;
        logger.debug('mypageModel > updateUserDegree / sql :: ' + sql + '\n   params.userUuid :: ' + params.userUuid);
        conn.query(sql, params.userUuid, callback);
    },

    /** KYC 인증 시도에 대한 history 등록 */
    insertIcoKycLog: function(conn, params, callback) {
        var sql = `INSERT INTO ico_kyc_log (
                    user_uuid, user_seq, user_email, degree, kyc_yn
                    , create_user, create_uuid, create_dttm
                ) SELECT user_uuid, user_seq, user_email, (SELECT degree FROM ico_plan WHERE open_yn = 'Y' AND DATE_FORMAT(NOW(), '%Y%m%d%H%i') BETWEEN from_date AND to_date), 'N'
                    , 'U', user_uuid, NOW()
                FROM ico_user
                WHERE user_uuid = ?
            `;
        logger.debug('mypageModel > insertIcoKycLog / sql :: ' + sql + '\n   params.userUuid :: ' + params.userUuid);
        conn.query(sql, params.userUuid, callback);
    },

    /** 법인 기본정보 수정 */
    updateCompanyInfo: function(conn, params, callback) {
        var sql = `UPDATE company_info 
                SET company_nm = ?
                    , company_no = ?
                    , tax_no = ?
                    , abode = ?
                    , addr1 = ?
                    , addr2 = ?
                    , sido = ?
                    , gugun = ?
                    , zipcode = ?
                WHERE user_uuid = ?
        `;
        logger.debug('mypageModel > updateCompanyInfo / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
        conn.query(sql, [params.companyNm, params.companyNo, params.taxNo
            , params.corpAbode, params.addr1, params.addr2, params.sido, params.gugun
            , params.zipcode, params.userUuid], callback);
    },

    /** 법인 상태값 변경(완료) */
    updateCompanyState: function(conn, userUuid, callback) {
        var kycUpdateSql = `UPDATE ico_user
                            SET degree = (SELECT degree 
                                            FROM ico_plan 
                                            WHERE open_yn = 'Y')
                                , kyc_yn = 'I'
                                , kyc_dttm = NOW()
                            WHERE user_uuid = ?
        `;
        logger.debug('mypageModel > updateCompanyState / kycUpdateSql sql :: ' + kycUpdateSql + '\n   userUuid :: ' + userUuid);
        conn.query(kycUpdateSql, userUuid);

        var sql = `UPDATE company_info 
                SET complete_yn = 'Y'
                WHERE user_uuid = ?
        `;
        logger.debug('mypageModel > updateCompanyState / UPDATE company_info sql :: ' + sql + '\n   userUuid :: ' + userUuid);
        conn.query(sql, userUuid, callback);
    },

    /** 법인 주주정보 등록 */
    insertShareholder: function(conn, params, callback) {
        var sql = `INSERT INTO shareholder (
                user_uuid, user_seq, sh_name, sh_user_seq, create_dttm
            ) VALUES (
                ?, (SELECT user_seq FROM ico_user WHERE user_uuid = ?), ?, ?, NOW()
            )
        `;
        logger.debug('mypageModel > insertShareholder / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
        conn.query(sql, [params.userUuid, params.userUuid, params.shName_, params.shUserSeq_], callback);
    },

    /** 법인 주주정보 삭제 */
    deleteShareholder: function(conn, params, callback) {
        var sql = `DELETE FROM shareholder
            WHERE user_uuid = ?
        `;
        logger.debug('mypageModel > deleteShareholder / sql :: ' + sql + '\n   params.userUuid :: ' + params.userUuid);
        conn.query(sql, params.userUuid, callback);
    },

    /** 마이페이지 법인 프로파일 수정 step1 데이터 조회 */
    selectProfileCorpStep1Info: function(userUuid, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT IU.user_email, IU.user_first_name, IU.user_last_name, IU.user_phone, IU.country_code
                            , (SELECT org_filename FROM kyc_attach WHERE user_uuid = IU.user_uuid AND attach_type = 'P') AS proofFile
                            , (SELECT org_filename FROM kyc_attach WHERE user_uuid = IU.user_uuid AND attach_type = 'E') AS etcFile
                        FROM ico_user IU
                        WHERE IU.user_uuid = ?`;
            logger.debug('mypageModel > selectProfileCorpStep1Info / sql :: ' + sql + '\n   userUuid :: ' + userUuid);
            connection.query(sql, userUuid, callback);
            connection.release();
        });
    },

    /** 법인 프로파일 수정 */
    editCorpProfile: function(params, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `UPDATE ico_user
                SET user_first_name = ?
                    , user_last_name = ?
                    , user_phone = ?
                WHERE user_uuid = ?
            `;
            logger.debug('mypageModel > editCorpProfile / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
            connection.query(sql, [params.editUserFirstName, params.editUserLastName, params.editUserPhone, params.userUuid], callback);
            connection.release();
        });
    },

    /** 인증 첨부파일 조회 */
    selectKYCAttachFiles: function(userUuid, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT attach_type, attach_url, save_filename, org_filename
                        FROM kyc_attach
                        WHERE user_uuid = ?
            `;
            logger.debug('mypageModel > selectKYCAttachFiles / sql :: ' + sql + '\n   userUuid :: ' + userUuid);
            connection.query(sql, userUuid, callback);
            connection.release();
        });
    },

    /** 인증 첨부파일 삭제 */
    deleteKYCAttachFiles: function(userUuid, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `DELETE FROM kyc_attach
                        WHERE user_uuid = ?
            `;
            logger.debug('mypageModel > deleteKYCAttachFiles / sql :: ' + sql + '\n   userUuid :: ' + userUuid);
            connection.query(sql, userUuid, callback);
            connection.release();
        });
    },

    /** 사용자 정보 변경 이력 등록 */
    insertUserlog: function(params, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `INSERT INTO ico_user_log (
                    user_uuid, edit_fields, before_fields, after_fields, create_user
                    , create_uuid, create_dttm, log_type
                ) values (
                    ?, ?, ?, ?, 'U'
                    , ?, NOW(), ?
                )
            `;
            logger.debug('mypageModel > insertUserlog / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
            connection.query(sql, [params.userUuid, params.editFields, params.beforeFields, params.afterFields, params.userUuid, params.logType], callback);
            connection.release();
        });
    },

    /** Token Sale 인증 상태 확인(개인, 법인) */
    checkCertified: function(userUuid, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `WITH temp AS (SELECT IU.user_uuid, IU.userd_type, IU.kyc_yn AS p_kyc_yn, IU.kyc_fail, IU.agree_admin, SH.sh_user_seq
                            FROM ico_user IU
                                LEFT OUTER JOIN shareholder SH
                                    ON IU.user_uuid = SH.user_uuid
                            WHERE IU.user_uuid = ?
                        )
                        SELECT T.*, sIU.kyc_yn AS c_kyc_yn
                        FROM temp T
                            LEFT OUTER JOIN ico_user sIU
                                ON T.sh_user_seq = sIU.user_seq
            `;
            logger.debug('mypageModel > checkCertified / sql :: ' + sql + '\n   userUuid :: ' + userUuid);
            connection.query(sql, userUuid, callback);
            connection.release();
        });
    },

    /** token sale ICO 계획 정보 조회 */
    tokenSaleIcoPlanInfo: function(coinType, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT IP.degree, IP.from_date, IP.to_date, IP.dday_yn, IP.bonus_rate
                        , IPD.coin_type, IPD.coin_name, IPD.per_amt
                    FROM ico_plan IP
                        , ico_plan_detail IPD
                    WHERE IP.plan_seq = IPD.plan_seq
                        AND IP.open_yn = 'Y' 
                        AND DATE_FORMAT(NOW(), '%Y%m%d%H%i') BETWEEN IP.from_date AND IP.to_date
            `;
            if (coinType) {
                sql += `AND IPD.coin_type = ?`;
            }
            logger.debug('mypageModel > tokenSaleIcoPlanInfo / sql :: ' + sql + '\n   coinType :: ' + coinType);
            connection.query(sql, coinType, callback);
            connection.release();
        });
    },

    /** token sale Coin별 ICO 정보 조회 */
    tokenSaleCoinPlan: function(coinType, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT IP.degree, IP.bonus_rate, IP.open_yn
                        , SUBSTR(IP.from_date, 1, 4) AS fyear
                        , DATE_FORMAT(CONCAT(CONCAT_WS('-', SUBSTR(IP.to_date, 1, 4), 
                                        SUBSTR(IP.from_date, 5, 2),
                                        SUBSTR(IP.from_date, 7, 2)),
                                ' '
                            ), '%b %e') AS fromDate
                        , DATE_FORMAT(CONCAT(CONCAT_WS('/', SUBSTR(IP.to_date, 1, 4), 
                                        SUBSTR(IP.to_date, 5, 2),
                                        SUBSTR(IP.to_date, 7, 2)),
                                ' ',
                                CONCAT_WS(':',
                                        SUBSTR(IP.to_date, 9, 2),
                                        SUBSTR(IP.to_date, 11, 2))
                            ), '%b %e') AS toDate
                        , IPD.per_amt
                        , CASE WHEN IP.to_date < DATE_FORMAT(NOW(), '%Y%m%d%H%i') THEN 'Y' ELSE 'N' END AS successYn
                    FROM ico_plan IP
                        , ico_plan_detail IPD
                    WHERE IP.plan_seq = IPD.plan_seq
                        AND IPD.coin_type = ?
            `;
            logger.debug('mypageModel > tokenSaleCoinPlan / sql :: ' + sql + '\n   coinType :: ' + coinType);
            connection.query(sql, coinType, callback);
            connection.release();
        });
    },

    /** 투자 가능 유무 */
    tokenSaleEnableYN: function(params, callback) {
        config.connection.getConnection(function(err, connection) {
            var insertSql = `INSERT INTO ico_invest_hist (
                                    invest_seq, plan_seq, user_uuid, coin_type, send_address
                                    , invest_address, invest_amt
                                    , edit_dttm
                                    , user_seq
                                    , invest_status
                                    , received_amt, confirmations, txid, received_dttm, send_invest_address
                                    , received_address, status_y_mail, status_y_mail_dttm
                                )
                                SELECT invest_seq, plan_seq, user_uuid, coin_type, send_address
                                    , invest_address, invest_amt
                                    , NOW()
                                    , user_seq
                                    , 'N'
                                    , received_amt, confirmations, txid, received_dttm, send_invest_address
                                    , received_address, status_y_mail, status_y_mail_dttm
                                FROM ico_invest
                                WHERE user_uuid = ?
                                    AND coin_type = ?
                                    AND invest_status IN ('I')
                                    AND plan_seq IN (SELECT plan_seq
                                                        FROM ico_plan
                                                        WHERE to_date < DATE_FORMAT(NOW(), '%Y%m%d%H%i')
                                                    )
            `;
            logger.debug('mypageModel > tokenSaleEnableYN / INSERT INTO ico_invest_hist sql :: ' + insertSql + '\n   params :: ' + JSON.stringify(params));
            connection.query(insertSql, [params.userUuid, params.coinType]);

            var updateSql = `UPDATE ico_invest
                                SET invest_status = 'N'
                                    , edit_dttm = NOW()
                                WHERE user_uuid = ?
                                    AND coin_type = ?
                                    AND invest_status IN ('I')
                                    AND plan_seq IN (SELECT plan_seq
                                                        FROM ico_plan
                                                        WHERE to_date < DATE_FORMAT(NOW(), '%Y%m%d%H%i')
                                                    )
            `;
            logger.debug('mypageModel > tokenSaleEnableYN / UPDATE ico_invest sql :: ' + updateSql + '\n   params :: ' + JSON.stringify(params));
            connection.query(updateSql, [params.userUuid, params.coinType]);

            var insertSql = `INSERT INTO ico_invest_hist (
                            invest_seq, plan_seq, user_uuid, coin_type, send_address
                            , invest_address, invest_amt
                            , edit_dttm
                            , user_seq
                            , invest_status
                            , received_amt, confirmations, txid, received_dttm, send_invest_address
                            , received_address, status_y_mail, status_y_mail_dttm
                        )
                        SELECT invest_seq, plan_seq, user_uuid, coin_type, send_address
                            , invest_address, invest_amt
                            , NOW()
                            , user_seq
                            , 'Y'
                            , received_amt, confirmations, txid, received_dttm, send_invest_address
                            , received_address, status_y_mail, status_y_mail_dttm
                        FROM ico_invest
                        WHERE user_uuid = ?
                            AND coin_type = ?
                            AND invest_status IN ('C')
                            AND plan_seq IN (SELECT plan_seq
                                                FROM ico_plan
                                                WHERE to_date < DATE_FORMAT(NOW(), '%Y%m%d%H%i')
                                            )
            `;
            logger.debug('mypageModel > tokenSaleEnableYN / INSERT INTO ico_invest_hist sql :: ' + insertSql + '\n   params :: ' + JSON.stringify(params));
            connection.query(insertSql, [params.userUuid, params.coinType]);

            var updateSql = `UPDATE ico_invest
                        SET invest_status = 'Y'
                            , edit_dttm = NOW()
                        WHERE user_uuid = ?
                            AND coin_type = ?
                            AND invest_status IN ('C')
                            AND plan_seq IN (SELECT plan_seq
                                                FROM ico_plan
                                                WHERE to_date < DATE_FORMAT(NOW(), '%Y%m%d%H%i')
                                            )
            `;
            logger.debug('mypageModel > tokenSaleEnableYN / UPDATE ico_invest sql :: ' + updateSql + '\n   params :: ' + JSON.stringify(params));
            connection.query(updateSql, [params.userUuid, params.coinType]);

            var sql = `SELECT count(*) AS standByCnt
                FROM ico_invest
                WHERE user_uuid = ?
                    AND coin_type = ?
                    AND invest_status IN ('I', 'C')
            `;
            logger.debug('mypageModel > tokenSaleEnableYN / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
            connection.query(sql, [params.userUuid, params.coinType], callback);
            connection.release();
        });
    },

    /** 완료되지 않은 token sale 참여수량 데이터 삭제 */
    tokenSalePartiCancel: function(userUuid, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `DELETE FROM ico_invest
                        WHERE user_uuid = ?
                            AND send_address IS NULL
                            AND invest_address IS NULL
            `;
            logger.debug('mypageModel > tokenSalePartiCancel / sql :: ' + sql + '\n   userUuid :: ' + userUuid);
            connection.query(sql, userUuid, callback);
            connection.release();
        });
    },

    /** token sale 참여수량 등록 */
    tokenSalePartiInput: function(params, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `INSERT INTO ico_invest (
                    plan_seq, user_uuid, coin_type, invest_amt, user_seq
                    , invest_status, create_dttm
                ) SELECT (SELECT plan_seq FROM ico_plan WHERE DATE_FORMAT(NOW(), '%Y%m%d%H%i') BETWEEN from_date AND to_date), user_uuid, ?, ?, user_seq
                    , 'I', NOW()
                FROM ico_user
                WHERE user_uuid = ?
            `;
            logger.debug('mypageModel > tokenSalePartiInput / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
            connection.query(sql, [params.coinType, params.investAmt, params.userUuid], callback);
            connection.release();
        });
    },

    tokenSaleInvestInfo: function(userUuid, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT II.invest_seq, II.coin_type, II.invest_amt
                FROM ico_invest II
                WHERE II.user_uuid = ?
                    AND II.invest_status = 'I'
            `;
            logger.debug('mypageModel > tokenSaleInvestInfo / sql :: ' + sql + '\n   userUuid :: ' + userUuid);
            connection.query(sql, userUuid, callback);
            connection.release();
        });
    },

    /** Token Sale 사용자 참여 토근 및 제공자 wallet 정보 조회 */
    tokenSalePartiInfo: function(userUuid, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT II.plan_seq, II.invest_seq, II.coin_type, II.invest_amt
                FROM ico_invest II
                    , ico_plan IP
                WHERE II.plan_seq = IP.plan_seq
                    AND DATE_FORMAT(NOW(), '%Y%m%d%H%i') BETWEEN IP.from_date AND IP.to_date
                    AND II.user_uuid = ?
                    AND II.send_address IS NULL
                    AND II.invest_address IS NULL
            `;
            logger.debug('mypageModel > tokenSalePartiInfo / sql :: ' + sql + '\n   userUuid :: ' + userUuid);
            connection.query(sql, userUuid, callback);
            connection.release();
        });
    },

    /** 토큰 세일 참여하기 */
    updateTokenSalePartiInfo: function(params, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `UPDATE ico_invest
                SET send_address = ?
                    , invest_address = ?
                    , create_dttm = NOW()
                WHERE user_uuid = ?
                    AND coin_type = ?
                    AND invest_seq = ?
            `;
            logger.debug('mypageModel > updateTokenSalePartiInfo / UPDATE ico_invest sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));

            connection.query(sql, [params.sendAddress, params.investAddress, params.userUuid, params.coinType, params.investSeq]);

            var sql2 = `INSERT INTO ico_invest_hist (
                            invest_seq, plan_seq, user_uuid, coin_type, send_address
                            , invest_address, invest_amt, edit_dttm, user_seq, invest_status
                            , received_amt, confirmations, txid, received_dttm, send_invest_address
                            , received_address, status_y_mail, status_y_mail_dttm
                        )
                        SELECT invest_seq, plan_seq, user_uuid, coin_type, send_address
                            , invest_address, invest_amt, edit_dttm, user_seq, invest_status
                            , received_amt, confirmations, txid, received_dttm, send_invest_address
                            , received_address, status_y_mail, status_y_mail_dttm
                        FROM ico_invest
                        WHERE invest_seq = ?
            `;
            logger.debug('mypageModel > updateTokenSalePartiInfo / INSERT ico_invest_hist sql :: ' + sql2 + '\n   params :: ' + JSON.stringify(params));

            connection.query(sql2, [params.investSeq], callback);
            connection.release();
        });
    },

    checkWalletDupl: function(params, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT COUNT(*) AS duplCnt
                        FROM ico_invest
                        WHERE send_address = ?
                            AND user_uuid <> ?
            `;
            logger.debug('mypageModel > checkWalletDupl / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
            connection.query(sql, [params.walletAddress, params.userUuid], callback);
            connection.release();
        });
    },

    /** Token Sale 투자 완료 결과 조회 */
    tokenSalePartiComplInfo: function(params, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT II.coin_type, II.invest_amt, II.invest_address
                FROM ico_invest II
                    , ico_plan IP
                WHERE II.plan_seq = IP.plan_seq
                    AND DATE_FORMAT(NOW(), '%Y%m%d%H%i') BETWEEN IP.from_date AND IP.to_date
                    AND II.user_uuid = ?
                    AND II.invest_seq = ?
                    AND II.send_address IS NOT NULL
                    AND II.invest_address IS NOT NULL
            `;
            logger.debug('mypageModel > tokenSalePartiComplInfo / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
            connection.query(sql, [params.userUuid, params.investSeq], callback);
            connection.release();
        });
    },

    /** 투자 완료 메일 정보 조회 */
    transactionParticipationSendMail: function(connection, params, callback) {
        var sql = `SELECT IU.user_first_name, IU.user_last_name, DATE_FORMAT(II.create_dttm, '%d.%m.%Y') AS createDate
                        , FORMAT(II.invest_amt, 8) AS investAmt, II.coin_type, FORMAT((II.invest_amt * IPD.per_amt), 8) AS totAMT
                        , II.send_address, II.invest_address, IU.user_email
                    FROM ico_invest II
                        , ico_user IU
                        , ico_plan IP
                        , ico_plan_detail IPD
                    WHERE II.user_uuid = IU.user_uuid
                        AND II.plan_seq = IP.plan_seq
                        AND IP.plan_seq = IPD.plan_seq
                        AND II.coin_type = IPD.coin_type
                        AND IP.open_yn = 'Y'
                        AND II.user_uuid = ?
                        AND II.coin_type = ?
                        AND II.invest_seq = ?
        `;
        logger.debug('mypageModel > transactionParticipationSendMail / sql :: ' + sql + '\n   params :: ' +JSON.stringify( params));
        connection.query(sql, [params.userUuid, params.coinType, params.investSeq], callback);
    },

    /** Token Sale 투자 완료 메일 등록 */
    insertEmailHistory: function(connection, params, callback) {
        var sql = `INSERT INTO ico_email_history (
                plan_seq, user_uuid, user_email, send_yn, send_type, create_dttm
            ) VALUES (
                ?, ?, ?, ?, ?, NOW()
            )
        `;
        logger.debug(`mypageModel > insertEmailHistory / sql :: ${sql}\n   params :: ${JSON.stringify(params)}`);
        connection.query(sql, [params.planSeq, params.userUuid, params.userEmail, params.sendYn, params.sendType], callback);
    },

    /** Transaction 통계 및 KYC 상태 */
    tokenSaleStats: function(params, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `WITH apprTemp AS (
                                    SELECT investTot.user_uuid, investTot.coin_type, investTot.totInvestAmt, apprTot.receivedAmt, apprTot.per_amt, apprTot.bonus_rate, apprTot.totReceivedAmt, apprTot.apprTotal
                                    FROM (
                                            SELECT user_uuid, coin_type, SUM(invest_amt) AS totInvestAmt
                                            FROM ico_invest
                                            WHERE user_uuid = ?
                                                AND send_address != ''
                                            GROUP BY user_uuid, coin_type
                                        ) investTot
                                        LEFT OUTER JOIN (
                                            SELECT T.*
                                                , SUM(T.receivedAmt) AS totReceivedAmt
                                                , SUM((T.receivedAmt * T.per_amt) + (T.receivedAmt * T.per_amt * T.bonus_rate * 0.01)) AS apprTotal
                                            FROM (
                                                    SELECT II.user_uuid, II.coin_type
                                                        , SUM(IFNULL((SELECT sI.received_amt
                                                            FROM ico_invest sI
                                                            WHERE sI.invest_seq = II.invest_seq
                                                            ), 0)) AS receivedAmt
                                                        , IPD.per_amt
                                                        , IP.bonus_rate
                                                    FROM ico_invest II
                                                        , ico_plan IP
                                                        , ico_plan_detail IPD
                                                    WHERE II.plan_seq = IP.plan_seq
                                                        AND II.plan_seq = IPD.plan_seq
                                                        AND II.coin_type = IPD.coin_type
                                                        AND II.invest_status = 'Y'
                                                        AND II.user_uuid = ?
                                                    GROUP BY II.coin_type, IPD.per_amt, IP.bonus_rate
                                                ) T
                                            GROUP BY T.coin_type
                                        ) apprTot
                                    ON investTot.user_uuid = apprTot.user_uuid
                                        AND investTot.coin_type = apprTot.coin_type
                            )
                        SELECT IU.kyc_yn AS kycStatus, IU.userd_type AS userdType, T.*
                        FROM ico_user IU 
                            LEFT OUTER JOIN apprTemp T
                                ON IU.user_uuid = T.user_uuid
                        WHERE IU.user_uuid = ?
            `;
            logger.debug('mypageModel > tokenSaleStats / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
            connection.query(sql, [params.userUuid, params.userUuid, params.userUuid], callback);
            connection.release();
        })
    },

    /** 투자 차수 리스트 및 실 참여 합계 */
    transactionDegreeList: function(params, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT IP.degree
                        , IPD.coin_type
                        , IPD.per_amt
                        , (SELECT IFNULL(SUM(II.received_amt), 0)
                            FROM ico_invest II
                            WHERE II.plan_seq = IP.plan_seq
                                AND II.coin_type = IPD.coin_type
                                AND II.user_uuid = ?
                                AND II.invest_status = 'Y'
                        ) AS receiveAmt
                        , (SELECT sIP.degree FROM ico_plan sIP WHERE sIP.open_yn = 'Y' AND DATE_FORMAT(NOW(), '%Y%m%d%H%i') BETWEEN sIP.from_date AND sIP.to_date) AS curDegree
                    FROM ico_plan IP
                        , ico_plan_detail IPD
                    WHERE IP.plan_seq = IPD.plan_seq
                    GROUP BY IP.degree, IPD.coin_type
                    ORDER BY IP.degree ASC
            `;
            logger.debug('mypageModel > transactionDegreeList / sql :: ' + sql + '\n   params.userUuid :: ' + params.userUuid);
            connection.query(sql, params.userUuid, callback);
            connection.release();
        });
    },

    /** 투자 차수에 해당하는 내용 */
    transactionDegreeHistList: function(params, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `WITH degreeInfo AS (SELECT degree, plan_seq, from_date, to_date, bonus_rate FROM ico_plan WHERE degree = ?)
                            , investInfo AS (
                                SELECT II.create_dttm, II.coin_type, II.invest_amt, II.send_address, II.invest_address
                                    , IPD.per_amt, II.invest_status, II.received_amt, II.plan_seq
                                FROM ico_invest II
                                    , ico_plan IP
                                    , ico_plan_detail IPD
                                WHERE II.plan_seq = IP.plan_seq
                                    AND IP.plan_seq = IPD.plan_seq
                                    AND II.coin_type = IPD.coin_type
                                    AND II.send_address != ''
                                    AND II.user_uuid = ?
                            )
                        SELECT D.degree, D.plan_seq, D.from_date, D.to_date, D.bonus_rate
                            , I.create_dttm, I.coin_type, I.invest_amt, I.send_address, I.invest_address, I.per_amt, I.invest_status, I.received_amt
                            , IFNULL(I.received_amt, 0) AS receivedAmt
                            , DATE_FORMAT(I.create_dttm, "%d.%m.%Y") AS dmY
                        FROM degreeInfo D
                            INNER JOIN investInfo I
                                ON D.plan_seq = I.plan_seq
                        ORDER BY I.received_amt IS NULL DESC, D.plan_seq DESC, I.create_dttm DESC
            `;
            logger.debug(`mypageModel > transactionDegreeHistList / sql :: ${sql} \n   params :: ${params.degree}, ${params.userUuid}`);
            connection.query(sql, [params.degree, params.userUuid], callback);
            connection.release();
        });
    },

    /** 토큰 교환 내역 */
    exchangeInfoList: function(params, callback) {
        config.connection.getConnection(function(err, connection) {
            // var sql = ` WITH invest AS (SELECT DATE_FORMAT(II.received_dttm, '%d.%m.%Y') AS exchangeDate
            //                                 , II.received_amt * IPD.per_amt + (II.received_amt * IPD.per_amt * IP.bonus_rate * 0.01) AS exchange_amt
            //                                 , II.coin_type
            //                             FROM ico_invest II
            //                                 , ico_plan IP
            //                                 , ico_plan_detail IPD
            //                             WHERE II.plan_seq = IP.plan_seq
            //                                 AND II.plan_seq = IPD.plan_seq
            //                                 AND II.invest_status IN ('C', 'Y')
            //                                 AND II.coin_type = IPD.coin_type
            //                                 AND II.user_uuid = ?
            //             )
            //             SELECT I.exchangeDate
            //                 , I.exchange_amt
            //                 , @running_total := @running_total + I.exchange_amt AS totExchangeAmt
            //             FROM invest I
            //                 JOIN (SELECT @running_total := 0) rt
            //             ORDER BY I.exchangeDate ASC, I.coin_type ASC
            // `;
            var sql = `SELECT DATE_FORMAT(create_dttm, '%d.%m.%Y') AS exchangeDate
                            , mat_sum AS exchange_amt
                            , @running_total := @running_total + mat_sum AS totExchangeAmt
                        FROM ico_exchange_sum
                            JOIN (SELECT @running_total := 0 ) rt
                        WHERE user_uuid = ?
                            AND exchange_status = 'Y'
                        ORDER BY exchangeDate ASC
                `
            logger.debug('mypageModel > exchangeInfoList / sql :: ' + sql + '\n   params.userUuid :: ' + params.userUuid);
            connection.query(sql, params.userUuid, callback);
            connection.release();
        });
    }, 

    /** wallet 조회 */
    getWalletInfo: function(userUuid, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT IU.mat_wallet, IU.btc_wallet
                            , IFNULL((SELECT IES.exchange_status FROM ico_exchange_sum IES WHERE IES.user_uuid = IU.user_uuid), 'N') AS exchangeStatus
                        FROM ico_user IU
                        WHERE IU.user_uuid = ?
            `;
            logger.debug('mypageModel > getWalletInfo / sql :: ' + sql + '\n   userUuid :: ' + userUuid);
            connection.query(sql, userUuid, callback);
            connection.release();
        });
    },

    /** wallet 주소 변경 */
    changeWalletAddr: function(params, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `UPDATE ico_user
                        SET mat_wallet = ?
                            , mat_create_dttm = NOW()
                        WHERE user_uuid = ?
            `;
            logger.debug('mypageModel > changeWalletAddr / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
            connection.query(sql, [params.walletAddr, params.userUuid], callback);
            connection.release();
        });
    },

    /** 사용자 처리 단계 설정 */
    setUserStep: function(connection, params, callback) {
        var sql = `SELECT COUNT(*) AS cnt FROM ico_user_step WHERE user_uuid = ? AND type = ?`;
        connection.query(sql, [params.userUuid, params.type], function(err, result) { 
            if (result[0].cnt > 0) {
                sql = `UPDATE ico_user_step
                        SET complete_step = ?
                            , edit_dttm = NOW()
                            , edit_uuid = ?
                        WHERE user_uuid = ?
                            AND type = ?
                `;
                logger.debug('mypageModel > setUserStep / update sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
                connection.query(sql, [params.completeStep, params.userUuid, params.userUuid, params.type], callback);
            } else {
                sql = `INSERT INTO ico_user_step (
                        user_uuid, user_seq, type, complete_step
                        , create_dttm, create_uuid
                    ) SELECT user_uuid, user_seq, ?, ?
                        , NOW(), user_uuid
                    FROM ico_user
                    WHERE user_uuid = ?
                `;
                logger.debug('mypageModel > setUserStep / insert sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
                connection.query(sql, [params.type, params.completeStep, params.userUuid], callback);
            }
        });
    },

    /** 환불 지갑주소 입력 */
    updateRefundWallet: function(params, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `UPDATE ico_user`;
            if (params.coinType == 'BTC') {
                sql += `    SET btc_refund_wallet = ?`;
            } else if (params.coinType == 'ETH') {
                sql += `    SET eth_refund_wallet = ?`;
            }
            sql += `    WHERE user_uuid = ?;`;
            logger.debug(`mypageModel > updateRefundWallet / UPDATE ico_user sql :: ${sql} \n   params :: ${params.walletAddr}, ${params.userUuid}`);

            connection.query(sql, [params.walletAddr, params.userUuid]);

            var sql2 = `UPDATE ico_refund_sum`;
            if (params.coinType == 'BTC') {
                sql2 += `    SET refund_btc_status = 'T'
                                , refund_btcwallet = ?`;
            } else if (params.coinType == 'ETH') {
                sql2 += `    SET refund_eth_status = 'T'
                                , refund_ethwallet = ?`;
            }
            sql2 += `    WHERE user_uuid = ?`;
            logger.debug(`mypageModel > updateRefundWallet / UPDATE ico_refund_sum sql :: ${sql2} \n   params :: ${params.walletAddr}, ${params.userUuid}`);

            connection.query(sql2, [params.walletAddr, params.userUuid], callback);
            connection.release();
        });
    },

    refundRegChk: function(params, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT COUNT(*) AS userCnt FROM ico_user WHERE user_uuid = ?;`;

            sql += `SELECT COUNT(*) AS cnt
                        FROM ico_user
                        WHERE user_uuid = ?
                `;
            if (params.coinType == 'BTC') {
                sql += `    AND btc_refund_wallet != ''`;
            } else if (params.coinType == 'ETH') {
                sql += `    AND eth_refund_wallet != ''`;
            }
            logger.debug(`mypageModel > refundRegChk / select sql :: ${sql} \n   params :: ${params.userUuid}, ${params.coinType}`);

            connection.query(sql, [params.userUuid, params.userUuid], callback);
            connection.release();
        });
    }
};

module.exports = mypageModel;