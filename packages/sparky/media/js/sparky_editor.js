/* Sparky Page Builder | https://www.hotjoomlatemplates.com | Copyright (C) 2021 HotThemes. All rights reserved | GNU/GPLv3 http://www.gnu.org/licenses/gpl-3.0.html */

//// I

// get sparky editor textarea & editor container
let sparkyEditorTextarea = document.getElementById("sparkyEditorTextarea");
let sparkyEditorTextareaValue = sparkyEditorTextarea.value;
let sparkyPageContent = document.getElementById("sparkyPageContent");
var sparkyPageContentArray;

const SPARKY_DEFAULT_ROW_CLASS = "sparky_page_row sparky_row0";
const SPARKY_DEFAULT_COLUMN_CLASS = "sparkle12 sparky_cell sparky_col0";
const SPARKY_DEFAULT_ANIMATION = [ "", 0, "" ];
let pendingBlockControlScroll = null;
let pendingRowControlScroll = null;
let pendingParagraphFocus = null;
let addRowInsertAfterPosition = null;
let sparkyHistory = [];
let sparkyHistoryIndex = -1;
let isApplyingHistoryState = false;

// get page url (not used anywhere... yet)
let sparkyPageUrl = window.location.href.split("/administrator/index.php");
let sparkyFrontendUrl = sparkyPageUrl[0];
let sparkyBackendUrl = sparkyPageUrl[0] + "/administrator/";

// joomla installation path
joomla_path = joomla_path.replace(window.location.origin, "");

// fix Joomla's background-image paths
sparkyEditorTextareaValue = normalizeBackgroundImagePaths(sparkyEditorTextareaValue, joomla_path);


//// II


// populate editor container with HTML from textarea
//sparkyPageContent.innerHTML = sparkyEditorTextarea.value;

// initial creation of content array

// parse HTML from textarea to HTML document
const domparser = new DOMParser();
const sparkyPageContentParsed = domparser.parseFromString(sparkyEditorTextareaValue, "text/html");
const sparkyRows = getSparkyRowsFromParsedDocument(sparkyPageContentParsed);
const firstSparkyRow = getFirstRowNode(sparkyRows);

// accessing parsed HTML with:
// sparkyPageContentParsed.childNodes[0].childNodes[1].childNodes
// because:
// <html><head></head><body>SPARKY ROWS HERE</body></html>

if (sparkyEditorTextarea.value === "") {

    // if new article, create initial content array
    sparkyPageContentArray = createDefaultPageContentArray({
        id: "",
        class: "",
        style: {},
        type: "paragraph",
        content: "Add some text..."
    });

    refreshSparky();

} else {

    // check if the first element is a proper Sparky row
    if (!isSparkyFirstRow(firstSparkyRow)) {

        alert("This content is not created with the Sparky Page Builder!\n\nThe initial layout will be created and the existing content will be in a Custom HTML block.\n\nIf you don't want to edit this with  Sparky Page Builder, click OK and then close without saving.");
        sparkyPageContentArray = createDefaultPageContentArray({
            id: "",
            class: "sparky_custom_html",
            style: {},
            type: "customhtml",
            content: sparkyEditorTextarea.value
        });

        refreshSparky();


    } else {

        // if this article is created with Sparky, populate content array from the article's HTML
        sparkyPageContentArray = populateSparkyPageContentArray(sparkyRows);

    }
}








//// III

function normalizeBackgroundImagePaths(content, path) {
    return content
        .replaceAll('background-image: url(' + path + '"', 'background-image: url("')
        .replaceAll("background-image: url(" + path + "'", "background-image: url('");
}

function normalizeBoldTagsInHtml(content) {
    return content
        .replace(/<b(\s[^>]*)?>/gi, "<strong$1>")
        .replace(/<\/b>/gi, "</strong>");
}

function removeLinksFromHtml(content) {
    const contentTemplate = document.createElement("template");
    contentTemplate.innerHTML = content;

    contentTemplate.content.querySelectorAll("a").forEach(function(linkElement) {
        let linkContent = document.createDocumentFragment();
        while (linkElement.firstChild) {
            linkContent.appendChild(linkElement.firstChild);
        }
        linkElement.replaceWith(linkContent);
    });

    return contentTemplate.innerHTML;
}

function isFullHeadingLink(blockElement) {
    if (!blockElement || blockElement.children.length !== 1) {
        return false;
    }

    const firstElement = blockElement.children[0];
    if (!firstElement || firstElement.nodeName !== "A") {
        return false;
    }

    return Array.from(blockElement.childNodes).every(function(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return !node.textContent.trim();
        }
        return node === firstElement;
    });
}

function createDefaultPageContentArray(initialBlock) {
    return [
        {
            id: generateRandomRowId(),
            class: SPARKY_DEFAULT_ROW_CLASS,
            style: {},
            content: [
                {
                    id: "",
                    class: SPARKY_DEFAULT_COLUMN_CLASS,
                    style: {},
                    cols: 12,
                    animation: [ ...SPARKY_DEFAULT_ANIMATION ],
                    content: [ initialBlock ]
                }
            ]
        }
    ];
}

function generateRandomRowId() {
    return "row_" + Math.floor((Math.random() * 100000000));
}

function getSparkyRowsFromParsedDocument(parsedDocument) {
    return parsedDocument?.body?.childNodes ?? [];
}

function getFirstRowNode(rows) {
    for (const row of rows) {
        if (row?.nodeType === Node.ELEMENT_NODE) {
            return row;
        }
    }
    return null;
}

function isSparkyFirstRow(firstRow) {
    if (!firstRow || !firstRow.id || !firstRow.className) {
        return false;
    }
    return firstRow.className.includes("sparky_row0") && firstRow.className.includes("sparky_page_row");
}


// populate sparkyPageContentArray with HTML from textarea

function populateSparkyPageContentArray(sparkyRows) {

    // sparkyPageContentArray will be array with all content (rows, columns, blocks)
    let sparkyPageContentArray = [];
    
    let i = 0;
    let sparkle;

    sparkyRows.forEach(function(row){

        let sparkyRow;
        
        // row must be in div
        if(row.nodeName !== "DIV" && row.nodeName !== "HR") {
            return;
        }

        // include only page rows!
        // we'll skip from content array: row settings, dropzones, and add row button      
        if (! row.className.includes("sparky_page_row sparky_row") && row.id !== "system-readmore" && !row.className.includes("system-pagebreak")) {
            return;
        }
        if (row.id === "system-readmore" || row.className.includes("system-pagebreak")) {
            sparkyRow = row.childNodes;
        } else {
            // because of whitespace, we have childnodes: #text / DIV / #text
            // so, let's take the second (in array it's [1])
            sparkyRow = row.childNodes[1].childNodes;
        }

        sparkyPageContentArray.push({
            id: row.id || generateRandomRowId(),
            class: row.className,
            style: row.style,
            content: []
        });

        // page break row has title and alias
        if (row.className.includes("system-pagebreak")) {
            sparkyPageContentArray[sparkyPageContentArray.length-1].title = row.getAttribute("title");
            sparkyPageContentArray[sparkyPageContentArray.length-1].alias = row.getAttribute("alt");
        }

        let j = 0;

        sparkyRow.forEach(function(column){

            // don't include column dropzones and whitespace
            if ( column.className === "column_dropzone" || column.nodeName !== "DIV" ) {
                return;
            }

            // get column width per class name
            sparkle = determineColumnsNumber(column.className);

            // animation (class, delay, type)
            let sparky_animation = [ "", 0, "" ];
            if ( column.className.includes("img-with-animation") ) {
                sparky_animation[0] = " img-with-animation";
                sparky_animation[1] = column.getAttribute("data-delay");
                sparky_animation[2] = column.getAttribute("data-animation");
            }

            sparkyPageContentArray[i].content.push({
                id: column.id,
                class: "sparkle" + sparkle + sparky_animation[0] + " sparky_cell sparky_col" + j,
                style: column.style,
                cols: sparkle,
                animation: sparky_animation,
                content: []
            });

            column.childNodes.forEach(function(block){

                if(
                    block.className === "column_settings_buttons" ||
                    block.className === "block_settings_buttons" ||
                    block.className === "add_block_container"){
                    return;
                }

                let blockType = determineBlockType(block);

                // paragraph block
                if (blockType === "paragraph") {
                    sparkyPageContentArray[i].content[j].content.push({
                        id: block.id,
                        class: block.className,
                        style: block.style,
                        type: "paragraph",
                        content: normalizeBoldTagsInHtml(block.innerHTML)
                    });
                }

                // heading block
                if (blockType === "heading") {

                    // heading link
                    // you can't access it just with block.link
                    let headingLink = "";
                    let headingTarget = false;
                    let headingHasFullLink = isFullHeadingLink(block);
                    if (headingHasFullLink) {
                        headingLink = block.children[0].getAttribute("href");
                        headingTarget = block.children[0].getAttribute("target");
                    }

                    let headingContent = normalizeBoldTagsInHtml(block.innerHTML);
                    if (headingHasFullLink) {
                        headingContent = removeLinksFromHtml(headingContent);
                    }

                    sparkyPageContentArray[i].content[j].content.push({
                        id: block.id,
                        class: block.className,
                        style: block.style,
                        type: "heading",
                        link: headingLink,
                        target: headingTarget,
                        level: block.nodeName,
                        content: headingContent
                    });
                    
                }

                // image block
                if (blockType === "image") {

                    // image link
                    // you can't access it just with block.link
                    let imageId = block.children[0].id;
                    let imageClass = block.children[0].className;
                    let imageStyle = block.children[0].style;
                    let imageLink = "";
                    let imageTarget = false;
                    let imageSrc = block.children[0].getAttribute("src");
                    let imageAlt = block.children[0].alt;

                    if (block.children[0]) {
                        if (block.children[0].nodeName === "A") {
                            imageId = block.children[0].children[0].id;
                            imageClass = block.children[0].children[0].className;
                            imageStyle = block.children[0].children[0].style;
                            imageLink = block.children[0].getAttribute("href");
                            imageTarget = block.children[0].getAttribute("target");
                            imageSrc = block.children[0].children[0].getAttribute("src");
                            imageAlt = block.children[0].children[0].getAttribute("alt");
                        }
                    }

                    sparkyPageContentArray[i].content[j].content.push({
                        id: imageId,
                        class: imageClass,
                        style: imageStyle,
                        type: "image",
                        link: imageLink,
                        target: imageTarget,
                        src: imageSrc,
                        alt: imageAlt,
                        content: block.innerHTML
                    });
                }

                // separator block
                if (blockType === "separator") {
                    sparkyPageContentArray[i].content[j].content.push({
                        id: block.id,
                        class: block.className,
                        style: block.style,
                        type: "separator",
                        content: block.innerHTML
                    });
                }

                // spacer block
                if (blockType === "spacer") {
                    sparkyPageContentArray[i].content[j].content.push({
                        id: block.id,
                        class: block.className,
                        style: block.style,
                        type: "spacer",
                        content: block.innerHTML
                    });
                }

                // button block
                if (blockType === "button") {

                    sparkyPageContentArray[i].content[j].content.push({
                        id: block.id,
                        class: block.className,
                        style: block.style,
                        link: block.getAttribute("href"),
                        target: block.getAttribute("target"),
                        type: "button",
                        content: block.innerHTML
                    });
                }

                // list block
                if (blockType === "list") {
                    sparkyPageContentArray[i].content[j].content.push({
                        id: block.id,
                        class: block.className,
                        style: block.style,
                        type: "list",
                        listType: block.nodeName.toLowerCase(),
                        content: normalizeBoldTagsInHtml(block.innerHTML)
                    });
                }

                // iframe block
                if (blockType === "iframe") {
                    sparkyPageContentArray[i].content[j].content.push({
                        id: block.id,
                        class: block.className,
                        style: block.style,
                        src: block.src,
                        type: "iframe",
                        content: block.innerHTML
                    });
                }

                // video block
                if (blockType === "video") {

                    // video files
                    let videoMp4 = "";
                    let videoOgg = "";
                    let videoWebm = "";

                    Array.from(block.children).forEach(function(videoFile){
                        switch(videoFile.type) {
                            case "video/mp4":
                                videoMp4 = videoFile.getAttribute("src");
                                break;
                            case "video/ogg":
                                videoOgg = videoFile.getAttribute("src");
                                break;
                            case "video/webm":
                                videoWebm = videoFile.getAttribute("src");
                                break;
                            default:
                                break;
                        }
                    });

                    sparkyPageContentArray[i].content[j].content.push({
                        id: block.id,
                        class: block.className,
                        style: block.style,
                        poster: block.getAttribute("poster"),
                        mp4: videoMp4,
                        ogg: videoOgg,
                        webm: videoWebm,
                        autoplay: block.autoplay,
                        controls: block.controls,
                        loop: block.loop,
                        muted: block.muted,
                        type: "video",
                        content: block.innerHTML
                    });
                }

                // audio block
                if (blockType === "audio") {

                    // audio files
                    let audioMp3 = "";
                    let audioOgg = "";
                    let audioWav = "";

                    Array.from(block.children).forEach(function(audioFile){
                        switch(audioFile.type) {
                            case "audio/mpeg":
                                audioMp3 = audioFile.src;
                                break;
                            case "audio/ogg":
                                audioOgg = audioFile.src;
                                break;
                            case "audio/wav":
                                audioWav = audioFile.src;
                                break;
                            default:
                                break;
                        }
                    });

                    sparkyPageContentArray[i].content[j].content.push({
                        id: block.id,
                        class: block.className,
                        style: block.style,
                        mp3: audioMp3,
                        ogg: audioOgg,
                        wav: audioWav,
                        autoplay: block.autoplay,
                        controls: block.controls,
                        loop: block.loop,
                        muted: block.muted,
                        type: "audio",
                        content: block.innerHTML
                    });
                }

                // icon block
                if (blockType === "icon") {

                    // icon link
                    let iconLink = "";

                    if (block.nodeName === "A") {
                        iconLink = block.getAttribute("href");
                        sparkyPageContentArray[i].content[j].content.push({
                            id: block.children[0].id,
                            category: block.children[0].className.substr(0, 3),
                            class: block.children[0].className.replace("fas ", "").replace("far ", "").replace("fab ", ""),
                            style: block.children[0].style,
                            link: iconLink,
                            target: block.getAttribute("target"),
                            type: "icon",
                            content: block.innerHTML
                        });
                    } else {
                        sparkyPageContentArray[i].content[j].content.push({
                            id: block.id,
                            category: block.className.substr(0, 3),
                            class: block.className.replace("fas ", "").replace("far ", "").replace("fab ", ""),
                            style: block.style,
                            link: iconLink,
                            target: false,
                            type: "icon",
                            content: block.innerHTML
                        });
                    }
                    
                }

                // social block
                if (blockType === "social") {

                    let social_icon_order;
                    let social_network = [false,false,false,false,false,false,false];
                    let social_link = ["","","","","","","",""];
                    let social_target = false;

                    if ( block.children.length > 0 ) {

                        if (block.children[0].getAttribute("target")) {
                            social_target = true;
                        }

                        Array.from(block.children).forEach(function(social){
                            social_icon_order = Number(social.className.charAt(social.className.length-1));
                            social_network[social_icon_order] = social.children[0].className.replace("fab fa-", "");
                            social_link[social_icon_order] = social.getAttribute("href");
                        });
                    }

                    sparkyPageContentArray[i].content[j].content.push({
                        id: block.id,
                        class: block.className,
                        style: block.style,
                        target: social_target,
                        network1: social_network[1],
                        link1: social_link[1],
                        network2: social_network[2],
                        link2: social_link[2],
                        network3: social_network[3],
                        link3: social_link[3],
                        network4: social_network[4],
                        link4: social_link[4],
                        network5: social_network[5],
                        link5: social_link[5],
                        network6: social_network[6],
                        link6: social_link[6],
                        type: "social",
                        content: block.innerHTML
                    });
                    
                }

                // custom html block
                if (blockType === "customhtml") {
                    sparkyPageContentArray[i].content[j].content.push({
                        id: block.id,
                        class: block.className,
                        style: block.style,
                        type: "customhtml",
                        content: block.innerHTML
                    });
                }

                // Joomla module block
                if (blockType === "joomlamodule") {
                    sparkyPageContentArray[i].content[j].content.push({
                        id: block.id,
                        class: block.className,
                        style: block.style,
                        type: "joomlamodule",
                        content: block.innerHTML
                    });
                }

            });
            j++;
        });
        i++;
    });

    return sparkyPageContentArray;

}



//// IV



