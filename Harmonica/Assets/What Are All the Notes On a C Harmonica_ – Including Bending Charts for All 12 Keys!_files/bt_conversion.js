// is user active global vars
window.abst = {};
// activity timer

window.abst.timer = localStorage.absttimer === undefined ? {} : JSON.parse(localStorage.absttimer || 0); 

window.abst.currscroll = window.scrollY;
window.abst.currentMousePos = -1;
window.abst.oldMousePos = -2;
window.abst.abactive = true;
window.abst.timeoutTime = 3000; // how much inactivity before we stop loggin in milliseconds
window.abst.intervals = {};


jQuery(document).ready(function(){

  //todo make visits / conversion wait until we have uuid

    next_page_visit_report();

    if( !btab_vars.is_preview && jQuery('.ab-test-page-redirect').length > 0 ) {
      jQuery('.ab-test-page-redirect').remove();
    }

    if( jQuery('[bt_hidden="true"]').length > 0 ) {
      jQuery('[bt_hidden="true"]').remove();
    }

  
    // update scroll status
    jQuery(document).mousemove(function(event) {
      window.abst.currentMousePos = event.pageX;
    });
    // catch mouse / keyboard action
    jQuery('body').on('mousedown keydown touchstart', function(event) {
      userActiveNow();
    });
    
    if(!('abConversionValue' in window.abst))
      window.abst.abConversionValue = 1;

    window.abst.timerInterval = setInterval(function(){
      //check if scroll's changed

      if((window.abst.currscroll != window.scrollY) || (window.abst.currentMousePos != window.abst.oldMousePos) )
      {
        window.abst.currscroll = window.scrollY;
        window.abst.oldMousePos = window.abst.currentMousePos;
        userActiveNow();
      }

      // check for active class and decrement all active timers
      if(window.abst.abactive) //for each active timer, increment
        abstOneSecond();

    },1000); // every second


    //conversion things
    if (typeof conversion_details !== 'undefined' &&  conversion_details)
    {
      var eid = null;
      var variation = null;

      // current p info
      page_url = window.location.href.replace(window.location.origin,'');
      if (page_url.charAt(0) == "/") page_url = page_url.substr(1);
      if (page_url.charAt(page_url.length - 1) == "/") page_url = page_url.substr(0, page_url.length - 1);
      //loop through each conversion d
      jQuery.each( conversion_details, function( key, detail ) {

        //regex url matching for url's with *   *about*
        if (detail.conversion_page_url && page_url) {
          // Escape special characters in the user input
          var escapedUrl = detail.conversion_page_url.replace(/([.+?^${}()|[\]\\])/g, '\\$1');
          // Replace * with a regex pattern (.*)
          var regexPattern = escapedUrl.replace(/\*/g, '.*');
          // Create a regular expression object
          var regex = new RegExp(`^${regexPattern}$`);
        }

        if(typeof regex !== 'undefined'){
          if (regex.test(page_url)) {
              eid = key;
          }
        }
        else if((detail.conversion_page_url === page_url) && (detail.conversion_page_url !== undefined) && (detail.conversion_page_url != ''))  
        {
          eid = key;
        }
        else if(current_page.includes(detail.conversion_page_id) || current_page.includes(parseInt(detail.conversion_page_id))) 
        {
          eid = key;
        }
        else
        {
          return true; // skip to the next one
        }

        variation = abstGetCookie('btab_'+eid);

        if(!variation)
          return true; // skip to the next one
        
        variation = JSON.parse(variation);

        //skip if its already converted
        if( variation.conversion == 1 )
          return true; // skip to the next one
        conversionValue = 1;
        if(window.abst.abConversionValue && detail.use_order_value == true)// woo etc
          conversionValue = window.abst.abConversionValue;

        bt_experiment_w(eid,variation.variation,'conversion',false,conversionValue);
    });

    }

    //foreach experiment
    if (typeof bt_experiments !== 'undefined')
    {
      // check for css classes, then add attributes
      jQuery("[class^='ab-'],[class*=' ab-']").each(function(e){
        if(jQuery(this).attr('class').includes('ab-var-') || jQuery(this).attr('class').includes('ab-convert'))
        {
          allClasses = jQuery(this).attr('class');
          allClasses = allClasses.split(" "); // into an array
          thisTestVar = false;
          thisTestGoal = false;
          thisTestId = false;
          thisTestConversion = false;
          allClasses.forEach(function(element) { 
            
            if(element.startsWith('ab-var-'))
              thisTestVar = element;
            else if (element.startsWith('ab-goal-'))
              thisTestGoal = element;
            else if(element.startsWith('ab-') && !element.includes('ab-convert') )
              thisTestId = element;          
            if(element == 'ab-convert')
              thisTestConversion = true;

          });

          if(thisTestVar !== false && thisTestId !== false)
          {
            //we've got variations, do ya thing!
            jQuery(this).attr('bt-eid',thisTestId.replace("ab-",""));
            jQuery(this).attr('bt-variation',thisTestVar.replace("ab-var-",""));
          }

          if(thisTestConversion == true && thisTestId !== false)
          {
            // it's a conversion, convert!
            abstConvert(thisTestId.replace("ab-",""));
          }

          if(thisTestGoal == true && thisTestId !== false)
          {
            //its a goal, record it!
            abstGoal(thisTestId.replace("ab-",""),thisTestGoal.replace("ab-goal-",""));
          }
        }

        if(jQuery(this).attr('class').includes('ab-click-convert-'))
        {
          
          jQuery(this).attr('class').split(" ").forEach(function(element) { // loop through all classes
            if(element.trim().startsWith('ab-click-convert-'))
              abClickListener(element.replace("ab-click-convert-",""),"."+element);
          });

        }

      });

      // legacy probably can be removed, check bricks 
      jQuery("[data-bt-variation]").each(function(){ 
        jQuery(this).attr('bt-variation',jQuery(this).attr('data-bt-variation')); 
        jQuery(this).attr('bt-eid',jQuery(this).attr('data-bt-eid')); 
      }); 


      //fix bricks child attributes
      //fix bricks, move attr's up one level       
      jQuery(".bricks-element [bt-eid]").each(function(e){
        jQuery(this).parents('.bricks-element').attr('bt-eid',jQuery(this).attr('bt-eid')).attr('bt-variation',jQuery(this).attr('bt-variation'));
        jQuery(this).removeAttr('bt-eid').removeAttr('bt-variation');
      });

      jQuery.each(bt_experiments, function(experimentId, experiment) {

        // if there is a winner, AND the current page is the default page and AUTOCOMPLETE then just go straight there do not pass go
        if(experiment.test_winner) 
        {
          if(experiment.test_type == 'full_page' && (experiment.full_page_default_page == btab_vars.post_id)) // if full p and the p is this page
          {
            if(experiment.test_winner !== btab_vars.post_id) // if its not the current page
            {
              if(experiment.page_variations[experiment.test_winner] == undefined) // if its not defined
              {
                console.log('split test winner is not found, not redirecting');
                return false; // skip
              }

              console.log('Split Test winner is page redirect. Redirecting to '+ experiment.page_variations[experiment.test_winner]);
              //only do it if its defined
                window.location.replace( abRedirectUrl(experiment.page_variations[experiment.test_winner]));

              return false;
            }
            else // it is the current page so show it
            {
              console.log('Test winner is current page. Showing '+ experiment.test_winner);
              jQuery("body").addClass('abst-show-page');
              return false; // skip 2 next experiment
            }

          }
          else if(experiment.test_type == 'css_test')
          {
            console.log('Split Test CSS winner. Showing '+ experiment.test_winner);
            jQuery('body').addClass(experiment.test_winner);
          } // text test winner todo
          else // on page test
          {
            console.log('Split Test winner is on this page. Showing '+ experiment.test_winner);
            jQuery('*[bt-eid=\"'+experimentId+'\"][bt-variation=\"'+experiment.test_winner+'\"]').addClass('bt-show-variation'); //maybe not necessary anymore now we have CSS?
            //show variation
          }
          return true;
          //skip this experiment
        }
        
        if(experiment.test_type == "css_test")
        {
          for (var i = 0; i < experiment.css_test_variations; i++) {
            // Code to be executed for each element
            jQuery('body').append('<script class="bt-css-scripts" bt-variation="test-css-'+experimentId+'-'+ (i+1)+ '" bt-eid="'+experimentId+'"/>');
          }
        }

        //full page test handler
        if(experiment.test_type == 'full_page' && experiment.full_page_default_page == btab_vars.post_id)
        {
          //add original do nothing variation
          jQuery('body').append('<div class="bt-redirect-handle" style="display: none !important" bt-variation="'+experiment.full_page_default_page+'" bt-eid="'+experimentId+'"></div>');
          //foreach variation
          jQuery.each(experiment.page_variations,function(varId,variation){
            jQuery('body').append('<div class="bt-redirect-handle" style="display: none !important" bt-variation="'+varId+'" bt-eid="'+experimentId+'" bt-url="'+variation+'"></div>');
          });
        }

        
        //add conversion click handlers
        if(experiment.conversion_page == 'selector')
        {
          if(experiment.conversion_selector != '')
          {
            var conversionSelector = experiment.conversion_selector;
            abClickListener(experimentId,conversionSelector, 0);
          }
        }


        // if experiment goals exists
          //loop through
          for (var i = 1; i < Object.keys(experiment['goals']).length; i++) {
            // if experiment.goals[i] key is click
            //get key name for goal
            const firstKey = Object.keys(experiment['goals'][i])[0];
          

            // click selector
            if(firstKey === 'selector')
            {
              abClickListener(experimentId,experiment['goals'][i]['selector'], i);
            }

            // text subgoall
            startInverval = false;
            if(firstKey === 'text')
            {
              startInverval = true;
    
              convstatus = abstGetCookie('btab_'+experimentId); 
              if(startInverval && convstatus) // if test exists and not false
              {
                convstatus = JSON.parse(convstatus);
                if (convstatus && convstatus['goals'] && convstatus['goals'][i] == 1)
                  startInverval = false;
              }
    
              if(experiment['goals'][i]['text'] == '')
                startInverval = false;
    
              //if text exists and not complete
              if(startInverval)
              {
                startTextWatcher(experimentId,experiment['goals'][i]['text'],i);
              }
            }

            if(firstKey === 'page')
            {
              var goalPage = experiment['goals'][i]['page'];

              if(goalPage == btab_vars.post_id){
                abstGoal(experimentId,i);
              }
            }

            if(firstKey === 'url')
            {
              page_url = window.location.href.replace(window.location.origin,'');
              if (page_url.charAt(0) == "/") page_url = page_url.substr(1);
              if (page_url.charAt(page_url.length - 1) == "/") page_url = page_url.substr(0, page_url.length - 1);

              goal_url = experiment['goals'][i]['url'].replace(window.location.origin,'');
              if (goal_url.charAt(0) == "/") goal_url = goal_url.substr(1);
              if (goal_url.charAt(goal_url.length - 1) == "/") goal_url = goal_url.substr(0, goal_url.length - 1);

              if(page_url == goal_url){
                abstGoal(experimentId,i);
                }

            }
            
          }
        
        

        //text conversion
        if(experiment.conversion_page == 'text')
        {
          startInverval = true;
          if(!bt_experiments[experimentId])
            startInverval = false; // not if not defined

          convstatus = abstGetCookie('btab_'+experimentId); 
          if(startInverval && convstatus) // if test exists and not false
          {
            convstatus = JSON.parse(convstatus);
            if(convstatus.conversion == 1) // if its converted
              startInverval = false;
          }

          if(experiment.conversion_text == '')
            startInverval = false;

          //if text exists and not complete
          if(startInverval)
          {
            startTextWatcher(experimentId,experiment.conversion_text);
          }
        }

        //text subgoals




        if(experiment.conversion_page == 'surecart-order-paid' && window.scData  ) // if surecart is slected and surecart js is detected
        {
          document.addEventListener('scOrderPaid', function(e) { // add listener
            console.log('surecart OrderPaid');
            const checkout = e.detail;
            if( checkout && checkout.amount_due ) {
              if( experiment.use_order_value == true)
                  window.abst.abConversionValue = checkout.amount_due; // set value
              abstConvert(experimentId, window.abst.abConversionValue);
            }
          });   
      }


        if( experiment.conversion_page == 'fingerprint' && !localStorage.getItem("ab-uuid") ) { 
          console.log("ab-uuid: set fingerprint");
          setAbFingerprint();
        } 
      
    });


      var experiments_el = jQuery('[bt-eid]:not([bt-eid=""])[bt-variation]:not([bt-variation=""])');
      var current_exp = {};
      var exp_redirect = {};

      experiments_el.each(function(e) {
        var me = jQuery(this),
            experimentId = me.attr('bt-eid'),
            variation = me.attr('bt-variation'),
            redirect_url = me.attr('bt-url');

        if( current_exp[experimentId] === undefined ) {
           current_exp[experimentId] = [];
          exp_redirect[experimentId] = [];
        }        
        if (!current_exp[experimentId].includes(variation)) {
          current_exp[experimentId].push(variation);
          exp_redirect[experimentId][variation] = redirect_url;
        }
      
      });

      // add css tests to current exp
      jQuery.each(bt_experiments, function(experimentId, value) {
        // Code to be executed for each element
        if(bt_experiments[experimentId]['test_type'] == 'css_test')
        {
          current_exp[experimentId] = []; // create
          exp_redirect[experimentId] = [];

          for (var i = 1; i <= parseInt(bt_experiments[experimentId]['css_test_variations']); i++) {
            current_exp[experimentId].push('test-css-'+experimentId+'-'+i);
            exp_redirect[experimentId]['test-css-'+experimentId+'-'+i] = '';
          }
        }
      });
     
      jQuery.each(current_exp, function(experimentId, variations) {
        //check it exists
        if( bt_experiments[experimentId] === undefined ) {
          console.log("ABST: " +'Test ID '+ experimentId +' does not exist.');
          showSkippedVisitorDefault(experimentId); 
          return true; // continue to next exp
        }

        // if there is a winner for the test, then do no more - its already done above
        if( bt_experiments[experimentId].test_winner) 
          return true; // continue to next exp

        //if cookie consent isnt done, then show default
        if ('BorlabsCookie' in window)
        {
          // borlabs v2
          if (typeof window.BorlabsCookie.checkCookieConsent === 'function' &&
              !window.BorlabsCookie.checkCookieConsent('split-test') &&
              !window.BorlabsCookie.checkCookieConsent('ab-split-test'))
            {
              console.log('Borlabs cookie consent prevented a split test from running');
              showSkippedVisitorDefault(experimentId);
              return true; // continue to next exp
            }
          //borlabs v3
          if(typeof window.BorlabsCookie.Consents.hasConsent === 'function')
          {
            if(!window.BorlabsCookie.Consents.hasConsent('split-test') && !window.BorlabsCookie.Consents.hasConsent('ab-split-test') )
            {
              console.log('Borlabs v3 cookie consent prevented a split test from running');
              showSkippedVisitorDefault(experimentId);
              return true; // continue to next exp
            }
          }
        }


          
        if( bt_experiments[experimentId]['is_current_user_track'] == false ) {
          showSkippedVisitorDefault(experimentId);
          return true; // continue to next exp
        }

        // if the test is not published
        if( bt_experiments[experimentId]['test_status'] !== 'publish' ) {
          showSkippedVisitorDefault(experimentId);
          return true; // continue to next exp
        }

        var targetVisitor = true;

        var btab = abstGetCookie('btab_'+ experimentId);
        
        var experimentVariation = '';

        if( !btab ) // no existing data, create
        {
          if(bt_experiments[experimentId]['test_type'] == 'css_test'){
            var randVar = getRandomInt(1, parseInt(bt_experiments[experimentId]['css_test_variations'])) - 1;    
          }
          else
            var randVar = getRandomInt(1, variations.length) - 1;   
          
          if(btab_vars.is_free && variations.length > 2){
            var randVar = getRandomInt(0, 1);  //limit to 2
            console.log('Free version of AB Split Test is limited to 1 variation. Your others will not be shown. Upgrade: https://absplittest.com/pricing?ref=ug');
          }

          experimentVariation = variations[randVar];  
        } 
        else //parse existing data
        { 
          
          try {
            var btab_cookie = JSON.parse(btab);
            experimentVariation = btab_cookie.variation;
          } catch (err) {
            console.log('Error parsing cookie data:', err);
          }

        }
 
        var variation_element = false;
        if(bt_experiments[experimentId]['test_type'] == 'css_test') 
        {
          jQuery('body').addClass(experimentVariation); 
        }
        else // on page tests
        {   
          variation_element = jQuery('*[bt-eid=\"'+experimentId+'\"][bt-variation=\"'+experimentVariation+'\"]'); 
        } 

        if( btab ){
            btab = JSON.parse( btab );
            var redirect_url = exp_redirect[experimentId][experimentVariation];
            if( redirect_url && !btab_vars.is_preview ) {
              window.location.replace(  abRedirectUrl( redirect_url) );
            }
            else
            {
              abstShowPage(); // full page
              if(variation_element)     
                variation_element.addClass('bt-show-variation');  // on page
            }
            return true; // continue to next exp
        }

        if( !btab ) { // new user, check tartgeting

          var targetPercentage = bt_experiments[experimentId].target_percentage;
          
          if(targetPercentage == '')
            targetPercentage = 100;
          
          var url_query = bt_experiments[experimentId].url_query;
          urlQueryResult = null;
          
          //we've got a url query
          if(url_query !== '')
          {
            
            var exploded_query = url_query.trim().split("=");
            if(exploded_query.length == 1) // just the query key
            {
              targetVisitor = bt_getQueryVariable(exploded_query[0]);
            }
            else if(exploded_query.length == 2) //query key and value
            {
              urlQueryResult = bt_getQueryVariable(exploded_query[0]);
              targetVisitor = exploded_query[1] == urlQueryResult;
            }
          }
          
          var target_option_device_size = bt_experiments[experimentId].target_option_device_size;

          if(targetVisitor && target_option_device_size != 'all')
          {
            var device_size = jQuery(window).width();
            if(device_size > 767)
              device_size = 'desktop';
            else if(device_size > 479)
              device_size = 'tablet';
            else
              device_size = 'mobile';

            targetVisitor = target_option_device_size.includes(device_size);

          }


          if(!targetVisitor)
          {
            showSkippedVisitorDefault(experimentId);
            return true;  // continue to next exp
          }
          // randomly target users according to percentage
          var percentage = getRandomInt(1,100);
          if(targetPercentage < percentage)
          {        
            showSkippedVisitorDefault(experimentId,true);
            console.log('ABST ' + experimentId+' skipped not in percentage target');
            return true;  // continue to next exp
          } 

          // no experiment cookie set, calculate and create        
          bt_experiments[experimentId].variations = bt_get_variations(experimentId);
        } 

        if(variation_element && !variation_element.length) 
        {
          showSkippedVisitorDefault(experimentId);
          console.log('ABST variation doesnt exist, or doesnt match');
          return true;  // continue to next exp
        }

        if (Object.keys(exp_redirect).length > 0)
        {
          redirect_url = exp_redirect[experimentId];
          redirect_url = redirect_url[experimentVariation];
        }
        else
          redirect_url = '';

        // if its css, add it to body   
        if(variation_element)     
          variation_element.addClass('bt-show-variation'); 
        bt_experiment_w(experimentId,experimentVariation,'visit', redirect_url);
      });
    }

    // warn users on localhost
    if(btIsLocalhost())
      console.info("AB Split Test: It looks like you're on a localhost, using local storage instead of cookies. External Conversion Pixels will not work on Local web servers.");

    window.dispatchEvent(new Event('resize')); // trigger a window resize event. Useful for sliders etc. that dynamically resize
    jQuery('body').trigger('ab-test-setup-complete'); // the end of the ab testing. do other things if you like with   jQuery('body').bind('ab-test-setup-complete', function() {    //do what you want! });

});

