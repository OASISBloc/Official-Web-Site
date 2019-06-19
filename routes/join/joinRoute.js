const router = require('express').Router();
const joinController = require('../../controller/web/joinController');

// 회원가입 페이지 이동
router.get('/', function(req, res) {
    var type = req.query.type == "corp" ? req.query.type : "";
    res.render('./join/join', {layout: './layout/layout', 'title':'회원 가입', 'type': type});
});

// 회원 등록 페이지 등록
router.post('/joinAjax', function(req, res) {
    //console.log(req.body.user_mail);
    joinController.insertMemberInfo(req, res);
});

router.post('/duplEmailChkAjax', function(req, res) {
    joinController.duplEmailChk(req, res);
});

// 회원 등록 후 메일 인증처리
router.get('/certifyEmail', function(req, res) {
    joinController.memberCertifyEmail(req, res);
});

// 회원가입 완료 페이지
router.get('/joinComplete', function(req, res) {
    res.render('./login/login', {layout: './layout/layout', 'title': '회원가입 완료', 'kind': 'complete', 'callPage': ''});
});

module.exports = router;