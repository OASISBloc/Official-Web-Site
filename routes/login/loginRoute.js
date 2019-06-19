const router = require('express').Router();
const loginController = require('../../controller/web/loginController');
const passport = require('passport');


/** 로그인 페이지 이동 */
router.get('/', function(req, res, next) {
    var callPage = req.headers.referer;
    res.render('./login/login', {layout: './layout/layout', 'title': 'Sign in', 'callPage': callPage, 'kind': ''});
});

/** 로그인 처리 */
router.post('/loginAjax', function(req, res) {

    require('../../util/passport').setup();

    // 로그인 정보 체크
    passport.authenticate('local', {session: false}, function(err, user, info) {    // token 생성을 위한 회원인증 passport
        var error = err || info;
        if (error) 
            //return res.json(401, error.message);
            return res.json({'result': false, 'message': error.message});
            
        if (!user) 
            return res.json(404, {message: 'Something went wrong, please try again.'});

        // token 생성
        loginController.loginCheck(req, res, user);

    })(req, res);

});

/** 로그인 OTP 인증 */
router.post('/otpVerifyAjax', function(req, res) {
        // 로그인 정보 체크
        passport.authenticate('local', {session: false}, function(err, user, info) {    // token 생성을 위한 회원인증 passport
            var error = err || info;
            if (error) 
                return res.json(401, error);
                
            if (!user) 
                return res.json(404, {message: 'Something went wrong, please try again.'});
    
            // token 생성
            loginController.loginCheck(req, res, user);
    
        })(req, res);
});

router.get('/forgotPassword', function(req, res) {
    res.render('./login/forgotPassword', {layout: './layout/layout', 'title': 'Sign in'});
});

/** 비밀번호 찾기 메일 발송 */
router.post('/fogotPasswordAjax', function(req, res) {
    loginController.fogotPassword(req, res);
});

/** 비밀번호 변경 페이지 */
router.get('/resetPassword', function(req, res) {
    loginController.resetPassword(req, res);
});

/** 비밀번호 변경 처리 */
router.post('/resetPasswordAjax', function(req, res) {
    loginController.resetPasswordAjax(req, res);
});

/** 회원가입 인증메일 재전송 */
router.post('/resendVerifyEmailAjax', function(req, res) {
    loginController.resendVerifyEmail(req, res);
});

/** 로그아웃 */
router.post('/logout', function(req, res) {
    loginController.logout(req, res);
});

module.exports = router;