function startTextWatcher(experimentId,word,goalId = null){
 
  if(!goalId)
    goalId = 0;

  if (typeof abst.intervals[experimentId] === 'undefined') {
    abst.intervals[experimentId] = {};
  }

  window.abst.intervals[experimentId][goalId] = setInterval(function () {
    let found = false;
  
    // Search within the main page more efficiently
    jQuery("body").find(":contains('" + word + "')").each(function () {
      if (jQuery(this).text().indexOf(word) >= 0 && jQuery(this).is(":visible")) {
        found = true;
        return false; // Break the loop
      }
    });
  
    if (!found) {
      jQuery("iframe").each(function () {
        try {
          var iframeBody = jQuery(this).contents().find("body");
          found = iframeBody.find(":contains('" + word + "')").filter(function () {
            return jQuery(this).text().indexOf(word) >= 0 && jQuery(this).is(":visible");
          }).length > 0;
  
          if (found){
            console.log('ABST: ' + experimentId + ' ' + word);
            return false; // Break the loop
          } 
        } catch (error) {
          //console.error("Error accessing iframe contents:", error);
        }
      });
    }
  
      if(found){
        if(goalId == 0)
        {
          abstConvert(experimentId);
        }
        else
        {  
          abstGoal(experimentId,goalId);
        }
        clearInterval(window.abst.intervals[experimentId][goalId]); // Stop the interval after finding the word
      }
    }, 1000);
  }
  

  function abstConvert(testId = '',orderValue = 1){
    console.log('abstConvert',testId,orderValue);
    if(testId !== '')
    {
      var btab = abstGetCookie('btab_'+ testId);
       if(btab)
       {
          btab = JSON.parse(btab);
          if(btab.conversion == 0)
          {
            bt_experiment_w(testId,btab.variation,'conversion',false,orderValue);
            btab.conversion = 1;
            experiment_vars = JSON.stringify(btab);
            abstSetCookie('btab_'+ testId, experiment_vars, 1000);   
            if(abst.intervals[testId]){
              clearInterval(abst.intervals[testId]);
            }
          }
          else
          {
            console.log("ABST: " +bt_experiments[testId].name + ': Visitor has already converted');
          }
       }
       else
       {
        if(!bt_experiments[testId])
          console.log("ABST: " +'Test ID not found or test not active');
       }
    }
  }

  function abstGoal(testId = '',goal = ''){
    //    console.log('start abstGoal',testId,goal);
    if(testId !== '' && goal !== '')
    {
      var btab = abstGetCookie('btab_'+ testId);
       if(btab)
       {
          btab = JSON.parse(btab);
          //console.log('btab',btab);
          if(btab.conversion !== 1) // no goals after conversion
          {
            if(Array.isArray(btab.goals))
            {
              //if its not in the goal
              if(btab.goals[goal] !== 0)
              {
                btab.goals[goal] = 1; 
                bt_experiment_w(testId,btab.variation,goal,false,1);
              }
              
              experiment_vars = JSON.stringify(btab);
              abstSetCookie('btab_'+ testId, experiment_vars, 1000);
              if(abst.intervals[testId+""+goal])
              {
                clearInterval(abst.intervals[testId+""+goal]);
              }
            }
            else
            {
              console.log("ABST: " +bt_experiments[testId].name + ': Visitor has already goaled');
            }
          } 
          //else
            //console.log('no goals after conversion');
       }
       else
       {
        if(!bt_experiments[testId])
          console.log("ABST: " +'Test ID not found or test not active');
       }
    }
  }
    
