const logger = require('../util/logger');

var mainModel = {
        /* 프레세일 오픈 여부 및 남은 시간 */
        getSaleStatus: function(callback) {
            config.connection.getConnection(function(err, connection) {
                var sql = `SELECT 'A' AS type
                                , TIMESTAMPDIFF(SECOND, now(), str_to_date(to_date, '%Y%m%d%H%i')) + UNIX_TIMESTAMP(now()) AS remainingSec
                                , UNIX_TIMESTAMP(str_to_date(DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'), '%Y%m%d%H%i%s')) AS nowSec
                                , UNIX_TIMESTAMP(str_to_date(to_date, '%Y%m%d%H%i')) AS planSec
                                , DATE_FORMAT(
                                    CONCAT_WS('/', SUBSTR(to_date, 1, 4), 
                                        SUBSTR(to_date, 5, 2),
                                        SUBSTR(to_date, 7, 2)) 
                                    , '%M %e') AS toMonthDay
                                , DATE_FORMAT(
                                    CONCAT_WS('/', SUBSTR(to_date, 1, 4), 
                                        SUBSTR(to_date, 5, 2),
                                        SUBSTR(to_date, 7, 2)) 
                                    , 'Ends on %D of %b. %Y') AS toMonthDayMb
                                , SUBSTR(to_date, 1, 4) AS toYear
                                , DATE_FORMAT(STR_TO_DATE(from_date, '%Y%m%d%H%i'), '%d.%m.%Y') AS fromDate
                                , CONCAT_WS(':',
                                    SUBSTR(from_date, 9, 2),
                                    SUBSTR(from_date, 11, 2)) AS fromTime
                                , DATE_FORMAT(STR_TO_DATE(to_date, '%Y%m%d%H%i'), '%d.%m.%Y') AS toDate
                                , CONCAT_WS(':',
                                    SUBSTR(to_date, 9, 2),
                                    SUBSTR(to_date, 11, 2)) AS toTime
                                , utc
                            FROM ico_plan
                            WHERE open_yn = 'Y'
                                AND dday_yn = 'Y'
                                AND DATE_FORMAT(NOW(), '%Y%m%d%H%i%s') BETWEEN from_date AND to_date
                        UNION ALL (
                            SELECT 'B' AS type
                                , TIMESTAMPDIFF(SECOND, now(), str_to_date(sub.from_date, '%Y%m%d%H%i')) + UNIX_TIMESTAMP(now()) AS remainingSec
                                , UNIX_TIMESTAMP(str_to_date(DATE_FORMAT(NOW(), '%Y%m%d%H%i%s'), '%Y%m%d%H%i%s')) AS nowSec
                                , UNIX_TIMESTAMP(str_to_date(sub.from_date, '%Y%m%d%H%i')) AS planSec
                                , DATE_FORMAT(
                                    CONCAT_WS('/', SUBSTR(sub.from_date, 1, 4), 
                                        SUBSTR(sub.from_date, 5, 2),
                                        SUBSTR(sub.from_date, 7, 2)) 
                                    , '%M %e') AS toMonthDay
                                , DATE_FORMAT(
                                    CONCAT_WS('/', SUBSTR(sub.from_date, 1, 4), 
                                        SUBSTR(sub.from_date, 5, 2),
                                        SUBSTR(sub.from_date, 7, 2)) 
                                    , 'Begins on %D of %b. %Y') AS toMonthDayMb
                                , SUBSTR(sub.from_date, 1, 4) AS toYear
                                , DATE_FORMAT(STR_TO_DATE(sub.from_date, '%Y%m%d%H%i'), '%d.%m.%Y') AS fromDate
                                , CONCAT_WS(':',
                                    SUBSTR(sub.from_date, 9, 2),
                                    SUBSTR(sub.from_date, 11, 2)) AS fromTime
                                , DATE_FORMAT(STR_TO_DATE(sub.to_date, '%Y%m%d%H%i'), '%d.%m.%Y') AS toDate
                                , CONCAT_WS(':',
                                    SUBSTR(sub.to_date, 9, 2),
                                    SUBSTR(sub.to_date, 11, 2)) AS toTime
                                , sub.utc
                            FROM ico_plan sub
                            WHERE sub.dday_yn = 'Y'
                                AND sub.from_date > DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')
                            ORDER BY remainingSec ASC
                            LIMIT 1
                        )
                        ORDER BY type ASC`;
                logger.debug('joinModel > getSaleStatus / sql :: ' + sql);
                connection.query(sql, callback);
                connection.release();
            });
        },
    /* 이메일 중복체크 */
    subscribeDuplEmailChk: function(param, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT COUNT(subscribe_email) as emailCnt
                FROM ico_subscribe_email
                WHERE subscribe_email = ?
            `;
            logger.debug('mainModel > subscribeDuplEmailChk / sql :: ' + sql + '\n   param :: ' + param);
            connection.query(sql, param, callback);
            connection.release();
        });
    },
    /** 공지사항 조회 */
    getNotice: function(callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT board_id
                            , board_subject AS subject
                            , board_content AS content
                        FROM ico_board
                        WHERE board_type = 'CD_NOTICE'
                            AND board_view = 'Y'
                        ORDER BY board_id DESC
                        LIMIT 1
            `;
            logger.debug('mainModel > subscribeDuplEmailChk / sql :: ' + sql);
            connection.query(sql, callback);
            connection.release();
        });
    },
    /** 구독 메일 등록 */
    addSubscribeEmail: function(param, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `INSERT INTO ico_subscribe_email(subscribe_email, reg_dttm) values(?, now())
            `;
            logger.debug('mainModel > addSubscribeEmail / sql :: ' + sql + '\n   param :: ' + param);
            connection.query(sql, param, callback);
            connection.release();
        });
    },
    /** join as partner 문의 카테고리 조회 */
    getInquiryCates: function(callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `SELECT inq_cate_seq
                            , cate_code_type
                            , cate_code
                            , cate_code_nm
                            , cate_code_nm_en
                        FROM ico_inquiry_cate
                        WHERE cate_code_type = '1'
                            AND use_yn = 'Y'
                        ORDER BY cate_code ASC
                        ;
                    `;
            sql += `SELECT inq_cate_seq
                        , cate_code_type
                        , cate_code
                        , cate_code_nm
                        , cate_code_nm_en
                    FROM ico_inquiry_cate
                    WHERE cate_code_type = '2'
                        AND use_yn = 'Y'
                    ORDER BY cate_code ASC
                    ;
                `;
            logger.debug('mainModel > getInquiryCates / sql :: ' + sql);
            connection.query(sql, callback);
            connection.release();
        });
    },

    addInquiry: function(params, callback) {
        config.connection.getConnection(function(err, connection) {
            var sql = `INSERT INTO ico_inquiry (
                            first_name, last_name, company_name, country_code, email
                            , phone, business_category, business_area, business_area_others, message
                            , agree_term, create_dttm
                        ) values(
                            ?, ?, ?, ?, ?
                            , ?, ?, ?, ?, ?
                            , ?, now()
                        )
            `;
            logger.debug('mainModel > addSubscribeEmail / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
            connection.query(sql, [params.first_name, params.last_name, params.comp_name, params.country, params.email, params.aesPhone, params.busiList, params.fieldList, params.inputOthers, params.message, params.agree_term], callback);
            connection.release();
        });
    }

};

module.exports = mainModel;