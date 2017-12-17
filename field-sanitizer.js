/**
 * fieldSanitizer - if a field contains input we don't want, change it on blur
 * note that we cannot alter original clipboard data being pasted with setData so blur works well here
 */
function fieldSanitizer(container) {
    this.container = container;

    //rules map shows the name of the rule, how to identify and what to replace with
    //can just add to it as needed
    this.rules = {'MSWORD-DOUBLE-QUOTES' : {'Replace' : '[\u201C\u201D\u201E]' , 'With' : '"', 'Type' : 'character'} ,
                    'MSWORD-COMMAS' : {'Replace' : '[\u201A]' , 'With' : ',', 'Type' : 'character'} ,
                    'MSWORD-APOSTROPHE' : {'Replace' : '[\u2018\u2019]' , 'With' : "'", 'Type' : 'character'} ,
                    'MSWORD-DOUBLE-LEFTQUOTE-HTML' : {'Replace' : '&ldquo' , 'With' : '&quot', 'Type' : 'term'} ,
                    'MSWORD-DOUBLE-RIGHTQUOTE-HTML' : {'Replace' : '&rdquo' , 'With' : '&quot', 'Type' : 'term'},
                    'MSWORD-SINGLE-RQUOTES-HTML' : {'Replace' : '&rsquo' , 'With' : '&#39', 'Type' : 'term'},
                    'MSWORD-SINGLE-LQUOTES-HTML' : {'Replace' : '&lsquo' , 'With' : '&#39', 'Type' : 'term'}};

    this.searchstr = this.buildCharacterSearchString();
    this.searchterms = this.buildSearchCollection();
    this.editorToChange = '';
}

fieldSanitizer.prototype = Object.create({});
fieldSanitizer.prototype.constructor = fieldSanitizer;

/**
 *
 * build up one string of the single character class values to search before
 *    deciding to actually sanitize
 */
fieldSanitizer.prototype.buildCharacterSearchString = function () {

    var textstr='';

    _.forEach(this.rules, function(value, _) {
        if (value['Type'] === 'character') {
            textstr += value['Replace'];
        }
    });

    return textstr;


}
/**
 *
 * build up one collection of the non single character search terms to search before
 *   deciding to actually sanitize
 */
fieldSanitizer.prototype.buildSearchCollection = function () {

    var terms=[];

    _.forEach(this.rules, function(value, _) {
        if (value['Type'] === 'term') {
            terms.push(value['Replace']);
        }
    });

    return terms;


}
/**
 *
 * decide if string even needs to be run through sanitizer
 */
fieldSanitizer.prototype.shouldSanitize = function (search, fieldVal) {

    var searchArray = (typeof search === "string") ? search.split('') : search;
    var found = false;

    searchArray.some(function (item) {
        if (fieldVal.indexOf(item) !== -1){
            found = true;
            return true;
        }

    });
    return found;

}

/**
 * sanitizeField - pass in the field text, loop through the rules and clean
 */
fieldSanitizer.prototype.sanitizeField = function (text) {

    _.forEach(this.rules, function(value, _) {
        var regexp = new RegExp(value['Replace'], "gi");
        text = text.replace(regexp, value['With']);
    });

    return text;

};

/**
 *  - initialize the sanitizer and events we care about
 */
$(document).ready(function() {

    var container = $('#navpage-content');
    var sanitizer = new fieldSanitizer(container);


    //input fields and textareas
    sanitizer.container.on('blur', 'input, textarea', function(e)
    {
        var fieldValue =  $(e.currentTarget).val();
        var shouldSanitize = sanitizer.shouldSanitize(sanitizer.searchstr, fieldValue);
        if (shouldSanitize) {
            var cleaned = sanitizer.sanitizeField(fieldValue);
            $(e.currentTarget).val(cleaned);
        }

    });

    //ckeditor instances
    if(typeof(CKEDITOR) !== "undefined") {

        CKEDITOR.on('currentInstance', function () {

            if (sanitizer.editorToChange.length > 0) {
                var shouldSanitize = sanitizer.shouldSanitize(sanitizer.searchterms,
                    CKEDITOR.instances[sanitizer.editorToChange].getData() );

                if (shouldSanitize) {
                    CKEDITOR.instances[sanitizer.editorToChange].
                        setData(sanitizer.sanitizeField(CKEDITOR.instances[sanitizer.editorToChange].getData()),
                        function () {
                            this.updateElement();
                        });

                    sanitizer.editorToChange = '';

                }
            }

            if (!this.currentInstance) return;

            var instance = this.currentInstance;

            instance.on('change', function () {
                sanitizer.editorToChange = instance.name;
            });

        });
    }

});