function showSkippedVisitorDefault(eid,createCookie = false){
  
  if(!window.bt_experiments[eid]){ // if no experiment, show first variations
    
      btv = jQuery('*[bt-eid=\"'+eid+'\"]').first().attr('bt-variation');
      jQuery('*[bt-eid=\"'+eid+'\"][bt-variation=\"'+btv+'\"]').addClass('bt-show-variation');
      return true;
  }

  if(bt_experiments[eid].test_winner !== ''){ // if we have a winner

    if(bt_experiments[eid].test_type =="full_page") // full page winner
    {
      url = bt_experiments[eid].page_variations[bt_experiments[eid].test_winner];
      if(url !== undefined)
      {
        window.location.replace( abRedirectUrl(url) ); // follow the link w search params
        return true;
      }
      else
      {
        console.log("ABST: " +'Full page test complete without matching page winner. Showing current page.');
      }
      abstShowPage();
    }

    if(bt_experiments[eid].test_type == "css_test") // css winner
    {
      console.log('css test winner, showing ver ' + bt_experiments[eid]['test_winner']);
      jQuery("body").addClass('test-css-'+eid+'-'+bt_experiments[eid]['test_winner']); // add winning class
      return true; // next
    }
  }

  if(bt_experiments[eid].test_type == "full_page")
  {
    abstShowPage();
    if(createCookie)
      skippedCookie(eid,bt_experiments[eid].full_page_default_page);

    return true; // next
  }

  if(bt_experiments[eid].test_type == "css_test") // css version 1
  {
    jQuery("body").addClass('test-css-'+eid+'-1'); // add 1 class
    if(createCookie)
      skippedCookie(eid,'test-css-'+eid+'-1');
    return true; // next
  }
  
  //on page tests only from here
  
  if(!eid)
    return;
  var foundSpecial = false;
  jQuery('*[bt-eid=\"'+eid+'\"]').each(function(index, element){
    var variationName = jQuery(element).attr('bt-variation').toLowerCase();
    var defaultNames = ["original","one","1","default","standard","a","control"];
    if(defaultNames.includes(variationName))
    {
      btv = variationName;
      jQuery(element).addClass('bt-show-variation'); // show the matched element
      foundSpecial = true;
    }
  });
    if(!foundSpecial){
      btv = jQuery('*[bt-eid=\"'+eid+'\"]').first().attr('bt-variation');
      jQuery('*[bt-eid=\"'+eid+'\"][bt-variation=\"'+btv+'\"]').addClass('bt-show-variation');
  }

  if(createCookie)
    skippedCookie(eid,btv);
 
}
function skippedCookie(eid,btv){
    var experiment_vars = {
      eid: eid,
      variation: btv,
      conversion: 1,
      skipped:1
    };
    experiment_vars = JSON.stringify(experiment_vars);
    abstSetCookie('btab_'+ eid, experiment_vars, 1000);
    return true;
}

