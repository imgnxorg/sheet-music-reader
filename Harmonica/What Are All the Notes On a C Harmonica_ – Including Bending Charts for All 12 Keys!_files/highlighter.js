
var ab_highlight_timer;
function bt_highlight(selector){

    var elem;
    if(jQuery("#elementor-preview-iframe").length)
    {
      elem = jQuery("#elementor-preview-iframe").contents().find(selector);
      jQuery("#elementor-preview-iframe").contents().find('.ab-highlight').removeClass('ab-highlight');
    }
    else
    {
      elem = jQuery(selector);
      jQuery('.ab-highlight').removeClass('ab-highlight');
    }

    elem.addClass("ab-highlight");
    ab_highlight_timer = setTimeout(function(){
        elem.removeClass('ab-highlight');
    },2000);
}


jQuery(function(){

// add ai button to pages sao far gb and BB toolbars, need to do the rest
//  jQuery('.edit-post-header-toolbar__left, .fl-builder-bar-actions').append('<button><STRONG>AI</strong></button>')


  if ( self !== top ) // if inside an iframe, then its a preview and we dont want to do things.
    return;

  jQuery('body').on('change blur','[name="bt_click_conversion_selector"], .bt_click_conversion_selector input, [data-setting="bt_click_conversion_selector"]',function(){      
    bt_highlight(jQuery(this).val());
  });




});

function update_experiments(){

   jQuery.ajax({
    url: bt_ajaxurl,
    type : 'get',
    data : {
        action : 'all_experiments'
    },
    success: function( response ) {
        console.log(response);
    }
 });


}




// AI AI AI AI AI AI AI AI AI AI AI AI AI AI AI AI AI AI AI AI 
// AI AI AI AI AI AI AI AI AI AI AI AI AI AI AI AI AI AI AI AI 
// AI AI AI AI AI AI AI AI AI AI AI AI AI AI AI AI AI AI AI AI 


//get openapi api key
 // if api then 
  // ADD BUTTON

// on click display modal

// modal copntains 'what do you want to rewrite'
// 'what is the goal' 
// current page content is context
// generate button

// on click, send to open ai and then display 3 responses
// maybe give option for 3 more
// button next to each option to copy text

function abai(){
    jQuery.magnificPopup.open({
        items: {
            src: '#ab-ai-form', // can be a HTML string, jQuery object, or CSS selector
            type: 'inline'
        }
    });
}


