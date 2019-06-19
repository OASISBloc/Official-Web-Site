var boardModel = require('../../models/boardModel')
var pagenavi = require('../../util/pagination')
var url = require('url')
const logger = require('../../util/logger');
/* 
    GET /ejs/board/list
*/

var boardController = {

    /**
     * list & contents(FAQ & NEWS)
     */
    boardList: function(req, res) {
        var nextNum = req.body.nextNum;
        var boardType = req.body.boardType;
        var params = {'boardType': boardType};
        var limit = boardType == 'CD_FAQ' ? (req.body.more == 'true' ? 4 : 8) : (req.body.more == 'true' ? 4 : 4);
        
        logger.debug('BoardController > boardList / getBoardListTotal   params :: ' + JSON.stringify(params));
        boardModel.getBoardTotalInfo(params, function(err, totalInfo) {
            if (err) {
                logger.error('BoardController > boardList / getBoardListTotal error :: ' + JSON.stringify(err) + '   params :: ' + JSON.stringify(params));
                return res.json({'result': false, 'message': 'Error occurred.'});
            } else if (totalInfo && totalInfo.length > 0) {
                var cntInfo = totalInfo[0];
                params.boardId = nextNum ? nextNum : cntInfo.maxPlusId;
                params.limit = limit;
                logger.debug('BoardController > boardList / getBoardList   params :: ' + JSON.stringify(params));
                boardModel.getBoardList(params, function(err, boardList) {
                    if (err) {
                        logger.error('BoardController > boardList / getBoardList error :: ' + JSON.stringify(err) + '   params :: ' + JSON.stringify(params));
                        return res.json({'result': false, 'message': 'Error occurred.'});
                    } else {
                        return res.json({'result': true, 'cntInfo': cntInfo, 'boardList': boardList});
                    }
                });
            } else {
                logger.debug('BoardController > boardList / getBoardListTotal 데이터 없음');
                return res.json({'result': false, 'message': 'No data.'});
            }
        });
    },

    /**
     * news view(get방식)
     */
    newsView: function(req, res) {
        var boardId = req.body.boardId;
        var params = {'boardType': 'CD_NEWS', 'boardId': boardId};
        logger.debug('BoardController > newsView / newsView   params :: ' + JSON.stringify(params));
        boardModel.newsView(params, function(err, viewInfos) {
            if (err) {
                logger.error('BoardController > newsView / newsView error :: ' + JSON.stringify(err) + '   params :: ' + JSON.stringify(params));
                return res.json({'result': false, 'message': 'Error occurred.'});
            } else {
                logger.debug('BoardController > newsView / newsView   resultVal :: ' + JSON.stringify(viewInfos));
                var currData, prevData, nextData;
                viewInfos.map((data) => {
                    if (data.loc === 'CURR') {
                        currData = data;
                    } else if (data.loc === 'PREV') {
                        prevData = data;
                    } else if (data.loc === 'NEXT') {
                        nextData = data;
                    }
                });
                return res.json({'currData': currData, 'prevData': prevData, 'nextData': nextData});
            }
        });
    },

    /**
     * news attach file download
     */
    fileDownload: function(req, res) {
        var attachId = req.body.attachId ? req.body.attachId : '';
        if (attachId == '') {
            res.render('error/500');
        } else {
            boardModel.getBoardFile(attachId, function(err, file) {
                if (err) {
                    res.render('error/500');
                } else {
                    var splitName = file[0]['saveFile'].split('/')
                    const s3Upload = require('../../util/awsFileUpload')
                    s3Upload.downloadFile(splitName[splitName.length-1], splitName[splitName.length-2], function(err, data){
                        if (err) {
                            returnData.status = '500'
                            returnData.message = err
                        } else {
                            res.attachment(file[0]['orgFileName']);
                            res.send(data.Body);
                        }
                   });
                }
            });
        }
    }

}

module.exports = boardController;
