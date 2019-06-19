const crypto = require('crypto')
const logger = require('../util/logger');

var boardModel = {
    /**
     * faq/news total count
     */
    getBoardTotalInfo: function(params, callback) {
        config.connection.getConnection(function (err, connection) {
            var sql = `SELECT COUNT(*) AS totCnt, MAX(board_id) + 1 AS maxPlusId
                        FROM ico_board
                        WHERE board_type = ?
                            AND board_view = 'Y'
                    `;
            logger.debug('BoardModel > getBoardTotalInfo / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
            connection.query(sql, params.boardType, callback);
            connection.release();
        });
    },

    /**
     * faq/news list
     */
    getBoardList: function(params, callback) {
        config.connection.getConnection(function (err, connection) {
            var sql = `WITH LIST AS (
                            SELECT
                                (@RNUM := @RNUM + 1) AS seq
                                , IB.board_id
                                , IB.board_type
                                , IB.board_subject
                                , IB.board_content
                                , IB.board_link
                                , DATE_FORMAT(IB.create_dttm, "%m/%d/%Y") AS MDY
                                , IB.board_pid
                                , (SELECT IBA.save_file FROM ico_board_attach IBA WHERE IBA.board_id = IB.board_id AND IBA.attach_url = 'THUMBNAIL') AS thumbnail
                            FROM ico_board IB
                                , (SELECT @RNUM := 0) R
                            WHERE IB.board_view = 'Y'
                                AND IB.board_type = ?
                        )
                        SELECT L.*
                        FROM LIST L
                        WHERE L.board_id < ?
                        ORDER BY L.seq DESC
                        LIMIT ?
                    `;
            logger.debug('BoardModel > getBoardList / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
            connection.query(sql,[params.boardType, params.boardId, params.limit], callback);
            connection.release();
        });
    },

    /**
     * news view
     */
    newsView: function(params, callback) {
        config.connection.getConnection(function (err, connection) {
            var sql = `SELECT 'CURR' AS loc
                                , IB.board_id AS boardId
                                , IBA.attach_id AS attachId
                                , IB.board_subject AS boardSubject
                                , IB.board_content AS boardContents
                                , DATE_FORMAT(IB.create_dttm, "%m/%d/%Y") AS MDY
                                , IBA.save_file AS saveFile
                                , IBA.org_filename AS orgFile
                            FROM ico_board IB
                                LEFT OUTER JOIN ico_board_attach IBA
                                ON IB.board_id = IBA.board_id
                                AND IBA.attach_url = 'ATTACH'
                            WHERE IB.board_view = 'Y'
                                AND IB.board_type = ?
                                AND IB.board_id = ?
                        UNION ALL (
                            SELECT 'PREV' AS loc
                                ,IB2.board_id AS boardId
                                , '' AS attachId
                                , IB2.board_subject AS boardSubject
                                , '' AS boardContents
                                , DATE_FORMAT(IB2.create_dttm, "%m/%d/%Y") AS MDY
                                , '' AS saveFile
                                , '' AS orgFile
                            FROM ico_board IB2
                            WHERE IB2.board_view = 'Y'
                                AND IB2.board_type = ?
                                AND IB2.board_id < ?
                            ORDER BY IB2.board_id DESC
                            LIMIT 1)
                        UNION ALL (
                            SELECT 'NEXT' AS loc
                                , IB3.board_id AS boardId
                                , '' AS attachId
                                , IB3.board_subject AS boardSubject
                                , '' AS boardContents
                                , DATE_FORMAT(IB3.create_dttm, "%m/%d/%Y") AS MDY
                                , '' AS saveFile
                                , '' AS orgFile
                            FROM ico_board IB3
                            WHERE IB3.board_view = 'Y'
                                AND IB3.board_type = ?
                                AND IB3.board_id > ?
                            ORDER BY IB3.board_id ASC
                            LIMIT 1
                        )`;
            logger.debug('BoardModel > newsView / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
            connection.query(sql, [params.boardType, params.boardId, params.boardType, params.boardId, params.boardType, params.boardId], callback);
            connection.release();
        });
    },

    getBoardFile: function (attachId, callback) {
        config.connection.getConnection(function (err, connection) {
            var sql = `SELECT
                             board_id as boardId
                            ,attach_id as attachId
                            ,attach_url as attachUrl
                            ,save_file as saveFile
                            ,org_filename as orgFileName
                        FROM ico_board_attach
                        WHERE attach_id = ?
            `;
            connection.query(sql,attachId, callback);
            connection.release();
        })
    }

}
module.exports = boardModel;