/*



*/
jQuery(function(){

    jQuery('body',parent.window.document).on('click','#ab-ai, #wp-admin-bar-ab-ai, .ab-ai-launch',function(){
        abai();
    });

    jQuery('body').on('click','.ai-option',function(){
        var theText = jQuery(this).text();
        copyText(theText);
    });

    jQuery('#ab-rewrite-form').submit(function(event) {
        event.preventDefault();

        //display loading screen
        jQuery("#result .ai-responses").html('<p>'+loadingMessage()+' may take up to 30 seconds...</p>');
        jQuery('#result').fadeIn();
        jQuery('.ai-loading').show();

        //send request
        callOpenAI('suggestions','#result .ai-responses');
        
    });
    

    jQuery('input[type=radio][name=abaitype]').change(function() {
        jQuery("#result .ai-responses").text('submit to see response.');
        jQuery("#ab-ai-submit").show();
        if (this.value == 'suggestions') {
            jQuery('#suggestions-div').show();
            jQuery('#rewrite-div').hide();
        }
        else if (this.value == 'rewrite') {
            jQuery('#suggestions-div').hide();
            jQuery('#rewrite-div').show();
        }
    });

    // add to builders
    setTimeout(function(){ // improve this

        // bb
        jQuery( '.fl-builder-bar-actions', parent.window.document ).append( '<button class="ab-ai-launch fl-builder-button"> AI </button>' );
        
        //  gb
        jQuery('.edit-post-header-toolbar__left').append('<button type="button" data-toolbar-item="true" aria-disabled="false" class="components-button ab-ai-launch has-icon" aria-label="Launch AI"><svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="15" height="15" viewBox="0 0 24 24"><path d="M 17 2 A 2 2 0 0 0 15 4 A 2 2 0 0 0 16 5.7285156 L 16 7 L 13 7 L 13 5 L 13.001953 3.5546875 A 1.0001 1.0001 0 0 0 12.503906 2.6894531 C 11.787176 2.2732724 10.988534 2.0496274 10.183594 2.0175781 C 9.91528 2.006895 9.6455955 2.0167036 9.3789062 2.0488281 C 8.31215 2.1773261 7.2814338 2.6482536 6.4648438 3.4648438 C 6.1441089 3.7855785 5.8954006 4.1406575 5.6992188 4.515625 L 5.6699219 4.5 C 5.0630052 5.5507072 4.9071497 6.7326156 5.1015625 7.8476562 C 3.2754904 8.8728198 2 10.76268 2 13 C 2 14.819816 2.8864861 16.388036 4.1660156 17.484375 C 4.6408757 20.032141 6.8174874 22 9.5 22 C 10.627523 22 11.683838 21.655029 12.556641 21.070312 A 1.0001 1.0001 0 0 0 13 20.240234 L 13 19 L 13 17 L 16 17 L 16 18.269531 A 2 2 0 0 0 15 20 A 2 2 0 0 0 17 22 A 2 2 0 0 0 19 20 A 2 2 0 0 0 18 18.271484 L 18 16 A 1.0001 1.0001 0 0 0 17 15 L 13 15 L 13 13 L 19.271484 13 A 2 2 0 0 0 21 14 A 2 2 0 0 0 23 12 A 2 2 0 0 0 21 10 A 2 2 0 0 0 19.269531 11 L 13 11 L 13 9 L 17 9 A 1.0001 1.0001 0 0 0 18 8 L 18 5.7304688 A 2 2 0 0 0 19 4 A 2 2 0 0 0 17 2 z M 9.9765625 4.0253906 C 10.323274 4.0594887 10.663125 4.1899373 11 4.3144531 L 11 5 L 11 7.8320312 A 1.0001 1.0001 0 0 0 11 8.1582031 L 11 10.001953 L 10.994141 10.001953 C 10.995487 11.115594 10.11489 11.998654 9.0019531 12 L 9.0039062 14 C 9.7330113 13.999103 10.409972 13.784291 11 13.4375 L 11 15.832031 A 1.0001 1.0001 0 0 0 11 16.158203 L 11 19 L 11 19.544922 C 10.53433 19.775688 10.05763 20 9.5 20 C 7.6963955 20 6.2496408 18.652222 6.0449219 16.904297 A 1.0001 1.0001 0 0 0 5.6445312 16.214844 C 4.6481295 15.482432 4 14.327105 4 13 C 4 11.598815 4.7246346 10.392988 5.8105469 9.6816406 C 6.2276287 10.337914 6.7833892 10.916519 7.5 11.330078 L 8.5 9.5976562 C 7.8796927 9.2396745 7.4474748 8.6957359 7.2089844 8.0820312 A 1.0001 1.0001 0 0 0 7.1855469 8 C 7.0449376 7.6024542 6.9871315 7.1827317 7.015625 6.7695312 C 7.0230903 6.6612728 7.0432757 6.5542362 7.0625 6.4472656 C 7.076659 6.3735269 7.0914327 6.2997442 7.1113281 6.2265625 C 7.1310767 6.1505802 7.1498827 6.0745236 7.1757812 6 C 7.2330841 5.8402322 7.3023195 5.6825058 7.3886719 5.5292969 C 7.5187762 5.2975857 7.6804734 5.0773393 7.8789062 4.8789062 C 8.3733162 4.3844964 8.9892096 4.1023458 9.6269531 4.0273438 C 9.7439583 4.0135832 9.860992 4.0140246 9.9765625 4.0253906 z"></path></svg> AI</button>');
        //  elementor
        //todo
        //  oxy
        //todo

        //  breakdance
        //soon // jQuery('.undo-redo-top-bar-section',window.parent.document).before('<div class="topbar-section topbar-section-bl"><button type="button" class="v-btn v-btn--outlined theme--light elevation-0 v-size--default breakdance-toolbar-button ab-ai-launch" style="height: 37px; margin-left: 3px; margin-right: 3px;"><span class="v-btn__content"> AI </span></button></div>');

        // bricks
        //todo

    },2000);
});






/**
 * Copies the specified text to the clipboard.
 * @param {String} text The text to copy.
 */

 function copyText(text) {
    if (!navigator.clipboard) {
    console.info('Cant copy to navigator.clipboard, you are probably on localhost where window.clipboard isnt allowed.');
    return;
}

  navigator.clipboard.writeText(text).then(function() {
    alert('Copied!');
  }, function(err) {
    console.info('Cant copy, you are probably on localhost where window.clipboard isnt allowed. Full error: ', err);
  });
}