//takes input slug or url and ends url suitable for window/replace
function abRedirectUrl(url){

  url = url + window.location.search + window.location.hash;
  // if it starts with http/s dop nothing
  if(url.startsWith('http') || url.startsWith('/'))
    return url;
  else
    return '/' + url;
  
}

function abstOneSecond(){
  if(Object.keys(window.abst.timer).length > 0)
  {
    Object.entries(window.abst.timer).forEach(([ index,item]) => {
      if(window.abst.timer[index] > -1) // dont decrease below -1
        window.abst.timer[index] = window.abst.timer[index] - 1;

      if(window.abst.timer[index] == 0){  // convert if its counted down, only fired once

        //console.log('time active converting ' + index);
        //index could be goal-eid-goalid
        if(index.includes('goal-'))
        {
          var parts = index.split('-');
          abstGoal(parts[1],parts[2]);
        }
        else
          abstConvert(index);
      
      }
    });

    // update localstorage
    localStorage.absttimer = JSON.stringify(window.abst.timer); // localstorage need strings
  }
}



function userActiveNow(){
  window.abst.currscroll = window.scrollY; // update last known scroll n mouse
  window.abst.abactive = true; // we active
  clearTimeout(window.abst.timeoutTimer); // delete the old timout
  window.abst.timeoutTimer = setTimeout(abstActiveTimeout, window.abst.timeoutTime); // create new timeout
}