function createEditableContentFromArray(arr) {

    // sparkyHTML is html for editable container
    // sparkyPageContentEditable is editable container
    let sparkyHTML = "";
    let sparkyPageContentEditable = document.getElementById("sparkyPageContentEditable");

    let i = 0;
    
    sparkyPageContentArray.forEach(function(row){

        let rowClassArr = [];
        let rowStyle = sparkyInlineStyle(row.style);
        let rowUp = '<a class="row_up" title="Move Up"></a>';
        let rowDown = '<a class="row_down" title="Move Down"></a>';

        // add ../ to background-image url for backend (relative urls only)
        if( !rowStyle.includes('background-image:url("http') && !rowStyle.includes("background-image:url('http")  && !document.getElementById("adminForm") ) {
            rowStyle = rowStyle.replaceAll('background-image:url("', 'background-image:url("../');
            rowStyle = rowStyle.replaceAll("background-image:url('", "background-image:url('../");
        } else if ( !rowStyle.includes('background-image:url("http') && !rowStyle.includes("background-image:url('http") && document.getElementById("adminForm")) {
            rowStyle = rowStyle.replaceAll('background-image:url("', 'background-image:url("'+joomla_path);
            rowStyle = rowStyle.replaceAll("background-image:url('", "background-image:url('"+joomla_path);
        }

        if (i === 0) {
            rowUp = '';
        }
        if (sparkyPageContentArray.length-1 === i) {
            rowDown = '';
        }

        // re-count row class name - "sparky_rowX" must be in order: 0, 1, 2...
        rowClassArr = row.class.split("sparky_row");
        row.class = rowClassArr[0] + "sparky_row" + i;

        if ( row.id === "system-readmore" ) {
            sparkyHTML += `<div class="row_settings_buttons">${rowUp}${rowDown}<a class="delete_row" title="Delete Read More Tag"></a></div><hr id="${row.id}" class="${row.class}" ${rowStyle} draggable="true" ondragstart="onRowDragStart(event);" ondragend="onRowDragEnd(event);" ondragover="onRowDragOver(event);" ondragleave="onRowDragLeave(event);" ondrop="onRowDrop(event);">`;
        } else if ( row.class.includes("system-pagebreak") ) {
            sparkyHTML += `<div class="row_settings_buttons"><a class="page_break_settings" title="Page Break Settings"></a>${rowUp}${rowDown}<a class="delete_row" title="Delete Page Break Tag"></a></div><hr id="${row.id}" class="system-pagebreak sparky_row${i}" title="${row.title}" alt="${row.alias}" draggable="true" ondragstart="onRowDragStart(event);" ondragend="onRowDragEnd(event);" ondragover="onRowDragOver(event);" ondragleave="onRowDragLeave(event);" ondrop="onRowDrop(event);">`;
        } else {
            sparkyHTML += `<div class="row_settings_buttons"><a class="row_settings" title="Row Settings"></a><a class="copy_row" title="Copy Row"></a><a class="add_row_after" title="Add Row Below"></a><a class="add_column" title="Add Column"></a>${rowUp}${rowDown}<a class="delete_row" title="Delete Row"></a></div><div id="${row.id}" class="${row.class}" ${rowStyle} draggable="true" ondragstart="onRowDragStart(event);" ondragend="onRowDragEnd(event);" ondragover="onRowDragOver(event);" ondragleave="onRowDragLeave(event);" ondrop="onRowDrop(event);"><div class="sparky_page_container">`;
        }

        let j = 0;

        row.content.forEach(function(column){

            let columnStyle = sparkyInlineStyle(column.style);

            // add ../ to background-image url for backend (relative urls only)
            if( !columnStyle.includes('background-image:url("http') && !columnStyle.includes("background-image:url('http") && !document.getElementById("adminForm") ) {
                columnStyle = columnStyle.replaceAll('background-image:url("', 'background-image:url("../');
                columnStyle = columnStyle.replaceAll("background-image:url('", "background-image:url('../");
            } else if ( !columnStyle.includes('background-image:url("http') && !columnStyle.includes("background-image:url('http") && document.getElementById("adminForm") ) {
                columnStyle = columnStyle.replaceAll('background-image:url("', 'background-image:url("'+joomla_path);
                columnStyle = columnStyle.replaceAll("background-image:url('", "background-image:url('"+joomla_path);
            }

            // re-calc column class name - "sparky_colX" must be in order: 0, 1, 2...
            if (row.content.length-1 === j && j > 0) {
                column.class = "sparkle" + column.cols + " sparky_cell last_col sparky_col" + j;
            } else {
                column.class = "sparkle" + column.cols + " sparky_cell sparky_col" + j;
            }

            sparkyHTML += `<div class="${column.class}" ${columnStyle} draggable="true" ondragstart="onColumnDragStart(event);" ondragend="onColumnDragEnd(event);" ondragover="onColumnDragOver(event);" ondragleave="onColumnDragLeave(event);" ondrop="onColumnDrop(event);"><div class="column_settings_buttons"><a class="column_settings" title="Column Settings"></a><a class="column_increase" title="Increase Column"></a><a class="column_decrease" title="Decrease Column"></a><a class="column_left" title="Move Left"></a><a class="column_right" title="Move Right"></a><a class="delete_column" title="Delete Column"></a></div>`;

                let k = 0;
                let dz = 1;

                column.content.forEach(function(block){

                    let blockId = "";
                    let blockClass = "";
                    let blockStyle = sparkyInlineStyle(block.style);                        
                    let blockAlt = "";                        
                    let blockTarget = "";                   
                    let blockSrc = "";
                    let blockUp = '<a class="block_up" title="Move Up"></a>';
                    let blockDown = '<a class="block_down" title="Move Down"></a>';

                    if (block.id) blockId = ` id="${block.id}"`;
                    if (block.class) blockClass = ` class="${block.class}"`;
                    if (block.alt) blockAlt = block.alt;
                    if (block.target) blockTarget = ' target="_blank"';
                    if (block.src) {
                        if (!block.src.startsWith("http") && !document.getElementById("adminForm")) {
                            blockSrc = "../" + block.src;
                        } else if (!block.src.startsWith("http") && document.getElementById("adminForm")) {
                            blockSrc = joomla_path + block.src;
                        } else {
                            blockSrc = block.src;
                        }
                    }

                    if (k === 0) {
                        blockUp = '';
                    }
                    if (column.content.length-1 === k) {
                        blockDown = '';
                    }

                    switch (block.type) {

                        case "paragraph":
                            sparkyHTML += `<div class="block_settings_buttons sparky_block${k}"><a class="block_settings" title="Block Settings"></a><a class="add_block_after_block" title="Add Block"></a><a class="copy_block" title="Copy Block"></a>${blockUp}${blockDown}<a class="add_paragraph_link" title="Add Link"></a><a class="add_paragraph_bold" title="Bold"></a><a class="add_paragraph_italic" title="Italic"></a><a class="add_paragraph_underline" title="Underline"></a><a class="delete_block" title="Delete Block"></a></div><p${blockId}${blockClass} ${blockStyle} contenteditable="true" draggable="true" ondragstart="onBlockDragStart(event);" ondragend="onBlockDragEnd(event);" ondragover="onDropToBlock(event);" ondragleave="onDropToBlock(event);" ondrop="onDropToBlock(event);">${block.content}</p>`;
                            break;

                        case "heading":
                            let headingLinkButtonClass = "add_heading_link";
                            let headingLinkButtonTitle = "Add Link";
                            if (block.link) {
                                headingLinkButtonClass += " heading_link_disabled";
                                headingLinkButtonTitle = "Link disabled because Heading Settings has a link";
                            }
                            sparkyHTML += `<div class="block_settings_buttons sparky_block${k}"><a class="block_settings" title="Block Settings"></a><a class="add_block_after_block" title="Add Block"></a><a class="copy_block" title="Copy Block"></a>${blockUp}${blockDown}<a class="${headingLinkButtonClass}" title="${headingLinkButtonTitle}"></a><a class="add_heading_bold" title="Bold"></a><a class="add_heading_italic" title="Italic"></a><a class="add_heading_underline" title="Underline"></a><a class="delete_block" title="Delete Block"></a></div><${block.level}${blockId}${blockClass}${blockStyle} contenteditable="true" draggable="true" ondragstart="onBlockDragStart(event);" ondragend="onBlockDragEnd(event);" ondragover="onDropToBlock(event);" ondragleave="onDropToBlock(event);" ondrop="onDropToBlock(event);">`;
                            if ( block.link && ! block.content.includes("href=") ) {
                                sparkyHTML += `<a href="${block.link}"${blockTarget}>`
                            }
                            sparkyHTML += block.content;
                            if ( block.link && ! block.content.includes("href=") ) {
                                sparkyHTML += `</a>`
                            }
                            sparkyHTML += `</${block.level}>`;
                            break;

                        case "image":
                            sparkyHTML += `<div class="block_settings_buttons sparky_block${k}"><a class="block_settings" title="Block Settings"></a><a class="add_block_after_block" title="Add Block"></a><a class="copy_block" title="Copy Block"></a>${blockUp}${blockDown}<a class="delete_block" title="Delete Block"></a></div><figure draggable="true" ondragstart="onBlockDragStart(event);" ondragend="onBlockDragEnd(event);" ondragover="onDropToBlock(event);" ondragleave="onDropToBlock(event);" ondrop="onDropToBlock(event);">`;
                            if ( block.link ) {
                                sparkyHTML += `<a href="${block.link}"${blockTarget}>`
                            }
                            sparkyHTML += `<img${blockId}${blockClass} ${blockStyle} src="${blockSrc}" alt="${blockAlt}" ondragstart="onImageDragStart(event);" ondragover="onDropToBlock(event);" ondragleave="onDropToBlock(event);" ondrop="onDropToBlock(event);" />`;
                            if ( block.link ) {
                                sparkyHTML += `</a>`
                            }
                            sparkyHTML += `</figure>`;
                            break;

                        case "separator":
                            sparkyHTML += `<div class="block_settings_buttons sparky_block${k}"><a class="block_settings" title="Block Settings"></a><a class="add_block_after_block" title="Add Block"></a><a class="copy_block" title="Copy Block"></a>${blockUp}${blockDown}<a class="delete_block" title="Delete Block"></a></div><hr${blockId}${blockClass} ${blockStyle} draggable="true" ondragstart="onBlockDragStart(event);" ondragend="onBlockDragEnd(event);" ondragover="onDropToBlock(event);" ondragleave="onDropToBlock(event);" ondrop="onDropToBlock(event);"/>`;
                            break;

                        case "spacer":
                            if (!blockStyle) {
                                blockStyle = " style='height:50px'";
                            }
                            sparkyHTML += `<div class="block_settings_buttons sparky_block${k}"><a class="block_settings" title="Block Settings"></a><a class="add_block_after_block" title="Add Block"></a><a class="copy_block" title="Copy Block"></a>${blockUp}${blockDown}<a class="delete_block" title="Delete Block"></a></div><div${blockId}${blockClass} ${blockStyle} draggable="true" ondragstart="onBlockDragStart(event);" ondragend="onBlockDragEnd(event);" ondragover="onDropToBlock(event);" ondragleave="onDropToBlock(event);" ondrop="onDropToBlock(event);"></div>`;
                            break;

                        case "button":
                            sparkyHTML += `<div class="block_settings_buttons sparky_block${k}"><a class="block_settings" title="Block Settings"></a><a class="add_block_after_block" title="Add Block"></a><a class="copy_block" title="Copy Block"></a>${blockUp}${blockDown}<a class="delete_block" title="Delete Block"></a></div><a href="${block.link}" ${blockTarget} ${blockId}${blockClass} ${blockStyle} draggable="true" ondragstart="onBlockDragStart(event);" ondragend="onBlockDragEnd(event);" ondragover="onDropToBlock(event);" ondragleave="onDropToBlock(event);" ondrop="onDropToBlock(event);">${block.content}</a>`;
                            break;

                        case "list":
                            sparkyHTML += `<div class="block_settings_buttons sparky_block${k}"><a class="block_settings" title="Block Settings"></a><a class="add_block_after_block" title="Add Block"></a><a class="copy_block" title="Copy Block"></a>${blockUp}${blockDown}<a class="add_paragraph_link" title="Add Link"></a><a class="add_paragraph_bold" title="Bold"></a><a class="add_paragraph_italic" title="Italic"></a><a class="add_paragraph_underline" title="Underline"></a><a class="delete_block" title="Delete Block"></a></div><${block.listType}${blockId}${blockClass} ${blockStyle} contenteditable="true" draggable="true" ondragstart="onBlockDragStart(event);" ondragend="onBlockDragEnd(event);" ondragover="onDropToBlock(event);" ondragleave="onDropToBlock(event);" ondrop="onDropToBlock(event);">${block.content}</${block.listType}>`;
                            break;

                        case "iframe":
                            sparkyHTML += `<div class="block_settings_buttons sparky_block${k}"><a class="block_settings" title="Block Settings"></a><a class="add_block_after_block" title="Add Block"></a><a class="copy_block" title="Copy Block"></a>${blockUp}${blockDown}<a class="delete_block" title="Delete Block"></a></div><iframe${blockId}${blockClass} ${blockStyle} src="${block.src}" draggable="true" ondragstart="onBlockDragStart(event);" ondragend="onBlockDragEnd(event);" ondragover="onDropToBlock(event);" ondragleave="onDropToBlock(event);" ondrop="onDropToBlock(event);"></iframe>`;
                            break;

                        case "video":
                            let videoPoster = "";
                            let videoMp4 = "";
                            let videoOgg = "";
                            let videoWebm = "";
                            let videoAutoplay = "";
                            let videoControls = "";
                            let videoLoop = "";
                            let videoMuted = "";
                            if (block.poster) {
                                if (!block.poster.startsWith("http") && !document.getElementById("adminForm")) {
                                    videoPoster = `poster="../${block.poster}" `;
                                } else if (!block.poster.startsWith("http") && document.getElementById("adminForm")) {
                                    videoPoster = `poster="${joomla_path}${block.poster}" `;
                                } else {
                                    videoPoster = `poster="${block.poster}" `;
                                }
                            }
                            if (block.mp4) {
                                if (!block.mp4.startsWith("http") && !document.getElementById("adminForm")) {
                                    videoMp4 = `<source src="../${block.mp4}" type="video/mp4">`;
                                } else if (!block.mp4.startsWith("http") && document.getElementById("adminForm")) {
                                    videoMp4 = `<source src="${joomla_path}${block.mp4}" type="video/mp4">`;
                                } else {
                                    videoMp4 = `<source src="${block.mp4}" type="video/mp4">`;
                                }
                            }
                            if (block.ogg) {
                                if (!block.ogg.startsWith("http") && !document.getElementById("adminForm")) {
                                    videoOgg = `<source src="../${block.ogg}" type="video/ogg">`;
                                } else if (!block.ogg.startsWith("http") && document.getElementById("adminForm")) {
                                    videoOgg = `<source src="${joomla_path}${block.ogg}" type="video/ogg">`;
                                } else {
                                    videoOgg = `<source src="${block.ogg}" type="video/ogg">`;
                                }
                            }
                            if (block.webm) {
                                if (!block.webm.startsWith("http") && !document.getElementById("adminForm")) {
                                    videoWebm = `<source src="../${block.webm}" type="video/webm">`;
                                } else if (!block.webm.startsWith("http") && document.getElementById("adminForm")) {
                                    videoWebm = `<source src="${joomla_path}${block.webm}" type="video/webm">`;
                                } else {
                                    videoWebm = `<source src="${block.webm}" type="video/webm">`;
                                }
                            }
                            if (block.autoplay) {
                                videoAutoplay = " autoplay";
                            }
                            if (block.controls) {
                                videoControls = " controls";
                            }
                            if (block.loop) {
                                videoLoop = " loop";
                            }
                            if (block.muted) {
                                videoMuted = " muted";
                            }
                            sparkyHTML += `<div class="block_settings_buttons sparky_block${k}"><a class="block_settings" title="Block Settings"></a><a class="add_block_after_block" title="Add Block"></a><a class="copy_block" title="Copy Block"></a>${blockUp}${blockDown}<a class="delete_block" title="Delete Block"></a></div><video${blockId}${blockClass} ${blockStyle} ${videoPoster}${videoAutoplay}${videoControls}${videoLoop}${videoMuted} draggable="true" ondragstart="onBlockDragStart(event);" ondragend="onBlockDragEnd(event);" ondragover="onDropToBlock(event);" ondragleave="onDropToBlock(event);" ondrop="onDropToBlock(event);">${videoMp4}${videoOgg}${videoWebm}Your browser does not support the video element.</video>`;
                            break;

                        case "audio":
                            let audioMp3 = "";
                            let audioOgg = "";
                            let audioWav = "";
                            let audioAutoplay = "";
                            let audioControls = "";
                            let audioMessage = "";
                            let audioLoop = "";
                            let audioMuted = "";
                            // problem with audio only:
                            // joomla reverts src to abs - wrong urls (in administrator only) after article save
                            if (block.mp3) {
                                if (!block.mp3.startsWith("http") && !document.getElementById("adminForm")) {
                                    audioMp3 = `<source src="../${block.mp3}" type="audio/mpeg">`;
                                } else if (!block.mp3.startsWith("http") && document.getElementById("adminForm")) {
                                    audioMp3 = `<source src="${joomla_path}${block.mp3}" type="audio/mpeg">`;
                                } else {
                                    audioMp3 = `<source src="${block.mp3}" type="audio/mpeg">`;
                                }
                            }
                            if (block.ogg) {
                                if (!block.ogg.startsWith("http") && !document.getElementById("adminForm")) {
                                    audioOgg = `<source src="../${block.ogg}" type="audio/ogg">`;
                                } else if (!block.ogg.startsWith("http") && document.getElementById("adminForm")) {
                                    audioOgg = `<source src="${joomla_path}${block.ogg}" type="audio/ogg">`;
                                } else {
                                    audioOgg = `<source src="${block.ogg}" type="audio/ogg">`;
                                }
                            }
                            if (!block.wav && !document.getElementById("adminForm")) {
                                if (block.wav.startsWith("http")) {
                                    audioWav = `<source src="../${block.wav}" type="audio/wav">`;
                                } else if (!block.wav.startsWith("http") && document.getElementById("adminForm")) {
                                    audioWav = `<source src="${joomla_path}${block.wav}" type="audio/wav">`;
                                } else {
                                    audioWav = `<source src="${block.wav}" type="audio/wav">`;
                                }
                            }
                            if (block.autoplay) {
                                audioAutoplay = " autoplay";
                            }
                            if (block.controls) {
                                audioControls = " controls";
                            } else {
                                audioMessage = "<div>The audio controls are hidden.</div>"
                            }
                            if (block.loop) {
                                audioLoop = " loop";
                            }
                            if (block.muted) {
                                audioMuted = " muted";
                            }
                            sparkyHTML += `<div class="block_settings_buttons sparky_block${k}"><a class="block_settings" title="Block Settings"></a><a class="add_block_after_block" title="Add Block"></a><a class="copy_block" title="Copy Block"></a>${blockUp}${blockDown}<a class="delete_block" title="Delete Block"></a></div><audio${blockId}${blockClass} ${blockStyle} ${audioAutoplay}${audioControls}${audioLoop}${audioMuted} draggable="true" ondragstart="onBlockDragStart(event);" ondragend="onBlockDragEnd(event);" ondragover="onDropToBlock(event);" ondragleave="onDropToBlock(event);" ondrop="onDropToBlock(event);">${audioMp3}${audioOgg}${audioWav}Your browser does not support the audio element.</audio>${audioMessage}`;
                            break;

                        case "icon":
                            let blockLinkStart = "";
                            let blockLinkEnd = "";
                            let blockDragndropIcon = "";
                            // fa icons class is: category + class
                            blockClass = ` class="${block.category} ${block.class}"`;

                            if ( block.link ) {
                                blockLinkStart = `<a href="${block.link}" ${blockTarget} class="sparky_icon_link" draggable="true" ondragstart="onBlockDragStart(event);" ondragend="onBlockDragEnd(event);" ondragover="onDropToBlock(event);" ondragleave="onDropToBlock(event);" ondrop="onDropToBlock(event);">`;
                                blockLinkEnd = "</a>";
                            } else {
                                blockDragndropIcon = 'draggable="true" ondragstart="onBlockDragStart(event);" ondragend="onBlockDragEnd(event);" ondragover="onDropToBlock(event);" ondragleave="onDropToBlock(event);" ondrop="onDropToBlock(event);"';
                            }
                            sparkyHTML += `<div class="block_settings_buttons sparky_block${k}"><a class="block_settings" title="Block Settings"></a><a class="add_block_after_block" title="Add Block"></a><a class="copy_block" title="Copy Block"></a>${blockUp}${blockDown}<a class="delete_block" title="Delete Block"></a></div>${blockLinkStart}<i${blockId}${blockClass} ${blockStyle} aria-hidden="true" ${blockDragndropIcon}></i>${blockLinkEnd}`;
                            break;

                        case "social":
                            let social_network_html = "";

                            if (block.network1)
                                social_network_html += `<a class="sparky_social_icon1" href="${block.link1}"${blockTarget} ><i class="fab fa-${block.network1}" aria-hidden="true"></i></a>`;
                            if (block.network2)
                                social_network_html += `<a class="sparky_social_icon2" href="${block.link2}"${blockTarget} ><i class="fab fa-${block.network2}" aria-hidden="true"></i></a>`;
                            if (block.network3)
                                social_network_html += `<a class="sparky_social_icon3" href="${block.link3}"${blockTarget} ><i class="fab fa-${block.network3}" aria-hidden="true"></i></a>`;
                            if (block.network4)
                                social_network_html += `<a class="sparky_social_icon4" href="${block.link4}"${blockTarget} ><i class="fab fa-${block.network4}" aria-hidden="true"></i></a>`;
                            if (block.network5)
                                social_network_html += `<a class="sparky_social_icon5" href="${block.link5}"${blockTarget} ><i class="fab fa-${block.network5}" aria-hidden="true"></i></a>`;
                            if (block.network6)
                                social_network_html += `<a class="sparky_social_icon6" href="${block.link6}"${blockTarget} ><i class="fab fa-${block.network6}" aria-hidden="true"></i></a>`;

                            sparkyHTML += `<div class="block_settings_buttons sparky_block${k}"><a class="block_settings" title="Block Settings"></a><a class="add_block_after_block" title="Add Block"></a><a class="copy_block" title="Copy Block"></a>${blockUp}${blockDown}<a class="delete_block" title="Delete Block"></a></div><div${blockId}${blockClass} ${blockStyle} draggable="true" ondragstart="onBlockDragStart(event);" ondragend="onBlockDragEnd(event);" ondragover="onDropToBlock(event);" ondragleave="onDropToBlock(event);" ondrop="onDropToBlock(event);">${social_network_html}</div>`;
                            break;

                        case "customhtml":
                            sparkyHTML += `<div class="block_settings_buttons sparky_block${k}"><a class="block_settings" title="Block Settings"></a><a class="add_block_after_block" title="Add Block"></a><a class="copy_block" title="Copy Block"></a>${blockUp}${blockDown}<a class="delete_block" title="Delete Block"></a></div><textarea${blockId}${blockClass} ${blockStyle} draggable="true" ondragstart="onBlockDragStart(event);" ondragend="onBlockDragEnd(event);" ondragover="onDropToBlock(event);" ondragleave="onDropToBlock(event);" ondrop="onDropToBlock(event);">${block.content}</textarea>`;
                            break;

                        case "joomlamodule":
                            sparkyHTML += `<div class="block_settings_buttons sparky_block${k}"><a class="block_settings" title="Block Settings"></a><a class="add_block_after_block" title="Add Block"></a><a class="copy_block" title="Copy Block"></a>${blockUp}${blockDown}<a class="delete_block" title="Delete Block"></a></div><div${blockId}${blockClass} ${blockStyle} draggable="true" ondragstart="onBlockDragStart(event);" ondragend="onBlockDragEnd(event);" ondragover="onDropToBlock(event);" ondragleave="onDropToBlock(event);" ondrop="onDropToBlock(event);">${block.content}</div>`;
                            break;

                        default:
                            break;

                    }
                    k++;
                    dz++;

                });

            j++;

            sparkyHTML += `<div class="add_block_container"><a class="add_block" title="Add Block"></a></div></div>`;

        });

        i++;

        if ( row.id === "system-readmore" || row.class.includes("system-pagebreak") ) {
            sparkyHTML += `</hr>`;
        } else {
            sparkyHTML += `</div></div>`;
        }

    });

    sparkyHTML += `<div class="sparky_bottom_actions"><div id="add_sparky_row"><a title="Add Row">Add Row</a></div><div class="joomla_buttons_container"><div id="add_read_more"><a title="Read More Tag">Read More</a></div><div id="add_page_break"><a title="Page Break Tag">Page Break</a></div></div></div>`;

    return sparkyHTML;

}
// initially create editable content from array
sparkyPageContentEditable.innerHTML = createEditableContentFromArray(sparkyPageContentArray);



//// V


