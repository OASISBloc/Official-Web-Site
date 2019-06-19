
function scroll_to(clicked_link, nav_height) {
	var element_class = clicked_link.attr('href').replace('#', '.');
	//console.log(element_class)
	var scroll_to = 0;
	if(element_class != '.top-content') {
		element_class += '-container';
		scroll_to = $(element_class).offset().top - nav_height;
	}
	if($(window).scrollTop() != scroll_to) {
		$('html, body').stop().animate({scrollTop: scroll_to}, 1000);
	}
}

jQuery(document).ready(function() {
	var timer;

	$(window).scroll(function(){	
		$('.navbar-nav').removeClass('border');
		var scroll_about = $('#about').offset().top-300;
		var scroll_platform = $('#platform').offset().top-300;
		var scroll_tech = $('#tech').offset().top-300;
		var scroll_plan = $('#plan').offset().top-400;
	
		$('.navbar-nav').find('li').removeClass('border');
		if($(document).scrollTop() >= scroll_about &&  $(document).scrollTop() < scroll_platform){
			$('.nav-a-01').parent().addClass('border');
		}else if($(document).scrollTop() >= scroll_platform &&  $(document).scrollTop() < scroll_tech){
			$('.nav-a-02').parent().addClass('border');
		}else if($(document).scrollTop() >= scroll_tech &&  $(document).scrollTop() < scroll_plan){
			$('.nav-a-03').parent().addClass('border');
		}else if($(document).scrollTop() >= scroll_plan){
			$('.nav-a-04').parent().addClass('border');
		}else{$('.navbar-nav').removeClass('border');}
		
		clearTimeout(timer);
        timer = setTimeout( refresh , 150 );
		
		if($(window).scrollTop()>30){
			$('.navbar.navbar-no-bg').addClass('up');
			$('.top').css({display:'none'})  
		}else{
			$('.navbar.navbar-no-bg').removeClass('up');
			$('.top').css({display:'block'})  
		}
	})

	 var refresh = function () { 
        // do stuff
        console.log('Stopped Scrolling');
        $('.top').css({display:'block'})  
    };
	

	/*
	    Navigation
	*/
	$('a.scroll-link').on('click', function(e) {
		e.preventDefault();
		scroll_to($(this), $('nav').outerHeight());
	});
	// toggle "navbar-no-bg" class
	$('.top-content .text').waypoint(function() {
		$('nav').toggleClass('navbar-no-bg');
	});
	
    $('#top-navbar-1').on('shown.bs.collapse', function(){
    	$('.top-content').backstretch("resize");
    });
    $('#top-navbar-1').on('hidden.bs.collapse', function(){
    	$('.top-content').backstretch("resize");
    });

    /*
		nav statue
    */

    $('nav li a').click(function(){

    	$('nav li').removeClass('border');
    	$(this).parent().addClass('border');
    })

    $('.ham').click(function(){
    	if($('body').hasClass('on')){
    		$('.sideMenu').animate({'right':'-200'+'%'});
    		$('.wrapping').removeClass('cover');
    		$('.line-btn-wrap').removeClass('active');	
    	}else{
    		$('.sideMenu').animate({'right':'0'});	
    		$('.wrapping').addClass('cover');
    		$('.line-btn-wrap').addClass('active');
    	}
    	$('body').toggleClass('on');
    })

    $('.sideMenu ul li a').click(function(){
    	$('body').removeClass('on');
    	$('.sideMenu').animate({'right':'-200'+'%'});
    	$('.wrapping').removeClass('cover');
    	$('.line-btn-wrap').removeClass('active');
    })

    /*
        Wow
    */
    //new WOW().init();
	
});


jQuery(window).load(function() {
	
	/*
		Loader
	*/
	$(".loader-img").fadeOut();
	$(".loader").delay(1000).fadeOut("slow");
	
	/*
		Hidden images
	*/
	$(".testimonial-image img").attr("style", "width: auto !important; height: auto !important;");
	
});

