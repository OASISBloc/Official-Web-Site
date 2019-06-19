const crypto = require('crypto')
const logger = require('../util/logger');

var Board = {
    getBoardList: function (params, callback) {
        //console.log('getBoardList' + JSON.stringify(params))
        config.connection.getConnection(function (err, connection) {
            var sql = `SELECT
                         E.boardId
                        ,E.boardType
                        ,E.boardSubject
                        ,E.boardContent
                        ,E.boardLint
                        ,E.createDate
                        ,E.createUuid
                        ,E.createName
                        ,E.boardPid
                        ,(E.bnum - E.rnum) + 1 AS boardNum
                        FROM (
                            SELECT 
                                        A.board_id AS boardId
                                        ,A.board_type AS boardType
                                        ,A.board_subject AS boardSubject
                                        ,A.board_content AS boardContent
                                        ,A.board_link AS boardLint
                                        ,DATE_FORMAT(A.create_dttm, '%Y-%m-%d') AS createDate
                                        ,A.create_uuid AS createUuid
                                        ,A.create_name AS createName
                                        ,A.board_pid AS boardPid
                                        ,CAST(? AS UNSIGNED) AS bnum
                                        ,@rownum:=@rownum+1 rnum
                                    FROM ico_board A,
                                            (SELECT @rownum:=0) R
                                    WHERE A.board_type = ?
                            `;
                                    if(''!== params.search){
                                        sql += 'AND A.board_subject like' + connection.escape('%'+params.search+'%');     
                                    }
                                    if(params.boardType==='CD_FAQ'){
                                        sql += 'AND A.board_pid is null';     
                                    }
                            sql += ' ORDER BY A.board_id DESC'
                            sql += ' LIMIT ? OFFSET ?'
                    sql += ' ) E '
                    
            logger.debug('Board > getBoardList / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
            connection.query(sql,[params.startNum, params.boardType, params.limits.limit, params.limits.offset], callback);
            connection.release();
        });
    },
    getBoardListTotal: function (params, callback) {
        config.connection.getConnection(function (err, connection) {
            var sql = `SELECT 
                         COUNT(board_id) AS total
                       FROM ico_board
                       WHERE board_type = ?
            `;
            if(''!== params.search){
                sql += 'AND board_subject like' + connection.escape('%'+params.search+'%') +'\n';     
            }
            if(params.boardType==='CD_FAQ'){
                sql += 'AND board_pid is null';     
            }
            logger.debug('Board > getBoardListTotal / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
            connection.query(sql,[params.boardType], callback);
            connection.release();
        });
    },
    getBoardView: function (params, callback) {
        config.connection.getConnection(function (err, connection) {

            var sql = `SELECT 
                         board_id AS boardId
                        ,board_type AS boardType
                        ,board_subject AS boardSubject
                        ,board_content AS boardContent
                        ,board_link AS boardLint
                        ,DATE_FORMAT(create_dttm, '%Y-%m-%d') AS createDate
                        ,create_uuid AS createUuid
                        ,create_name AS createName
                        ,board_pid AS boardPid
                       FROM ico_board
                       WHERE board_type = ?
                         AND board_id = ?
            `;
            logger.debug('Board > getBoardView / sql :: ' + sql + '\n   params :: ' + JSON.stringify(params));
            connection.query(sql,[params.boardType, params.boardId], callback);
            connection.release();
        });
    }
}
module.exports = Board;