function createRealContentFromArray(arr) {

    // sparkyHTMLTextarea is html for textarea (without interface)
    let sparkyHTMLTextarea = "";
    let i = 0;

    arr.forEach(function(row){

        // re-count row class name - "sparky_rowX" must be in order: 0, 1, 2...
        let rowClassArr = [];
        let rowStyle = sparkyInlineStyle(row.style);
        rowClassArr = row.class.split("sparky_row");
        if ( !row.class.includes("system-pagebreak") ) {
            row.class = rowClassArr[0] + "sparky_row" + i;
        }
        
        if ( row.id === "system-readmore" ) {
            sparkyHTMLTextarea += `<hr id="${row.id}" />
`;
        } else if ( row.class.includes("system-pagebreak") ) {
            sparkyHTMLTextarea += `<hr id="${row.id}" class="system-pagebreak" title="${row.title}" alt="${row.alias}" />
            `;
        } else {
            sparkyHTMLTextarea += `<div id="${row.id}" class="${row.class}" ${rowStyle}>
        <div class="sparky_page_container">
            `;
        }

        let j = 0;

        row.content.forEach(function(column){

            // re-calc column class name - "sparky_colX" must be in order: 0, 1, 2...
            let columnStyle = sparkyInlineStyle(column.style);

            // animation
            let columnAnimationDelay = "";
            let columnAnimationType = "";
            if (column.animation[0]) {
                columnAnimationDelay = ' data-delay="' + column.animation[1] + '"';
                columnAnimationType = ' data-animation="' + column.animation[2] + '"';
            }

            column.class = "sparkle" + column.cols + column.animation[0] + " sparky_cell sparky_col" + j;

            sparkyHTMLTextarea += `<div class="${column.class}" ${columnStyle}${columnAnimationDelay}${columnAnimationType}>`;

                column.content.forEach(function(block){

                    let blockId = "";
                    let blockClass = "";
                    let blockStyle = sparkyInlineStyle(block.style);
                    let blockAlt = "";
                    let blockTarget = "";

                    if (block.id) blockId = ` id="${block.id}"`;
                    if (block.class) blockClass = ` class="${block.class}"`;
                    if (block.alt) blockAlt = block.alt;
                    if (block.target) blockTarget = ' target="_blank"';

                    switch (block.type) {

                        case "paragraph":
                            sparkyHTMLTextarea += `<p${blockId}${blockClass}${blockStyle}>${block.content}</p>`;
                            break;

                        case "heading":
                            sparkyHTMLTextarea += `<${block.level}${blockId}${blockClass}${blockStyle}>`;
                            if ( block.link && ! block.content.includes("href=") ) {
                                sparkyHTMLTextarea += `<a href="${block.link}"${blockTarget}>`;
                            }
                            sparkyHTMLTextarea += block.content;
                            if ( block.link && ! block.content.includes("href=") ) {
                                sparkyHTMLTextarea += `</a>`;
                            }
                            sparkyHTMLTextarea += `</${block.level}>`;
                            break;

                        case "image":
                            sparkyHTMLTextarea += `<figure>`;
                            if ( block.link ) {
                                sparkyHTMLTextarea += `<a href="${block.link}"${blockTarget}>`;
                            }
                            sparkyHTMLTextarea += `<img${blockId}${blockClass} ${blockStyle} src="${block.src}" alt="${blockAlt}" />`;
                            if ( block.link ) {
                                sparkyHTMLTextarea += `</a>`;
                            }
                            sparkyHTMLTextarea += `</figure>`;
                            break;

                        case "separator":
                            sparkyHTMLTextarea += `<hr${blockId}${blockClass}${blockStyle}/>`;
                            break;

                        case "spacer":
                            if (!blockStyle) {
                                blockStyle = " style='height:50px'";
                            }
                            sparkyHTMLTextarea += `<div${blockId}${blockClass}${blockStyle}></div>`;
                            break;

                        case "button":
                            sparkyHTMLTextarea += `<a href="${block.link}"${blockTarget}${blockId}${blockClass}${blockStyle}>${block.content}</a>`;
                            break;

                        case "list":
                            sparkyHTMLTextarea += `<${block.listType}${blockId}${blockClass}${blockStyle}>${block.content}</${block.listType}>`;
                            break;

                        case "iframe":
                            sparkyHTMLTextarea += `<iframe${blockId}${blockClass}${blockStyle} src="${block.src}"></iframe>`;
                            break;

                        case "video":
                            let videoPoster = "";
                            let videoMp4 = "";
                            let videoOgg = "";
                            let videoWebm = "";
                            let videoAutoplay = "";
                            let videoControls = "";
                            let videoLoop = "";
                            let videoMuted = "";
                            if (block.poster) {
                                videoPoster = `poster="${block.poster}" `;
                            }
                            if (block.mp4) {
                                videoMp4 = `<source src="${block.mp4}" type="video/mp4">`;
                            }
                            if (block.ogg) {
                                videoOgg = `<source src="${block.ogg}" type="video/ogg">`;
                            }
                            if (block.webm) {
                                videoWebm = `<source src="${block.webm}" type="video/webm">`;
                            }
                            if (block.autoplay) {
                                videoAutoplay = " autoplay";
                            }
                            if (block.controls) {
                                videoControls = " controls";
                            }
                            if (block.loop) {
                                videoLoop = " loop";
                            }
                            if (block.muted) {
                                videoMuted = " muted";
                            }
                            sparkyHTMLTextarea += `<video${blockId}${blockClass} ${blockStyle} ${videoPoster}${videoAutoplay}${videoControls}${videoLoop}${videoMuted}>${videoMp4}${videoOgg}${videoWebm}Your browser does not support the video element.</video>`;
                            break;

                        case "audio":
                            let audioMp3 = "";
                            let audioOgg = "";
                            let audioWav = "";
                            let audioAutoplay = "";
                            let audioControls = "";
                            let audioLoop = "";
                            let audioMuted = "";
                            if (block.mp3) {
                                audioMp3 = `<source src="${block.mp3}" type="audio/mpeg">`;
                            }
                            if (block.ogg) {
                                audioOgg = `<source src="${block.ogg}" type="audio/ogg">`;
                            }
                            if (block.wav) {
                                audioWav = `<source src="${block.wav}" type="audio/wav">`;
                            }
                            if (block.autoplay) {
                                audioAutoplay = " autoplay";
                            }
                            if (block.controls) {
                                audioControls = " controls";
                            }
                            if (block.loop) {
                                audioLoop = " loop";
                            }
                            if (block.muted) {
                                audioMuted = " muted";
                            }
                            sparkyHTMLTextarea += `<audio${blockId}${blockClass} ${blockStyle}${audioAutoplay}${audioControls}${audioLoop}${audioMuted}>${audioMp3}${audioOgg}${audioWav}Your browser does not support the audio element.</audio>`;
                            break;

                        case "icon":
                            let blockLinkStart = "";
                            let blockLinkEnd = "";
                            // fa icons class is: category + class
                            blockClass = ` class="${block.category} ${block.class}"`;

                            if ( block.link ) {
                                blockLinkStart = `<a href="${block.link}" ${blockTarget}  class="sparky_icon_link">`;
                                blockLinkEnd = "</a>";
                            }

                            sparkyHTMLTextarea += `${blockLinkStart}<i${blockId}${blockClass}${blockStyle} aria-hidden="true"></i>${blockLinkEnd}`;
                            break;

                        case "social":
                            let social_network_html = "";

                            if (block.network1)
                                social_network_html += `<a class="sparky_social_icon1" href="${block.link1}"${blockTarget} ><i class="fab fa-${block.network1}" aria-hidden="true"></i></a>`;
                            if (block.network2)
                                social_network_html += `<a class="sparky_social_icon2" href="${block.link2}"${blockTarget} ><i class="fab fa-${block.network2}" aria-hidden="true"></i></a>`;
                            if (block.network3)
                                social_network_html += `<a class="sparky_social_icon3" href="${block.link3}"${blockTarget} ><i class="fab fa-${block.network3}" aria-hidden="true"></i></a>`;
                            if (block.network4)
                                social_network_html += `<a class="sparky_social_icon4" href="${block.link4}"${blockTarget} ><i class="fab fa-${block.network4}" aria-hidden="true"></i></a>`;
                            if (block.network5)
                                social_network_html += `<a class="sparky_social_icon5" href="${block.link5}"${blockTarget} ><i class="fab fa-${block.network5}" aria-hidden="true"></i></a>`;
                            if (block.network6)
                                social_network_html += `<a class="sparky_social_icon6" href="${block.link6}"${blockTarget} ><i class="fab fa-${block.network6}" aria-hidden="true"></i></a>`;

                            sparkyHTMLTextarea += `<div${blockId}${blockClass} ${blockStyle}>${social_network_html}</div>`;
                            break;

                        case "customhtml":
                            sparkyHTMLTextarea += `<div${blockId}${blockClass}${blockStyle}>${block.content}</div>`;
                            break;

                        case "joomlamodule":
                            sparkyHTMLTextarea += `<div${blockId}${blockClass}${blockStyle}>${block.content}</div>`;
                            break;

                        default:
                            break;

                    }

                });

                j++;

                sparkyHTMLTextarea += `</div>
            `;

        });

        if ( row.id !== "system-readmore" && !row.class.includes("system-pagebreak") ) {
            sparkyHTMLTextarea += `</div>
</div>
`;
        }

        i++;

    });

    return sparkyHTMLTextarea;
}
// initially put HTML to the textarea
sparkyEditorTextarea.value = createRealContentFromArray(sparkyPageContentArray);




//// VI events

// disable draggable temporarily on editable elements (firefox bug)
function sparkyEditorDraggableEditableEvents(){
    // select all draggable elements
    let draggableElements = document.querySelectorAll('[draggable="true"]');

    // in Firefox, user must double-click editable element to select text (otherwise, dragndrop used)
    Array.from(draggableElements).forEach(function(element){
        element.addEventListener('dblclick', function(event){
            sparkyDisableDraggable(draggableElements);
        });
    });

    // on blur (element deselect), all draggable elements are draggable again
    Array.from(draggableElements).forEach(function(element){
        element.addEventListener('blur', function(event){
            sparkyEnableDraggable(draggableElements);
        });
    });
}
sparkyEditorDraggableEditableEvents();


function rangeToHtml(contentRange) {
    let contentContainer = document.createElement("div");
    contentContainer.appendChild(contentRange.cloneContents());
    return contentContainer.innerHTML;
}

function splitParagraphAtSelection(paragraphElement, selectionRange) {
    let contentBeforeRange = document.createRange();
    contentBeforeRange.selectNodeContents(paragraphElement);
    contentBeforeRange.setEnd(selectionRange.startContainer, selectionRange.startOffset);

    let contentAfterRange = document.createRange();
    contentAfterRange.selectNodeContents(paragraphElement);
    contentAfterRange.setStart(selectionRange.endContainer, selectionRange.endOffset);

    return {
        before: normalizeBoldTagsInHtml(rangeToHtml(contentBeforeRange)),
        after: normalizeBoldTagsInHtml(rangeToHtml(contentAfterRange))
    };
}

function queueParagraphFocus(rowPosition, columnPosition, blockPosition) {
    pendingParagraphFocus = {
        row: Number(rowPosition),
        column: Number(columnPosition),
        block: Number(blockPosition)
    };
}

function applyPendingParagraphFocus() {
    if (!pendingParagraphFocus) {
        return;
    }

    const selector = ".sparky_row" + pendingParagraphFocus.row + " .sparky_col" + pendingParagraphFocus.column + " .sparky_block" + pendingParagraphFocus.block;
    const blockSettings = sparkyPageContentEditable.querySelector(selector);
    const paragraphElement = blockSettings ? blockSettings.nextSibling : null;

    if (paragraphElement && paragraphElement.nodeName === "P") {
        paragraphElement.focus();

        let caretRange = document.createRange();
        caretRange.selectNodeContents(paragraphElement);
        caretRange.collapse(true);

        let selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(caretRange);
    }

    pendingParagraphFocus = null;
}


// edit text in paragraph or heading

sparkyPageContentEditable.addEventListener('input', function(event) {

    //sparkyDisableDraggable(draggableElements);
    
    // When content is edited update array

    let targetElement = event.target.nodeType === Node.TEXT_NODE ? event.target.parentElement : event.target;
    let blockElement = targetElement;
    while (
        blockElement
        &&
        blockElement !== sparkyPageContentEditable
        &&
        (!blockElement.previousElementSibling || !blockElement.previousElementSibling.classList.contains("block_settings_buttons"))
    ) {
        blockElement = blockElement.parentElement;
    }

    if (!blockElement || blockElement === sparkyPageContentEditable) {
        return;
    }

    // Find block position in array
    let rowElement = blockElement.closest(".sparky_page_row");
    let columnElement = blockElement.closest(".sparky_cell");
    if (!rowElement || !columnElement) {
        return;
    }

    let rowMatch = rowElement.className.match(/sparky_row(\d+)/);
    if (!rowMatch) {
        return;
    }
    let row = Number(rowMatch[1]);

    let columnMatch = columnElement.className.match(/sparky_col(\d+)/);
    if (!columnMatch) {
        return;
    }
    let column = Number(columnMatch[1]);

    let blockMatch = blockElement.previousElementSibling.className.match(/sparky_block(\d+)/);
    if (!blockMatch) {
        return;
    }
    let block = Number(blockMatch[1]);

    // Update array
    if (blockElement.nodeName === "TEXTAREA") {
        sparkyPageContentArray[row].content[column].content[block].content = blockElement.value;
    } else {
        sparkyPageContentArray[row].content[column].content[block].content = normalizeBoldTagsInHtml(blockElement.innerHTML);
    }
    
    // Update HTML in the textarea (can't use refreshSparky(), it blocks typing)
    sparkyEditorTextarea.value = createRealContentFromArray(sparkyPageContentArray);

    // editable content changed - refresh events!
    //sparkyEditorButtonsEvents();

});

sparkyPageContentEditable.addEventListener('keydown', function(event) {
    if (event.key !== "Enter" || event.shiftKey || event.target.nodeName !== "P") {
        return;
    }

    let selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
        return;
    }

    let selectionRange = selection.getRangeAt(0);
    if (!event.target.contains(selectionRange.startContainer) || !event.target.contains(selectionRange.endContainer)) {
        return;
    }

    event.preventDefault();

    // Find block position in array
    let row = event.target.parentNode.parentNode.parentNode.className;
    row = row.split("sparky_row")[row.split("sparky_row").length-1];

    let column = event.target.parentNode.className;
    column = column.split("sparky_col")[column.split("sparky_col").length-1];

    let block = event.target.previousSibling.className;
    block = block.split("sparky_block")[block.split("sparky_block").length-1];

    let splitParagraphContent = splitParagraphAtSelection(event.target, selectionRange);
    let currentParagraphBlock = sparkyPageContentArray[row].content[column].content[block];
    let newParagraphBlock = JSON.parse(JSON.stringify(currentParagraphBlock));
    newParagraphBlock.id = "";

    currentParagraphBlock.content = splitParagraphContent.before;
    newParagraphBlock.content = splitParagraphContent.after;

    sparkyPageContentArray[row].content[column].content.splice(Number(block) + 1, 0, newParagraphBlock);

    queueParagraphFocus(row, column, Number(block) + 1);
    refreshSparky();
});

// on paste, convert clipboard content to text (except for custom HTML)

sparkyPageContentEditable.addEventListener("paste", function(event) {
    if (event.target.nodeName !== "TEXTAREA") {
        // cancel paste
        event.preventDefault();

        // get text representation of clipboard
        let text = (event.originalEvent || event).clipboardData.getData('text/plain');

        // insert text manually
        document.execCommand("insertHTML", false, text);
    }
    
});


