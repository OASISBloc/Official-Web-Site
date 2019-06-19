const express = require('express');
const router = express.Router();
const passport = require('passport');
const mypageController = require('../../controller/web/mypageController');
const authToken = require('../../util/authToken');
let jwt = require("jsonwebtoken");
const boardcontroller = require('../../controller/web/boardController');

/** mypage 약관 페이지 이동 */
router.get('/termsnprivacy', function(req, res) {
    var type = req.query.type;
    res.render('./mypage/termsnprivacy', {layout: './layout/layout', 'type': type});
});

/** 마이페이지 메인 */
router.get('/mypage', function(req, res, next) {
	res.render('./mypage/profile', {layout: './layout/mypage-layout'});
});

router.post('/myInfoAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.myInfo(req, res, token, refToken);
	
		} else {
			res.json({'result': false, 'message': 'Please sign in again.'});
		}
	});
});

/** 마이페이지 profile */
router.get('/profile', function(req, res, next) {
	var loginFlg = req.query.loginFlg == 'true' ? true : false;
	res.render('./mypage/profile', {layout: './layout/mypage-layout', 'loginFlg': loginFlg});
});

/** profile 접근전 토큰참여 동의 유무 체크 */
router.post('/tokenSaleInitCheckAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.tokenSaleInitCheck(req, res, token, refToken);
	
		} else {
			res.json({'result': false, 'message': 'Please sign in again.'});
		}
	});
});

/** token sale 참여 동의 페이지 이동 */
router.get('/tokenSaleInit', function(req, res, next) {
	res.render('./mypage/tokenSaleInit', {layout: './layout/mypage-layout'});
});

/** token sale 참여 동의 업데이트 */
router.post('/agreeTokenSaleAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.updateTokenSaleYn(req, res, token, refToken);
	
		} else {
			res.json({'result': false, 'message': 'Please sign in again.'});
		}
	});
});

/** 개인 프로파일 등록 페이지 */
router.get('/profilePriv', function(req, res, next) {
	var loginFlg = req.query.loginFlg == 'true' ? true : false;
	res.render('./mypage/profilePriv', {layout: './layout/mypage-layout', 'loginFlg': loginFlg});
});

/** 법인 프로파일 등록 페이지 */
router.get('/profileCorp', function(req, res, next) {
	var loginFlg = req.query.loginFlg == 'true' ? true : false;
	res.render('./mypage/profileCorp', {layout: './layout/mypage-layout', 'loginFlg': loginFlg});
});

/** 마이페이지 profile */
router.post('/getMemberProfileInfoAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.getMemberProfileInfo(req, res, token, refToken);
	
		} else {
			res.json({'result': false, 'message': 'Please sign in again.'});
		}
	});
});

/** 추천인 체크 */
router.post('/profileCheckRecommendAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result) {
		if (!err && result) {
			mypageController.profileCheckRecommend(req, res);
		} else {
			res.json({'result': false, 'message': 'Please sign in again.'});
		}
	});
});

/** 개인 프로파일 등록 */
router.post('/updatePersonProfileAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.updatePersonProfile(req, res, token, refToken);
		} else {
			res.json({'result': false, 'message': 'Please sign in again.'});
		}
	});
});

/** 개인 프로파일 수정 */
router.post('/editPersonProfileAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.editPersonProfile(req, res, token, refToken);
		} else {
			res.json({'result': false, 'message': 'Please sign in again.'});
		}
	});
});

/** 주주 유효성 체크 */
router.post('/checkShareHolderAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.checkShareHolder(req, res, refToken);
		} else {
			res.json({'result': false, 'message': 'Please sign in again.'});
		}
	});
});

/** 법인 프로파일 등록 (step1) */
router.post('/updateCorpProfileAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.updateCorpProfile(req, res, token, refToken);
		} else {
			res.json({'result': false, 'message': 'Please sign in again.'});
		}
	});
});

/** 법인 프로파일 파일 등록(step2) */
router.post('/corpProfileFileUploadAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.corpProfileFileUpload(req, res, token, refToken);
		} else {
			res.json({'result': false, 'message': 'Please sign in again.'});
		}
	});
});

