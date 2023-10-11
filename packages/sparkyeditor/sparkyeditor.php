<?php
/*------------------------------------------------------------------------
# "Sparky Content Plugin" Joomla plugin
# Copyright (C) 2021 HotThemes. All Rights Reserved.
# License: GNU/GPLv3 http://www.gnu.org/licenses/gpl-3.0.html
# Author: HotJoomlaTemplates.com
# Website: https://www.hotjoomlatemplates.com
-------------------------------------------------------------------------*/

// no direct access
defined( '_JEXEC' ) or die( 'Restricted access' );

use Joomla\CMS\Factory;
use Joomla\CMS\Plugin\CMSPlugin;

// jimport('joomla.plugin.plugin');

class plgContentSparkyEditor extends CMSPlugin
{

	public function onContentPrepare($context, &$article, &$params, $page = 0)
	{
		
		// // checking if the page content is edited by the Sparky Editor
		// if (strpos($article->text, 'sparky_page_content') === false) {
		// 	return true;
		// }
		
		// // adding CSS and JS in head
		// $doc = JFactory::getDocument();
		
		// // add your stylesheet
		// $doc->addStyleSheet( JURI :: base().'plugins/content/sparkyeditor/css/sparky_frontend.css' );

		/** @var HtmlDocument $doc */
		$doc = Factory::getApplication()->getDocument();
		$lang = Factory::getApplication()->getLanguage();
		$direction = $lang->get('rtl');
		$wa  = $doc->getWebAssetManager();

		// Add assets
		$wa->registerAndUseStyle('plg_content_sparkyeditor', 'plg_editors_sparky/sparky_frontend.css')
		   ->registerAndUseScript('plg_content_sparkyeditor', 'plg_editors_sparky/sparky_frontend.js')
		   ->registerAndUseScript('plg_content_sparkyanimation', 'plg_editors_sparky/sparky_animation.js', [], [], ['jquery'])
		;
		
		// inline style declaration
		if ($direction) {
			$doc->addStyleDeclaration( '
.sparky_page_container {
	flex-direction: row-reverse;
}
			' );
		}

		// Replace colors

		$templateColor[1] = $this->params->def('templateColor1', '');
		$templateColor[2] = $this->params->def('templateColor2', '');
		$templateColor[3] = $this->params->def('templateColor3', '');
		$templateColor[4] = $this->params->def('templateColor4', '');
		$templateColor[5] = $this->params->def('templateColor5', '');
		$templateColor[6] = $this->params->def('templateColor6', '');

		for ($i = 1; $i <= 6; $i++) {

			$templateColor[$i] = $this->params->def('templateColor'.$i, '');

			if ($templateColor[$i]) {

				$color_rgb[$i][0] = hexdec(substr($templateColor[$i], 1, 2));
				$color_rgb[$i][1] = hexdec(substr($templateColor[$i], 3, 2));
				$color_rgb[$i][2] = hexdec(substr($templateColor[$i], 5, 2));

				$color_values = [ $templateColor[$i], "rgb(".$color_rgb[$i][0].", ".$color_rgb[$i][1].", ".$color_rgb[$i][2].")", "rgb(".$color_rgb[$i][0].", ".$color_rgb[$i][1].", ".$color_rgb[$i][2].", 1)" ];

				$article->text = str_replace($color_values, "var(--sparkycolor".$i.")", $article->text);

			}
		}
	}
}