function sparkyEditorButtonsEvents() {

    initBlockToolbarVisibility();

    // add row event

    document.getElementById("add_sparky_row").addEventListener("click", function() {
        addRowInsertAfterPosition = null;
        sparky_modal( "add_row_modal" );
        
    });

    // add read more event

    document.getElementById("add_read_more").addEventListener("click", function() {

        // if already read more tag, remove it from the array
        let i = 0;
        sparkyPageContentArray.forEach(function(row){
            if ( row.id === "system-readmore" ) {
                sparkyPageContentArray.splice(i, 1);
            }
            i++;
        })

        // add read more tag as the last element to the array
        sparkyPageContentArray.push({
            id: "system-readmore",
            class: "",
            style: "",
            content: []
        });

        refreshSparky();
        
    });

    // add page break event

    document.getElementById("add_page_break").addEventListener("click", function() {

        // add page break tag as the last element to the array
        sparkyPageContentArray.push({
            id: generateRandomRowId(),
            class: "system-pagebreak",
            title: "Page Break Title",
            alias: "Table of Contents Alias",
            style: "",
            content: []
        });

        refreshSparky();
        
    });

    // row settings event

    let rowSettingsEditorButtons = document.getElementsByClassName("row_settings");
    Array.from(rowSettingsEditorButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {
            sparky_modal( "row_settings_modal" );
        });

    });

    // page break settings event

    let pageBreakSettingsEditorButtons = document.getElementsByClassName("page_break_settings");
    Array.from(pageBreakSettingsEditorButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {
            sparky_modal( "page_break_settings_modal" );
        });

    });

    // copy row event

    let copyRowEditorButtons = document.getElementsByClassName("copy_row");
    Array.from(copyRowEditorButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {
            
            // event.composedPath()[3].className -> row position (.sparky_rowX)
            // event.composedPath()[2].className -> col position (.sparky_colX)
            // event.composedPath()[1].className -> block position (.sparky_blockX)
            let sparkyRowPosition = determineRowPosition(event.composedPath()[1].nextSibling.className);

            let copiedRow = sparkyPageContentArray[sparkyRowPosition];

            // row must be copied this way, otherwise it will be just a "reference"
            let newRow = JSON.parse(JSON.stringify(copiedRow));

            // generate random row id
            newRow.id = generateRandomRowId();

            // add copied row to array
            sparkyPageContentArray.splice(sparkyRowPosition, 0, newRow);

            refreshSparky();

        });

    });

    // add row below event
    let addRowAfterEditorButtons = document.getElementsByClassName("add_row_after");
    Array.from(addRowAfterEditorButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {
            addRowInsertAfterPosition = Number(determineRowPosition(event.target.parentNode.nextSibling.className));
            sparky_modal( "add_row_modal" );
        });

    });

    // row up event

    let rowUpEditorButtons = document.getElementsByClassName("row_up");
    Array.from(rowUpEditorButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {

            let sparkyRowPosition = Number(determineRowPosition(event.composedPath()[1].nextSibling.className));

            if ( sparkyRowPosition - 1 >= 0 ) {
                queueRowControlScroll(sparkyRowPosition - 1, "row_up", event.clientY);
                sparkyPageContentArray = moveArrayItemToNewIndex(sparkyPageContentArray, sparkyRowPosition, sparkyRowPosition - 1);
                refreshSparky();
            }

        });

    });

    // row down event

    let rowDownEditorButtons = document.getElementsByClassName("row_down");
    Array.from(rowDownEditorButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {

            let sparkyRowPosition = Number(determineRowPosition(event.composedPath()[1].nextSibling.className));

            if ( sparkyPageContentArray.length - 1 > sparkyRowPosition ) {
                queueRowControlScroll(sparkyRowPosition + 1, "row_down", event.clientY);
                sparkyPageContentArray = moveArrayItemToNewIndex(sparkyPageContentArray, sparkyRowPosition, sparkyRowPosition + 1);
                refreshSparky();
            }

        });

    });

    // delete row event

    let deleteRowEditorButtons = document.getElementsByClassName("delete_row");
    Array.from(deleteRowEditorButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {

            let confirm_delete = confirm("Please confirm row deletion!");
            if (confirm_delete === true) {

                let sparkyRowPosition = determineRowPosition(event.composedPath()[1].nextSibling.className);
                sparkyPageContentArray.splice(sparkyRowPosition, 1);

                refreshSparky();

            }

        });

    });

    // column settings event

    let columnSettingsEditorButtons = document.getElementsByClassName("column_settings");
    Array.from(columnSettingsEditorButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {
            sparky_modal( "column_settings_modal" );
        });

    });

    // column increase event

    let columnIncreaseEditorButtons = document.getElementsByClassName("column_increase");
    Array.from(columnIncreaseEditorButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {
            
            let sparkyRowPosition = determineRowPosition(event.target.parentNode.parentNode.parentNode.parentNode.className);
            let sparkyColumnPosition = determineColumnPosition(event.target.parentNode.parentNode.className);

            // overall columns in the row
            let columns = 0;
            Array.from(sparkyPageContentArray[sparkyRowPosition].content).forEach(function(column) {
                columns += column.cols;
            });
            
            if ( columns < 12 ) {

                sparkyPageContentArray[sparkyRowPosition].content[sparkyColumnPosition].cols++;
                refreshSparky();

            } else {
                alert("No more space! Please reduce some columns.");
            }

        });

    });

    // column decrease event

    let columnDecreaseEditorButtons = document.getElementsByClassName("column_decrease");
    Array.from(columnDecreaseEditorButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {

            let sparkyRowPosition = determineRowPosition(event.target.parentNode.parentNode.parentNode.parentNode.className);
            let sparkyColumnPosition = determineColumnPosition(event.target.parentNode.parentNode.className);

            // don't decrease column if width = 1
            if ( sparkyPageContentArray[sparkyRowPosition].content[sparkyColumnPosition].cols > 1 ) {

                sparkyPageContentArray[sparkyRowPosition].content[sparkyColumnPosition].cols--;
                refreshSparky();

            } else {
                alert("This column has a minimum width.");
            }

        });

    });

    // column add event
    let columnAddEditorButtons = document.getElementsByClassName("add_column");
    Array.from(columnAddEditorButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {

            let sparkyRowPosition = determineRowPosition(event.target.parentNode.nextSibling.className);

            // overall columns in the row and remaining space
            let columns = 0;
            let remainingSpace = 0;
            let i = -1;
            Array.from(sparkyPageContentArray[sparkyRowPosition].content).forEach(function(column) {
                columns += column.cols;
                i++;
            });
            remainingSpace = 12 - columns;

            if ( remainingSpace > 0 ) {

                sparkyPageContentArray[sparkyRowPosition].content.push({
                    id: "",
                    class: "sparkle" + remainingSpace + " sparky_cell sparky_col" + i,
                    style: {},
                    cols: remainingSpace,
                    animation: [ "", 0, "" ],
                    content: []
                });
                refreshSparky();

            } else {
                alert("No more space! Please reduce some columns.");
            }
            

        });

    });

    // column left event

    let columnLeftEditorButtons = document.getElementsByClassName("column_left");
    Array.from(columnLeftEditorButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {

            let sparkyRowPosition = determineRowPosition(event.target.parentNode.parentNode.parentNode.parentNode.className);
            let sparkyColumnPosition = determineColumnPosition(event.target.parentNode.parentNode.className);

            if ( Number(sparkyColumnPosition) > 0 ) {
                moveArrayItemToNewIndex(sparkyPageContentArray[sparkyRowPosition].content, Number(sparkyColumnPosition), Number(sparkyColumnPosition) - 1);
                refreshSparky();
            }

        });

    });

    // column right event

    let columnRightEditorButtons = document.getElementsByClassName("column_right");
    Array.from(columnRightEditorButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {

            let sparkyRowPosition = determineRowPosition(event.target.parentNode.parentNode.parentNode.parentNode.className);
            let sparkyColumnPosition = determineColumnPosition(event.target.parentNode.parentNode.className);

            if ( sparkyPageContentArray[sparkyRowPosition].content.length - 1 > Number(sparkyColumnPosition) ) {
                moveArrayItemToNewIndex(sparkyPageContentArray[sparkyRowPosition].content, Number(sparkyColumnPosition), Number(sparkyColumnPosition) + 1);
                refreshSparky();
            }

        });

    });

    // column delete event

    let columnDeleteEditorButtons = document.getElementsByClassName("delete_column");
    Array.from(columnDeleteEditorButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {

            let confirm_delete = confirm("Please confirm column deletion!");
            if (confirm_delete === true) {

                let sparkyRowPosition = determineRowPosition(event.target.parentNode.parentNode.parentNode.parentNode.className);
                let sparkyColumnPosition = determineColumnPosition(event.target.parentNode.parentNode.className);

                sparkyPageContentArray[sparkyRowPosition].content.splice(sparkyColumnPosition, 1);
                refreshSparky();

            }

        });

    });



    // add block event

    let addBlockEditorButtons = document.getElementsByClassName("add_block");
    Array.from(addBlockEditorButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {
            sparky_modal( "add_block_modal" );
        });

    });

    let addBlockAfterBlockButtons = document.getElementsByClassName("add_block_after_block");
    Array.from(addBlockAfterBlockButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {
            sparky_modal( "add_block_modal" );
        });

    });

    // block settings event

    let blockSettingsEditorButtons = document.getElementsByClassName("block_settings");
    Array.from(blockSettingsEditorButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {

            let blockType = determineBlockType(event.target.parentNode.nextSibling);

            if (blockType === "paragraph")
                sparky_modal( "block_settings_modal_paragraph" );
            if (blockType === "heading")
                sparky_modal( "block_settings_modal_heading" );
            if (blockType === "image")
                sparky_modal( "block_settings_modal_image" );
            if (blockType === "separator")
                sparky_modal( "block_settings_modal_separator" );
            if (blockType === "spacer")
                sparky_modal( "block_settings_modal_spacer" );
            if (blockType === "button")
                sparky_modal( "block_settings_modal_button" );
            if (blockType === "list")
                sparky_modal( "block_settings_modal_list" );
            if (blockType === "icon")
                sparky_modal( "block_settings_modal_icon" );
            if (blockType === "iframe")
                sparky_modal( "block_settings_modal_iframe" );
            if (blockType === "video")
                sparky_modal( "block_settings_modal_video" );
            if (blockType === "audio")
                sparky_modal( "block_settings_modal_audio" );
            if (blockType === "social")
                sparky_modal( "block_settings_modal_social" );
            if (blockType === "customhtml")
                sparky_modal( "block_settings_modal_customhtml" );
            if (blockType === "joomlamodule")
                sparky_modal( "block_settings_modal_joomlamodule" );

        });

    });


    function isValidInlineTextSelection(selection, targetBlock) {
        const anchorNode = selection ? (selection.anchorNode || selection.baseNode) : null;
        const focusNode = selection ? (selection.focusNode || selection.extentNode) : null;

        if (!selection || !anchorNode || !focusNode || !targetBlock) {
            return false;
        }

        if (selection.type !== "Range" || selection.rangeCount === 0) {
            return false;
        }

        if (!selection.toString().trim()) {
            return false;
        }

        return targetBlock.contains(anchorNode) && targetBlock.contains(focusNode);
    }

    function applyInlineTextCommand(buttonClassName, command) {
        let commandButtons = document.getElementsByClassName(buttonClassName);

        Array.from(commandButtons).forEach(function(button) {
            button.addEventListener("click", function(event) {
                let selection = window.getSelection();
                let targetBlock = event.target.parentNode.nextSibling;

                if (!isValidInlineTextSelection(selection, targetBlock)) {
                    alert("Please select a part of the text first.");
                    return;
                }

                document.execCommand(command, false, null);
                targetBlock.dispatchEvent(new Event("input", { bubbles: true }));
            });
        });
    }

    function isHeadingTag(nodeName) {
        return [ "H1", "H2", "H3", "H4", "H5", "H6" ].includes(nodeName);
    }

    // add link to paragraph event

    let addParagraphLinkButtons = document.getElementsByClassName("add_paragraph_link");
    Array.from(addParagraphLinkButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {
            const selection = window.getSelection();
            const anchorNode = selection ? (selection.anchorNode || selection.baseNode) : null;

            if (anchorNode) {
                // check if selection is inside existing link, and existing link is in paragraph or list item
                if ( anchorNode.parentNode.nodeName === "A" ) {
                    if (anchorNode.parentNode.parentNode.nodeName === "P" || anchorNode.parentNode.parentNode.nodeName === "LI") {
                        sparky_modal( "add_link_modal" );
                    }
                } else {
                    // open modal if some text is selected
                    if ( selection.type === "Range" && selection.rangeCount > 0 ) {
                        // check if selected text is inside this paragraph (first case)
                        // or inside list item (second case)
                        if (
                            anchorNode.parentNode === event.target.parentNode.nextSibling
                            ||
                            anchorNode.parentNode.parentNode === event.target.parentNode.nextSibling
                        ) {
                            sparky_modal( "add_link_modal" );
                        }
                    } else {
                        alert("Please select two or more characters of text where you want to add a link.")
                    }
                }
            } else {
                alert("Please select a part of the text first.")
            }
            
        });

    });

    // add link to heading event
    let addHeadingLinkButtons = document.getElementsByClassName("add_heading_link");
    Array.from(addHeadingLinkButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {
            const selection = window.getSelection();
            const anchorNode = selection ? (selection.anchorNode || selection.baseNode) : null;

            if (event.target.className.includes("heading_link_disabled")) {
                alert("Link icon is disabled while the Heading Settings link is in use.");
                return;
            }

            if (anchorNode) {
                // check if selection is inside existing link and existing link is in heading
                if ( anchorNode.parentNode.nodeName === "A" ) {
                    if (isHeadingTag(anchorNode.parentNode.parentNode.nodeName)) {
                        sparky_modal( "add_link_modal" );
                    }
                } else {
                    // open modal if some text is selected
                    if ( selection.type === "Range" && selection.rangeCount > 0 ) {
                        if (
                            anchorNode.parentNode === event.target.parentNode.nextSibling
                            ||
                            anchorNode.parentNode.parentNode === event.target.parentNode.nextSibling
                        ) {
                            sparky_modal( "add_link_modal" );
                        }
                    } else {
                        alert("Please select two or more characters of text where you want to add a link.")
                    }
                }
            } else {
                alert("Please select a part of the text first.")
            }
        });

    });

    applyInlineTextCommand("add_paragraph_bold", "bold");
    applyInlineTextCommand("add_paragraph_italic", "italic");
    applyInlineTextCommand("add_paragraph_underline", "underline");
    applyInlineTextCommand("add_heading_bold", "bold");
    applyInlineTextCommand("add_heading_italic", "italic");
    applyInlineTextCommand("add_heading_underline", "underline");

    // copy block event

    let copyBlockEditorButtons = document.getElementsByClassName("copy_block");
    Array.from(copyBlockEditorButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {
            
            // event.composedPath()[4].className -> row position (.sparky_rowX)
            // event.composedPath()[2].className -> col position (.sparky_colX)
            // event.composedPath()[1].className -> block position (.sparky_blockX)
            let sparkyBlockPosition = determineBlockPosition([event.composedPath()[4].className, event.composedPath()[2].className, event.composedPath()[1].className] );

            let columnArr = sparkyPageContentArray[sparkyBlockPosition[0]].content[sparkyBlockPosition[1]].content;
            let copiedBlock = sparkyPageContentArray[sparkyBlockPosition[0]].content[sparkyBlockPosition[1]].content[sparkyBlockPosition[2]];

            // block must be copied this way, otherwise it will be just a "reference"
            let newBlock = JSON.parse(JSON.stringify(copiedBlock));

            // add copied block to array
            columnArr.splice(sparkyBlockPosition[2], 0, newBlock);

            refreshSparky();

        });

    });

    // block up event

    let blockUpEditorButtons = document.getElementsByClassName("block_up");
    Array.from(blockUpEditorButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {

            // event.composedPath()[4].className -> row position (.sparky_rowX)
            // event.composedPath()[2].className -> col position (.sparky_colX)
            // event.composedPath()[1].className -> block position (.sparky_blockX)
            let sparkyBlockPosition = determineBlockPosition([event.composedPath()[4].className, event.composedPath()[2].className, event.composedPath()[1].className] );

            if ( Number(sparkyBlockPosition[2]) > 0 ) {
                queueBlockControlScroll(sparkyBlockPosition[0], sparkyBlockPosition[1], Number(sparkyBlockPosition[2]) - 1, "block_up", event.clientY);
                moveArrayItemToNewIndex(sparkyPageContentArray[sparkyBlockPosition[0]].content[sparkyBlockPosition[1]].content, Number(sparkyBlockPosition[2]), Number(sparkyBlockPosition[2]) - 1);
                refreshSparky();
            }

        });

    });

    // block down event

    let blockDownEditorButtons = document.getElementsByClassName("block_down");
    Array.from(blockDownEditorButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {

            // event.composedPath()[4].className -> row position (.sparky_rowX)
            // event.composedPath()[2].className -> col position (.sparky_colX)
            // event.composedPath()[1].className -> block position (.sparky_blockX)
            let sparkyBlockPosition = determineBlockPosition([event.composedPath()[4].className, event.composedPath()[2].className, event.composedPath()[1].className] );

            if ( sparkyPageContentArray[sparkyBlockPosition[0]].content[sparkyBlockPosition[1]].content.length - 1 > Number(sparkyBlockPosition[2]) ) {
                queueBlockControlScroll(sparkyBlockPosition[0], sparkyBlockPosition[1], Number(sparkyBlockPosition[2]) + 1, "block_down", event.clientY);
                moveArrayItemToNewIndex(sparkyPageContentArray[sparkyBlockPosition[0]].content[sparkyBlockPosition[1]].content, Number(sparkyBlockPosition[2]), Number(sparkyBlockPosition[2]) + 1);
                refreshSparky();
            }

        });

    });

    // delete block event

    let deleteBlockEditorButtons = document.getElementsByClassName("delete_block");
    Array.from(deleteBlockEditorButtons).forEach(function(button) {

        button.addEventListener("click", function(event) {

            let confirm_delete = confirm("Please confirm block deletion!");
            if (confirm_delete === true) {
            
                // event.composedPath()[4].className -> row position (.sparky_rowX)
                // event.composedPath()[2].className -> col position (.sparky_colX)
                // event.composedPath()[1].className -> block position (.sparky_blockX)
                let sparkyBlockPosition = determineBlockPosition([event.composedPath()[4].className, event.composedPath()[2].className, event.composedPath()[1].className] );

                sparkyPageContentArray[sparkyBlockPosition[0]].content[sparkyBlockPosition[1]].content.splice(sparkyBlockPosition[2], 1);

                refreshSparky();

            }

        });

    });

}

function initBlockToolbarVisibility() {
    let blockToolbars = document.getElementsByClassName("block_settings_buttons");

    Array.from(blockToolbars).forEach(function(toolbar) {
        let blockElement = toolbar.nextElementSibling;
        if (!blockElement) {
            return;
        }
        let hideToolbarTimer = null;
        let showToolbarTimer = null;

        toolbar.classList.remove("block_toolbar_visible");
        blockElement.classList.remove("block_hover_shift");

        let clearHideToolbarTimer = function() {
            if (hideToolbarTimer !== null) {
                window.clearTimeout(hideToolbarTimer);
                hideToolbarTimer = null;
            }
        };

        let clearShowToolbarTimer = function() {
            if (showToolbarTimer !== null) {
                window.clearTimeout(showToolbarTimer);
                showToolbarTimer = null;
            }
        };

        let showToolbar = function() {
            clearShowToolbarTimer();
            clearHideToolbarTimer();
            toolbar.classList.add("block_toolbar_visible");
            blockElement.classList.add("block_hover_shift");
        };

        let hideToolbarIfInactive = function() {
            if (toolbar.contains(document.activeElement) || blockElement.contains(document.activeElement)) {
                return;
            }
            toolbar.classList.remove("block_toolbar_visible");
            blockElement.classList.remove("block_hover_shift");
        };

        let scheduleHideToolbarIfInactive = function() {
            clearShowToolbarTimer();
            clearHideToolbarTimer();
            hideToolbarTimer = window.setTimeout(hideToolbarIfInactive, 120);
        };

        let scheduleShowToolbar = function() {
            clearShowToolbarTimer();
            clearHideToolbarTimer();
            showToolbarTimer = window.setTimeout(showToolbar, 1000);
        };

        toolbar.addEventListener("mouseenter", scheduleShowToolbar);
        blockElement.addEventListener("mouseenter", scheduleShowToolbar);

        toolbar.addEventListener("mouseleave", scheduleHideToolbarIfInactive);
        blockElement.addEventListener("mouseleave", scheduleHideToolbarIfInactive);

        blockElement.addEventListener("focusin", showToolbar);
        blockElement.addEventListener("focusout", function() {
            scheduleHideToolbarIfInactive();
        });
    });
}
sparkyEditorButtonsEvents();
initSparkyUndoRedoToolbarButtons();
recordSparkyHistoryState();




//// VII drag and drop

let currentDragType = "";
let activeRowDropIndicator = null;
let activeRowDropIndicatorPosition = "";

function clearRowDropIndicator() {
    if (!activeRowDropIndicator) {
        return;
    }
    activeRowDropIndicator.classList.remove("sparky_row_drop_target_before", "sparky_row_drop_target_after");
    activeRowDropIndicator = null;
    activeRowDropIndicatorPosition = "";
}

function setRowDropIndicator(targetElement, insertAfterTarget) {
    if (!targetElement) {
        clearRowDropIndicator();
        return;
    }
    const nextPosition = insertAfterTarget ? "after" : "before";
    if (activeRowDropIndicator === targetElement && activeRowDropIndicatorPosition === nextPosition) {
        return;
    }

    clearRowDropIndicator();
    activeRowDropIndicator = targetElement;
    activeRowDropIndicatorPosition = nextPosition;
    activeRowDropIndicator.classList.add(insertAfterTarget ? "sparky_row_drop_target_after" : "sparky_row_drop_target_before");
}

function isRowDragEvent(event) {
    return currentDragType === "row";
}

function isColumnDragEvent(event) {
    return currentDragType === "column";
}


// drag and drop rows

function onRowDragStart(event) {
    if (event.currentTarget !== event.target) {
        return;
    }

    currentDragType = "row";
    clearColumnDropIndicator();
    clearBlockDropIndicator();
    event.dataTransfer.setData('text/plain', event.currentTarget.id);
    event.currentTarget.style.borderColor = 'red';

}

function onRowDragEnd(event){
    if (event.currentTarget !== event.target) {
        return;
    }
    currentDragType = "";
    clearRowDropIndicator();
    event.currentTarget.style.borderColor = '#ccc';
    //event.dataTransfer.clearData();

}

function onRowDragOver(event) {

    if (!isRowDragEvent(event)) {
        return;
    }
    event.preventDefault();
    const targetRect = event.currentTarget.getBoundingClientRect();
    const insertAfterTarget = event.clientY > (targetRect.top + targetRect.height / 2);
    setRowDropIndicator(event.currentTarget, insertAfterTarget);

}

function onRowDragLeave(event) {

    if (!isRowDragEvent(event)) {
        return;
    }
    event.preventDefault();

}

function onRowDrop(event) {

    event.preventDefault();
    clearRowDropIndicator();

    // check if dragged element is a row (if row id starts with "row_")
    if ( event.dataTransfer.getData('text').startsWith("row_") || event.dataTransfer.getData('text') === "system-readmore" ) {

        // row id that we are dragging
        const id = event.dataTransfer.getData('text');

        const targetRowClass = event.currentTarget.className;
        let oldRowPosition = determineRowPosition(document.getElementById(id).className);
        let newRowPosition = determineRowPosition(targetRowClass);

        const targetRect = event.currentTarget.getBoundingClientRect();
        if (event.clientY > (targetRect.top + targetRect.height / 2)) {
            newRowPosition++;
        }
        if (newRowPosition > oldRowPosition) {
            newRowPosition--;
        }

        sparkyPageContentArray = moveArrayItemToNewIndex(sparkyPageContentArray, oldRowPosition, newRowPosition);

        currentDragType = "";
        refreshSparky();

    }

    //event.dataTransfer.clearData();

}

// drag and drop columns

let draggedColumn;
let activeColumnDropIndicator = null;
let activeColumnDropIndicatorPosition = "";

function clearColumnDropIndicator() {
    if (!activeColumnDropIndicator) {
        return;
    }
    activeColumnDropIndicator.classList.remove("sparky_column_drop_target_before", "sparky_column_drop_target_after");
    activeColumnDropIndicator = null;
    activeColumnDropIndicatorPosition = "";
}

function setColumnDropIndicator(targetElement, insertAfterTarget) {
    if (!targetElement) {
        clearColumnDropIndicator();
        return;
    }

    const nextPosition = insertAfterTarget ? "after" : "before";
    if (activeColumnDropIndicator === targetElement && activeColumnDropIndicatorPosition === nextPosition) {
        return;
    }

    clearColumnDropIndicator();
    activeColumnDropIndicator = targetElement;
    activeColumnDropIndicatorPosition = nextPosition;
    activeColumnDropIndicator.classList.add(insertAfterTarget ? "sparky_column_drop_target_after" : "sparky_column_drop_target_before");
}

function onColumnDragStart(event) {
    if (event.currentTarget !== event.target) {
        return;
    }
    event.stopPropagation();

    currentDragType = "column";
    draggedColumn = event.currentTarget;
    clearBlockDropIndicator();

    event.dataTransfer.setData("column", event.currentTarget.outerHTML);
    event.dataTransfer.setData("parent_row", event.currentTarget.parentNode.parentNode.id);
    event.dataTransfer.setData("parent_row_class", event.currentTarget.parentNode.parentNode.className);
    event.dataTransfer.setData("column_class", event.currentTarget.className);
    event.currentTarget.style.borderColor = 'red';

}

function onColumnDragEnd(event){
    if (event.currentTarget !== event.target) {
        return;
    }
    currentDragType = "";
    event.currentTarget.style.borderColor = '#ccc';
    clearColumnDropIndicator();
    //event.dataTransfer.clearData();

}

function onColumnDragOver(event) {

    if (!isColumnDragEvent(event)) {
        return;
    }
    event.preventDefault();
    const targetRect = event.currentTarget.getBoundingClientRect();
    const insertAfterTarget = event.clientX > (targetRect.left + targetRect.width / 2);
    setColumnDropIndicator(event.currentTarget, insertAfterTarget);

}

function onColumnDragLeave(event) {

    if (!isColumnDragEvent(event)) {
        return;
    }
    event.preventDefault();

}

function onColumnDrop(event) {

    event.preventDefault();
    clearColumnDropIndicator();

    // prevent dropping columns to other rows
    if ( event.currentTarget.parentNode.parentNode.id !== event.dataTransfer.getData("parent_row") ) {
        return;
    }

    // Update main array

    // Row position
    let row = event.dataTransfer.getData("parent_row_class");
    row = row.split("sparky_row")[row.split("sparky_row").length-1];

    // Dragged column old order (per CSS class)
    let columnPos = event.dataTransfer.getData("column_class");
    columnPos = columnPos.split("sparky_col")[columnPos.split("sparky_col").length-1];

    let columnNewPos = event.currentTarget.className;
    columnNewPos = columnNewPos.split("sparky_col")[columnNewPos.split("sparky_col").length-1];

    const targetRect = event.currentTarget.getBoundingClientRect();
    if (event.clientX > (targetRect.left + targetRect.width / 2)) {
        columnNewPos++;
    }
    if (columnNewPos > columnPos) {
        columnNewPos--;
    }

    // Update index of the column in array (row's sub-array)
    sparkyPageContentArray[row].content = moveArrayItemToNewIndex(sparkyPageContentArray[row].content, columnPos, columnNewPos);

    //event.dataTransfer.clearData();

    currentDragType = "";
    refreshSparky();

}


// drag and drop blocks

let draggedBlock;
let draggedBlockSettings;
let activeBlockDropIndicator = null;
let activeBlockDropIndicatorPosition = "";

function clearBlockDropIndicator() {
    if (!activeBlockDropIndicator) {
        return;
    }
    activeBlockDropIndicator.classList.remove("sparky_block_drop_target_before", "sparky_block_drop_target_after");
    activeBlockDropIndicator = null;
    activeBlockDropIndicatorPosition = "";
}