function abstActiveTimeout(){
  window.abst.abactive = false;
}


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function abstSetCookie(c_name, value, exdays) {
    if(btIsLocalhost())
      return btSetLocal(c_name,value);

    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = escape(value) + ((exdays == null) ? '' : ';path=/; expires=' + exdate.toUTCString()) + "; SameSite=None; Secure";

    document.cookie = c_name + '=' + c_value;
}
function deleteCookie(c_name) {
      if(btIsLocalhost())
        return btDeleteLocal(c_name);

    document.cookie = c_name+"= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
}

function abstGetCookie(c_name) {
    if(btIsLocalhost())
      return btGetLocal(c_name);

    var i, x, y, ARRcookies = document.cookie.split(';');
    for (i = 0; i < ARRcookies.length; i++) {
        x = ARRcookies[i].substr(0, ARRcookies[i].indexOf('='));
        y = ARRcookies[i].substr(ARRcookies[i].indexOf('=') + 1);
        x = x.replace(/^\s+|\s+$/g, '');
        if (x == c_name) {
            return unescape(y);
        }
    }
}

function abstShowPage(){
  jQuery("body").addClass('abst-show-page');
  jQuery("body",parent.window.document).addClass('abst-show-page'); // bb iframe UI
}

function btSetLocal(c_name,value){
    localStorage.setItem(c_name, value);
}

