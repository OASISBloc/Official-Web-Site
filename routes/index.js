var express = require('express');
var router = express.Router();
const commonController = require('../controller/web/common/commonController');
const mainController = require('../controller/web/mainController');

/* official(단독으로 있을경우) GET home page. */
router.get('/official', function(req, res, next) {
	res.render('official', { layout: './layout/official-layout' });
});

// router.get('/official', function(req, res, next) {
// 	res.render('official', { layout: './layout/official-layout' });
// });

/** main(official) */
router.get('/main', function(req, res, next) {
    var target = req.query.target;
	res.render('main', {'target': target, layout: './layout/main-layout', title: 'Main' });
});

router.get('/lang/:id', function(req, res, next){
	res.cookie('ico-lang',req.params.id)
	res.redirect('back')
});

/** main(official) 타이머 */
router.post('/getSaleStatus', function(req, res, next) {
	mainController.getSaleStatus(req, res);
});

/** main(official) 메일링 중복체크 */
router.post('/subscribeDuplEmailChkAjax', function(req, res, next) {
	mainController.subscribeDuplEmailChk(req, res);
});

/** main(official) 공지사항 */
router.post('/getNoticeAjax', function(req, res) {
    mainController.getNotice(req, res);
});

/** main(official) 메일링 등록 */
router.post('/addSubscribeEmailAjax', function(req, res) {
    mainController.addSubscribeEmail(req, res);
});

/** main(official) 약관 페이지 이동 */
router.get('/termsnprivacy', function(req, res) {
    var type = req.query.type;
    res.render('./terms/termsnprivacy', {layout: './layout/main-layout', 'type': type});
});

/** main(official) 약관 데이터 조회 */
router.post('/policyData', function(req, res) {
	const joinController = require('../controller/web/joinController');
    joinController.policyData(req, res);
});


const controller = require('../controller/web/boardController')

/** OFFICIAL FAQ/NEWS */
/** 게시판 접근 */
router.get('/official/:mode', function(req, res){
    var mode = req.params.mode ? req.params.mode : 'news';
    res.render(`./board/${mode}/${mode}List`, {layout: './layout/main-layout'});
});

/** list & contents(FAQ & NEWS) */
router.post('/official/:mode/listAjax', controller.boardList);

/** news view */
router.get('/official/:mode/view', function(req, res){
    var boardId = req.query.boardId;
    res.render(`./board/news/newsView`, {layout: './layout/main-layout', 'boardId': boardId});
});

/** news view contents */
router.post('/official/news/newsViewAjax', controller.newsView);

/** news attach file download */
router.post('/official/news/fileDownload', controller.fileDownload);

/** Join as partners 문의 */
router.get('/inquiry', mainController.getInquiryCates);

/** Join as partners 문의 등록 */
router.post('/addInquiryAjax', mainController.addInquiry);

module.exports = router;
