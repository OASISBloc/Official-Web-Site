const router = require('express').Router()
const controller = require('../../controller/web/boardController')

/** OFFICIAL FAQ/NEWS */
/** 게시판 접근 */
router.get('/:mode', function(req, res){
    var mode = req.params.mode ? req.params.mode : 'news';
    res.render(`./board/${mode}/${mode}List`);
});

/** list & contents(FAQ & NEWS) */
router.post('/:mode/listAjax', controller.boardList);

/** news view */
router.get('/:mode/view', function(req, res){
    var boardId = req.query.boardId;
    res.render(`./board/news/newsView`, {'boardId': boardId});
});

/** news view contents */
router.post('/news/newsViewAjax', controller.newsView);

module.exports = router