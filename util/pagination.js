const logger = require('./logger');

exports.pagination = (curPage,totalCount,maxPageInSet,maxEntityInPage,link) => {
    logger.debug('pagination / curPage :: ' + curPage + '   totalCount :: ' + totalCount + '    maxEntityInPage :: ' + maxEntityInPage + '  maxPageInSet :: ' + maxPageInSet);
    if( curPage && totalCount ){
        //var mod_url = link.replace(/\/([0-9])+/g,'/2');
        var paging_result='';
        //var maxPageInSet = 10,                            // 페이지 카운트 갯수
        //    maxEntityInPage = 10,                         // 한 페이지당 컨텐츠 수
        var totalPage = Math.ceil(totalCount/maxEntityInPage),                  // 전체 페이지수
            totalSet = Math.ceil(totalPage/maxPageInSet),                       // 전체 세트수
            curSet = Math.ceil(curPage/maxPageInSet),                           // 현재 세트번호
            startPage = ((curSet-1)*maxPageInSet)+1,                            // 현재 세트내 출력될 시작 페이지
            endPage = (startPage+maxPageInSet)-1;                               // 현재 세트내 출력될 마지막 페이지
        //console.log('[0] curPage : '+curPage+' | [1] maxPageInset : '+maxPageInSet+' | [2] maxEntityInpage : '+maxEntityInPage+' | [3] totalPage : '+totalPage+' | [4] totalSet : '+totalSet+' | [5] curSet : '+curSet+' | [6] startPage : '+startPage+' | [7] endPage : '+endPage);
        /** 1개 세트내 Previous 페이지 출력여부 설정(PreviousPage=StartPage-1) **/
        if(curSet > 1){
            paging_result += '<li value="'+ (startPage-1) +'"><a href="'+link.replace(/\/([0-9])+/g,'/'+ (startPage-1))+'"><i class="fa fa-angle-left">prev</i></a></li>';
        }
        /** 1개 세트내 페이지 출력여부 설정(페이지 순환하면서 요청페이지와 같을 경우 해당 페이지 비활성화 처리) **/
        for(var i=startPage; i<=endPage;i++){
            if(i>totalPage) break;      // 전체페이지보다 클 경우 종료(마지막 세트의 마지막 페이지)
            paging_result += '<li '+ (i==curPage ? 'class="active"':'') +' value="'+ i +'"><a href="'+link.replace(/\/([0-9])+/g,'/'+ i)+'">'+ i + '</a></li>';
        }
        /** 1개 세트내 Next 페이지 출력여부 설정(NextPage=EndPage+1) **/
        if(curSet<totalSet){
            paging_result += '<li value="'+ (endPage+1) +'"><a href="'+link.replace(/\/([0-9])+/g,'/'+ (endPage+1))+'"><i class="fa fa-angle-right">next</i></a></li>';
        }

        logger.debug('pagination / paging_result :: ' + paging_result);
        return paging_result;
    }    
}