/** 마이페이지 법인 프로파일 페이지 이동(step1) */
router.get('/profileCorpStep1', function(req, res, next) {
	res.render('./mypage/profileCorpStep1', {layout: './layout/mypage-layout'});
});

/** 마이페이지 법인 프로파일 정보 조회(step1) */
router.post('/profileCorpStep1Ajax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.profileCorpStep1(req, res, token, refToken);
		}
	});
});

/** 마이페이지 법인 프로파일 수정(step1) */
router.post('/editProfileCorpStep1Ajax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.editProfileCorpStep1(req, res, token, refToken);
		}
	});
});

/** 마이페이지 법인 프로파일 확인(step2) */
router.get('/profileCorpStep2', function(req, res, next) {
	res.render('./mypage/profileCorpStep2', {layout: './layout/mypage-layout'});
});

/** 마이페이지 법인 프로파일 정보 조회(step2) */
router.post('/profileCorpStep2Ajax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.profileCorpStep2(req, res, token, refToken);
		}
	});
});

/** 마이페이지 법인 프로파일 확인(step3) */
router.get('/profileCorpStep3', function(req, res, next) {
	res.render('./mypage/profileCorpStep3', {layout: './layout/mypage-layout'});
});

/** 마이페이지 법인 프로파일 정보 조회(step3) */
router.post('/profileCorpStep3Ajax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.profileCorpStep3(req, res, token, refToken);
		}
	});
});

/** Token Sale step1 페이지 이동 */
router.get('/tokenSale1', function(req, res, next) {
	res.render('./mypage/tokenSale1', {layout: './layout/mypage-layout'});
})

// /** Token Sale 개인/법인 구분 Step1 */
// router.post('/tokenSaleUserTypeAjax', function(req, res, next) {
// 	authToken.isAuthToken(req, res, function(err, result, token) {
// 		if (!err && result) {
// 			mypageController.tokenSaleUserType(req, res, token);
// 		}
// 	});
// });

/** Token Sale 법인의 주주정보 조회 step1 */
router.post('/corpShareHolderInfoAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.corpShareHolderInfo(req, res, token, refToken);
		}
	});
});

router.post('/proceedSetStepAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.proceedSetStep(req, res, token, refToken);
		}
	});
});

/** Token Sale 개인 KYC 인증 파일 업로드 step1 */
router.post('/tokenSaleKYCUploadAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.tokenSaleKYCUpload(req, res, token, refToken);
		}
	});
});

/** Token Sale step2 페이지 이동  */
router.get('/tokenSale2', function(req, res, next) {
	res.render('./mypage/tokenSale2', {layout: './layout/mypage-layout'});
});

/** Token Sale 인증 상태 확인 step2 */
router.post('/checkCertifiedAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.checkCertified(req, res, token, refToken);
		}
	});
});

/** Token Sale step3 페이지 이동  */
router.get('/tokenSale3', function(req, res, next) {
	res.render('./mypage/tokenSale3', {layout: './layout/mypage-layout'});
});

router.post('/tokenSaleInvestInfoAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.tokenSaleInvestInfo(req, res, token, refToken);
		}
	});
});

/** Token Sale step3 참여수량 ICO 정보 조회 */
router.post('/tokenSaleExchangeInfoAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.tokenSaleExchangeInfo(req, res);
		}
	});
});

/** Token Sale step 참여수량 등록  */
router.post('/tokenSalePartiInputAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.tokenSalePartiInput(req, res, token, refToken);
		}
	});
});

/** Token Sale step4 페이지 이동  */
router.get('/tokenSale4', function(req, res, next) {
	res.render('./mypage/tokenSale4', {layout: './layout/mypage-layout'});
});

/** Token Sale step4 사용자 참여 토근 및 제공자 wallet 정보 조회 */
router.post('/tokenSalePartiInfoAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.tokenSalePartiInfo(req, res, token, refToken);
		}
	});
});

/** Token Sale step4 토큰 세일 참여하기 */
router.post('/tokenSaleParticipatedAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.tokenSaleParticipated(req, res, token, refToken);
		}
	});
});

