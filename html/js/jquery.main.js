;(function () {
  $(function() {
    initHeightFooter('#footer','#content');
    tabs('.tabs-menu','.tabs-menu-item','.tabs','.tabs-content',200);
    initScrollTo('.guide-menu');
    addBtnTop('.up-btn',500,400,0);
  });

  /*
   * Function
   * */

  /*
   * function addBtnTop
   * a - selector
   * b - scrollTop, px
   * c - animate, ms
   * d - spred to top, px
   * */
  function addBtnTop(a,b,c,d){
    //$('body').append("<span class='up-btn'></span>");
    var _this = $(a);
    _this.hide();
    $(window).scroll(function() {
      if($(this).scrollTop() >= b) {
        _this.fadeIn();
      } else {
        _this.fadeOut();
      }
    });
    _this.on('click',function() {
      $('html,body').animate({scrollTop:d},c);
    });
  };

// function initScrollTo
  function initScrollTo(a){
    $('a',a).on('click',function() {
      var str = $(this).attr("href");
      var targetOffset = $(str).offset().top;
      $('html,body').animate({scrollTop: targetOffset}, 600);
      return false
    });
  }

// function tabs
  /**
   * function tabs
   * used: tabs('.tabs-menu','.tabs-menu-item','.tabs','.tabs-content',200);
   **/
  function tabs(tabsMenu,tabsMenuItem,tabsParent,tabsContent,tabsTime){
    $(tabsMenu).each(function(i,e){
      $(tabsMenuItem,e).each(function(i,e){
        $(e).attr('index',i);
      });
    });
    $(tabsMenuItem,tabsMenu).on('click', function(){
      var _this = $(this);
      if(!_this.hasClass('active')){
        var i = _this.attr('index');
        var _thisPar = _this.parents(tabsParent);
        _this.siblings().removeClass('active');
        _this.addClass('active');
        $(tabsContent + ' > div',_thisPar).fadeOut(0);
        $(tabsContent + ' > div',_thisPar).eq(i).fadeIn(tabsTime);
      }
    });
  }

// function initHeightFooter
  function initHeightFooter(a,b){
    function autoHeightFooter(){
      var _this = $(a);
      _this.height('auto');
      var _thisHeight = _this.outerHeight();
      _this.css('margin-top',-_thisHeight);
      $(b).css('padding-bottom',_thisHeight);
    };
    autoHeightFooter();
    setTimeout(autoHeightFooter,1000);
    $(window).resize(function(){
      autoHeightFooter();
    });
  }

})();