function setBlockDropIndicator(targetElement, insertAfterTarget) {
    if (!targetElement) {
        clearBlockDropIndicator();
        return;
    }

    const nextPosition = insertAfterTarget ? "after" : "before";
    if (activeBlockDropIndicator === targetElement && activeBlockDropIndicatorPosition === nextPosition) {
        return;
    }

    clearBlockDropIndicator();
    activeBlockDropIndicator = targetElement;
    activeBlockDropIndicatorPosition = nextPosition;
    activeBlockDropIndicator.classList.add(insertAfterTarget ? "sparky_block_drop_target_after" : "sparky_block_drop_target_before");
}

function onDropToBlock(event) {
    event.stopPropagation();

    if (event.type === "dragover") {
        event.preventDefault();
        if (!draggedBlock || event.currentTarget === draggedBlock) {
            clearBlockDropIndicator();
            return;
        }
        const targetRect = event.currentTarget.getBoundingClientRect();
        const insertAfterTarget = event.clientY > (targetRect.top + targetRect.height / 2);
        setBlockDropIndicator(event.currentTarget, insertAfterTarget);
        return;
    }

    if (event.type === "dragleave") {
        event.preventDefault();
        return;
    }

    event.preventDefault();
    clearBlockDropIndicator();

    let startingRow = event.dataTransfer.getData("block_parent_row");
    startingRow = startingRow.split("sparky_row")[startingRow.split("sparky_row").length-1];

    let startingColumn = event.dataTransfer.getData("block_parent_column");
    startingColumn = startingColumn.split("sparky_col")[startingColumn.split("sparky_col").length-1];

    let startingBlock = event.dataTransfer.getData("block_position");
    startingBlock = startingBlock.split("sparky_block")[startingBlock.split("sparky_block").length-1];

    let targetRow = event.currentTarget.parentNode.parentNode.parentNode.className;
    targetRow = targetRow.split("sparky_row")[targetRow.split("sparky_row").length-1];

    let targetColumn = event.currentTarget.parentNode.className;
    targetColumn = targetColumn.split("sparky_col")[targetColumn.split("sparky_col").length-1];

    let targetBlock = event.currentTarget.previousSibling.className;
    targetBlock = targetBlock.split("sparky_block")[targetBlock.split("sparky_block").length-1];

    const targetRect = event.currentTarget.getBoundingClientRect();
    const insertAfterTarget = event.clientY > (targetRect.top + targetRect.height / 2);
    let targetIndex = Number(targetBlock) + (insertAfterTarget ? 1 : 0);

    let blockToInsert = sparkyPageContentArray[startingRow].content[startingColumn].content[startingBlock];
    let whereToInsert = sparkyPageContentArray[targetRow].content[targetColumn].content;
    whereToInsert.splice(targetIndex, 0, blockToInsert);

    let whereToRemove = sparkyPageContentArray[startingRow].content[startingColumn].content;
    if (whereToInsert === whereToRemove && Number(startingBlock) >= targetIndex) {
        startingBlock++;
    }
    whereToRemove.splice(startingBlock, 1);

    currentDragType = "";
    refreshSparky();
}

function onBlockDragStart(event) {
    if (event.currentTarget !== event.target) {
        return;
    }
    event.stopPropagation();

    currentDragType = "block";
    // display block drop zones
    blockDropZones(true, event.currentTarget);

    draggedBlock = event.currentTarget;
    draggedBlockSettings = event.currentTarget.previousSibling;
    clearColumnDropIndicator();

    event.dataTransfer.setData("block_parent_row", event.currentTarget.parentNode.parentNode.parentNode.className);
    event.dataTransfer.setData("block_parent_column", event.currentTarget.parentNode.className);
    event.dataTransfer.setData("block_position", event.currentTarget.previousSibling.className);
    event.dataTransfer.setData("block", event.currentTarget.previousSibling.outerHTML + event.currentTarget.outerHTML);
    event.currentTarget.style.borderColor = 'red';

}

function onImageDragStart(event) {

    return false;

}

function onBlockDragEnd(event){
    if (event.currentTarget !== event.target) {
        return;
    }

    // deactivate row drop zones
    blockDropZones(false, event.currentTarget);
    clearBlockDropIndicator();
    draggedBlock = null;
    currentDragType = "";

    event.currentTarget.style.borderColor = '#ccc';
    //event.dataTransfer.clearData();

}

function onBlockDragOver(event) {

    event.preventDefault();
    if (!draggedBlock || event.currentTarget === draggedBlock) {
        clearBlockDropIndicator();
        return;
    }
    const targetRect = event.currentTarget.getBoundingClientRect();
    const insertAfterTarget = event.clientY > (targetRect.top + targetRect.height / 2);
    setBlockDropIndicator(event.currentTarget, insertAfterTarget);

}

function onBlockDragLeave(event) {

    event.preventDefault();

}

function onBlockDrop(event) {

    event.preventDefault();

    // Get dragged block starting position and target position

    // Starting row position
    let startingRow = event.dataTransfer.getData("block_parent_row");
    startingRow = startingRow.split("sparky_row")[startingRow.split("sparky_row").length-1];

    // Starting column position
    let startingColumn = event.dataTransfer.getData("block_parent_column");
    startingColumn = startingColumn.split("sparky_col")[startingColumn.split("sparky_col").length-1];

    // Starting block position
    let startingBlock = event.dataTransfer.getData("block_position");
    startingBlock = startingBlock.split("sparky_block")[startingBlock.split("sparky_block").length-1];

    // Target row position
    let targetRow = event.target.parentNode.parentNode.parentNode.className;
    targetRow = targetRow.split("sparky_row")[targetRow.split("sparky_row").length-1];

    // Target column position
    let targetColumn = event.target.parentNode.className;
    targetColumn = targetColumn.split("sparky_col")[targetColumn.split("sparky_col").length-1];

    // Target block position
    let targetBlock = event.target.getAttribute("data-blockdropzone");


    // Update main array

    // Move to the new position
    let blockToInsert = sparkyPageContentArray[startingRow].content[startingColumn].content[startingBlock];
    let whereToInsert = sparkyPageContentArray[targetRow].content[targetColumn].content;
    whereToInsert.splice(targetBlock, 0, blockToInsert);

    // Delete from old position
    let whereToRemove = sparkyPageContentArray[startingRow].content[startingColumn].content;
    if (whereToInsert === whereToRemove && startingBlock > targetBlock) {
        startingBlock++;
    }
    whereToRemove.splice(startingBlock, 1);
    

    //event.dataTransfer.clearData();

    refreshSparky();

}


//// VIII functions

function sparkySerializeState() {
    return JSON.stringify(sparkyPageContentArray);
}

function updateSparkyHistoryButtons() {
    const undoButton = document.getElementById("sparkyUndoButton");
    const redoButton = document.getElementById("sparkyRedoButton");

    if (undoButton) {
        undoButton.disabled = sparkyHistoryIndex <= 0;
    }
    if (redoButton) {
        redoButton.disabled = sparkyHistoryIndex >= sparkyHistory.length - 1;
    }
}

function recordSparkyHistoryState() {
    if (isApplyingHistoryState) {
        return;
    }

    const currentState = sparkySerializeState();
    if (sparkyHistoryIndex >= 0 && sparkyHistory[sparkyHistoryIndex] === currentState) {
        updateSparkyHistoryButtons();
        return;
    }

    sparkyHistory = sparkyHistory.slice(0, sparkyHistoryIndex + 1);
    sparkyHistory.push(currentState);
    sparkyHistoryIndex = sparkyHistory.length - 1;
    updateSparkyHistoryButtons();
}

function applySparkyHistoryState() {
    isApplyingHistoryState = true;
    sparkyPageContentArray = JSON.parse(sparkyHistory[sparkyHistoryIndex]);
    refreshSparky();
    isApplyingHistoryState = false;
    updateSparkyHistoryButtons();
}

function sparkyUndoAction() {
    if (sparkyHistoryIndex <= 0) {
        return;
    }
    sparkyHistoryIndex--;
    applySparkyHistoryState();
}

function sparkyRedoAction() {
    if (sparkyHistoryIndex >= sparkyHistory.length - 1) {
        return;
    }
    sparkyHistoryIndex++;
    applySparkyHistoryState();
}

function initSparkyUndoRedoToolbarButtons() {
    const toolbar = document.getElementById("toolbar");
    if (!toolbar || document.getElementById("sparkyUndoButton")) {
        return;
    }

    const undoRedoGroup = document.createElement("div");
    undoRedoGroup.className = "btn-group";

    const undoButton = document.createElement("button");
    undoButton.type = "button";
    undoButton.id = "sparkyUndoButton";
    undoButton.className = "btn btn-sm btn-secondary";
    undoButton.innerHTML = '<span class="icon-undo" aria-hidden="true"></span> Undo';
    undoButton.addEventListener("click", sparkyUndoAction);

    const redoButton = document.createElement("button");
    redoButton.type = "button";
    redoButton.id = "sparkyRedoButton";
    redoButton.className = "btn btn-sm btn-secondary";
    redoButton.innerHTML = '<span class="icon-redo" aria-hidden="true"></span> Redo';
    redoButton.addEventListener("click", sparkyRedoAction);

    undoRedoGroup.appendChild(undoButton);
    undoRedoGroup.appendChild(redoButton);
    toolbar.appendChild(undoRedoGroup);

    updateSparkyHistoryButtons();
}

function queueBlockControlScroll(rowPosition, columnPosition, blockPosition, controlClassName, clientY) {
    pendingBlockControlScroll = {
        row: Number(rowPosition),
        column: Number(columnPosition),
        block: Number(blockPosition),
        controlClassName: controlClassName,
        clientY: clientY
    };
}

function queueRowControlScroll(rowPosition, controlClassName, clientY) {
    pendingRowControlScroll = {
        row: Number(rowPosition),
        controlClassName: controlClassName,
        clientY: clientY
    };
}

function applyPendingRowControlScroll() {
    if (!pendingRowControlScroll) {
        return;
    }

    const rowElement = sparkyPageContentEditable.querySelector(".sparky_row" + pendingRowControlScroll.row);
    const rowSettings = rowElement ? rowElement.previousSibling : null;
    const rowControlButton = rowSettings ? rowSettings.querySelector("." + pendingRowControlScroll.controlClassName) : null;

    if (rowControlButton) {
        const buttonPosition = rowControlButton.getBoundingClientRect();
        window.scrollBy(0, buttonPosition.top - pendingRowControlScroll.clientY);
    }

    pendingRowControlScroll = null;
}

function applyPendingBlockControlScroll() {
    if (!pendingBlockControlScroll) {
        return;
    }

    const selector = ".sparky_row" + pendingBlockControlScroll.row + " .sparky_col" + pendingBlockControlScroll.column + " .sparky_block" + pendingBlockControlScroll.block + " ." + pendingBlockControlScroll.controlClassName;
    const blockControlButton = sparkyPageContentEditable.querySelector(selector);

    if (blockControlButton) {
        const buttonPosition = blockControlButton.getBoundingClientRect();
        window.scrollBy(0, buttonPosition.top - pendingBlockControlScroll.clientY);
    }

    pendingBlockControlScroll = null;
}



function refreshSparky() {

    // update text area and editable pane
    sparkyEditorTextarea.value = createRealContentFromArray(sparkyPageContentArray);
    sparkyPageContentEditable.innerHTML = createEditableContentFromArray(sparkyPageContentArray);

    // editable content changed - refresh events!
    sparkyEditorButtonsEvents();

    // refresh draggable elements (fix for firefox bug)
    sparkyEditorDraggableEditableEvents();

    applyPendingParagraphFocus();
    applyPendingRowControlScroll();
    applyPendingBlockControlScroll();
    recordSparkyHistoryState();

    console.log(sparkyPageContentArray)

}

function determineColumnsNumber(str) {

    let sparkle = 0;

    for (let i=1; i<=12; i++) {
        if (str.includes("sparkle" + i)) {
            sparkle = i;
        }
    }
    return sparkle;
}

function determineBlockType(str) {

    let blockType;

    switch(str.nodeName) {
        case "P":
            blockType = "paragraph";
            break;
        case "H1":
        case "H2":
        case "H3":
        case "H4":
        case "H5":
        case "H6":
            blockType = "heading";
            break;
        case "FIGURE":
            blockType = "image";
            break;
        case "HR":
            blockType = "separator";
            break;
        case "UL":
        case "OL":
            blockType = "list";
            break;
        case "A":
            // it's button if has class "sparky_button"
            if ( str.className.includes("sparky_button") ) {
                blockType = "button";
            }
            if ( str.children.length === 1 ) {
                if ( str.children[0].nodeName === "I" ) {
                    blockType = "icon";
                }
            }
            break;
        case "IFRAME":
            blockType = "iframe";
            break;
        case "VIDEO":
            blockType = "video";
            break;
        case "AUDIO":
            blockType = "audio";
            break;
        case "I":
            blockType = "icon";
            break;
        case "DIV":
            // it's social if has class "sparky_social_icons"
            if ( str.className.includes("sparky_social_icons") ) {
                blockType = "social";
            }
            // it's spacer if has class "sparky_spacer"
            if ( str.className.includes("sparky_spacer") ) {
                blockType = "spacer";
            }
            // it's custom html if has class "sparky_custom_html"
            if ( str.className.includes("sparky_custom_html") ) {
                blockType = "customhtml";
            }
            // it's Joomla module if has class "sparky_joomla_module"
            if ( str.className.includes("sparky_joomla_module") ) {
                blockType = "joomlamodule";
            }
            break;
        // this is for editor only
        case "TEXTAREA":
            blockType = "customhtml";
            break;
    }

    return blockType;
}

function determineRowPosition(str) {
    let rowMatch = String(str).match(/sparky_row(\d+)/);
    return rowMatch ? rowMatch[1] : "";
}

function determineColumnPosition(str) {
    let columnMatch = String(str).match(/sparky_col(\d+)/);
    return columnMatch ? columnMatch[1] : "";
}

function determineBlockPosition(arr) {

    // arr: [row class, column class, block settings class]

    let row = determineRowPosition(arr[0]);
    let col = determineColumnPosition(arr[1]);
    let block = "";

    // for new blocks, the third argument is not provided
    if (arr[2]) {
        let blockMatch = String(arr[2]).match(/sparky_block(\d+)/);
        block = blockMatch ? blockMatch[1] : "";
    }
    if (block !== "") {
        return [ row, col, block ];
    }

    return [ row, col ];
}

function filterRowClass(str) {

    let classArr = str.split(" ");
    let filteredRowClass = "";

    classArr.forEach(function(className){
        if(
            className==="sparky_page_row"
            ||
            className.startsWith("sparky_row")
            ||
            className.includes("row_full_width")
            ){
            return;
        }
        filteredRowClass = className;
    });
    return filteredRowClass;

}

function filterBlockClass(str) {

    let classArr = str.split(" ");
    let filteredBlockClass = [];

    classArr.forEach(function(className){
        if(
            className.endsWith("-font-size")
            ||
            className.startsWith("has-text-align-")
            ||
            className.startsWith("align-")
            ||
            (className === "sparky_button")
            ||
            (className === "sparky_social_icons")
            ||
            (className === "sparky_spacer")
            ||
            (className === "sparky_custom_html")
            ||
            (className === "sparky_joomla_module")
        ){
            return;
        }
        filteredBlockClass.push(className);

    });
    return filteredBlockClass.join(" ");

}

function rowDropZones(bool, row) {

    let row_drop_zones = document.getElementsByClassName("row_dropzone");

    Array.from(row_drop_zones).forEach(function(zone){

        // check if we are enabling or disabling
        if (bool) {
            // don't activate dropzone just before/after the row (unnecessary)
            if (zone !== row.previousSibling.previousSibling && zone !== row.nextSibling) {
                zone.style.opacity = 1;
                zone.style.height = "30px";
                zone.style.margin = "10px 0";
                zone.style.pointerEvents = "auto";
            }
        } else {
            zone.style.opacity = 0;
            zone.style.height = "0";
            zone.style.margin = "0";
            zone.style.pointerEvents = "none";
        }

    });

}

function columnDropZones(bool, column) {

    let column_drop_zones = document.getElementsByClassName("column_dropzone");

    Array.from(column_drop_zones).forEach(function(zone){

        // check if we are enabling or disabling
        if (bool) {
            // don't activate dropzone just before/after the column (unnecessary)
            // activate dropzones in the column's row only
            if (
                zone !== column.previousSibling
                &&
                zone !== column.nextSibling
                &&
                zone.parentNode === column.parentNode
                ) {
                zone.style.opacity = 1;
                zone.style.width = "10px";
                zone.style.margin = "10px 5px";
                zone.style.pointerEvents = "auto";
            }
        } else {
            zone.style.opacity = 0;
            zone.style.width = "0";
            zone.style.margin = "0";
            zone.style.pointerEvents = "none";
        }

    });

}

function blockDropZones(bool, block) {

    let block_drop_zones = document.getElementsByClassName("block_dropzone");

    Array.from(block_drop_zones).forEach(function(zone){

        // check if we are enabling or disabling
        if (bool) {
            // don't activate dropzone just before/after the block (unnecessary)
            if (zone !== block.previousSibling.previousSibling && zone !== block.nextSibling) {
                zone.style.opacity = 1;
                zone.style.height = "10px";
                zone.style.margin = "10px";
                zone.style.pointerEvents = "auto";
            }
        } else {
            zone.style.opacity = 0;
            zone.style.height = "0";
            zone.style.margin = "0";
            zone.style.pointerEvents = "none";
        }

    });

}

function moveArrayItemToNewIndex(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; 
}

// prepare style attribute
function sparkyInlineStyle(style) {

    let rowStyle = "";
    let rowStyleStart = " style='";
    let rowStyleEnd = "'";

    if (style.backgroundColor){
        rowStyle = rowStyle + "background-color:" + style.backgroundColor + ";";
    }
    if (style.backgroundImage && style.backgroundImage !== 'url("")'){
        rowStyle = rowStyle + "background-image:" + style.backgroundImage + ";";
    }
    if (style.backgroundRepeat){
        rowStyle = rowStyle + "background-repeat:" + style.backgroundRepeat + ";";
    }
    if (style.backgroundPosition){
        rowStyle = rowStyle + "background-position:" + style.backgroundPosition + ";";
    }
    if (style.backgroundSize){
        rowStyle = rowStyle + "background-size:" + style.backgroundSize + ";";
    }
    if (style.backgroundAttachment){
        rowStyle = rowStyle + "background-attachment:" + style.backgroundAttachment + ";";
    }
    if (style.borderColor){
        rowStyle = rowStyle + "border-color:" + style.borderColor + ";";
    }
    if (style.borderRadius){
        rowStyle = rowStyle + "border-radius:" + style.borderRadius + ";";
    }
    if (style.borderWidth){
        rowStyle = rowStyle + "border-width:" + style.borderWidth + ";";
    }
    if (style.color){
        rowStyle = rowStyle + "color:" + style.color + ";";
    }
    if (style.display){
        rowStyle = rowStyle + "display:" + style.display + ";";
    }
    if (style.fontSize){
        rowStyle = rowStyle + "font-size:" + style.fontSize + ";";
    }
    if (style.height){
        rowStyle = rowStyle + "height:" + style.height + ";";
    }
    if (style.lineHeight){
        rowStyle = rowStyle + "line-height:" + style.lineHeight + ";";
    }
    if (style.marginTop){
        rowStyle = rowStyle + "margin-top:" + style.marginTop + ";";
    }
    if (style.marginBottom){
        rowStyle = rowStyle + "margin-bottom:" + style.marginBottom + ";";
    }
    if (style.marginLeft){
        rowStyle = rowStyle + "margin-left:" + style.marginLeft + ";";
    }
    if (style.marginRight){
        rowStyle = rowStyle + "margin-right:" + style.marginRight + ";";
    }
    if (style.paddingTop){
        rowStyle = rowStyle + "padding-top:" + style.paddingTop + ";";
    }
    if (style.paddingBottom){
        rowStyle = rowStyle + "padding-bottom:" + style.paddingBottom + ";";
    }
    if (style.paddingLeft){
        rowStyle = rowStyle + "padding-left:" + style.paddingLeft + ";";
    }
    if (style.paddingRight){
        rowStyle = rowStyle + "padding-right:" + style.paddingRight + ";";
    }
    if (style.textAlign){
        rowStyle = rowStyle + "text-align:" + style.textAlign + ";";
    }
    if (style.width){
        rowStyle = rowStyle + "width:" + style.width + ";";
    }
    if (style.justifyContent){
        rowStyle = rowStyle + "justify-content:" + style.justifyContent + ";";
    }

    if (rowStyle) {
        return rowStyleStart + rowStyle + rowStyleEnd;
    }
    return rowStyle;
    

}

// rgb to hex color
function rgb_to_hex_values(rgb) { 
    var hex = Number(rgb).toString(16);
    if (hex.length < 2) {
        hex = "0" + hex;
    }
    return hex;
};
function rgb_to_hex(rgb) {  
    var rgb_values, red, green, blue;
    if (rgb) {
        rgb_values = rgb.replace('rgb(', '').replace(')', '').split(', ');
    }

    if (rgb_values) {
        red = rgb_to_hex_values(rgb_values[0]);
        green = rgb_to_hex_values(rgb_values[1]);
        blue = rgb_to_hex_values(rgb_values[2]);
    }

    if (red == "NaN" || green == "NaN" || blue == "NaN") {
        return rgb;
    }
    return "#" + red + green + blue;
};

// minicolors init
function sparky_minicolors(setting, value) {
    jQuery(setting).minicolors({theme: "bootstrap", format: "rgb", opacity: true});
    jQuery(setting).minicolors('value', rgb_to_hex(value));
}

