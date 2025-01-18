jQuery(document).ready(function(){
  
  if( !bt_frontend_script_vars.is_preview && jQuery('.conversion-module').length > 0 ) {
    jQuery('.conversion-module').remove();
  }

  if( window.bt_conversion_vars ) {

    jQuery.each(bt_conversion_vars, function(key, conversion_el) {

      // page load conversion
      if ( conversion_el.type !== 'click' )
      {
        var eid = conversion_el.eid;
        var variationObj = abstGetCookie('btab_'+eid);

        if( !variationObj ) {
          return true;
        }

        variationObj = JSON.parse(variationObj);

       if( bt_experiments[eid] === undefined ) {
          return false;
        }

        // if its converted already
        if( variationObj.conversion == 1 ) {
            console.info('AB Split test already converted.');
          return true;
        }

        // if its not an empty conversion URL or page, then it must be defined elsewhere
        if( bt_experiments[eid].conversion_url != '' || bt_experiments[eid].conversion_page != '' ) {
          if(bt_experiments[eid].conversion_url == 'embed')
            console.info('AB Split Test conversion defined as external URL, but conversion module used. Please check your configuration settings. This is a soft error and a conversion event has not been blocked.');
          else
            return true;
        }


        variation = variationObj.variation;

        var convertType = conversion_el.type;
        var convertClickSelector = conversion_el.selector;
       
        if (typeof conversion_details !== 'undefined' ) // we have a conversion page URL set, 
        {
          if(typeof conversion_details[eid] !== 'undefined')
          {
            console.log('Possible duplicate conversion event. Check your set up.');
          }
        }
        
        if(variation){
          bt_experiment_w(eid,variation,'conversion',false);
          variationObj.conversion = 1;
          variationObj = JSON.stringify(variationObj);
          abstSetCookie('btab_'+eid, variationObj, 1000);
        }
      }

      // click conversion
      if( conversion_el.type == 'click' )
      {
        var convertClickSelector = conversion_el.selector;
        //find link
        if( jQuery(convertClickSelector).length > 0 ) {
          //cool
        }
        else if( jQuery(convertClickSelector + " a").length > 0 ) {
          //add the "a"
          convertClickSelector += " a"; 
        }
        else if( jQuery(convertClickSelector + " img").length > 0 ) {
          //add the "a"
          convertClickSelector += " img";
        }
        else
        {
          console.log("no conversion elements found");
        }
        
        if( jQuery(convertClickSelector).length > 0 ) {

          jQuery('body').on('click', convertClickSelector,function(event){
            var convertElement = jQuery(this);
            var url = convertElement.attr('href');
            var target = convertElement.attr('target');
            var eid = conversion_el.eid;

            var variationObj = abstGetCookie('btab_'+eid);
            variationObj = JSON.parse(variationObj);

            console.log('variationObj', variationObj);

            if( bt_experiments[eid] === undefined ) {
              return false;
            }

            if( variationObj.conversion == 1 ) {
                console.log('ab test already converted.');
              return true;
            }

            variation = variationObj.variation;

            if(url && (target !== '_blank'))
            {
              event.preventDefault();
              bt_experiment_w(eid,variation,'conversion',url);
            }
            else
            {
              bt_experiment_w(eid,variation,'conversion',false);
            }

            variationObj.conversion = 1;
            variationObj = JSON.stringify(variationObj);
            abstSetCookie('btab_'+eid, variationObj, 1000);          
          });

        }
      }
    });

  }

  // admin bar test helper...
  var submenus = '';
  var bt_conversion_icon = '<div class="ab-flag-filled"></div>';
  var bt_variation_icon = '<div class="ab-split"></div>';
  var bt_split_test_icon = '<div class="ab-test-tube"></div>';
  var conversions = {};

   //clean up conversions
   if(window.bt_conversion_vars)
   {
      jQuery.each(bt_conversion_vars, function(index,value){
        conversions[value.eid] = value;
      });
   }

   if(window.bt_experiments)
   {
    jQuery.each(bt_experiments, function(index,value){
      //each experiment

      if(!jQuery('[bt-eid="'+index+'"]').length && !conversions[index]) // if no tests or conversions, then skip er{}
        return;

      //create experiment menu
      submenus += '<li><a class="ab-item" target="_blank" href="'+bt_adminurl+'post.php?post='+index+'&action=edit">'+bt_split_test_icon+'<strong>'+ value.name +'</strong></a></li>';
      
      variations = [];
      //list test variations
      jQuery('[bt-eid="'+index+'"]').each(function(){
        spantext = '';
        if(jQuery(this).attr('bt-url'))
          spantext = jQuery(this).attr('bt-url').replace(/^.*\/\/[^\/]+/, '');
        else if(btab_vars.post_id == jQuery(this).attr('bt-variation'))
          spantext = 'Current Page';
        else
          spantext = jQuery(this).attr('bt-variation');

        if( variations.indexOf(jQuery(this).attr('bt-variation')) === -1)
        {
          variations.push(jQuery(this).attr('bt-variation'));
          submenus += '<li><a class="ab-item ab-test" show-css = "'+jQuery(this).attr('bt-variation')+'" show-url="' + jQuery(this).attr('bt-url') + '" show-eid="' + jQuery(this).attr('bt-eid') + '"show-variation="' + jQuery(this).attr('bt-variation') + '"> ' + bt_variation_icon + ' <span class="variation-tag-button">' + spantext + '</span></a></li>';
        }
      });

      //list conversions 
      if(conversions[index])
      {
        if(conversions[index]['type'] != 'load')
          submenus += '<li><a class="ab-item ab-test test-conversion">'+bt_conversion_icon+' '+ conversions[index]['type'] + " <div class='ab-test-selector'>" + conversions[index]['selector'] + '</div></a></li>';
          else
          submenus += '<li><a class="ab-item ab-test test-conversion">'+bt_conversion_icon+' On page load</a></li>';   
      }
    });

   }

  var bt_variations_found = jQuery('[bt-eid]:not([bt-eid=""])[bt-variation]:not([bt-variation=""])');

  if(bt_variations_found.length || !jQuery.isEmptyObject(conversions))
  { 
    submenus += '<li><a class="ab-item ab-sub-secondary" id="ab-clear-test-cookies">Clear AB Test Cookies</a></li>';

    //add admin bar if not there
    if(!jQuery('#wp-admin-bar-ab-test').length)
      jQuery("#wp-admin-bar-root-default").append('<li id="wp-admin-bar-ab-test" class="menupop"><div class="ab-item ab-empty-item" aria-haspopup="true">'+bt_split_test_icon+'A/B Split Test</div><div class="ab-sub-wrapper"><ul class="ab-submenu"></ul></div></li>');
    
    jQuery("#wp-admin-bar-ab-test ul.ab-submenu").prepend(submenus);
    
    jQuery('#wp-admin-bar-ab-test [show-variation]').click(function(){
      
      var showeid = jQuery(this).attr('show-eid');
      var showevar = jQuery(this).attr('show-variation');
      var showurl = jQuery(this).attr('show-url');

      if(showevar.indexOf('test-css-') != -1)
      {
        result = showevar.replace(/-\d+$/, '');
        removeTestClasses(jQuery('body'),showeid );
        jQuery('body').addClass(showevar);
      }

      if(showurl != 'undefined')
      {
        var win = window.open(showurl, '_blank');
        if (win) {
            //Browser has allowed it to be opened
            win.focus();
        } else {
            //Browser has blocked it
            alert('Please allow popups to preview full page test pages');
        }
      }

      jQuery('[bt-eid="'+showeid+'"]').removeClass('bt-show-variation');
      jQuery('[bt-eid="'+showeid+'"][bt-variation="'+showevar+'"]').addClass('bt-show-variation');
      bt_highlight('[bt-eid="'+showeid+'"][bt-variation="'+showevar+'"]');

      window.dispatchEvent(new Event('resize')); // trigger a window resize event. Useful for sliders etc. that dynamically resize

    });

    jQuery('#wp-admin-bar-ab-test>a').mouseenter(function(){
      bt_highlight("[bt-eid]");
    });

    jQuery('#wp-admin-bar-ab-test>a').click(function(){
      bt_highlight("[bt-eid]");
    });

    jQuery('.test-conversion').click(function(){
      bt_highlight(jQuery(this).find('.ab-test-selector').text());
    });
    

    let searchParams = new URLSearchParams(window.location.search)
    const abtv = searchParams.get("abtv");
    const abtid = searchParams.get("abtid");
    if (abtv && abtid) {
      //console.log("abtv: " + abtv + " abtid: " + abtid);
      // Search for the element with matching data attributes and click it
      jQuery(`a[show-variation="${abtv}"][show-eid="${abtid}"]`).click();
    }
    



    jQuery('#ab-clear-test-cookies').click(function(){
      if(confirm("Clear your A/B Split Test cookies?"))
      {
        alert('A/B split test cookies cleared\n\nRefresh your page to see another random variation.');
        //get all experiments on page
        jQuery('[bt-eid]').each(function(){
          abstSetCookie('btab_' + jQuery(this).attr('bt-eid'), '', -1);
        });
      }
    });

    if ( typeof(jQuery.fn.hoverIntent) == 'undefined' )
      !function(I){I.fn.hoverIntent=function(e,t,n){function r(e){o=e.pageX,v=e.pageY}var o,v,i,u,s={interval:100,sensitivity:6,timeout:0},s="object"==typeof e?I.extend(s,e):I.isFunction(t)?I.extend(s,{over:e,out:t,selector:n}):I.extend(s,{over:e,out:e,selector:t}),h=function(e,t){if(t.hoverIntent_t=clearTimeout(t.hoverIntent_t),Math.sqrt((i-o)*(i-o)+(u-v)*(u-v))<s.sensitivity)return I(t).off("mousemove.hoverIntent",r),t.hoverIntent_s=!0,s.over.apply(t,[e]);i=o,u=v,t.hoverIntent_t=setTimeout(function(){h(e,t)},s.interval)},t=function(e){var n=I.extend({},e),o=this;o.hoverIntent_t&&(o.hoverIntent_t=clearTimeout(o.hoverIntent_t)),"mouseenter"===e.type?(i=n.pageX,u=n.pageY,I(o).on("mousemove.hoverIntent",r),o.hoverIntent_s||(o.hoverIntent_t=setTimeout(function(){h(n,o)},s.interval))):(I(o).off("mousemove.hoverIntent",r),o.hoverIntent_s&&(o.hoverIntent_t=setTimeout(function(){var e,t;e=n,(t=o).hoverIntent_t=clearTimeout(t.hoverIntent_t),t.hoverIntent_s=!1,s.out.apply(t,[e])},s.timeout)))};return this.on({"mouseenter.hoverIntent":t,"mouseleave.hoverIntent":t},s.selector)}}(jQuery);
    //add hoverintent for the data
    jQuery('#wp-admin-bar-ab-test').hoverIntent({
        over: function(e){
              jQuery(this).addClass('hover');
        },
        out: function(e){
                jQuery(this).removeClass('hover');
        },
        timeout: 180,
        sensitivity: 7,
        interval: 100
    });
  }
});

function removeTestClasses(element, testId) {
    var classNames = element.attr('class').split(/\s+/);
    jQuery.each(classNames, function (index, className) {
        var regex = new RegExp('test-css-' + testId + '-\\d+');
        if (regex.test(className)) {
            element.removeClass(className);
        }
    });
}