/** 지갑주소 중복 체크 */
router.post('/checkWalletDuplAjax', function(req, res) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.checkWalletDupl(req, res, token, refToken);
		}
	});
});

/** Transaction 페이지 이동 */
router.get('/transaction', function(req, res, next) {
	res.render('./mypage/transaction', {layout: './layout/mypage-layout'});
});

/** Transaction 투자 통계 및 KYC 결과 */
router.post('/transactionParticipateInfoAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.transactionParticipateInfo(req, res, token, refToken);
		}
	});
});

/** Transaction 차수 조회 */
router.post('/transactionDegreeListAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.transactionDegreeList(req, res, token, refToken);
		}
	});
});

/** Transaction 투자내역 조회 */
router.post('/transactionDegreeHistListAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.transactionDegreeHistList(req, res, token, refToken);
		}
	});
});

/** Transaction QRCode 이미지 */
router.post('/transactionQRImgAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.transactionQRImg(req, res, token, refToken);
		}
	});
});

/** Exchange 페이지 이동 */
router.get('/exchange', function(req, res, next) {
	res.render('./mypage/exchange', {layout: './layout/mypage-layout'});
});

/** Exchange 데이터 조회 */
router.post('/exchangeInfoAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.exchangeInfo(req, res, token, refToken);
		}
	});
});

router.post('/changeWalletAddr', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.changeWalletAddr(req, res, token, refToken);
		}
	});
});

// 2 Factor 인증 페이지 이동
router.get('/tFactorAuth', function(req, res, next) {
	res.render('./mypage/tFactorAuth', {layout: './layout/mypage-layout'});
});

/** OTP QRcode 생성 */
router.post('/createQRcodeAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.createQRcode(req, res, token, refToken);
		} else {
			res.json({'result': false, 'message': 'Authentication failed.'});
		}
	});
});

/** OTP 등록 */
router.post('/createOTPAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.createOTP(req, res, token, refToken);
		} else {
			res.json({'result': false, 'message': 'Authentication failed.'});
		}
	});
});

/** OTP 인증 삭제 */
router.post('/removeOTPAuthAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.removeOTPAuth(req, res, token, refToken);
		} else {
			res.json({'result': false, 'message': 'Authentication failed.'});
		}
	});
});

// /** OTP 재사용/재등록 */
// router.post('/recycleOTPAuthAjax', function(req, res, next) {
// 	authToken.isAuthToken(req, res, function(err, result, token) {
// 		if (!err && result) {
// 			mypageController.recycleOTPAuth(req, res, token);
// 		} else {
// 			res.json({'result': false, 'message': 'Authentication failed.'});
// 		}
// 	});
// });

router.post('/awsFileDownloadAjax', function(req, res, next) {
	mypageController.awsFileDownload(req, res);
});

// /** 프로파일  */
// router.post('/profile', function(req, res, next) {
// 	authToken.isAuthToken(req, res, function(err, result, token) {
// 		if (!err && result) {
// 			mypageController.recycleOTPAuth(req, res, token);
// 		} else {
// 			res.json({'result': false, 'message': 'Authentication failed.'});
// 		}
// 	});
// });

/** 환불 페이지 이동 */
router.get('/refundWallet', function(req, res, next) {
    res.render('./mypage/refundWallet', {layout: './layout/layout', 'userUuid': req.query.userUuid, 'coinType': req.query.coinType});
});

/** 환불 지갑 등록 */
router.post('/refundWalletAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.refundWallet(req, res, token, refToken);
		} else {
			res.json({'result': false, 'message': 'Authentication failed.'});
		}
	});
});

router.post('/refundRegChkAjax', function(req, res, next) {
	authToken.isAuthToken(req, res, function(err, result, token, refToken) {
		if (!err && result) {
			mypageController.refundRegChk(req, res, token, refToken);
		}
	})
});

/** mypage faq 접근 */
router.get('/mypageFaqList', function(req, res){
    res.render(`./mypage/mypageFaqList`, {layout: './layout/mypage-layout'});
});

/** mypage faq list */
router.post('/mypageFaqListAjax', boardcontroller.boardList);


module.exports = router;