function btGetLocal(c_name){
  return localStorage.getItem(c_name);
}

function btDeleteLocal(c_name){
  localStorage.removeItem(c_name);
}

function btIsLocalhost(){
  return (location.hostname === "localhost" || location.hostname === "127.0.0.1"|| location.hostname.endsWith(".local")|| location.hostname.endsWith(".test"));
}

function bt_get_variations(eid){
  
  variation = [];
  jQuery('[bt-eid=' + eid + ']').each(function (index, val) {
    var newVariation = jQuery(this).attr('bt-variation');
    
    // Check if the variation already exists in the array
    if (variation.indexOf(newVariation) === -1) {
      variation.push(newVariation);
    }
  });

  if(btab_vars.is_free)
  {
    //only return first 2 variations
    variation = variation.slice(0,2);
  }

  return variation;
}

function bt_experiment_w(eid,variation,type, url,orderValue=1){

  // dont log it if its a skipper or malformed
  if(variation == '_bt_skip_' || btab_vars.is_preview || !eid || !variation)
  {
    return true;
  }
  // if its a full page redirect, set cookie then redirect then log visit
  if(type == 'visit' && url){
    var nextPageVisitData = {
      eid: eid,
      variation: variation,
      type: type,
      url: url,
      orderValue:orderValue
    };
    abstSetCookie('ab-set-visit',JSON.stringify(nextPageVisitData),1000);
    window.location.replace(  abRedirectUrl(url));
    return true;
  }

  // if its a fingerprinter and we dont have a uuid, then wait for it
  if(bt_experiments[eid].conversion_page == 'fingerprint' && !localStorage.getItem('ab-uuid'))
  {
    console.log("bt_exp_w: waiting for fingerprint");
    setTimeout(bt_experiment_w, 500, eid, variation, type, url,orderValue);
    return true; //back in 500ms
  }
  
  // on page tests and full page final pages only from here... 

  var data = {
    'action': 'bt_experiment_w',
    'eid'  : eid,   
    'variation'  : variation,   
    'type'  : type,
    'location' : btab_vars.post_id,
    'orderValue': orderValue
  };

  btab_track_event(data); // analytics tagger

  var experiment_vars = {
    eid: eid,
    variation: variation,
    conversion: 0,
    goals:[],
  };

  // set up time watchers
  if( type == 'visit' && bt_experiments[eid]['conversion_page'] == 'time')
  { 
    window.abst.timer[eid] = bt_experiments[eid]['conversion_time'];
  } 
  //goal time watcher
  if( type == 'visit')
  {
   // console.log(bt_experiments[eid]['goals']);
    //foreach goals
    jQuery.each(bt_experiments[eid]['goals'], function(key, value) {
      // if valuee.time is set
      if(value['time'] > 0)
      {
        window.abst.timer["goal-"+eid + "-"+key] = value['time'];
      }
    });

  }

  // set up conversion
  if( type == 'conversion' ) 
    experiment_vars.conversion = 1;
  else if ( type == 'visit' )
  {
    // not conversion or goal
  }
  else // goal
  {
    experiment_vars.goals[type] = 1; // add to goals list
  }


  //add uuid if necessary
  if( bt_experiments[eid]['conversion_page'] == 'fingerprint' )
    
    data.uuid = localStorage.getItem('ab-uuid');

  experiment_vars = JSON.stringify(experiment_vars);
  abstSetCookie('btab_'+ eid, experiment_vars, 1000);      
  //show the page if its not a redirect or external
  if(url !== "ex" && !url)
  {
    abstShowPage(); // show the page
  }

  //send it to WP to log
  // use beacon the data 
  navigator.sendBeacon(bt_ajaxurl+"?action=bt_experiment_w&method=beacon",JSON.stringify(data)); // send the data
  return true;
}

