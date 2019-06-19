/* JS init */
$(document).ready(function(){
	dropdown();
	accordion();
	scrollNav();
	scrollTop();
});
$(window).on("load", function(){
	gnb();
	headerFooterPosition();
});


/*---------------------------------
	GNB
----------------------------------*/
var gnb = function(){
	var $el = $(".mp-header, .main-header");
	var	$pane = $el.find(".pane");
	var	$dim = $el.find(".dim");

	var open = function(){
		$dim.stop().fadeIn(200);
		$pane.stop().animate({ right: 0 },500,"easeOutQuart");
	}

	var close = function(){
		$dim.stop().fadeOut(100);
		$pane.stop().animate({ right: "-80%" },300,"easeOutQuart");
	}
		
	$el.on("click", ".top-wrap > .h-btn", function(e){
		if($el.is(".mp-header")){
			$("body").css({overflow : "hidden"});	
			$(window).scrollTop(0);
		}
		
		if(!$(this).is(".active")){
			$(this).addClass("active");
			open();
		}else{
			$(this).removeClass("active");
			$("body").css({overflow : "visible"});
			close();
		}
		e.preventDefault();
	});
	$el.on("click", ".dim", function(e){
		$el.find(".top-wrap > .h-btn").removeClass("active");
		$("body").css({overflow : "visible"});
		close();
	});
}


/*---------------------------------
	Dropdown
----------------------------------*/
var dropdown = function(){
	var $el = $(".dropdown");
	var $option = $el.find(".d-option");

	$el.on("click", ".d-select", function(e){
		if(!$(this).is(".active")){
			$option.slideDown(300);
			$(this).addClass("active");
		}else{
			$option.slideUp(100);
			$(this).removeClass("active");
		}
		e.preventDefault();
		
	});
	$(document).on("click scroll", function(e){ 
		if($(e.target).closest(".dropdown").length == 0){ 
			$option.slideUp(100);
			$el.find(".d-select").removeClass("active");
		} 
	});
	
}


/*---------------------------------
	Accordion
----------------------------------*/
var accordion = function(){
	var $el = $(".accordion");
	
	$el.on("click", ".ac-trigger", function(e){
		var $parent = $(this).parent("li");

		if(!$parent.is(".active")){
			$(this).next(".ac-content").slideDown(200);
			$parent.addClass("active").siblings("li").removeClass("active").find(".ac-content").slideUp(200);
		}else{
			$(this).next(".ac-content").slideUp(200);
			$parent.removeClass("active");
		}
		e.preventDefault();
	});

}

/*---------------------------------
	Header & Footer position
----------------------------------*/
var headerFooterPosition = function(){

	var windowHeight = null;
	var headerHeight = null;
	var contentHeadHeight = null;
	var gnbHeight = null;
	var containerSignHeight = null;
	var contentSignHeight = null;
	var contentMpHeight = null;
	var footerHeight = null;
	var viewHeight = null;
	
	var $wrap = $(".wrapper");
	var $containerSign = $wrap.find(".container");
	var $contentSign = $wrap.find(".contents");
	var $wrapMp = $(".mp-wrapper");
	var $gnb = $wrapMp.find(".mp-header .top-wrap");
	var $lnb = $wrapMp.find(".mp-header .btm-wrap");
	var $containerMp = $wrapMp.find(".mp-container");
	var $contentHead = $wrapMp.find(".mp-contents-head:visible");
	var $contentMp = $wrapMp.find(".mp-contents:visible");
	var $header = $("header");
	var $footer = $("footer");
	
	var objHeight = function(){
		windowHeight = $(window).outerHeight(true);
		gnbHeight = $gnb.outerHeight(true);
		containerSignHeight = $containerSign.outerHeight(true);
		contentSignHeight = $contentSign.outerHeight(true);
		contentMpHeight = $contentMp.outerHeight(true);
		footerHeight = $footer.outerHeight(true);
	}
	
	var start = function(){
		objHeight();	
		viewSize();
		event();
	}
	
	var event = function(){
		$(window).resize(function(){
			objHeight();
			viewSize();
			fixed();
		});
		$(window).scroll(function(){
			fixed();
		});
	}
	
	var viewSize = function(){
		if($("body").children().is($wrapMp)){
			if($(window).outerWidth(true) <= 1024){
				$wrapMp.addClass("tablet");
				headerHeight = $header.outerHeight(true);
				viewHeight = windowHeight - headerHeight - contentMpHeight - footerHeight;
				if(viewHeight >= 0){
					$containerMp.css({height: contentMpHeight + viewHeight + "px" });
				}else{
					$containerMp.css({height: "auto"});
				}
			}else{
				$wrapMp.removeClass("tablet");
				contentHeadHeight = $contentHead.outerHeight(true);
				viewHeight = windowHeight - contentHeadHeight - contentMpHeight - footerHeight;
				if(viewHeight >= 0){
					$containerMp.css({height: contentHeadHeight + contentMpHeight + viewHeight + "px" });
				}else{
					$containerMp.css({height: "auto"});
				}
			}
		}else{
			headerHeight = $header.outerHeight(true);
			viewHeight = windowHeight - headerHeight - contentSignHeight - footerHeight;
			if(viewHeight >= 0){
				$containerSign.css({height: headerHeight + contentSignHeight + viewHeight + "px" });
			}else{
				$containerSign.css({height: "auto"});
			}
		}
	}

	var fixed = function(){
		if($wrapMp.is(".tablet")){
			if($(window).scrollTop() >= gnbHeight){
				$lnb.addClass("fixed");
				$containerMp.addClass("fixed");
			}else{
				$lnb.removeClass("fixed");
				$containerMp.removeClass("fixed");
			}
		}
	}
	start();
	
}


