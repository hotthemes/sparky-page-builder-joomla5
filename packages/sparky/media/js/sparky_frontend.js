/* Sparky Page Builder | https://www.hotjoomlatemplates.com | Copyright (C) 2021 HotThemes. All rights reserved | GNU/GPLv3 http://www.gnu.org/licenses/gpl-3.0.html */

/* Set scroll bar width variable */
document.addEventListener('DOMContentLoaded', function() {

	document.documentElement.style.setProperty('--scrollbar-width', (window.innerWidth - document.documentElement.clientWidth) + "px");

	/* Set ".row_full_width .sparky_page_container" max width to the parent container's width */
	let row_full_width = document.querySelectorAll('.row_full_width:not(.row_fluid)');
	let parentWidth = 0;

	function rowFullWidthMaxWidth() {
		row_full_width.forEach(function(row){
			// only in front-end, only in edit mode
			if (!document.getElementsByClassName("js-editor-sparky").length) {
				// 30 (15+15) is negative margin of .sparky_page_container
				parentWidth = row.parentNode.offsetWidth + 30;
				row.children[0].style.maxWidth = parentWidth + 'px';
			}
		});
	}
	rowFullWidthMaxWidth();
	window.onresize = rowFullWidthMaxWidth;

});