async function btab_track_event(data){

  //create javascript event with data 
  jQuery('body').trigger('abst_event', [data]);
  
  if(btab_vars.tagging == '0'){
    //console.log('event tagging turned off');
    return false;
  }

  window.abeventstarted = new Date().getTime(); // give up sending events after 5 seconds
  //set up vals
  var trackName = bt_experiments[data.eid].name;
  if(trackName == '')
    trackName = data.eid;
  
  var trackCat = data.type;
  var trackValue = data.variation;
  
  //google analytics 4 for all
  window.abst.abga4 = setInterval(function(){ 
    if(typeof gtag === "function"){  // if using gtag
      gtag('event',  'ab_split_test', {  //custom event
        'test_name': trackName,
        'test_variation': trackValue,
        'test_event': trackCat 
      });
      clearInterval(window.abst.abga4); 
      return; 
    } 
    
    if(window.dataLayer && typeof window.dataLayer.push === "function"){  // if using GTM
  
      window.dataLayer.push({
        'event': 'ab_split_test',
        'test_name': trackName,
        'test_variation': trackValue,
        'test_event': trackCat 
        });
        clearInterval(window.abst.abga4); 
      } 

    if(new Date().getTime() - window.abeventstarted > 5000)//quit after 5s 
    clearInterval(window.abst.abga4); 
  },499); 

  
  
  if(btab_vars.is_agency == '1') //agency only after here
  {
    trackName = "AB Test: " + trackName;
    window.abst = window.abst || {};
    window.abst.abconvertpartner = window.abst.abconvertpartner || {};
    window.abst.abconvertpartner.abawp = false;
    window.abst.abconvertpartner.clarity = false;
    window.abst.abconvertpartner.gai = false;
    window.abst.abconvertpartner.abmix = false;
    window.abst.abconvertpartner.abumav = false;
    window.abst.abconvertpartner.umami = false;
    window.abst.abconvertpartner.cabin = false;
    window.abst.abconvertpartner.plausible = false;
    window.abst.abconvertpartner.fathom = false;

    //tag matomo
    var _paq = window._paq = window._paq || [];
    _paq.push(['trackEvent', trackName, trackCat, trackValue]);

    window.abst.abconvertpartner.timer = setInterval(function(){
      if(!window.abst.abconvertpartner.clarity)
        if(typeof clarity === "function"){
            window.abst.abconvertpartner.clarity = true;
            clarity("set", trackName + "-" + trackCat, trackValue);
        }

      if(!window.abst.abconvertpartner.abawp)
        if(window.AnalyticsWP){
          window.abst.abconvertpartner.abawp = true;
          AnalyticsWP.event('Split Test ' + trackCat + ' ' + bt_experiments[data.eid].name, trackValue);
        }

      if(!window.abst.abconvertpartner.gai)
        if(typeof ga === "function"){
          tracker = ga.getAll()[0];
          if (tracker)
          {
              tracker.send("event", trackName, trackCat, trackValue,{nonInteraction: true}); // send non interactive event to GA
              window.abst.abconvertpartner.gai = true;
          }
        }

      if(!window.abst.abconvertpartner.fathom)
        if(window.fathom){
          console.log('fathom trackEvent', trackName + ", " + trackValue + ": " + trackCat); 
          window.abst.abconvertpartner.fathom = true;
          window.fathom.trackEvent(trackName + ", " + trackValue + ": " + trackCat);
        }

      if(!window.abst.abconvertpartner.abmix)
        if(typeof mixpanel == "object"){
          mixpanel.track(trackName, {'type': trackCat,'variation':trackValue}, {send_immediately: true});
          window.abst.abconvertpartner.abmix = true;
        }

      if(!window.abst.abconvertpartner.abumav)
        if(typeof usermaven === "function"){
          window.abst.abconvertpartner.abumav = true;
          usermaven("track", trackName, {
            type: trackCat,
            variation: trackValue
          });
        }

      if(!window.abst.abconvertpartner.umami)
        if(window.umami){
          window.abst.abconvertpartner.umami = true;
          umami.track(bt_experiments[data.eid].name, {
            type: trackCat,
            variation: trackValue
          });
          }
 
      if(!window.abst.abconvertpartner.cabin)
        if(window.cabin){
          window.abst.abconvertpartner.cabin = true;
          cabin.event(bt_experiments[data.eid].name + ' | ' + trackCat + ' | ' + trackValue);
        }

      if(!window.abst.abconvertpartner.plausible)
        if(window.plausible){
          window.abst.abconvertpartner.plausible = true;
          plausible(bt_experiments[data.eid].name, {props: {testEvent: trackCat, variation: trackValue}});
        }

      if(new Date().getTime() - window.abeventstarted > 5000) //quit after 5s
        clearInterval(window.abst.abconvertpartner.timer);
    },500);
   
  
  } // end agency tracking

}