/*---------------------------------
	Scroll navigation
----------------------------------*/
var scrollNav = function(){
	
	var $html = null;
	var $wrapper = null;
	var $header = null;

	var $pane = null;
	var $dim = null;
	var $hBtn = null;
	
	var $nav = null;
	var $navList = null;
	var $section = null;
	var $btn = null;

	var navTop = 0;
	var nowScroll = 0;
	var fixed = false;
	
	var headerHeight = null;
	var navHeight = null;
		
	var sectionTop = []; 
	var sectionLength = 0;

	var $selectList = null;
	var selectNum = null;
	
	var start = function(){
		init();
		sectionOffset();
		event();
	}
		
	var init = function(){
		$html = $("html, body");
		$wrapper = $(".main-wrapper");
		$header = $wrapper.find(".main-header");
		
		$pane = $header.find(".pane"); 
		$dim = $header.find(".dim"); 

		$nav = $header.find(".top-wrap");
		$navList = $nav.find(".gnb li.scroll");
		$hBtn = $nav.find(".h-btn");

		$section = $wrapper.find("section.scroll-section");
		$btn = $wrapper.find(".btn-wrap.scroll");
		
		
		headerHeight = $header.outerHeight(true);
		navHeight = $nav.outerHeight(true);
		navTop = 72;
		sectionLength = $navList.length;
				
	}
	
	var sectionOffset = function(){
		if(sectionLength > 0){
			for(var i=0; i<sectionLength; i++){
				if ($section.length > 0)
					sectionTop[i] = parseFloat($section.eq(i).offset().top).toFixed() - navHeight;
			}
		}
	}
		
	var event = function(){
		$btn.on("click", "a", function(e){
			target = $(this.hash);
			$html.stop().animate({ "scrollTop" : target.offset().top - navHeight }, 600, "easeOutQuad");
			e.preventDefault();
		});

		$header.on("click", ".gnb li.scroll a", function(e){
			var idx = $(this).parent("li.scroll").index();
			
			$dim.stop().fadeOut(100);
			$hBtn.removeClass("active");
			$pane.stop().animate({ right: "-80%" },300,"easeOutQuart");
			$html.stop().animate({ "scrollTop" : sectionTop[idx] }, 600, "easeOutQuad");
			e.preventDefault();
		});

		$(window).scroll(function(){
			nowScroll = $(window).scrollTop();
			navFixed();
			navSelect();
			sectionOffset();
		});
		
		$(window).resize(function(){
			navHeight = $nav.outerHeight(true);
			headerHeight = $header.outerHeight(true);
			navFixed();
			sectionOffset();
		});
	}
		
	var navFixed = function(){
		if(headerHeight > 80) {
			$nav.removeClass("shadow");
			if(nowScroll >= navTop){
				if(fixed === false){
					$nav.addClass("fixed");
					fixed = true;
				}
			}else{
				if(fixed === true){
					$nav.removeClass("fixed");
					fixed = false;
				}
			}
		}else{
			$nav.removeClass("fixed");
			fixed = false;
			if(nowScroll > 0){
				$nav.addClass("shadow");
			}else {
				$nav.removeClass("shadow");
			}
		}
	}
		
	var navSelect = function(){
		for(var i=0; i<sectionLength-1; i++){
			if(nowScroll>=sectionTop[i] && nowScroll<sectionTop[i+1]){
				select(i);
            }
			if(i == sectionLength - 2){
				if(nowScroll>=sectionTop[sectionLength - 1]){
					select(sectionLength - 1);
				}
			}
			if(nowScroll<sectionTop[0]){
				selectRemove();
			}
		}
    }
    
    var select = function(num){
		selectRemove(num);
		selectAdd(num);
    }
        
    var selectRemove =  function(num){
        if($selectList!=null){
            if(selectNum != num){
                $selectList.removeClass("active");
                $selectList=null;
            }
        }
    }
    
    var selectAdd = function(num){
        $selectList = $navList.eq(num);
        $selectList.addClass("active"); 
        selectNum = num;
    }

	start();
}


/*---------------------------------
	Scroll to the top
----------------------------------*/
var scrollTop = function(){
	var $html = $("html, body");
	var $el = $(".scrolltop");
	
	$(window).scroll(function(){
		var p = $(window).scrollTop();

		if(p > 1000){
			$el.fadeIn(200);
		}else{
			$el.fadeOut(100);
		}
	});
	
	$el.on("click", function(e){
		$html.animate({ "scrollTop" : 0 }, 600, "easeOutQuad");
		e.preventDefault();
	});

}