async function callOpenAI(abAiType,outputSelector) {

    // send text and ai response required type
    var abAiType = jQuery('input[type="radio"][name="abaitype"]:checked')[0]['value'];
    if(abAiType == 'rewrite')
        var query = jQuery('[name="inputText"]').val().trim();
    else
    {
        var selectorList = [
            '.wp-block-post-content',
            '[itemprop="mainContentOfPage"]',
            '[role="main"]',
            'main',
            '#mainContent',
            'article',
            '.article',
            '.content',
            '#content',
            '.entry-content',
            'body',
            ] 
        var abPageContent = false;
        jQuery.each( selectorList, function( key, selector ) { // run through the selectors until we find one, cant fail with good ol body at the end
            if(jQuery(selector).length)
            {
                console.info('found with selector: ' + selector);
                abPageContent = jQuery(selector).clone(); // Clone the content to avoid modifying the actual page
                return false; // break loop
            }
        });

        // Remove non understandable things, media, and links
        abPageContent.find('source, header,footer, iframe, #wpadminbar,script,style,#ab-ai-form,meta,script,style,link').remove();

        // remove classes and styles from html
        abPageContent.find('*').removeAttr('style').removeAttr('data-*').removeAttr('data-node');
        // remove spaces between html elements
        abPageContent.find('*').contents().filter(function() {
            return this.nodeType === 3 && !/\S/.test(this.nodeValue);
        }).remove();
    
        // Convert the cleaned content to HTML
        var cleanedHtml = abPageContent.html();
        console.info("the text we're sending to AI",cleanedHtml);
        query = cleanedHtml;
    }

    jQuery.ajax({
        url: bt_ajaxurl,
        type : 'post',
        data : {
            'action': 'send_to_openai',
            'input_text': query,
            'type': abAiType,
            'title': abAiType,
        },
        success: function( response ) {
            if(response && typeof response.error !== 'undefined')
            {
                console.log(response);
                jQuery(outputSelector).html('<small><strong>ERROR</strong></small><BR>' + response["error"]['message']);
            }
            else
            {
                 console.log(response.choices[0]['message']['content']);
                var outt = '';
                if(abAiType == 'suggestions')
                {
                    //trim the content before the first square bracket and after the last square bracket
                    respo = response.choices[0]['message']['content'];
                    // remove ```json
                    respo = respo.replace(/```json/g, '');
                    // remove ```
                    respo = respo.replace(/```/g, '');

                    var ideas = JSON.parse(respo);

                    console.log(ideas);
                    //remove ```json and ``` from response
                    outt += "<h3>CRO Page Score: " + ideas.overall_page_rating + "%</h3><h4> You should consider adding:</h4><p> " + ideas.missing_content +"</p>";
                    jQuery.each(ideas.suggestions,function(index, content){
        
                        outt += "<div class='ai-option'><h4>" +  content.test_name + "</h4><p> " + content.reason_why +"</p><p>Original text:<BR><strong>" + content.original_string + "</strong></p><p>Suggestions:</p>";
                        jQuery.each(content.suggestions,function(index, suggestion){
        
                            outt += "<p class='ai-suggestion-item'>" + suggestion + "</p>";
                        });
                        outt += "</div>";
                    });
                }
                else
                {
                    suggestions = JSON.parse(response.choices[0]['message']['content']);
                    jQuery.each(suggestions.suggestions,function(index, choice){
                        outt += "<div class='ai-option'>" + choice +"</div>";
                    });                  
                }
                jQuery(outputSelector).html(outt);
                }
            jQuery('.ai-loading').hide();
        }
    });
}





function loadingMessage(){

    var loadingMessages = [
    "Loading, please wait...",
    "Fetching unicorns from the cloud...",
    "Initiating data transfer...",
    "Preparing to dazzle you...",
    "Calculating the meaning of life...",
    "Polishing up the pixels...",
    "Preparing to amaze you...",
    "Transmitting awesomeness...",
    "Crafting your results...",
    "Preparing for blast off...",
    "Assembling the pieces...",
    "Elevating your experience...",
    "Generating quantum states...",
    "Refining your results...",
    "Transforming data into gold...",
    "Accelerating electrons...",
    "Integrating over functions...",
    "Deconstructing the code...",
    "Tuning the engine...",
    "Synchronizing the clocks...",
    "Translating into ones and zeros...",
    "Archiving history...",
    "Empowering your experience...",
    "Conducting the orchestra...",
    "Compiling the modules...",
    "Scaling the heights...",
    "Breaking the sound barrier...",
    "Hyperspace travel engaged...",
    "Charging the capacitors...",
    "Aligning the planets...",
    "Distributing the load...",
    "Mapping the unknown...",
    "Decompressing the data...",
    "Filtering out the noise...",
    "Quantum entangling particles...",
    "Deciphering the glyphs...",
    "Optimizing the algorithm...",
    "Defragging the disk...",
    "Unleashing the power...",
    "Leveraging the network...",
    "Expanding the universe...",
    "Ruling out the impossible...",
    "Crunching the numbers...",
    "Synthesizing reality...",
    "Solving the puzzle...",
    "Unearthing the truth...",
    "Breaking the deadlock...",
    "Refining the solution...",
    ];

    return loadingMessages[Math.floor(Math.random()*loadingMessages.length)];
}


/*



jQuery('.fl-builder-bar-actions').append('<button class="ab-ai-launch fl-builder-button"> AI </button>');



*/