// check for a full page tes tvisit cookie
function next_page_visit_report(){
    //if is set cookie npv
  var setvisit = abstGetCookie('ab-set-visit');
  if(setvisit)
  {
    //if urls' match?
    try {
      setvisit = JSON.parse(setvisit);
      bt_experiment_w(setvisit.eid, setvisit.variation,setvisit.type,false);
    } catch (err) {
//      console.log('Error parsing cookie data:', err);
    }

    abstSetCookie('ab-set-visit',false,1000);
  }
}

function bt_getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if(pair[0] == variable){
      if(pair[1] == null)
        return true;
      return pair[1];
    }
  }
  return(false);
}

if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(search, this_len) {
    if (this_len === undefined || this_len > this.length) {
      this_len = this.length;
    }
    return this.substring(this_len - search.length, this_len) === search;
  };
}



//function to find and replace strings uin document, including strings with formatting like strong em, etc
function bt_replace_all(find, replace, location = 'body') {
  // Get the element by the provided location
  const element = document.querySelector(location);
  
  // Function to recursively replace text
  function replaceText(node) {
      if (node.nodeType === Node.TEXT_NODE) { // Check if it's a text node
          // Replace text, preserving HTML entities by decoding and encoding
          let text = node.textContent;
          let div = document.createElement('div');
          div.innerHTML = text.replace(new RegExp(find, 'gi'), replace);
          node.textContent = div.textContent || div.innerText || "";
      } else {
          // Otherwise, handle all its children nodes
          node.childNodes.forEach(replaceText);
      }
  }

  // Start the text replacement process from the chosen element
  replaceText(element);
}

// Usage example:
//bt_replace_all('find text', 'replace text');

function bt_replace_all_html(find, replace, location = 'body') {
  // Get the element by the provided location
  const element = document.querySelector(location);
  
  // Function to recursively replace HTML
  function replaceHTML(node) {
      if (node.nodeType === Node.ELEMENT_NODE) { // Check if it's an element node
          // Replace HTML, preserving the node structure
          node.innerHTML = node.innerHTML.split(find).join(replace);
      } else {
          // Otherwise, handle all its children nodes
          node.childNodes.forEach(replaceHTML);
      }
  }

  // Start the HTML replacement process from the chosen element
  replaceHTML(element);
}

function abClickListener(experimentId,conversionSelector, goalId = 0) {
  var testCookie = abstGetCookie('btab_'+experimentId);
  if(testCookie)
  {
    testCookie = JSON.parse(testCookie);
    if(goalId == 0)
    {
      if(testCookie.conversion == 1)
      {
        //console.log('abClickListener: already converted');
        return;
      }
    }
    else // issa goal
    {
      if(testCookie.goals[goalId] == 1)
      {
        //console.log('abClickListener: goal already converted');
        return;
      }      
    }
  }
  var eventType = 'click'; // Default event type
  // If a pipe symbol exists, split it into the conversion selector and the event type
  if(conversionSelector.indexOf('|') !== -1) {
      var conversionParts = conversionSelector.split('|');  
      // Check if there are at least two conversionParts
      if(conversionParts.length >= 2) {
          conversionSelector = conversionParts[0]; // First part is the conversion selector
          eventType = conversionParts[1]; // Second part is the event type
      }
  }

  try {
    document.addEventListener(eventType, function(event) {
      var target = event.target;
      while (target && target !== document) {
        if (target.matches(conversionSelector)) {
          //console.log(eventType + ' conversion on ' + conversionSelector + ' type ' + goalId);
          if(goalId > 0)
            abstGoal(experimentId,goalId);
          else
            abstConvert(experimentId);
          break;
        }
        target = target.parentNode;
      }
    }, true);
  } catch(error) {
    console.info('ABST: Invalid conversion selector:' +  conversionSelector + ' ' + error + ' ' + goalId); 
  }
  var iframes = document.querySelectorAll('iframe');
  iframes.forEach(function(iframe) {
  try {
    var iframeDoc = iframe.contentWindow.document;
    iframeDoc.addEventListener(eventType, function(event) {
      if (event.target.matches(conversionSelector)) {
        console.log(eventType + ' IFRAME conversion on ' + conversionSelector);
        abstConvert(experimentId);
      }
    }, true);
  } catch (error) {
    //console.info('Error accessing cross-origin iframe:', error); // CORS issue, the iframe is not in the same origin and does not allow cross origin access.
  }
  });
}


async function setAbFingerprint() {
  if(!localStorage.getItem("ab-uuid"))
    try {
      const module = await import(window.bt_pluginurl + "/js/ab-fingerprint.js");
      const fp = await ThumbmarkJS.getFingerprint();
      localStorage.setItem("ab-uuid", fp);
      console.log("set Fingerprint: " + fp);
    } catch (error) {

      console.error("Error setting fingerprint:", error);
    }
  else
    console.log("ab-uuid: already set: " + localStorage.getItem("ab-uuid"));
}