// url("image.png") >>> image.png
function sparkyStyleURL(str) {
    return str.replace('url(', "")
              .replace(')', "")
              .replace(/"/g, '')
              .replace(/'/g, "");
}

function sparkyDisableDraggable(elements) {
    Array.from(elements).forEach(function(element){
        element.setAttribute("draggable", "false");
    });
}

function sparkyEnableDraggable(elements) {
    Array.from(elements).forEach(function(element){
        element.setAttribute("draggable", "true");
    });
}

function sparkyBlockPosition() {
    // event.composedPath()[4].className -> row position (.sparky_rowX)
    // event.composedPath()[2].className -> col position (.sparky_colX)
    let sparkyBlockPosition = determineBlockPosition([event.composedPath()[4].className, event.composedPath()[2].className, event.composedPath()[1].className] );

    let block = sparkyPageContentArray[sparkyBlockPosition[0]].content[sparkyBlockPosition[1]].content[sparkyBlockPosition[2]];

    return block;
}


//// VIII modals



function sparky_modal(modal_type) {

    // Get the modal
    let modal = document.getElementById(modal_type);

    // Get the <span> element that closes the modal and Save button
    let close_button = document.getElementById("close_" + modal_type);
    let save_button = document.getElementById("save_" + modal_type);

    // When the user clicks on <span> (x), close the modal
    close_button.onclick = function() {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Block position in array
    let rowPosition = event.target.parentNode.parentNode.parentNode.parentNode.className;
    rowPosition = rowPosition.split("sparky_row");
    rowPosition = rowPosition[rowPosition.length-1];

    let columnPosition = event.target.parentNode.parentNode.className;
    columnPosition = columnPosition.split("sparky_col");
    columnPosition = columnPosition[columnPosition.length-1];

    let blockPosition = event.target.parentNode.className;
    blockPosition = blockPosition.split("sparky_block");
    blockPosition = blockPosition[blockPosition.length-1];

    let blockToEdit = event.target.parentNode.nextSibling;

    // add row modal
    if (modal_type === "add_row_modal") {

        modal.style.display = "block";

        // new row position (.sparky_rowX)
        let new_row_position = sparkyPageContentArray.length;
        if (addRowInsertAfterPosition !== null) {
            new_row_position = addRowInsertAfterPosition + 1;
        }

        // array with possible row layouts
        let row_layouts = [ "12", "6_6", "4_4_4", "3_3_3_3", "2_2_2_2_2_2", "8_4", "4_8", "9_3", "3_9" ];

        row_layouts.forEach(function(layout){

            document.getElementById("columns_" + layout).onclick = function(event) {

                let columns = layout.split("_");

                // add row to the sparky object
                sparkyPageContentArray.splice(new_row_position, 0, {
                    id: generateRandomRowId(),
                    class: "sparky_page_row sparky_row" + new_row_position,
                    style: {},
                    content: []
                });

                // add columns to the new row
                let i = 0;
                columns.forEach(function(cells){
                    sparkyPageContentArray[new_row_position].content.push({
                        id: "",
                        class: "sparkle" + cells + " sparky_cell sparky_col" + i,
                        style: {},
                        cols: Number(cells),
                        animation: [ "", 0, "" ],
                        content: []
                    });
                    i++;
                });

                modal.style.display = "none";
                addRowInsertAfterPosition = null;
                refreshSparky();
            }

        });
        
    }

    // row settings modal
    if (modal_type === "row_settings_modal") {

        modal.style.display = "block";
        

        // event.composedPath()[1].nextSibling -> row element
        // determine row position
        let sparkyRowPosition = determineRowPosition(event.composedPath()[1].nextSibling.className);

        // get row values from array and put them into the modal fields

        // row ID value
        document.getElementById("row_id").value = sparkyPageContentArray[sparkyRowPosition].id;

        // row class value (without "sparky_page_row", "row_full_width" and "sparky_rowX")
        document.getElementById("row_class").value = filterRowClass(sparkyPageContentArray[sparkyRowPosition].class);

        // row full width value
        if (sparkyPageContentArray[sparkyRowPosition].class.includes("row_full_width")) {
            document.getElementById("row_full_width").checked = true;
        } else {
            document.getElementById("row_full_width").checked = false;
        }

        // row fluid value
        if (sparkyPageContentArray[sparkyRowPosition].class.includes("row_fluid")) {
            document.getElementById("row_fluid").checked = true;
        } else {
            document.getElementById("row_fluid").checked = false;
        }

        // row background color value
        sparky_minicolors("input#row_background_color", sparkyPageContentArray[sparkyRowPosition].style.backgroundColor);
        if (sparkyPageContentArray[sparkyRowPosition].style.backgroundColor) {
            document.getElementById("row_background_color").value = rgb_to_hex(sparkyPageContentArray[sparkyRowPosition].style.backgroundColor);
        } else {
            document.getElementById("row_background_color").value = "";
        }

        // row background image value
        if (sparkyPageContentArray[sparkyRowPosition].style.backgroundImage) {
            document.getElementById("row_background_image").value = sparkyStyleURL(sparkyPageContentArray[sparkyRowPosition].style.backgroundImage);
        } else {
            document.getElementById("row_background_image").value = "";
        }

        // row background image repeat: no-repeat, repeat, repeat-x, repeat-y
        if (sparkyPageContentArray[sparkyRowPosition].style.backgroundRepeat) {
            document.getElementById("row_background_image_repeat").value = sparkyPageContentArray[sparkyRowPosition].style.backgroundRepeat;
        } else {
            document.getElementById("row_background_image_repeat").value = "";
        }

        // row background image position: top left, top center, top right, center left, center center, center right, bottom left, bottom center, bottom right
        if (sparkyPageContentArray[sparkyRowPosition].style.backgroundPosition) {
            document.getElementById("row_background_image_position").value = sparkyPageContentArray[sparkyRowPosition].style.backgroundPosition;
        } else {
            document.getElementById("row_background_image_position").value = "";
        }

        // row background image size: cover, contain
        if (sparkyPageContentArray[sparkyRowPosition].style.backgroundSize) {
            document.getElementById("row_background_image_size").value = sparkyPageContentArray[sparkyRowPosition].style.backgroundSize;
        } else {
            document.getElementById("row_background_image_size").value = "";
        }

        // row background image attachment: scroll, fixed
        if (sparkyPageContentArray[sparkyRowPosition].style.backgroundAttachment) {
            document.getElementById("row_background_image_attachment").value = sparkyPageContentArray[sparkyRowPosition].style.backgroundAttachment;
        } else {
            document.getElementById("row_background_image_attachment").value = "";
        }

        // row margin
        if (sparkyPageContentArray[sparkyRowPosition].style.marginTop) {
            document.getElementById("row_margin_top").value = sparkyPageContentArray[sparkyRowPosition].style.marginTop;
        } else {
            document.getElementById("row_margin_top").value = "";
        }
        if (sparkyPageContentArray[sparkyRowPosition].style.marginBottom) {
            document.getElementById("row_margin_bottom").value = sparkyPageContentArray[sparkyRowPosition].style.marginBottom;
        } else {
            document.getElementById("row_margin_bottom").value = "";
        }
        if (sparkyPageContentArray[sparkyRowPosition].style.marginLeft) {
            document.getElementById("row_margin_left").value = sparkyPageContentArray[sparkyRowPosition].style.marginLeft;
        } else {
            document.getElementById("row_margin_left").value = "";
        }
        if (sparkyPageContentArray[sparkyRowPosition].style.marginRight) {
            document.getElementById("row_margin_right").value = sparkyPageContentArray[sparkyRowPosition].style.marginRight;
        } else {
            document.getElementById("row_margin_right").value = "";
        }

        // row padding
        if (sparkyPageContentArray[sparkyRowPosition].style.paddingTop) {
            document.getElementById("row_padding_top").value = sparkyPageContentArray[sparkyRowPosition].style.paddingTop;
        } else {
            document.getElementById("row_padding_top").value = "";
        }
        if (sparkyPageContentArray[sparkyRowPosition].style.paddingBottom) {
            document.getElementById("row_padding_bottom").value = sparkyPageContentArray[sparkyRowPosition].style.paddingBottom;
        } else {
            document.getElementById("row_padding_bottom").value = "";
        }
        if (sparkyPageContentArray[sparkyRowPosition].style.paddingLeft) {
            document.getElementById("row_padding_left").value = sparkyPageContentArray[sparkyRowPosition].style.paddingLeft;
        } else {
            document.getElementById("row_padding_left").value = "";
        }
        if (sparkyPageContentArray[sparkyRowPosition].style.paddingRight) {
            document.getElementById("row_padding_right").value = sparkyPageContentArray[sparkyRowPosition].style.paddingRight;
        } else {
            document.getElementById("row_padding_right").value = "";
        }

        // row columns tablet
        document.getElementById("row_columns_tablet").value = "";
        for (let i = 1; i < 7; i++) {
            if (sparkyPageContentArray[sparkyRowPosition].class.includes("columns_on_tablet" + i)) {
                document.getElementById("row_columns_tablet").value = String(i);
            }
        }

        // row columns phone
        document.getElementById("row_columns_phone").value = "";
        for (let i = 1; i < 7; i++) {
            if (sparkyPageContentArray[sparkyRowPosition].class.includes("columns_on_phone" + i)) {
                document.getElementById("row_columns_phone").value = String(i);
            }
        }

        save_button.onclick = function(event) {
            event.preventDefault();

            // row id
            let rowIdInput = document.getElementById("row_id").value.trim();
            sparkyPageContentArray[sparkyRowPosition].id = rowIdInput || generateRandomRowId();

            // row class ("sparky_rowX" must be last)
            sparkyPageContentArray[sparkyRowPosition].class = document.getElementById("row_class").value + " sparky_page_row sparky_row" + sparkyRowPosition;

            // row full width
            if (document.getElementById("row_full_width").checked) {
                sparkyPageContentArray[sparkyRowPosition].class = "row_full_width " + sparkyPageContentArray[sparkyRowPosition].class;
            } else {
                sparkyPageContentArray[sparkyRowPosition].class = sparkyPageContentArray[sparkyRowPosition].class.replace("row_full_width ", "");
            }

            // row fluid (activated only if row full width is activated)
            if (document.getElementById("row_fluid").checked && document.getElementById("row_full_width").checked) {
                sparkyPageContentArray[sparkyRowPosition].class = "row_fluid " + sparkyPageContentArray[sparkyRowPosition].class;
            } else {
                sparkyPageContentArray[sparkyRowPosition].class = sparkyPageContentArray[sparkyRowPosition].class.replace("row_fluid ", "");
            }

            // row background
            sparkyPageContentArray[sparkyRowPosition].style.backgroundColor = document.getElementById("row_background_color").value;
            sparkyPageContentArray[sparkyRowPosition].style.backgroundImage = "url(" + document.getElementById("row_background_image").value + ")";
            sparkyPageContentArray[sparkyRowPosition].style.backgroundRepeat = document.getElementById("row_background_image_repeat").value;
            sparkyPageContentArray[sparkyRowPosition].style.backgroundPosition = document.getElementById("row_background_image_position").value;
            sparkyPageContentArray[sparkyRowPosition].style.backgroundSize = document.getElementById("row_background_image_size").value;
            sparkyPageContentArray[sparkyRowPosition].style.backgroundAttachment = document.getElementById("row_background_image_attachment").value;

            // row margin
            sparkyPageContentArray[sparkyRowPosition].style.marginTop = document.getElementById("row_margin_top").value;
            sparkyPageContentArray[sparkyRowPosition].style.marginBottom = document.getElementById("row_margin_bottom").value;
            sparkyPageContentArray[sparkyRowPosition].style.marginLeft = document.getElementById("row_margin_left").value;
            sparkyPageContentArray[sparkyRowPosition].style.marginRight = document.getElementById("row_margin_right").value;

            // row padding
            sparkyPageContentArray[sparkyRowPosition].style.paddingTop = document.getElementById("row_padding_top").value;
            sparkyPageContentArray[sparkyRowPosition].style.paddingBottom = document.getElementById("row_padding_bottom").value;
            sparkyPageContentArray[sparkyRowPosition].style.paddingLeft = document.getElementById("row_padding_left").value;
            sparkyPageContentArray[sparkyRowPosition].style.paddingRight = document.getElementById("row_padding_right").value;

            // row columns tablet
            for (let i = 1; i < 7; i++) {
                if (document.getElementById("row_columns_tablet").value == i) {
                    sparkyPageContentArray[sparkyRowPosition].class = "columns_on_tablet" + String(i) + " " + sparkyPageContentArray[sparkyRowPosition].class;
                } else {
                    sparkyPageContentArray[sparkyRowPosition].class = sparkyPageContentArray[sparkyRowPosition].class.replace("columns_on_tablet" + String(i) + " ", "");
                }
            }

            // row columns phone
            for (let i = 1; i < 7; i++) {
                if (document.getElementById("row_columns_phone").value == i) {
                    sparkyPageContentArray[sparkyRowPosition].class = "columns_on_phone" + String(i) + " " + sparkyPageContentArray[sparkyRowPosition].class;
                } else {
                    sparkyPageContentArray[sparkyRowPosition].class = sparkyPageContentArray[sparkyRowPosition].class.replace("columns_on_phone" + String(i) + " ", "");
                }
            }


            refreshSparky();

            modal.style.display = "none";


        }

    }

    // page break settings modal
    if (modal_type === "page_break_settings_modal") {

        modal.style.display = "block";

        // event.composedPath()[1].nextSibling -> row element
        // determine row position
        let sparkyRowPosition = determineRowPosition(event.composedPath()[1].nextSibling.className);

        // get row values from array and put them into the modal fields

        // title value
        document.getElementById("page_break_title").value = sparkyPageContentArray[sparkyRowPosition].title;

        // alias value
        document.getElementById("page_break_alias").value = sparkyPageContentArray[sparkyRowPosition].alias;

        save_button.onclick = function(event) {
            event.preventDefault();

            // save title value
            sparkyPageContentArray[sparkyRowPosition].title = document.getElementById("page_break_title").value;

            // save alias value
            sparkyPageContentArray[sparkyRowPosition].alias = document.getElementById("page_break_alias").value;

            refreshSparky();

            modal.style.display = "none";


        }

    }

    // column settings modal
    if (modal_type === "column_settings_modal") {

        modal.style.display = "block";

        // column background color value
        sparky_minicolors("input#column_background_color", sparkyPageContentArray[rowPosition].content[columnPosition].style.backgroundColor);
        if (sparkyPageContentArray[rowPosition].content[columnPosition].style.backgroundColor) {
            document.getElementById("column_background_color").value = rgb_to_hex(sparkyPageContentArray[rowPosition].content[columnPosition].style.backgroundColor);
        } else {
            document.getElementById("column_background_color").value = "";
        }

        // column background image value
        if (sparkyPageContentArray[rowPosition].content[columnPosition].style.backgroundImage) {
            document.getElementById("column_background_image").value = sparkyStyleURL(sparkyPageContentArray[rowPosition].content[columnPosition].style.backgroundImage);
        } else {
            document.getElementById("column_background_image").value = "";
        }

        // column background image repeat: no-repeat, repeat, repeat-x, repeat-y
        if (sparkyPageContentArray[rowPosition].content[columnPosition].style.backgroundRepeat) {
            document.getElementById("column_background_image_repeat").value = sparkyPageContentArray[rowPosition].content[columnPosition].style.backgroundRepeat;
        } else {
            document.getElementById("column_background_image_repeat").value = "";
        }

        // column background image position: top left, top center, top right, center left, center center, center right, bottom left, bottom center, bottom right
        if (sparkyPageContentArray[rowPosition].content[columnPosition].style.backgroundPosition) {
            document.getElementById("column_background_image_position").value = sparkyPageContentArray[rowPosition].content[columnPosition].style.backgroundPosition;
        } else {
            document.getElementById("column_background_image_position").value = "";
        }

        // column background image size: cover, contain
        if (sparkyPageContentArray[rowPosition].content[columnPosition].style.backgroundSize) {
            document.getElementById("column_background_image_size").value = sparkyPageContentArray[rowPosition].content[columnPosition].style.backgroundSize;
        } else {
            document.getElementById("column_background_image_size").value = "";
        }

        // column background image attachment: scroll, fixed
        if (sparkyPageContentArray[rowPosition].content[columnPosition].style.backgroundAttachment) {
            document.getElementById("column_background_image_attachment").value = sparkyPageContentArray[rowPosition].content[columnPosition].style.backgroundAttachment;
        } else {
            document.getElementById("column_background_image_attachment").value = "";
        }

        // column margin
        if (sparkyPageContentArray[rowPosition].content[columnPosition].style.marginTop) {
            document.getElementById("column_margin_top").value = sparkyPageContentArray[rowPosition].content[columnPosition].style.marginTop;
        } else {
            document.getElementById("column_margin_top").value = "";
        }
        if (sparkyPageContentArray[rowPosition].content[columnPosition].style.marginBottom) {
            document.getElementById("column_margin_bottom").value = sparkyPageContentArray[rowPosition].content[columnPosition].style.marginBottom;
        } else {
            document.getElementById("column_margin_bottom").value = "";
        }
        if (sparkyPageContentArray[rowPosition].content[columnPosition].style.marginLeft) {
            document.getElementById("column_margin_left").value = sparkyPageContentArray[rowPosition].content[columnPosition].style.marginLeft;
        } else {
            document.getElementById("column_margin_left").value = "";
        }
        if (sparkyPageContentArray[rowPosition].content[columnPosition].style.marginRight) {
            document.getElementById("column_margin_right").value = sparkyPageContentArray[rowPosition].content[columnPosition].style.marginRight;
        } else {
            document.getElementById("column_margin_right").value = "";
        }

        // column padding
        if (sparkyPageContentArray[rowPosition].content[columnPosition].style.paddingTop) {
            document.getElementById("column_padding_top").value = sparkyPageContentArray[rowPosition].content[columnPosition].style.paddingTop;
        } else {
            document.getElementById("column_padding_top").value = "";
        }
        if (sparkyPageContentArray[rowPosition].content[columnPosition].style.paddingBottom) {
            document.getElementById("column_padding_bottom").value = sparkyPageContentArray[rowPosition].content[columnPosition].style.paddingBottom;
        } else {
            document.getElementById("column_padding_bottom").value = "";
        }
        if (sparkyPageContentArray[rowPosition].content[columnPosition].style.paddingLeft) {
            document.getElementById("column_padding_left").value = sparkyPageContentArray[rowPosition].content[columnPosition].style.paddingLeft;
        } else {
            document.getElementById("column_padding_left").value = "";
        }
        if (sparkyPageContentArray[rowPosition].content[columnPosition].style.paddingRight) {
            document.getElementById("column_padding_right").value = sparkyPageContentArray[rowPosition].content[columnPosition].style.paddingRight;
        } else {
            document.getElementById("column_padding_right").value = "";
        }

        // vertical align: center, flex-end, space-between, space-around, space-evenly
        if (sparkyPageContentArray[rowPosition].content[columnPosition].style.justifyContent) {
            document.getElementById("column_vertical_align").value = sparkyPageContentArray[rowPosition].content[columnPosition].style.justifyContent;
        } else {
            document.getElementById("column_vertical_align").value = "";
        }

        // animation type
        if (sparkyPageContentArray[rowPosition].content[columnPosition].animation[2]) {
            document.getElementById("column_animation_type").value = sparkyPageContentArray[rowPosition].content[columnPosition].animation[2];
        } else {
            document.getElementById("column_animation_type").value = "";
        }

        // animation delay
        document.getElementById("column_animation_delay").value = sparkyPageContentArray[rowPosition].content[columnPosition].animation[1];

        save_button.onclick = function(event) {

            event.preventDefault();

            // column background
            sparkyPageContentArray[rowPosition].content[columnPosition].style.backgroundColor = document.getElementById("column_background_color").value;
            sparkyPageContentArray[rowPosition].content[columnPosition].style.backgroundImage = "url(" + document.getElementById("column_background_image").value + ")";
            sparkyPageContentArray[rowPosition].content[columnPosition].style.backgroundRepeat = document.getElementById("column_background_image_repeat").value;
            sparkyPageContentArray[rowPosition].content[columnPosition].style.backgroundPosition = document.getElementById("column_background_image_position").value;
            sparkyPageContentArray[rowPosition].content[columnPosition].style.backgroundSize = document.getElementById("column_background_image_size").value;
            sparkyPageContentArray[rowPosition].content[columnPosition].style.backgroundAttachment = document.getElementById("column_background_image_attachment").value;

            // column margin
            sparkyPageContentArray[rowPosition].content[columnPosition].style.marginTop = document.getElementById("column_margin_top").value;
            sparkyPageContentArray[rowPosition].content[columnPosition].style.marginBottom = document.getElementById("column_margin_bottom").value;
            sparkyPageContentArray[rowPosition].content[columnPosition].style.marginLeft = document.getElementById("column_margin_left").value;
            sparkyPageContentArray[rowPosition].content[columnPosition].style.marginRight = document.getElementById("column_margin_right").value;

            // column padding
            sparkyPageContentArray[rowPosition].content[columnPosition].style.paddingTop = document.getElementById("column_padding_top").value;
            sparkyPageContentArray[rowPosition].content[columnPosition].style.paddingBottom = document.getElementById("column_padding_bottom").value;
            sparkyPageContentArray[rowPosition].content[columnPosition].style.paddingLeft = document.getElementById("column_padding_left").value;
            sparkyPageContentArray[rowPosition].content[columnPosition].style.paddingRight = document.getElementById("column_padding_right").value;

            // vertical align
            sparkyPageContentArray[rowPosition].content[columnPosition].style.justifyContent = document.getElementById("column_vertical_align").value;

            // animation type
            sparkyPageContentArray[rowPosition].content[columnPosition].animation[2] = document.getElementById("column_animation_type").value;
            if (document.getElementById("column_animation_type").value) {
                sparkyPageContentArray[rowPosition].content[columnPosition].animation[0] = " img-with-animation";
            } else {
                sparkyPageContentArray[rowPosition].content[columnPosition].animation[0] = "";
            }

            // animation delay
            sparkyPageContentArray[rowPosition].content[columnPosition].animation[1] = Number(document.getElementById("column_animation_delay").value);

            refreshSparky();

            modal.style.display = "none";


        }


    }

    // add block modal
    if (modal_type === "add_block_modal") {

        modal.style.display = "block";

        // event.composedPath()[4].className -> row position (.sparky_rowX)
        // event.composedPath()[2].className -> col position (.sparky_colX)
        let sparkyBlockPosition = determineBlockPosition([event.composedPath()[4].className, event.composedPath()[2].className], false);
        let insertPosition = sparkyPageContentArray[sparkyBlockPosition[0]].content[sparkyBlockPosition[1]].content.length;

        if (event.target.className.includes("add_block_after_block")) {
            let clickedBlockPosition = determineBlockPosition([event.composedPath()[4].className, event.composedPath()[2].className, event.composedPath()[1].className]);
            insertPosition = Number(clickedBlockPosition[2]) + 1;
        }

        function addNewBlockToColumn(newBlock) {
            sparkyPageContentArray[sparkyBlockPosition[0]].content[sparkyBlockPosition[1]].content.splice(insertPosition, 0, newBlock);
            modal.style.display = "none";
            refreshSparky();
        }

        // add paragraph block
        document.getElementById("sparky_block_paragraph").onclick = function(event) {
            addNewBlockToColumn({
                id: "",
                class: "",
                style: {},
                type: "paragraph",
                content: "Add some text..."
            });
        }

        // add heading block
        document.getElementById("sparky_block_heading").onclick = function(event) {
            addNewBlockToColumn({
                id: "",
                class: "",
                style: {},
                type: "heading",
                level: "H2",
                link: "",
                target: false,
                content: "Sample Heading"
            });
        }

        // add image block
        document.getElementById("sparky_block_image").onclick = function(event) {
            addNewBlockToColumn({
                id: "",
                class: "",
                style: {},
                type: "image",
                link: "",
                target: false,
                src: "media/plg_editors_sparky/images/image.png",
                alt: ""
            });
        }

        // add separator block
        document.getElementById("sparky_block_separator").onclick = function(event) {
            addNewBlockToColumn({
                id: "",
                class: "",
                style: {height: "3px"},
                link: "",
                type: "separator"
            });
        }

        // add spacer block
        document.getElementById("sparky_block_spacer").onclick = function(event) {
            addNewBlockToColumn({
                id: "",
                class: "sparky_spacer",
                style: {},
                link: "",
                type: "spacer"
            });
        }

        // add button block
        document.getElementById("sparky_block_button").onclick = function(event) {
            addNewBlockToColumn({
                id: "",
                class: "sparky_button",
                style: {},
                link: "#",
                target: false,
                type: "button",
                content: "My Button"
            });
        }

        // add list block
        document.getElementById("sparky_block_list").onclick = function(event) {
            addNewBlockToColumn({
                id: "",
                class: "",
                style: {},
                type: "list",
                listType: "ul",
                content: "<li>Lorem ipsum</li><li>Dolor sit amet</li><li>Consectetuer adipiscing</li>"
            });
        }

        // add Iframe block
        document.getElementById("sparky_block_iframe").onclick = function(event) {
            addNewBlockToColumn({
                id: "",
                class: "",
                style: {},
                src: "",
                type: "iframe"
            });
        }

        // add video block
        document.getElementById("sparky_block_video").onclick = function(event) {
            addNewBlockToColumn({
                id: "",
                class: "",
                style: {},
                poster: "media/plg_editors_sparky/images/video.png",
                mp4: "",
                ogg: "",
                webm: "",
                autoplay: false,
                controls: false,
                loop: false,
                muted: false,
                type: "video"
            });
        }

        // add audio block
        document.getElementById("sparky_block_audio").onclick = function(event) {
            addNewBlockToColumn({
                id: "",
                class: "",
                style: {},
                mp3: "",
                ogg: "",
                wav: "",
                autoplay: false,
                controls: true,
                loop: false,
                muted: false,
                type: "audio"
            });
        }

        // add icon block
        document.getElementById("sparky_block_icon").onclick = function(event) {
            addNewBlockToColumn({
                id: "",
                class: "fa-check-circle",
                category: "fas",
                link: "",
                target: false,
                style: {},
                type: "icon"
            });
        }

        // add social block
        document.getElementById("sparky_block_social").onclick = function(event) {
            addNewBlockToColumn({
                id: "",
                class: "sparky_social_icons",
                style: {},
                target: true,
                network1: "facebook",
                link1: "https://www.facebook.com/hotthemes",
                network2: "x-twitter",
                link2: "https://twitter.com/hot_themes",
                network3: "instagram",
                link3: "https://instagram.com/hotthemes",
                network4: false,
                link4: "",
                network5: false,
                link5: "",
                network6: false,
                link6: "",
                type: "social"
            });
        }

        // add custom html block
        document.getElementById("sparky_block_customhtml").onclick = function(event) {
            addNewBlockToColumn({
                id: "",
                class: "sparky_custom_html",
                style: {},
                content: "",
                type: "customhtml"
            });
        }

        // add joomla module block
        document.getElementById("sparky_block_joomlamodule").onclick = function(event) {
            addNewBlockToColumn({
                id: "sparky_joomla_module_id0",
                class: "sparky_joomla_module",
                style: {},
                content: "{loadmoduleid 0}",
                type: "joomlamodule"
            });
        }

    }

    // paragraph block settings modal
    if (modal_type === "block_settings_modal_paragraph") {

        modal.style.display = "block";

        // get block position
        block = sparkyBlockPosition();

        // paragraph ID value
        document.getElementById("paragraph_id").value = block.id;

        // paragraph class value
        document.getElementById("paragraph_class").value = filterBlockClass(block.class);

        // paragraph block text color value
        sparky_minicolors("input#paragraph_color", block.style.color);
        if (block.style.color) {
            document.getElementById("paragraph_color").value = rgb_to_hex(block.style.color);
        } else {
            document.getElementById("paragraph_color").value = "";
        }

        // paragraph block font size
        const font_size_classes = [ "has-small-font-size", "has-medium-font-size", "has-large-font-size", "has-huge-font-size" ];
        document.getElementById("paragraph_font_size").value = "normal";
        block.class.split(" ").forEach(function(class_name){
            if (class_name.endsWith("-font-size")) {
                document.getElementById("paragraph_font_size").value = class_name;
            }
        });

        // paragraph block custom font size
        if (block.style.fontSize) {
            document.getElementById("paragraph_custom_font_size").value = block.style.fontSize;
        } else {
            document.getElementById("paragraph_custom_font_size").value = "";
        }

        // paragraph block text align
        const text_align_classes = [ "has-text-align-left", "has-text-align-center", "has-text-align-right", "has-text-align-justify" ];
        document.getElementById("paragraph_text_align").value = "normal";
        block.class.split(" ").forEach(function(class_name){
            if (class_name.startsWith("has-text-align-")) {
                document.getElementById("paragraph_text_align").value = class_name;
            }
        });

        save_button.onclick = function(event) {
            event.preventDefault();

            // paragraph block id
            block.id = document.getElementById("paragraph_id").value;

            // paragraph block class
            block.class = document.getElementById("paragraph_class").value;

            // paragraph block text color value
            block.style.color = document.getElementById("paragraph_color").value;

            // paragraph font size
            const block_font_size = document.getElementById("paragraph_font_size");
            if (block_font_size.value) {
                let itemsProcessed = 0;
                font_size_classes.forEach(function(class_name){
                    block.class = block.class.replace(class_name, "");
                    itemsProcessed++;
                    if(itemsProcessed === font_size_classes.length) {
                        if(block_font_size.value !== "normal"){
                            block.class = block.class + " " + block_font_size.value;
                        }
                    }
                });
            }

            // paragraph custom font size
            block.style.fontSize = document.getElementById("paragraph_custom_font_size").value;

            // paragraph text align
            const block_text_align = document.getElementById("paragraph_text_align");
            if (block_text_align.value) {
                let itemsProcessed = 0;
                text_align_classes.forEach(function(class_name){
                    block.class = block.class.replace(class_name, "");
                    itemsProcessed++;
                    if(itemsProcessed === text_align_classes.length) {
                        if(block_text_align.value !== "normal"){
                            block.class = block.class + " " + block_text_align.value;
                        }
                    }
                });
            }

            refreshSparky();

            modal.style.display = "none";

        }
    }

    // heading block settings modal
    if (modal_type === "block_settings_modal_heading") {

        modal.style.display = "block";

        // get block position
        block = sparkyBlockPosition();

        // heading ID value
        document.getElementById("heading_id").value = block.id;

        // heading class value
        document.getElementById("heading_class").value = filterBlockClass(block.class);

        // heading block type
        document.getElementById("heading_type").value = block.level;

        // heading link
        document.getElementById("heading_link").value = block.link;

        // check if this heading is set to open in a new window
        if ( block.target ) {
            document.getElementById("heading_target").value = "blank";
        } else {
            document.getElementById("heading_target").value = "normal";
        }

        // heading block text color value
        sparky_minicolors("input#heading_color", block.style.color);
        if (block.style.color) {
            document.getElementById("heading_color").value = rgb_to_hex(block.style.color);
        } else {
            document.getElementById("heading_color").value = "";
        }

        // heading block text align
        const text_align_classes = [ "has-text-align-left", "has-text-align-center", "has-text-align-right", "has-text-align-justify" ];
        document.getElementById("heading_text_align").value = "normal";
        block.class.split(" ").forEach(function(class_name){
            if (class_name.startsWith("has-text-align-")) {
                document.getElementById("heading_text_align").value = class_name;
            }
        });

        save_button.onclick = function(event) {
            event.preventDefault();

            // heading block id
            block.id = document.getElementById("heading_id").value;

            // heading block class
            block.class = document.getElementById("heading_class").value;

            // heading block type
            block.level = document.getElementById("heading_type").value;

            // heading link
            block.link = document.getElementById("heading_link").value;
            if (block.link) {
                block.content = removeLinksFromHtml(block.content);
            }

            // heading link target
            if ( document.getElementById("heading_target").value === "blank" ) {
                block.target = true;
            } else {
                block.target = false;
            }

            // heading block text color value
            block.style.color = document.getElementById("heading_color").value;

            // heading text align
            const block_text_align = document.getElementById("heading_text_align");
            if (block_text_align.value) {
                let itemsProcessed = 0;
                text_align_classes.forEach(function(class_name){
                    block.class = block.class.replace(class_name, "");
                    itemsProcessed++;
                    if(itemsProcessed === text_align_classes.length) {
                        if(block_text_align.value !== "normal"){
                            block.class = block.class + " " + block_text_align.value;
                        }
                    }
                });
            }

            refreshSparky();

            modal.style.display = "none";

        }

    }

    // image block settings modal
    if (modal_type === "block_settings_modal_image") {

        modal.style.display = "block";

        // get block position
        block = sparkyBlockPosition();

        // image ID value
        document.getElementById("image_id").value = block.id;

        // image class value
        document.getElementById("image_class").value = filterBlockClass(block.class);

        // image source
        document.getElementById("image_src").value = block.src;

        // image block align
        const image_align_classes = [ "align-left", "align-center", "align-right" ];
        document.getElementById("image_align").value = "normal";
        block.class.split(" ").forEach(function(class_name){
            if (class_name.startsWith("align-")) {
                document.getElementById("image_align").value = class_name;
            }
        });

        // image link
        document.getElementById("image_link").value = block.link;

        // check if this icon is set to open in a new window
        if ( block.target ) {
            document.getElementById("image_target").value = "blank";
        } else {
            document.getElementById("image_target").value = "normal";
        }

        // image alt
        document.getElementById("image_alt").value = block.alt;

        // image width
        if (block.style.width) {
            document.getElementById("image_width").value = block.style.width;
        } else {
            document.getElementById("image_width").value = "";
        }

        // image height
        if (block.style.height) {
            document.getElementById("image_height").value = block.style.height;
        } else {
            document.getElementById("image_height").value = "";
        }

        save_button.onclick = function(event) {
            event.preventDefault();

            // image block id
            block.id = document.getElementById("image_id").value;

            // image block class
            block.class = document.getElementById("image_class").value;

            // image source
            block.src = document.getElementById("image_src").value;

            // image align
            const block_image_align = document.getElementById("image_align");
            if (block_image_align.value) {
                let itemsProcessed = 0;
                image_align_classes.forEach(function(class_name){
                    block.class = block.class.replace(class_name, "");
                    itemsProcessed++;
                    if(itemsProcessed === image_align_classes.length) {
                        if(block_image_align.value !== "normal"){
                            block.class = block.class + " " + block_image_align.value;
                        }
                    }
                });
            }

            // image link
            block.link = document.getElementById("image_link").value;

            // image link target
            if ( document.getElementById("icon_target").value === "blank" ) {
                block.target = true;
            } else {
                block.target = false;
            }

            // image link target
            if ( document.getElementById("image_target").value === "blank" ) {
                block.target = true;
            } else {
                block.target = false;
            }

            // image alt
            block.alt = document.getElementById("image_alt").value;

            // image width
            block.style.width = document.getElementById("image_width").value;

            // image height
            block.style.height = document.getElementById("image_height").value;

            refreshSparky();

            modal.style.display = "none";

        }
    }

    // icon block settings modal
    if (modal_type === "block_settings_modal_icon") {

        modal.style.display = "block";

        // get block position
        block = sparkyBlockPosition();

        // icon ID value
        document.getElementById("icon_id").value = block.id;

        // icon category
        document.getElementById("icon_category").value = block.category;

        // icon class value
        document.getElementById("icon_class").value = filterBlockClass(block.class).replace("fa-", "").replace("fas ", "").replace("far ", "").replace("fab ", "");

        // icon block color value
        sparky_minicolors("input#icon_color", block.style.color);
        if (block.style.color) {
            document.getElementById("icon_color").value = rgb_to_hex(block.style.color);
        } else {
            document.getElementById("icon_color").value = "";
        }

        // icon block size value
        if (block.style.fontSize) {
            document.getElementById("icon_size").value = block.style.fontSize;
        } else {
            document.getElementById("icon_size").value = "";
        }

        // icon block align
        const icon_align_classes = [ "has-text-align-left", "has-text-align-center", "has-text-align-right" ];
        document.getElementById("icon_align").value = "normal";
        block.class.split(" ").forEach(function(class_name){
            if (class_name.startsWith("has-text-align-")) {
                document.getElementById("icon_align").value = class_name;
            }
        });

        // icon link value
        document.getElementById("icon_link").value = block.link;

        // check if this icon is set to open in a new window
        if ( block.target ) {
            document.getElementById("icon_target").value = "blank";
        } else {
            document.getElementById("icon_target").value = "normal";
        }

        save_button.onclick = function(event) {
            event.preventDefault();

            // icon block id
            block.id = document.getElementById("icon_id").value;

            // icon category
            block.category = document.getElementById("icon_category").value;

            // icon block class
            block.class = "fa-" + document.getElementById("icon_class").value;

            // icon block color
            block.style.color = document.getElementById("icon_color").value;

            // icon block size
            block.style.fontSize = document.getElementById("icon_size").value;

            // icon block align
            const block_icon_align = document.getElementById("icon_align");
            if (block_icon_align.value) {
                let itemsProcessed = 0;
                icon_align_classes.forEach(function(class_name){
                    block.class = block.class.replace(class_name, "");
                    itemsProcessed++;
                    if(itemsProcessed === icon_align_classes.length) {
                        if(block_icon_align.value !== "normal"){
                            block.class = block.class + " " + block_icon_align.value;
                        }
                    }
                });
            }

            // icon block link
            block.link = document.getElementById("icon_link").value;

            // icon block link target
            if ( document.getElementById("icon_target").value === "blank" ) {
                block.target = true;
            } else {
                block.target = false;
            }

            refreshSparky();

            modal.style.display = "none";

        }
    }

    // separator block settings modal
    if (modal_type === "block_settings_modal_separator") {

        modal.style.display = "block";

        // get block position
        block = sparkyBlockPosition();

        // separator ID value
        document.getElementById("separator_id").value = block.id;

        // separator class value
        document.getElementById("separator_class").value = filterBlockClass(block.class);

        // separator block color value
        sparky_minicolors("input#separator_color", block.style.backgroundColor);
        if (block.style.backgroundColor) {
            document.getElementById("separator_color").value = rgb_to_hex(block.style.backgroundColor);
        } else {
            document.getElementById("separator_color").value = "";
        }

        // separator block height value
        if (block.style.height) {
            document.getElementById("separator_height").value = block.style.height;
        } else {
            document.getElementById("separator_height").value = "";
        }

        save_button.onclick = function(event) {
            event.preventDefault();

            // separator block id
            block.id = document.getElementById("separator_id").value;

            // separator block class
            block.class = document.getElementById("separator_class").value;

            // separator block color
            block.style.backgroundColor = document.getElementById("separator_color").value;

            // separator block height
            block.style.height = document.getElementById("separator_height").value;

            refreshSparky();

            modal.style.display = "none";

        }
    }

    // spacer block settings modal
    if (modal_type === "block_settings_modal_spacer") {

        modal.style.display = "block";

        // get block position
        block = sparkyBlockPosition();

        // spacer ID value
        document.getElementById("spacer_id").value = block.id;

        // spacer class value
        document.getElementById("spacer_class").value = filterBlockClass(block.class);

        // spacer block height value
        if (block.style.height) {
            document.getElementById("spacer_height").value = block.style.height;
        } else {
            document.getElementById("spacer_height").value = "";
        }

        save_button.onclick = function(event) {
            event.preventDefault();

            // spacer block id
            block.id = document.getElementById("spacer_id").value;

            // spacer block class
            block.class = "sparky_spacer " + document.getElementById("spacer_class").value;

            // spacer block height
            block.style.height = document.getElementById("spacer_height").value;

            refreshSparky();

            modal.style.display = "none";

        }
    }

    // button block settings modal
    if (modal_type === "block_settings_modal_button") {

        modal.style.display = "block";

        // get block position
        block = sparkyBlockPosition();

        // button ID value
        document.getElementById("button_id").value = block.id;

        // button class value
        document.getElementById("button_class").value = filterBlockClass(block.class);

        // button text value
        document.getElementById("button_text").value = block.content;

        // button link value
        document.getElementById("button_link").value = block.link;

        // check if this button is set to open in a new window
        if ( block.target ) {
            document.getElementById("button_target").value = "blank";
        } else {
            document.getElementById("button_target").value = "normal";
        }

        // button full width
        if (block.style.width === "auto") {
            document.getElementById("button_full_width").checked = true;
        } else {
            document.getElementById("button_full_width").checked = false;
        }

        // button block width value
        if (block.style.width && block.style.width !== "auto") {
            document.getElementById("button_width").value = block.style.width;
        } else {
            document.getElementById("button_width").value = "";
        }

        // button block height value
        if (block.style.lineHeight) {
            document.getElementById("button_height").value = block.style.lineHeight;
        } else {
            document.getElementById("button_height").value = "";
        }

        // button block align value
        const button_align_classes = [ "align-left", "align-center", "align-right" ];
        document.getElementById("button_align").value = "normal";
        block.class.split(" ").forEach(function(class_name){
            if (class_name.startsWith("align-")) {
                document.getElementById("button_align").value = class_name;
            }
        });

        // button block font size
        const font_size_classes = [ "has-small-font-size", "has-medium-font-size", "has-large-font-size", "has-huge-font-size" ];
        document.getElementById("button_font_size").value = "normal";
        block.class.split(" ").forEach(function(class_name){
            if (class_name.endsWith("-font-size")) {
                document.getElementById("button_font_size").value = class_name;
            }
        });

        // button block custom font size 
        if (block.style.fontSize) {
            document.getElementById("button_custom_font_size").value = block.style.fontSize;
        } else {
            document.getElementById("button_custom_font_size").value = "";
        }

        // button block text color value
        sparky_minicolors("input#button_text_color", block.style.color);
        if (block.style.color) {
            document.getElementById("button_text_color").value = rgb_to_hex(block.style.color);
        } else {
            document.getElementById("button_text_color").value = "";
        }

        // button block background color value
        sparky_minicolors("input#button_background_color", block.style.backgroundColor);
        if (block.style.backgroundColor) {
            document.getElementById("button_background_color").value = rgb_to_hex(block.style.backgroundColor);
        } else {
            document.getElementById("button_background_color").value = "";
        }

        // button block border width value
        if (block.style.borderWidth) {
            document.getElementById("button_border_width").value = block.style.borderWidth;
        } else {
            document.getElementById("button_border_width").value = "";
        }

        // button block border color value
        sparky_minicolors("input#button_border_color", block.style.borderColor);
        if (block.style.borderColor) {
            document.getElementById("button_border_color").value = rgb_to_hex(block.style.borderColor);
        } else {
            document.getElementById("button_border_color").value = "";
        }

        // button block border radius value
        if (block.style.borderRadius) {
            document.getElementById("button_border_radius").value = block.style.borderRadius;
        } else {
            document.getElementById("button_border_radius").value = "";
        }

        save_button.onclick = function(event) {
            event.preventDefault();

            // button block id
            block.id = document.getElementById("button_id").value;

            // button block class
            block.class = "sparky_button " + document.getElementById("button_class").value;

            // button block text
            block.content = document.getElementById("button_text").value;

            // button block link
            block.link = document.getElementById("button_link").value;

            // button block link target
            if ( document.getElementById("button_target").value === "blank" ) {
                block.target = true;
            } else {
                block.target = false;
            }

            // button full width
            if (document.getElementById("button_full_width").checked) {
                block.style.width = "auto";
            } else {
                block.style.width = "";
            }

            // button block width
            if ( block.style.width !== "auto" ) {
                block.style.width = document.getElementById("button_width").value;
            }

            // button block height
            block.style.lineHeight = document.getElementById("button_height").value;

            // button block align
            const block_button_align = document.getElementById("button_align");
            if (block_button_align.value) {
                let itemsProcessed = 0;
                button_align_classes.forEach(function(class_name){
                    block.class = block.class.replace(class_name, "");
                    itemsProcessed++;
                    if(itemsProcessed === button_align_classes.length) {
                        if(block_button_align.value !== "normal"){
                            block.class = block.class + " " + block_button_align.value;
                        }
                    }
                });
            }

            // button block font size
            const block_font_size = document.getElementById("button_font_size");
            if (block_font_size.value) {
                let itemsProcessed = 0;
                font_size_classes.forEach(function(class_name){
                    block.class = block.class.replace(class_name, "");
                    itemsProcessed++;
                    if(itemsProcessed === font_size_classes.length) {
                        if(block_font_size.value !== "normal"){
                            block.class = block.class + " " + block_font_size.value;
                        }
                    }
                });
            }

            // button block custom font size
            block.style.fontSize = document.getElementById("button_custom_font_size").value;

            // button block color
            block.style.color = document.getElementById("button_text_color").value;

            // button background color
            block.style.backgroundColor = document.getElementById("button_background_color").value;

            // button block border width
            block.style.borderWidth = document.getElementById("button_border_width").value;

            // button block border color
            block.style.borderColor = document.getElementById("button_border_color").value;

            // button block border radius
            block.style.borderRadius = document.getElementById("button_border_radius").value;

            refreshSparky();

            modal.style.display = "none";

        }
    }

    // list block settings modal
    if (modal_type === "block_settings_modal_list") {

        modal.style.display = "block";

        // get block position
        block = sparkyBlockPosition();

        // list ID value
        document.getElementById("list_id").value = block.id;

        // list class value
        document.getElementById("list_class").value = filterBlockClass(block.class);

        // list type
        document.getElementById("list_type").value = block.listType;

        // list block text color value
        sparky_minicolors("input#list_color", block.style.color);
        if (block.style.color) {
            document.getElementById("list_color").value = rgb_to_hex(block.style.color);
        } else {
            document.getElementById("list_color").value = "";
        }

        // list block font size
        const font_size_classes = [ "has-small-font-size", "has-medium-font-size", "has-large-font-size", "has-huge-font-size" ];
        document.getElementById("list_font_size").value = "normal";
        block.class.split(" ").forEach(function(class_name){
            if (class_name.endsWith("-font-size")) {
                document.getElementById("list_font_size").value = class_name;
            }
        });

        // list block custom font size
        if (block.style.fontSize) {
            document.getElementById("list_custom_font_size").value = block.style.fontSize;
        } else {
            document.getElementById("list_custom_font_size").value = "";
        }

        // list block text align
        const text_align_classes = [ "has-text-align-left", "has-text-align-center", "has-text-align-right", "has-text-align-justify" ];
        document.getElementById("list_text_align").value = "normal";
        block.class.split(" ").forEach(function(class_name){
            if (class_name.startsWith("has-text-align-")) {
                document.getElementById("list_text_align").value = class_name;
            }
        });

        save_button.onclick = function(event) {
            event.preventDefault();

            // list block id
            block.id = document.getElementById("list_id").value;

            // list block class
            block.class = document.getElementById("list_class").value;

            // list type
            block.listType = document.getElementById("list_type").value;

            // list block text color value
            block.style.color = document.getElementById("list_color").value;

            // list font size
            const block_font_size = document.getElementById("list_font_size");
            if (block_font_size.value) {
                let itemsProcessed = 0;
                font_size_classes.forEach(function(class_name){
                    block.class = block.class.replace(class_name, "");
                    itemsProcessed++;
                    if(itemsProcessed === font_size_classes.length) {
                        if(block_font_size.value !== "normal"){
                            block.class = block.class + " " + block_font_size.value;
                        }
                    }
                });
            }

            // list custom font size
            block.style.fontSize = document.getElementById("list_custom_font_size").value;

            // list text align
            const block_text_align = document.getElementById("list_text_align");
            if (block_text_align.value) {
                let itemsProcessed = 0;
                text_align_classes.forEach(function(class_name){
                    block.class = block.class.replace(class_name, "");
                    itemsProcessed++;
                    if(itemsProcessed === text_align_classes.length) {
                        if(block_text_align.value !== "normal"){
                            block.class = block.class + " " + block_text_align.value;
                        }
                    }
                });
            }

            refreshSparky();

            modal.style.display = "none";

        }
    }

    // iframe block settings modal
    if (modal_type === "block_settings_modal_iframe") {

        modal.style.display = "block";

        // get block position
        block = sparkyBlockPosition();

        // iframe ID value
        document.getElementById("iframe_id").value = block.id;

        // iframe class value
        document.getElementById("iframe_class").value = filterBlockClass(block.class);

        // iframe source value
        document.getElementById("iframe_src").value = block.src;

        // iframe block align
        const iframe_align_classes = [ "align-left", "align-center", "align-right" ];
        document.getElementById("iframe_align").value = "normal";
        block.class.split(" ").forEach(function(class_name){
            if (class_name.startsWith("align-")) {
                document.getElementById("iframe_align").value = class_name;
            }
        });

        // iframe block width value
        if (block.style.width) {
            document.getElementById("iframe_width").value = block.style.width;
        } else {
            document.getElementById("iframe_width").value = "";
        }

        // iframe block height value
        if (block.style.height) {
            document.getElementById("iframe_height").value = block.style.height;
        } else {
            document.getElementById("iframe_height").value = "";
        }

        save_button.onclick = function(event) {
            event.preventDefault();

            // iframe block id
            block.id = document.getElementById("iframe_id").value;

            // iframe block class
            block.class = document.getElementById("iframe_class").value;

            // iframe block source
            block.src = document.getElementById("iframe_src").value;

            // iframe block align
            const block_iframe_align = document.getElementById("iframe_align");
            if (block_iframe_align.value) {
                let itemsProcessed = 0;
                iframe_align_classes.forEach(function(class_name){
                    block.class = block.class.replace(class_name, "");
                    itemsProcessed++;
                    if(itemsProcessed === iframe_align_classes.length) {
                        if(block_iframe_align.value !== "normal"){
                            block.class = block.class + " " + block_iframe_align.value;
                        }
                    }
                });
            }

            // iframe block width
            block.style.width = document.getElementById("iframe_width").value;

            // iframe block height
            block.style.height = document.getElementById("iframe_height").value;

            refreshSparky();

            modal.style.display = "none";

        }
    }

    // video block settings modal
    if (modal_type === "block_settings_modal_video") {

        modal.style.display = "block";

        // get block position
        block = sparkyBlockPosition();

        // video ID value
        document.getElementById("video_id").value = block.id;

        // video class value
        document.getElementById("video_class").value = filterBlockClass(block.class);

        // video poster value
        document.getElementById("video_poster").value = block.poster;

        // video MP4 value
        document.getElementById("video_mp4").value = block.mp4;

        // video OGG value
        document.getElementById("video_ogg").value = block.ogg;

        // video WEBM value
        document.getElementById("video_webm").value = block.webm;

        // video autoplay value
        if (block.autoplay) {
            document.getElementById("video_autoplay").checked = true;
        } else {
            document.getElementById("video_autoplay").checked = false;
        }

        // video controls value
        if (block.controls) {
            document.getElementById("video_controls").checked = true;
        } else {
            document.getElementById("video_controls").checked = false;
        }

        // video loop value
        if (block.loop) {
            document.getElementById("video_loop").checked = true;
        } else {
            document.getElementById("video_loop").checked = false;
        }

        // video muted value
        if (block.muted) {
            document.getElementById("video_muted").checked = true;
        } else {
            document.getElementById("video_muted").checked = false;
        }

        // video block align
        const video_align_classes = [ "align-left", "align-center", "align-right" ];
        document.getElementById("video_align").value = "normal";
        block.class.split(" ").forEach(function(class_name){
            if (class_name.startsWith("align-")) {
                document.getElementById("video_align").value = class_name;
            }
        });

        // video block width value
        if (block.style.width) {
            document.getElementById("video_width").value = block.style.width;
        } else {
            document.getElementById("video_width").value = "";
        }

        // video block height value
        if (block.style.height) {
            document.getElementById("video_height").value = block.style.height;
        } else {
            document.getElementById("video_height").value = "";
        }

        save_button.onclick = function(event) {
            event.preventDefault();

            // video block id
            block.id = document.getElementById("video_id").value;

            // video block class
            block.class = document.getElementById("video_class").value;

            // video block poster source
            block.poster = document.getElementById("video_poster").value;

            // video block MP4 source
            block.mp4 = document.getElementById("video_mp4").value;

            // video block OGG source
            block.ogg = document.getElementById("video_ogg").value;

            // video block WEBM source
            block.webm = document.getElementById("video_webm").value;

            // video block autoplay
            if (document.getElementById("video_autoplay").checked) {
                block.autoplay = true;
            } else {
                block.autoplay = false;
            }

            // video block controls
            if (document.getElementById("video_controls").checked) {
                block.controls = true;
            } else {
                block.controls = false;
            }

            // video block loop
            if (document.getElementById("video_loop").checked) {
                block.loop = true;
            } else {
                block.loop = false;
            }

            // video block muted
            if (document.getElementById("video_muted").checked) {
                block.muted = true;
            } else {
                block.muted = false;
            }

            // video block align
            const block_video_align = document.getElementById("video_align");
            if (block_video_align.value) {
                let itemsProcessed = 0;
                video_align_classes.forEach(function(class_name){
                    block.class = block.class.replace(class_name, "");
                    itemsProcessed++;
                    if(itemsProcessed === video_align_classes.length) {
                        if(block_video_align.value !== "normal"){
                            block.class = block.class + " " + block_video_align.value;
                        }
                    }
                });
            }

            // video block width
            block.style.width = document.getElementById("video_width").value;

            // video block height
            block.style.height = document.getElementById("video_height").value;

            refreshSparky();

            modal.style.display = "none";

        }
    }

    // audio block settings modal
    if (modal_type === "block_settings_modal_audio") {

        modal.style.display = "block";

        // get block position
        block = sparkyBlockPosition();

        // audio ID value
        document.getElementById("audio_id").value = block.id;

        // audio class value
        document.getElementById("audio_class").value = filterBlockClass(block.class);

        // audio MP3 value
        document.getElementById("audio_mp3").value = block.mp3;

        // audio OGG value
        document.getElementById("audio_ogg").value = block.ogg;

        // audio WAV value
        document.getElementById("audio_wav").value = block.wav;

        // audio autoplay value
        if (block.autoplay) {
            document.getElementById("audio_autoplay").checked = true;
        } else {
            document.getElementById("audio_autoplay").checked = false;
        }

        // audio controls value
        if (block.controls) {
            document.getElementById("audio_controls").checked = true;
        } else {
            document.getElementById("audio_controls").checked = false;
        }

        // audio loop value
        if (block.loop) {
            document.getElementById("audio_loop").checked = true;
        } else {
            document.getElementById("audio_loop").checked = false;
        }

        // audio muted value
        if (block.muted) {
            document.getElementById("audio_muted").checked = true;
        } else {
            document.getElementById("audio_muted").checked = false;
        }

        // audio block align
        const audio_align_classes = [ "align-left", "align-center", "align-right" ];
        document.getElementById("audio_align").value = "normal";
        block.class.split(" ").forEach(function(class_name){
            if (class_name.startsWith("align-")) {
                document.getElementById("audio_align").value = class_name;
            }
        });

        save_button.onclick = function(event) {
            event.preventDefault();

            // audio block id
            block.id = document.getElementById("audio_id").value;

            // audio block class
            block.class = document.getElementById("audio_class").value;

            // audio block MP3 source
            block.mp3 = document.getElementById("audio_mp3").value;

            // audio block OGG source
            block.ogg = document.getElementById("audio_ogg").value;

            // audio block WAV source
            block.wav = document.getElementById("audio_wav").value;

            // audio block autoplay
            if (document.getElementById("audio_autoplay").checked) {
                block.autoplay = true;
            } else {
                block.autoplay = false;
            }

            // audio block controls
            if (document.getElementById("audio_controls").checked) {
                block.controls = true;
            } else {
                block.controls = false;
            }

            // audio block loop
            if (document.getElementById("audio_loop").checked) {
                block.loop = true;
            } else {
                block.loop = false;
            }

            // audio block muted
            if (document.getElementById("audio_muted").checked) {
                block.muted = true;
            } else {
                block.muted = false;
            }

            // audio block align
            const block_audio_align = document.getElementById("audio_align");
            if (block_audio_align.value) {
                let itemsProcessed = 0;
                audio_align_classes.forEach(function(class_name){
                    block.class = block.class.replace(class_name, "");
                    itemsProcessed++;
                    if(itemsProcessed === audio_align_classes.length) {
                        if(block_audio_align.value !== "normal"){
                            block.class = block.class + " " + block_audio_align.value;
                        }
                    }
                });
            }

            refreshSparky();

            modal.style.display = "none";

        }
    }

    // social block settings modal
    if (modal_type === "block_settings_modal_social") {

        modal.style.display = "block";

        // get block position
        block = sparkyBlockPosition();

        // social ID value
        document.getElementById("social_id").value = block.id;

        // social class value
        document.getElementById("social_class").value = filterBlockClass(block.class);

        // social block align value
        if (block.style.textAlign) {
            document.getElementById("social_align").value = block.style.textAlign;
        } else {
            document.getElementById("social_align").value = "";
        }

        // social block text color value
        sparky_minicolors("input#social_color", block.style.color);
        if (block.style.color) {
            document.getElementById("social_color").value = rgb_to_hex(block.style.color);
        } else {
            document.getElementById("social_color").value = "";
        }

        // check if links are set to open in a new window
        if ( block.target ) {
            document.getElementById("social_target").value = "blank";
        } else {
            document.getElementById("social_target").value = "normal";
        }

        // social block size value
        if (block.style.fontSize) {
            document.getElementById("social_size").value = block.style.fontSize;
        } else {
            document.getElementById("social_size").value = "";
        }

        // social networks
        document.getElementById("social_network1").value = block.network1;
        document.getElementById("social_link1").value = block.link1;
        document.getElementById("social_network2").value = block.network2;
        document.getElementById("social_link2").value = block.link2;
        document.getElementById("social_network3").value = block.network3;
        document.getElementById("social_link3").value = block.link3;
        document.getElementById("social_network4").value = block.network4;
        document.getElementById("social_link4").value = block.link4;
        document.getElementById("social_network5").value = block.network5;
        document.getElementById("social_link5").value = block.link5;
        document.getElementById("social_network6").value = block.network6;
        document.getElementById("social_link6").value = block.link6;

        save_button.onclick = function(event) {
            event.preventDefault();

            // social block id
            block.id = document.getElementById("social_id").value;

            // social block class
            block.class = "sparky_social_icons " + document.getElementById("social_class").value;

            // social block align
            block.style.textAlign = document.getElementById("social_align").value;

            // social block color
            block.style.color = document.getElementById("social_color").value;

            // social block size
            block.style.fontSize = document.getElementById("social_size").value;

            // social block link target
            if ( document.getElementById("social_target").value === "blank" ) {
                block.target = true;
            } else {
                block.target = false;
            }

            // social networks
            block.network1 = document.getElementById("social_network1").value;
            block.link1 = document.getElementById("social_link1").value;
            block.network2 = document.getElementById("social_network2").value;
            block.link2 = document.getElementById("social_link2").value;
            block.network3 = document.getElementById("social_network3").value;
            block.link3 = document.getElementById("social_link3").value;
            block.network4 = document.getElementById("social_network4").value;
            block.link4 = document.getElementById("social_link4").value;
            block.network5 = document.getElementById("social_network5").value;
            block.link5 = document.getElementById("social_link5").value;
            block.network6 = document.getElementById("social_network6").value;
            block.link6 = document.getElementById("social_link6").value;

            refreshSparky();

            modal.style.display = "none";

        }
    }

    // custom HTML block settings modal
    if (modal_type === "block_settings_modal_customhtml") {

        modal.style.display = "block";

        // get block position
        block = sparkyBlockPosition();

        // custom HTML ID value
        document.getElementById("customhtml_id").value = block.id;

        // custom HTML class value
        document.getElementById("customhtml_class").value = filterBlockClass(block.class);

        save_button.onclick = function(event) {
            event.preventDefault();

            // custom HTML block id
            block.id = document.getElementById("customhtml_id").value;

            // custom HTML block class
            block.class = "sparky_custom_html " + document.getElementById("customhtml_class").value;

            refreshSparky();

            modal.style.display = "none";

        }
    }

    // Joomla module block settings modal
    if (modal_type === "block_settings_modal_joomlamodule") {

        modal.style.display = "block";

        // get block position
        block = sparkyBlockPosition();

        // Joomla module ID value
        document.getElementById("joomlamodule_id").value = block.id.replace("sparky_joomla_module_id", "");

        // Joomla module class value
        document.getElementById("joomlamodule_class").value = filterBlockClass(block.class);

        save_button.onclick = function(event) {
            event.preventDefault();

            // Joomla module block id
            block.id = "sparky_joomla_module_id" + document.getElementById("joomlamodule_id").value;

            // Joomla module block class
            block.class = "sparky_joomla_module " + document.getElementById("joomlamodule_class").value;

            // Joomla module content (shortcode)
            block.content = "{loadmoduleid " + block.id.replace("sparky_joomla_module_id", "") + "}";

            refreshSparky();

            modal.style.display = "none";

        }
    }

    // add link to paragraph modal
    if (modal_type === "add_link_modal") {

        let currentLink = false;
        const selection = window.getSelection();
        const anchorNode = selection ? (selection.anchorNode || selection.baseNode) : null;

        // if selected text is inside link
        if (anchorNode && anchorNode.parentNode.nodeName === "A") {

            modal.style.display = "block";

            currentLink = anchorNode.parentNode;

            // assign current link value to the modal input
            document.getElementById("add_link_link").value = currentLink.getAttribute("href");

            // check if this link is set to open in a new window
            if ( currentLink.getAttribute("target") === "_blank" ) {
                document.getElementById("add_link_target").value = "blank";
            } else {
                document.getElementById("add_link_target").value = "normal";
            }

        // if selected text is not inside link, we'll create new link with prompt (without modal)
        } else {

            var linkURL = prompt('Enter a URL:', 'https://');
            var selectedText = selection;

            document.execCommand('insertHTML', false, '<a href="' + linkURL + '">' + selectedText + '</a>');

        }

        save_button.onclick = function(event) {
            event.preventDefault();

            // if selected text is inside link
            if ( currentLink ) {

                // if link value is empty, let's remove this link
                if ( document.getElementById("add_link_link").value === "" ) {

                    // remove link (convert it to text)
                    currentLink.outerHTML = currentLink.innerText;

                } else {
                    currentLink.setAttribute( "href", document.getElementById("add_link_link").value );

                    if ( document.getElementById("add_link_target").value === "blank" ) {
                        currentLink.setAttribute( "target", "_blank" );
                    } else {
                        currentLink.removeAttribute( "target" );
                    }
                }
            }


            // Get block position in array and add new html
            sparkyPageContentArray[rowPosition].content[columnPosition].content[blockPosition].content = blockToEdit.innerHTML;

            refreshSparky();

            modal.style.display = "none";

        }

        // remove link from "Remove Link" button in modal
        let remove_link_button = document.getElementById("remove_link_modal");
        remove_link_button.onclick = function(event) {

            event.preventDefault();

            // remove link (convert it to text)
            currentLink.outerHTML = currentLink.innerText;

            // Get block position in array and add new html
            sparkyPageContentArray[rowPosition].content[columnPosition].content[blockPosition].content = blockToEdit.innerHTML;

            refreshSparky();
            
            modal.style.display = "none";

        }
    }


}

/*


next steps:

 -- Add Predefined Row (create predefined rows (i.e. 3 columns, each with image, heading and text))
 -- Import Predefined Page (entire sparkyPageContentArray filled with data)

 -- More complex blocks, such as:
    -carousel
    -counter
    -accordion


 joomla bugs:



 browsers compatibility issues:

    opera v73 bugs:
     -none

    firefox v84 bugs:
     -select text: fixed with functions sparkyDisableDraggable and sparkyEnableDraggable (double click requied)
     -dragndrop: fixed by deleting event.dataTransfer.clearData();

    safari v14 bugs:
     -select text: (same as for firefox)

    edge v87 bugs:
     -none

*/
