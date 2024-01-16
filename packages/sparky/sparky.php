<?php
/*------------------------------------------------------------------------
# "Sparky Editor Plugin" Joomla plugin
# Copyright (C) 2021 HotThemes. All Rights Reserved.
# License: GNU/GPLv3 http://www.gnu.org/licenses/gpl-3.0.html
# Author: HotJoomlaTemplates.com
# Website: https://www.hotjoomlatemplates.com
-------------------------------------------------------------------------*/

defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Layout\LayoutHelper;
use Joomla\CMS\Plugin\CMSPlugin;
use Joomla\Event\Event;
use Joomla\CMS\Uri\Uri;
use Joomla\CMS\Language\Text;

/**
 * Plain Textarea Editor Plugin
 *
 * @since  1.5
 */
class PlgEditorSparky extends CMSPlugin
{

	// public function onInit()
	// {
	// 	JHtml::_('script', 'editors/none/none.min.js', array('version' => 'auto', 'relative' => true));
	// 	JHtml::_('script', 'editors/sparky/sparky_editor.js', array('version' => 'auto', 'relative' => true));
	// }

	/**
	 * Copy editor content to form field.
	 *
	 * Not applicable in this editor.
	 *
	 * @param   string  $editor  the editor id
	 *
	 * @return  void
	 *
	 * @deprecated 4.0 Use directly the returned code
	 */
	public function onSave($content)
	{
	}

	/**
	 * Get the editor content.
	 *
	 * @param   string  $id  The id of the editor field.
	 *
	 * @return  string
	 *
	 * @deprecated 4.0 Use directly the returned code
	 */
	public function onGetContent($id)
	{
		return 'Joomla.editors.instances[' . json_encode($id) . '].getValue();';
	}

	/**
	 * Set the editor content.
	 *
	 * @param   string  $id    The id of the editor field.
	 * @param   string  $html  The content to set.
	 *
	 * @return  string
	 *
	 * @deprecated 4.0 Use directly the returned code
	 */
	public function onSetContent($id, $html)
	{
		return 'Joomla.editors.instances[' . json_encode($id) . '].setValue(' . json_encode($html) . ');';
	}

	/**
	 * Inserts html code into the editor
	 *
	 * @param   string  $id  The id of the editor field
	 *
	 * @return  void
	 *
	 * @deprecated 4.0
	 */
	public function onGetInsertMethod($id)
	{
	}

	/**
	 * Display the editor area.
	 *
	 * @param   string   $name     The control name.
	 * @param   string   $content  The contents of the text area.
	 * @param   string   $width    The width of the text area (px or %).
	 * @param   string   $height   The height of the text area (px or %).
	 * @param   integer  $col      The number of columns for the textarea.
	 * @param   integer  $row      The number of rows for the textarea.
	 * @param   boolean  $buttons  True and the editor buttons will be displayed.
	 * @param   string   $id       An optional ID for the textarea (note: since 1.6). If not supplied the name is used.
	 * @param   string   $asset    The object asset
	 * @param   object   $author   The author.
	 * @param   array    $params   Associative array of editor parameters.
	 *
	 * @return  string
	 */
	public function onDisplay($name, $content, $width, $height, $col, $row, $buttons = true,
		$id = null, $asset = null, $author = null, $params = array())
	{
		if (empty($id))
		{
			$id = $name;
		}

		/** @var HtmlDocument $doc */
		$doc = Factory::getApplication()->getDocument();
		$wa  = $doc->getWebAssetManager();

    $uri = Uri::getInstance();

		// get all Joomla modules

		$db = Factory::getDBO();
		$query = 'SELECT m.title, m.id
		          FROM #__modules AS m
		          WHERE m.published = 1
		          AND m.client_id = 0';
		$db->setQuery( $query );
		$joomla_modules = $db->loadObjectList();
		$joomla_modules_options = "";
		foreach ( $joomla_modules as $joomla_module ) {
			// echo "<pre>";
			// print_r($joomla_module);
			// echo "</pre>";
			$joomla_modules_options = $joomla_modules_options . '<option value="' . $joomla_module->id . '">' . $joomla_module->title . '</option>';
		}


    // get the default template for the site application

    $query = $db->getQuery(true)
      ->select('template')
      ->from('#__template_styles')
      ->where('client_id=0 AND home=' . $db->quote('1'));

    $db->setQuery($query);

    try
    {
      $template = $db->loadResult();
    }
    catch (RuntimeException $e)
    {
      $app->enqueueMessage(Text::_('JERROR_AN_ERROR_HAS_OCCURRED'), 'error');

      return '';
    }

    $templates_path = JPATH_SITE . '/templates';

    $wa->registerAndUseStyle('minicolors', 'vendor/minicolors/jquery.minicolors.css')
       //->registerAndUseStyle('media', 'system/fields/joomla-field-media.min.css')
       //->registerAndUseStyle('cassiopeia_css', 'templates/cassiopeia/css/template.min.css')
       ->registerAndUseStyle('plg_editors_sparky', 'plg_editors_sparky/sparky_editor.css')
       ->registerAndUseStyle($template, 'templates/'.$template.'/css/editor.css')
       ->registerAndUseStyle($template.'_media', 'media/templates/site/'.$template.'/css/editor.css')
       ->registerAndUseScript('jquery', 'vendor/jquery/jquery.min.js')
       ->registerAndUseScript('plg_editors_none', 'plg_editors_none/joomla-editor-none.min.js')
       ->registerAndUseScript('minicolors', 'vendor/minicolors/jquery.minicolors.min.js');


		// // Add assets
		// $wa->registerAndUseStyle('plg_editors_sparky', 'plugins/editors/sparky/css/sparky_editor.css')
		//    ->registerAndUseScript('plg_editors_none', 'plg_editors_none/joomla-editor-none.min.js')
		//    ->registerAndUseScript('plg_editors_sparky', 'plugins/editors/sparky/js/sparky_editor.js')
		// ;

		// Factory::getDocument()->getWebAssetManager()
		// 	->registerAndUseScript(
		// 		'webcomponent.editor-none',
		// 		'plg_editors_none/joomla-editor-none.min.js',
		// 		['webcomponent' => true]
		// 	)
		// 	->registerAndUseScript(
		// 		'webcomponent.editor-sparky',
		// 		'plg_editors_sparky/sparky_editor.js',
		// 		['webcomponent' => true]
		// 	);

    

		$editor = '<div class="js-editor-sparky">'
			. '<textarea id="sparkyEditorTextarea" name="' . $name . '">'
			. $content
			. '</textarea>'
			. '<div id="sparkyPageContentEditable"></div>'
			. '</div>'
			. '<!-- Add Row Modal -->
<div id="add_row_modal" class="sparky_modal">
  <div class="sparky_modal-content thin-modal">
      <div class="sparky_modal-header">
        <span id="close_add_row_modal" class="sparky_modal_close">&times;</span>
        <h3>Add Row</h3>
      </div>
      <div class="sparky_modal-body">
        <p>Select initial row layout:</p>
        <ul class="sparky_modal_rows">
            <li><a id="columns_12"></a></li>
            <li><a id="columns_6_6"></a></li>
            <li><a id="columns_4_4_4"></a></li>
            <li><a id="columns_8_4"></a></li>
            <li><a id="columns_4_8"></a></li>
            <li><a id="columns_9_3"></a></li>
            <li><a id="columns_3_9"></a></li>
            <li><a id="columns_3_3_3_3"></a></li>
            <li><a id="columns_2_2_2_2_2_2"></a></li>
        </ul>
      </div>
      <div class="sparky_modal-footer">
        <p>Sparky Page Builder</p>
      </div>
  </div>
</div>

<!-- Row Settings Modal -->
<div id="row_settings_modal" class="sparky_modal">
  <div class="sparky_modal-content">
      <div class="sparky_modal-header">
        <span id="close_row_settings_modal" class="sparky_modal_close">&times;</span>
        <h3>Row Settings</h3>
      </div>
      <div class="sparky_modal-body">
        <label>Row ID <input type="text" name="row_id" id="row_id"></label>
        <label>Row Class <input type="text" name="row_class" id="row_class" placeholder="i.e. myClass"></label>
        <label></label>
        <label><input type="checkbox" name="row_full_width" id="row_full_width"> Full Width</label>
        <label><input type="checkbox" name="row_fluid" id="row_fluid"> Fluid Row</label>
        <div>Background Image</div>
        <p style="font-size:13px;">To use this in front-end, enable option Content > Articles > Options > Editing Layout > "Frontend Images and Links"</p>
        <joomla-field-media class="field-media-wrapper" type="image" base-path="'.URI :: root().'" root-folder="images" url="'.$uri->getPath().'?option=com_media&amp;view=media&amp;tmpl=component&amp;fieldid={field-media-id}&amp;path=" modal-container=".modal" modal-width="100%" modal-height="400px" input=".field-media-input" button-select=".button-select" button-clear=".button-clear" button-save-selected=".button-save-selected" preview="static" preview-container=".field-media-preview" preview-width="200" preview-height="200">
          <div id="imageModal_jform_images_image_intro" role="dialog" tabindex="-1" class="joomla-modal modal fade" data-url="'.$uri->getPath().'?option=com_media&amp;view=media&amp;tmpl=component&amp;asset=89&amp;author=149&amp;fieldid={field-media-id}&amp;path=" data-iframe="<iframe class=&quot;iframe&quot; src=&quot;index.php?option=com_media&amp;amp;view=media&amp;amp;tmpl=component&amp;amp;fieldid={field-media-id}&amp;amp;path=&quot; name=&quot;Change Image&quot; title=&quot;Change Image&quot; height=&quot;100%&quot; width=&quot;100%&quot;></iframe>">
          <div class="modal-dialog modal-lg jviewport-width80">
            <div class="modal-content">
              <div class="modal-header">
              <h3 class="modal-title">Change Image</h3>
                <button type="button" class="btn-close novalidate" data-bs-dismiss="modal" aria-label="Close">
            </button>
          </div>
        <div class="modal-body jviewport-height60">
          </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-success button-save-selected">Select</button><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button></div>
            </div>
          </div>
        </div>
            <div class="input-group">
              <input type="text" name="row_background_image" id="row_background_image" value="" readonly="readonly" class="form-control field-media-input">
              <button type="button" class="btn btn-success button-select">Select</button>
              <button type="button" class="btn btn-danger button-clear"><span class="icon-times" aria-hidden="true"></span><span class="visually-hidden">Clear</span></button>
            </div>
        </joomla-field-media>
        <label>Background Color<br><input type="text" name="row_background_color" id="row_background_color" placeholder="i.e. #FF9933"></label>
        <label>Background Image Repeat:
            <select id="row_background_image_repeat">
                <option value="">Repeat</option>
                <option value="no-repeat">No Repeat</option>
                <option value="repeat-x">Repeat Horizontally</option>
                <option value="repeat-y">Repeat Vertically</option>
            </select>
        </label>
        <label>Background Image Position:
            <select id="row_background_image_position">
                <option value="">Top Left</option>
                <option value="center top">Top Center</option>
                <option value="right top">Top Right</option>
                <option value="left center">Center Left</option>
                <option value="center center">Center Center</option>
                <option value="right center">Center Right</option>
                <option value="left bottom">Bottom Left</option>
                <option value="center bottom">Bottom Center</option>
                <option value="right bottom">Bottom Right</option>
            </select>
        </label>
        <label>Background Image Size:
            <select id="row_background_image_size">
                <option value="">Auto</option>
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
            </select>
        </label>
        <label>Background Image Attachment:
            <select id="row_background_image_attachment">
                <option value="">Scroll</option>
                <option value="fixed">Fixed</option>
            </select>
        </label>
        <label></label>
        <label>Margin:<br>
            <input type="text" name="row_margin_top" id="row_margin_top" class="input_inline" size="6" placeholder="Top">
            <input type="text" name="row_margin_bottom" id="row_margin_bottom" class="input_inline" size="6" placeholder="Bottom">
            <input type="text" name="row_margin_left" id="row_margin_left" class="input_inline" size="6" placeholder="Left">
            <input type="text" name="row_margin_right" id="row_margin_right" class="input_inline" size="6" placeholder="Right">
        </label>
        <label>Padding:<br>
            <input type="text" name="row_padding_top" id="row_padding_top" class="input_inline" size="6" placeholder="Top">
            <input type="text" name="row_padding_bottom" id="row_padding_bottom" class="input_inline" size="6" placeholder="Bottom">
            <input type="text" name="row_padding_left" id="row_padding_left" class="input_inline" size="6" placeholder="Left">
            <input type="text" name="row_padding_right" id="row_padding_right" class="input_inline" size="6" placeholder="Right">
        </label>
        <label></label>
        <label>Columns on Tablet:
            <select id="row_columns_tablet">
                <option value="">Auto</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
            </select>
        </label>
        <label>Columns on Smartphone:
            <select id="row_columns_phone">
                <option value="">Auto</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
            </select>
        </label>
      </div>
      <div class="sparky_modal-footer">
      	<p>Sparky Page Builder</p>
      	<button id="save_row_settings_modal" class="btn btn-primary">Save</button>
      </div>
  </div>
</div>

<!-- Page Break Settings Modal -->
<div id="page_break_settings_modal" class="sparky_modal">
  <div class="sparky_modal-content">
      <div class="sparky_modal-header">
        <span id="close_page_break_settings_modal" class="sparky_modal_close">&times;</span>
        <h3>Page Break Settings</h3>
      </div>
      <div class="sparky_modal-body">
        <label>Title <input type="text" name="page_break_title" id="page_break_title"></label>
        <label>Alias <input type="text" name="page_break_alias" id="page_break_alias"></label>
      </div>
      <div class="sparky_modal-footer">
      	<button id="save_page_break_settings_modal" class="btn btn-primary">Save</button>
        <p>Sparky Page Builder</p>
      </div>
  </div>
</div>

<!-- Column Settings Modal -->
<div id="column_settings_modal" class="sparky_modal">
  <div class="sparky_modal-content">
      <div class="sparky_modal-header">
        <span id="close_column_settings_modal" class="sparky_modal_close">&times;</span>
        <h3>Column Settings</h3>
      </div>
      <div class="sparky_modal-body">
        <div>Background Image:</div>
        <p style="font-size:13px;">To use this in front-end, enable option Content > Articles > Options > Editing Layout > "Frontend Images and Links"</p>
        <joomla-field-media class="field-media-wrapper" type="image" base-path="'.URI :: root().'" root-folder="images" url="'.$uri->getPath().'?option=com_media&amp;view=media&amp;tmpl=component&amp;fieldid={field-media-id}&amp;path=" modal-container=".modal" modal-width="100%" modal-height="400px" input=".field-media-input" button-select=".button-select" button-clear=".button-clear" button-save-selected=".button-save-selected" preview="static" preview-container=".field-media-preview" preview-width="200" preview-height="200">
          <div id="imageModal_jform_images_image_intro" role="dialog" tabindex="-1" class="joomla-modal modal fade" data-url="'.$uri->getPath().'?option=com_media&amp;view=media&amp;tmpl=component&amp;asset=89&amp;author=149&amp;fieldid={field-media-id}&amp;path=" data-iframe="<iframe class=&quot;iframe&quot; src=&quot;index.php?option=com_media&amp;amp;view=media&amp;amp;tmpl=component&amp;amp;fieldid={field-media-id}&amp;amp;path=&quot; name=&quot;Change Image&quot; title=&quot;Change Image&quot; height=&quot;100%&quot; width=&quot;100%&quot;></iframe>">
          <div class="modal-dialog modal-lg jviewport-width80">
            <div class="modal-content">
              <div class="modal-header">
              <h3 class="modal-title">Change Image</h3>
                <button type="button" class="btn-close novalidate" data-bs-dismiss="modal" aria-label="Close">
            </button>
          </div>
        <div class="modal-body jviewport-height60">
          </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-success button-save-selected">Select</button><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button></div>
            </div>
          </div>
        </div>
            <div class="input-group">
              <input type="text" name="column_background_image" id="column_background_image" value="" readonly="readonly" class="form-control field-media-input">
              <button type="button" class="btn btn-success button-select">Select</button>
              <button type="button" class="btn btn-danger button-clear"><span class="icon-times" aria-hidden="true"></span><span class="visually-hidden">Clear</span></button>
            </div>
        </joomla-field-media>
        <label>Background Color<br><input type="text" name="column_background_color" id="column_background_color" placeholder="ex: #FF9933"></label>
        <label>Background Image Repeat:
            <select id="column_background_image_repeat">
                <option value="">Repeat</option>
                <option value="no-repeat">No Repeat</option>
                <option value="repeat-x">Repeat Horizontally</option>
                <option value="repeat-y">Repeat Vertically</option>
            </select>
        </label>
        <label>Background Image Position:
            <select id="column_background_image_position">
                <option value="">Top Left</option>
                <option value="center top">Top Center</option>
                <option value="right top">Top Right</option>
                <option value="left center">Center Left</option>
                <option value="center center">Center Center</option>
                <option value="right center">Center Right</option>
                <option value="left bottom">Bottom Left</option>
                <option value="center bottom">Bottom Center</option>
                <option value="right bottom">Bottom Right</option>
            </select>
        </label>
        <label>Background Image Size:
            <select id="column_background_image_size">
                <option value="">Auto</option>
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
            </select>
        </label>
        <label>Background Image Attachment:
            <select id="column_background_image_attachment">
                <option value="">Scroll</option>
                <option value="fixed">Fixed</option>
            </select>
        </label>
        <label>Margin:<br>
            <input type="text" name="column_margin_top" id="column_margin_top" class="input_inline" size="6" placeholder="Top">
            <input type="text" name="column_margin_bottom" id="column_margin_bottom" class="input_inline" size="6" placeholder="Bottom">
            <input type="text" name="column_margin_left" id="column_margin_left" class="input_inline" size="6" placeholder="Left">
            <input type="text" name="column_margin_right" id="column_margin_right" class="input_inline" size="6" placeholder="Right">
        </label>
        <label>Padding:<br>
            <input type="text" name="column_padding_top" id="column_padding_top" class="input_inline" size="6" placeholder="Top">
            <input type="text" name="column_padding_bottom" id="column_padding_bottom" class="input_inline" size="6" placeholder="Bottom">
            <input type="text" name="column_padding_left" id="column_padding_left" class="input_inline" size="6" placeholder="Left">
            <input type="text" name="column_padding_right" id="column_padding_right" class="input_inline" size="6" placeholder="Right">
        </label>
        <label>Vertical Align:
            <select id="column_vertical_align">
                <option value="">Top</option>
                <option value="center">Center</option>
                <option value="flex-end">Bottom</option>
                <option value="space-around">Space Around</option>
                <option value="space-between">Space Between</option>
                <option value="space-evenly">Space Evenly</option>
            </select>
        </label>
        <label></label>
        <label>Animation Type:
            <select id="column_animation_type">
                <option value="">None</option>
                <option value="grow-in">Grow in</option>
                <option value="fade-in">Fade in</option>
                <option value="fade-in-from-left">Fade in from left</option>
                <option value="fade-in-from-right">Fade in from right</option>
                <option value="fade-in-from-bottom">Fade in from bottom</option>
            </select>
        </label>
        <label>Animation Delay (ms):<br><input type="text" name="column_animation_delay" id="column_animation_delay" placeholder="ex: 200"></label>
      </div>
      <div class="sparky_modal-footer">
      	<button id="save_column_settings_modal" class="btn btn-primary">Save</button>
        <p>Sparky Page Builder</p>
      </div>
  </div>
</div>

<!-- Add Block Modal -->
<div id="add_block_modal" class="sparky_modal">
  <div class="sparky_modal-content thin-modal">
      <div class="sparky_modal-header">
        <span id="close_add_block_modal" class="sparky_modal_close">&times;</span>
        <h3>Add Block</h3>
      </div>
      <div class="sparky_modal-body">
        <ul class="sparky_modal_blocks">
            <li><a id="sparky_block_paragraph">Paragraph</a></li>
            <li><a id="sparky_block_heading">Heading</a></li>
            <li><a id="sparky_block_image">Image</a></li>
            <li><a id="sparky_block_button">Button</a></li>
            <li><a id="sparky_block_list">List</a></li>
            <li><a id="sparky_block_icon">Icon</a></li>
            <li><a id="sparky_block_social">Social</a></li>
            <li><a id="sparky_block_video">Video</a></li>
            <li><a id="sparky_block_audio">Audio</a></li>
            <li><a id="sparky_block_iframe">Iframe</a></li>
            <li><a id="sparky_block_separator">Separator</a></li>
            <li><a id="sparky_block_spacer">Spacer</a></li>
            <li><a id="sparky_block_customhtml">Custom HTML</a></li>
            <li><a id="sparky_block_joomlamodule">Joomla Module</a></li>
        </ul>
      </div>
      <div class="sparky_modal-footer">
        <p>Sparky Page Builder</p>
      </div>
  </div>
</div>

<!-- Block Settings Modal (Paragraph) -->
<div id="block_settings_modal_paragraph" class="sparky_modal">
  <div class="sparky_modal-content thin-modal">
      <div class="sparky_modal-header">
        <span id="close_block_settings_modal_paragraph" class="sparky_modal_close">&times;</span>
        <h3>Paragraph Block Settings</h3>
      </div>
      <div class="sparky_modal-body">
        <label>Paragraph ID <input id="paragraph_id" type="text" name="paragraph_id" placeholder="i.e. myBlock"></label>
        <label>Paragraph Class <input id="paragraph_class" type="text" name="paragraph_class" placeholder="i.e. myClass"></label>
        <label></label>
        <label>Text Color<br><input id="paragraph_color" type="text" name="paragraph_color" placeholder="i.e. #FF9933"></label>
        <label>Font Size
            <select id="paragraph_font_size">
                <option value="has-small-font-size">Small</option>
                <option value="normal" selected="selected">Normal</option>
                <option value="has-medium-font-size">Medium</option>
                <option value="has-large-font-size">Large</option>
                <option value="has-huge-font-size">Huge</option>
            </select>
        </label>
        <label>Custom Font Size <input id="paragraph_custom_font_size" type="text" name="paragraph_custom_font_size" placeholder="i.e. 14px"></label>
        <label>Text Align
            <select id="paragraph_text_align">
                <option value="normal">None</option>
                <option value="has-text-align-left">Left</option>
                <option value="has-text-align-center">Center</option>
                <option value="has-text-align-right">Right</option>
                <option value="has-text-align-justify">Justify</option>
            </select>
        </label>
      </div>
      <div class="sparky_modal-footer">
      	<button id="save_block_settings_modal_paragraph" class="btn btn-primary">Save</button>
        <p>Sparky Page Builder</p>
      </div>
  </div>
</div>

<!-- Block Settings Modal (Heading) -->
<div id="block_settings_modal_heading" class="sparky_modal">
  <div class="sparky_modal-content">
      <div class="sparky_modal-header">
        <span id="close_block_settings_modal_heading" class="sparky_modal_close">&times;</span>
        <h3>Heading Settings</h3>
      </div>
      <div class="sparky_modal-body">
        <label>Heading ID <input id="heading_id" type="text" name="heading_id" placeholder="i.e. myElement"></label>
        <label>Heading Class <input id="heading_class" type="text" name="heading_class" placeholder="i.e. myClass"></label>
        <label></label>
        <label>Heading Type
            <select id="heading_type">
                <option value="H1">H1</option>
                <option value="H2" selected="selected">H2</option>
                <option value="H3">H3</option>
                <option value="H4">H4</option>
                <option value="H5">H5</option>
                <option value="H6">H6</option>
            </select>
        </label>
        <label>Link <input id="heading_link" type="text" name="heading_link" placeholder="i.e. https://www.google.com"></label>
        <label>Target
            <select id="heading_target">
                <option value="normal">Normal</option>
                <option value="blank">New Window</option>
            </select>
        </label>
        <label>Color<br><input id="heading_color" type="text" name="heading_color" placeholder="i.e. #FF9933"></label>
        <label>Heading Align
            <select id="heading_text_align">
                <option value="normal">None</option>
                <option value="has-text-align-left">Left</option>
                <option value="has-text-align-center">Center</option>
                <option value="has-text-align-right">Right</option>
                <option value="has-text-align-justify">Justify</option>
            </select>
        </label>
      </div>
      <div class="sparky_modal-footer">
      	<button id="save_block_settings_modal_heading" class="btn btn-primary">Save</button>
       	<p>Sparky Page Builder</p>
      </div>
  </div>
</div>

<!-- Block Settings Modal (Image) -->
<div id="block_settings_modal_image" class="sparky_modal">
  <div class="sparky_modal-content">
      <div class="sparky_modal-header">
        <span id="close_block_settings_modal_image" class="sparky_modal_close">&times;</span>
        <h3>Image Block Settings</h3>
      </div>
      <div class="sparky_modal-body">
        <label>Image ID <input id="image_id" type="text" name="image_id" placeholder="i.e. myBlock"></label>
        <label>Image Class <input id="image_class" type="text" name="image_class" placeholder="i.e. myClass"></label>
        <label></label>
        <div>Source</div>
        <p style="font-size:13px;">To use this in front-end, enable option Content > Articles > Options > Editing Layout > "Frontend Images and Links"</p>
        <joomla-field-media class="field-media-wrapper" type="image" base-path="'.URI :: root().'" root-folder="images" url="'.$uri->getPath().'?option=com_media&amp;view=media&amp;tmpl=component&amp;fieldid={field-media-id}&amp;path=" modal-container=".modal" modal-width="100%" modal-height="400px" input=".field-media-input" button-select=".button-select" button-clear=".button-clear" button-save-selected=".button-save-selected" preview="static" preview-container=".field-media-preview" preview-width="200" preview-height="200">
          <div id="imageModal_jform_images_image_intro" role="dialog" tabindex="-1" class="joomla-modal modal fade" data-url="'.$uri->getPath().'?option=com_media&amp;view=media&amp;tmpl=component&amp;asset=89&amp;author=149&amp;fieldid={field-media-id}&amp;path=" data-iframe="<iframe class=&quot;iframe&quot; src=&quot;index.php?option=com_media&amp;amp;view=media&amp;amp;tmpl=component&amp;amp;fieldid={field-media-id}&amp;amp;path=&quot; name=&quot;Change Image&quot; title=&quot;Change Image&quot; height=&quot;100%&quot; width=&quot;100%&quot;></iframe>">
          <div class="modal-dialog modal-lg jviewport-width80">
            <div class="modal-content">
              <div class="modal-header">
              <h3 class="modal-title">Change Image</h3>
                <button type="button" class="btn-close novalidate" data-bs-dismiss="modal" aria-label="Close">
            </button>
          </div>
        <div class="modal-body jviewport-height60">
          </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-success button-save-selected">Select</button><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button></div>
            </div>
          </div>
        </div>
            <div class="input-group">
              <input type="text" name="image_src" id="image_src" value="" readonly="readonly" class="form-control field-media-input">
              <button type="button" class="btn btn-success button-select">Select</button>
              <button type="button" class="btn btn-danger button-clear"><span class="icon-times" aria-hidden="true"></span><span class="visually-hidden">Clear</span></button>
            </div>
        </joomla-field-media>
        <label>Alt Text <input id="image_alt" type="text" name="image_alt" placeholder="Image description"></label>
        <label>Image Align
            <select id="image_align">
                <option value="normal">None</option>
                <option value="align-left">Left</option>
                <option value="align-center">Center</option>
                <option value="align-right">Right</option>
            </select>
        </label>
        <label>Image Link <input id="image_link" type="text" name="image_link" placeholder="i.e. https://www.google.com"></label>
        <label>Target
            <select id="image_target">
                <option value="normal">Normal</option>
                <option value="blank">New Window</option>
            </select>
        </label>
        <label>Width <input id="image_width" type="text" name="image_width" placeholder="i.e. 150px"></label>
        <label>Height <input id="image_height" type="text" name="image_height" placeholder="i.e. 150px"></label>
      </div>
      <div class="sparky_modal-footer">
      	<p>Sparky Page Builder</p>
      	<button id="save_block_settings_modal_image" class="btn btn-primary">Save</button>
      </div>
  </div>
</div>

<!-- Block Settings Modal (Separator) -->
<div id="block_settings_modal_separator" class="sparky_modal">
  <div class="sparky_modal-content thin-modal">
      <div class="sparky_modal-header">
        <span id="close_block_settings_modal_separator" class="sparky_modal_close">&times;</span>
        <h3>Separator Block Settings</h3>
      </div>
      <div class="sparky_modal-body">
        <label>Separator ID <input id="separator_id" type="text" name="separator_id" placeholder="i.e. myBlock"></label>
        <label>Separator Class <input id="separator_class" type="text" name="separator_class" placeholder="i.e. myClass"></label>
        <label></label>
        <label>Color<br><input id="separator_color" type="text" name="separator_color" placeholder="i.e. #FF9933"></label>
        <label>Height <input id="separator_height" type="text" name="separator_height" placeholder="i.e. 3px"></label>
      </div>
      <div class="sparky_modal-footer">
      	<button id="save_block_settings_modal_separator" class="btn btn-primary">Save</button>
        <p>Sparky Page Builder</p>
      </div>
  </div>
</div>

<!-- Block Settings Modal (Spacer) -->
<div id="block_settings_modal_spacer" class="sparky_modal">
  <div class="sparky_modal-content thin-modal">
      <div class="sparky_modal-header">
        <span id="close_block_settings_modal_spacer" class="sparky_modal_close">&times;</span>
        <h3>Spacer Block Settings</h3>
      </div>
      <div class="sparky_modal-body">
        <label>Spacer ID <input id="spacer_id" type="text" name="spacer_id" placeholder="i.e. myBlock"></label>
        <label>Spacer Class <input id="spacer_class" type="text" name="spacer_class" placeholder="i.e. myClass"></label>
        <label>Height <input id="spacer_height" type="text" name="spacer_height" placeholder="i.e. 50px"></label>
      </div>
      <div class="sparky_modal-footer">
      	<button id="save_block_settings_modal_spacer" class="btn btn-primary">Save</button>
        <p>Sparky Page Builder</p>
      </div>
  </div>
</div>

<!-- Block Settings Modal (Button) -->
<div id="block_settings_modal_button" class="sparky_modal">
  <div class="sparky_modal-content">
      <div class="sparky_modal-header">
        <span id="close_block_settings_modal_button" class="sparky_modal_close">&times;</span>
        <h3>Button Block Settings</h3>
      </div>
      <div class="sparky_modal-body">
        <label>Button ID <input id="button_id" type="text" name="button_id" placeholder="i.e. myBlock"></label>
        <label>Button Class <input id="button_class" type="text" name="button_class" placeholder="i.e. myClass"></label>
        <label></label>
        <label>Text <input id="button_text" type="text" name="button_text" placeholder="Call To Action"></label>
        <label>Link <input id="button_link" type="text" name="button_link" placeholder="http://mysite.com/contact"></label>
        <label>Target
            <select id="button_target">
                <option value="normal">Normal</option>
                <option value="blank">New Window</option>
            </select>
        </label>
        <label><input type="checkbox" name="button_full_width" id="button_full_width"> Full Width</label>
        <label>Width <input id="button_width" type="text" name="button_width" placeholder="i.e. 100px"></label>
        <label>Height <input id="button_height" type="text" name="button_height" placeholder="i.e. 30px"></label>
        <label>Button Align
            <select id="button_align">
                <option value="normal">None</option>
                <option value="align-left">Left</option>
                <option value="align-center">Center</option>
                <option value="align-right">Right</option>
            </select>
        </label>
        <label>Font Size
            <select id="button_font_size">
                <option value="has-small-font-size">Small</option>
                <option value="normal" selected="selected">Normal</option>
                <option value="has-medium-font-size">Medium</option>
                <option value="has-large-font-size">Large</option>
                <option value="has-huge-font-size">Huge</option>
            </select>
        </label>
        <label>Custom Font Size <input id="button_custom_font_size" type="text" name="button_custom_font_size" placeholder="i.e. 14px"></label>
        <label>Text Color<br><input id="button_text_color" type="text" name="button_text_color" placeholder="i.e. #FF9933"></label>
        <label>Background Color<br><input id="button_background_color" type="text" name="button_background_color" placeholder="i.e. #FF9933"></label>
        <label>Border Width <input id="button_border_width" type="text" name="button_border_width" placeholder="i.e. 3px"></label>
        <label>Border Color<br><input id="button_border_color" type="text" name="button_border_color" placeholder="i.e. #FF9933"></label>
        <label>Border Radius <input id="button_border_radius" type="text" name="button_border_radius" placeholder="i.e. 5px"></label>
      </div>
      <div class="sparky_modal-footer">
        <p>Sparky Page Builder</p>
        <button id="save_block_settings_modal_button" class="btn btn-primary">Save</button>
      </div>
  </div>
</div>

<!-- Block Settings Modal (List) -->
<div id="block_settings_modal_list" class="sparky_modal">
  <div class="sparky_modal-content">
      <div class="sparky_modal-header">
        <span id="close_block_settings_modal_list" class="sparky_modal_close">&times;</span>
        <h3>List Block Settings</h3>
      </div>
      <div class="sparky_modal-body">
        <label>List ID <input id="list_id" type="text" name="list_id" placeholder="i.e. myBlock"></label>
        <label>List Class <input id="list_class" type="text" name="list_class" placeholder="i.e. myClass"></label>
        <label></label>
        <label>List Type
            <select id="list_type">
                <option value="ul" selected="selected">UL (Unordered List)</option>
                <option value="ol">OL (Ordered List)</option>
            </select>
        </label>
        <label>Text Color<br><input id="list_color" type="text" name="list_color" placeholder="i.e. #FF9933"></label>
        <label>Font Size
            <select id="list_font_size">
                <option value="has-small-font-size">Small</option>
                <option value="normal" selected="selected">Normal</option>
                <option value="has-medium-font-size">Medium</option>
                <option value="has-large-font-size">Large</option>
                <option value="has-huge-font-size">Huge</option>
            </select>
        </label>
        <label>Custom Font Size <input id="list_custom_font_size" type="text" name="list_custom_font_size" placeholder="i.e. 14px"></label>
        <label>Text Align
            <select id="list_text_align">
                <option value="normal">None</option>
                <option value="has-text-align-left">Left</option>
                <option value="has-text-align-center">Center</option>
                <option value="has-text-align-right">Right</option>
                <option value="has-text-align-justify">Justify</option>
            </select>
        </label>
      </div>
      <div class="sparky_modal-footer">
        <p>Sparky Page Builder</p>
        <button id="save_block_settings_modal_list" class="btn btn-primary">Save</button>
      </div>
  </div>
</div>

<!-- Block Settings Modal (Icon) -->
<div id="block_settings_modal_icon" class="sparky_modal">
  <div class="sparky_modal-content">
      <div class="sparky_modal-header">
        <span id="close_block_settings_modal_icon" class="sparky_modal_close">&times;</span>
        <h3>Icon Block Settings</h3>
      </div>
      <div class="sparky_modal-body">
        <p>You should select a category and enter an icon name. <a href="https://fontawesome.com/icons?d=gallery&m=free" target="_blank">See available icons</a></p>
        <label>Icon ID <input id="icon_id" type="text" name="icon_id" placeholder="i.e. myBlock"></label>
        <label>Category
            <select id="icon_category">
            	<option value="fas">Solid</option>
                <option value="far">Regular</option>
                <option value="fab">Brands</option>
            </select>
        </label>
        <label>Icon Name <input id="icon_class" type="text" name="icon_class" placeholder="i.e. check-circle"></label>
        <label>Color<br><input id="icon_color" type="text" name="icon_color" placeholder="i.e. #FF9933"></label>
        <label>Size <input id="icon_size" type="text" name="icon_size" placeholder="i.e. 30px"></label>
        <label>Icon Align
            <select id="icon_align">
                <option value="normal">None</option>
                <option value="has-text-align-left">Left</option>
                <option value="has-text-align-center">Center</option>
                <option value="has-text-align-right">Right</option>
            </select>
        </label>
        <label>Icon Link <input id="icon_link" type="text" name="icon_link" placeholder="i.e. https://www.google.com"></label>
        <label>Target
            <select id="icon_target">
                <option value="normal">Normal</option>
                <option value="blank">New Window</option>
            </select>
        </label>
      </div>
      <div class="sparky_modal-footer">
        <p>Sparky Page Builder</p>
        <button id="save_block_settings_modal_icon" class="btn btn-primary">Save</button>
      </div>
  </div>
</div>

<!-- Block Settings Modal (Iframe) -->
<div id="block_settings_modal_iframe" class="sparky_modal">
  <div class="sparky_modal-content">
      <div class="sparky_modal-header">
        <span id="close_block_settings_modal_iframe" class="sparky_modal_close">&times;</span>
        <h3>Iframe Block Settings</h3>
      </div>
      <div class="sparky_modal-body">
        <label>Iframe ID <input id="iframe_id" type="text" name="iframe_id" placeholder="i.e. myBlock"></label>
        <label>Iframe Class <input id="iframe_class" type="text" name="iframe_class" placeholder="i.e. myClass"></label>
        <label></label>
        <label>Source <input id="iframe_src" type="text" name="iframe_src" placeholder="i.e. https://www.google.com"></label>
        <label>Width <input id="iframe_width" type="text" name="iframe_width" placeholder="i.e. 480px or 100%"></label>
        <label>Height <input id="iframe_height" type="text" name="iframe_height" placeholder="i.e. 320px"></label>
        <label>Iframe Align
            <select id="iframe_align">
                <option value="normal">None</option>
                <option value="align-left">Left</option>
                <option value="align-center">Center</option>
                <option value="align-right">Right</option>
            </select>
        </label>
      </div>
      <div class="sparky_modal-footer">
        <p>Sparky Page Builder</p>
        <button id="save_block_settings_modal_iframe" class="btn btn-primary">Save</button>
      </div>
  </div>
</div>

<!-- Block Settings Modal (Video) -->
<div id="block_settings_modal_video" class="sparky_modal">
  <div class="sparky_modal-content">
      <div class="sparky_modal-header">
        <span id="close_block_settings_modal_video" class="sparky_modal_close">&times;</span>
        <h3>Video Block Settings</h3>
      </div>
      <div class="sparky_modal-body">
        <label>Video ID <input id="video_id" type="text" name="video_id" placeholder="i.e. myBlock"></label>
        <label>Video Class <input id="video_class" type="text" name="video_class" placeholder="i.e. myClass"></label>
        <label>Video Poster Image <input id="video_poster" type="text" name="video_poster" placeholder="i.e. video.jpg"></label>
        <label>Video File (MP4 format) <input id="video_mp4" type="text" name="video_mp4" placeholder="i.e. video.mp4"></label>
        <label>Video File (OGG format) <input id="video_ogg" type="text" name="video_ogg" placeholder="i.e. video.ogg"></label>
        <label>Video File (WEBM format) <input id="video_webm" type="text" name="video_webm" placeholder="i.e. video.webm"></label>
        <label>Video Align
            <select id="video_align">
                <option value="normal">None</option>
                <option value="align-left">Left</option>
                <option value="align-center">Center</option>
                <option value="align-right">Right</option>
            </select>
        </label>
        <label>Width <input id="video_width" type="text" name="video_width" placeholder="i.e. 480px or 100%"></label>
        <label>Height <input id="video_height" type="text" name="video_height" placeholder="i.e. 320px"></label>
        <label><input type="checkbox" name="video_autoplay" id="video_autoplay"> Autoplay</label>
        <label><input type="checkbox" name="video_controls" id="video_controls"> Controls</label>
        <label><input type="checkbox" name="video_loop" id="video_loop"> Loop</label>
        <label><input type="checkbox" name="video_muted" id="video_muted"> Muted</label>
      </div>
      <div class="sparky_modal-footer">
        <p>Sparky Page Builder</p>
        <button id="save_block_settings_modal_video" class="btn btn-primary">Save</button>
      </div>
  </div>
</div>

<!-- Block Settings Modal (Audio) -->
<div id="block_settings_modal_audio" class="sparky_modal">
  <div class="sparky_modal-content">
      <div class="sparky_modal-header">
        <span id="close_block_settings_modal_audio" class="sparky_modal_close">&times;</span>
        <h3>Audio Block Settings</h3>
      </div>
      <div class="sparky_modal-body">
        <label>Audio ID <input id="audio_id" type="text" name="audio_id" placeholder="i.e. myBlock"></label>
        <label>Audio Class <input id="audio_class" type="text" name="audio_class" placeholder="i.e. myClass"></label>
        <label></label>
        <label>Audio File (MP3 format) <input id="audio_mp3" type="text" name="audio_mp3" placeholder="i.e. audio.mp3"></label>
        <label>Audio File (OGG format) <input id="audio_ogg" type="text" name="audio_ogg" placeholder="i.e. audio.ogg"></label>
        <label>Audio File (WAV format) <input id="audio_wav" type="text" name="audio_wav" placeholder="i.e. audio.wav"></label>
        <label>Audio Align
            <select id="audio_align">
                <option value="normal">None</option>
                <option value="align-left">Left</option>
                <option value="align-center">Center</option>
                <option value="align-right">Right</option>
            </select>
        </label>
        <label><input type="checkbox" name="audio_autoplay" id="audio_autoplay"> Autoplay</label>
        <label><input type="checkbox" name="audio_controls" id="audio_controls"> Controls</label>
        <label><input type="checkbox" name="audio_loop" id="audio_loop"> Loop</label>
        <label><input type="checkbox" name="audio_muted" id="audio_muted"> Muted</label>
      </div>
      <div class="sparky_modal-footer">
      	<button id="save_block_settings_modal_audio" class="btn btn-primary">Save</button>
        <p>Sparky Page Builder</p>
      </div>
  </div>
</div>

<!-- Block Settings Modal (Social) -->
<div id="block_settings_modal_social" class="sparky_modal">
  <div class="sparky_modal-content">
      <div class="sparky_modal-header">
        <span id="close_block_settings_modal_social" class="sparky_modal_close">&times;</span>
        <h3>Social Block Settings</h3>
      </div>
      <div class="sparky_modal-body">
        <label>Social Block ID <input id="social_id" type="text" name="social_id" placeholder="i.e. myBlock"></label>
        <label>Social Block Class <input id="social_class" type="text" name="social_class" placeholder="i.e. myClass"></label>
        <label>Social Block Align
            <select id="social_align">
                <option value="">None</option>
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
            </select>
        </label>
        <label>Icons Size <input id="social_size" type="text" name="social_size" placeholder="i.e. 30px"></label>
        <label>Color<br><input id="social_color" type="text" name="social_color" placeholder="i.e. #FF9933"></label>
        <label>Links Targets
            <select id="social_target">
                <option value="normal">Normal</option>
                <option value="blank">New Window</option>
            </select>
        </label>
        <label>Social Network 1
            <select id="social_network1">
                <option value="">None</option>
                <option value="app-store">Apple App Store</option>
                <option value="behance">Behance</option>
                <option value="blogger">Blogger</option>
                <option value="digg">Digg</option>
                <option value="dribbble">Dribbble</option>
                <option value="facebook">Facebook</option>
                <option value="facebook-messenger">Facebook Messenger</option>
                <option value="flickr">Flickr</option>
                <option value="foursquare">Foursquare</option>
                <option value="github">Github</option>
                <option value="google">Google</option>
                <option value="google-play">Google Play</option>
                <option value="imdb">IMDB</option>
                <option value="instagram">Instagram</option>
                <option value="kickstarter">Kickstarter</option>
                <option value="linkedin">Linkedin</option>
                <option value="medium">Medium</option>
                <option value="meetup">Meetup</option>
                <option value="pinterest">Pinterest</option>
                <option value="quora">Quora</option>
                <option value="reddit">Reddit</option>
                <option value="skype">Skype</option>
                <option value="slack">Slack</option>
                <option value="snapchat">Snapchat</option>
                <option value="soundcloud">Soundcloud</option>
                <option value="spotify">Spotify</option>
                <option value="telegram">Telegram</option>
                <option value="tripadvisor">Trip Advisor</option>
                <option value="tiktok">TikTok</option>
                <option value="tumblr">Tumblr</option>
                <option value="twitch">Twitch</option>
                <option value="viber">Viber</option>
                <option value="vimeo">Vimeo</option>
                <option value="whatsapp">Whatsapp</option>
                <option value="x-twitter">X (Twitter)</option>
                <option value="xing">Xing</option>
                <option value="youtube">YouTube</option>
            </select>
        </label>
        <label>Link 1 <input id="social_link1" type="text" name="social_link1"></label>
        <label></label>
        <label>Social Network 2
            <select id="social_network2">
                <option value="">None</option>
                <option value="app-store">Apple App Store</option>
                <option value="behance">Behance</option>
                <option value="blogger">Blogger</option>
                <option value="digg">Digg</option>
                <option value="dribbble">Dribbble</option>
                <option value="facebook">Facebook</option>
                <option value="facebook-messenger">Facebook Messenger</option>
                <option value="flickr">Flickr</option>
                <option value="foursquare">Foursquare</option>
                <option value="github">Github</option>
                <option value="google">Google</option>
                <option value="google-play">Google Play</option>
                <option value="imdb">IMDB</option>
                <option value="instagram">Instagram</option>
                <option value="kickstarter">Kickstarter</option>
                <option value="linkedin">Linkedin</option>
                <option value="medium">Medium</option>
                <option value="meetup">Meetup</option>
                <option value="pinterest">Pinterest</option>
                <option value="quora">Quora</option>
                <option value="reddit">Reddit</option>
                <option value="skype">Skype</option>
                <option value="slack">Slack</option>
                <option value="snapchat">Snapchat</option>
                <option value="soundcloud">Soundcloud</option>
                <option value="spotify">Spotify</option>
                <option value="telegram">Telegram</option>
                <option value="tripadvisor">Trip Advisor</option>
                <option value="tiktok">TikTok</option>
                <option value="tumblr">Tumblr</option>
                <option value="twitch">Twitch</option>
                <option value="viber">Viber</option>
                <option value="vimeo">Vimeo</option>
                <option value="whatsapp">Whatsapp</option>
                <option value="x-twitter">X (Twitter)</option>
                <option value="xing">Xing</option>
                <option value="youtube">YouTube</option>
            </select>
        </label>
        <label>Link 2 <input id="social_link2" type="text" name="social_link2"></label>
        <label></label>
        <label>Social Network 3
            <select id="social_network3">
                <option value="">None</option>
                <option value="app-store">Apple App Store</option>
                <option value="behance">Behance</option>
                <option value="blogger">Blogger</option>
                <option value="digg">Digg</option>
                <option value="dribbble">Dribbble</option>
                <option value="facebook">Facebook</option>
                <option value="facebook-messenger">Facebook Messenger</option>
                <option value="flickr">Flickr</option>
                <option value="foursquare">Foursquare</option>
                <option value="github">Github</option>
                <option value="google">Google</option>
                <option value="google-play">Google Play</option>
                <option value="imdb">IMDB</option>
                <option value="instagram">Instagram</option>
                <option value="kickstarter">Kickstarter</option>
                <option value="linkedin">Linkedin</option>
                <option value="medium">Medium</option>
                <option value="meetup">Meetup</option>
                <option value="pinterest">Pinterest</option>
                <option value="quora">Quora</option>
                <option value="reddit">Reddit</option>
                <option value="skype">Skype</option>
                <option value="slack">Slack</option>
                <option value="snapchat">Snapchat</option>
                <option value="soundcloud">Soundcloud</option>
                <option value="spotify">Spotify</option>
                <option value="telegram">Telegram</option>
                <option value="tripadvisor">Trip Advisor</option>
                <option value="tiktok">TikTok</option>
                <option value="tumblr">Tumblr</option>
                <option value="twitch">Twitch</option>
                <option value="viber">Viber</option>
                <option value="vimeo">Vimeo</option>
                <option value="whatsapp">Whatsapp</option>
                <option value="x-twitter">X (Twitter)</option>
                <option value="xing">Xing</option>
                <option value="youtube">YouTube</option>
            </select>
        </label>
        <label>Link 3 <input id="social_link3" type="text" name="social_link3"></label>
        <label></label>
        <label>Social Network 4
            <select id="social_network4">
                <option value="">None</option>
                <option value="app-store">Apple App Store</option>
                <option value="behance">Behance</option>
                <option value="blogger">Blogger</option>
                <option value="digg">Digg</option>
                <option value="dribbble">Dribbble</option>
                <option value="facebook">Facebook</option>
                <option value="facebook-messenger">Facebook Messenger</option>
                <option value="flickr">Flickr</option>
                <option value="foursquare">Foursquare</option>
                <option value="github">Github</option>
                <option value="google">Google</option>
                <option value="google-play">Google Play</option>
                <option value="imdb">IMDB</option>
                <option value="instagram">Instagram</option>
                <option value="kickstarter">Kickstarter</option>
                <option value="linkedin">Linkedin</option>
                <option value="medium">Medium</option>
                <option value="meetup">Meetup</option>
                <option value="pinterest">Pinterest</option>
                <option value="quora">Quora</option>
                <option value="reddit">Reddit</option>
                <option value="skype">Skype</option>
                <option value="slack">Slack</option>
                <option value="snapchat">Snapchat</option>
                <option value="soundcloud">Soundcloud</option>
                <option value="spotify">Spotify</option>
                <option value="telegram">Telegram</option>
                <option value="tripadvisor">Trip Advisor</option>
                <option value="tiktok">TikTok</option>
                <option value="tumblr">Tumblr</option>
                <option value="twitch">Twitch</option>
                <option value="viber">Viber</option>
                <option value="vimeo">Vimeo</option>
                <option value="whatsapp">Whatsapp</option>
                <option value="x-twitter">X (Twitter)</option>
                <option value="xing">Xing</option>
                <option value="youtube">YouTube</option>
            </select>
        </label>
        <label>Link 4 <input id="social_link4" type="text" name="social_link4"></label>
        <label></label>
        <label>Social Network 5
            <select id="social_network5">
                <option value="">None</option>
                <option value="app-store">Apple App Store</option>
                <option value="behance">Behance</option>
                <option value="blogger">Blogger</option>
                <option value="digg">Digg</option>
                <option value="dribbble">Dribbble</option>
                <option value="facebook">Facebook</option>
                <option value="facebook-messenger">Facebook Messenger</option>
                <option value="flickr">Flickr</option>
                <option value="foursquare">Foursquare</option>
                <option value="github">Github</option>
                <option value="google">Google</option>
                <option value="google-play">Google Play</option>
                <option value="imdb">IMDB</option>
                <option value="instagram">Instagram</option>
                <option value="kickstarter">Kickstarter</option>
                <option value="linkedin">Linkedin</option>
                <option value="medium">Medium</option>
                <option value="meetup">Meetup</option>
                <option value="pinterest">Pinterest</option>
                <option value="quora">Quora</option>
                <option value="reddit">Reddit</option>
                <option value="skype">Skype</option>
                <option value="slack">Slack</option>
                <option value="snapchat">Snapchat</option>
                <option value="soundcloud">Soundcloud</option>
                <option value="spotify">Spotify</option>
                <option value="telegram">Telegram</option>
                <option value="tripadvisor">Trip Advisor</option>
                <option value="tiktok">TikTok</option>
                <option value="tumblr">Tumblr</option>
                <option value="twitch">Twitch</option>
                <option value="viber">Viber</option>
                <option value="vimeo">Vimeo</option>
                <option value="whatsapp">Whatsapp</option>
                <option value="x-twitter">X (Twitter)</option>
                <option value="xing">Xing</option>
                <option value="youtube">YouTube</option>
            </select>
        </label>
        <label>Link 5 <input id="social_link5" type="text" name="social_link5"></label>
        <label></label>
        <label>Social Network 6
            <select id="social_network6">
                <option value="">None</option>
                <option value="app-store">Apple App Store</option>
                <option value="behance">Behance</option>
                <option value="blogger">Blogger</option>
                <option value="digg">Digg</option>
                <option value="dribbble">Dribbble</option>
                <option value="facebook">Facebook</option>
                <option value="facebook-messenger">Facebook Messenger</option>
                <option value="flickr">Flickr</option>
                <option value="foursquare">Foursquare</option>
                <option value="github">Github</option>
                <option value="google">Google</option>
                <option value="google-play">Google Play</option>
                <option value="imdb">IMDB</option>
                <option value="instagram">Instagram</option>
                <option value="kickstarter">Kickstarter</option>
                <option value="linkedin">Linkedin</option>
                <option value="medium">Medium</option>
                <option value="meetup">Meetup</option>
                <option value="pinterest">Pinterest</option>
                <option value="quora">Quora</option>
                <option value="reddit">Reddit</option>
                <option value="skype">Skype</option>
                <option value="slack">Slack</option>
                <option value="snapchat">Snapchat</option>
                <option value="soundcloud">Soundcloud</option>
                <option value="spotify">Spotify</option>
                <option value="telegram">Telegram</option>
                <option value="tripadvisor">Trip Advisor</option>
                <option value="tiktok">TikTok</option>
                <option value="tumblr">Tumblr</option>
                <option value="twitch">Twitch</option>
                <option value="viber">Viber</option>
                <option value="vimeo">Vimeo</option>
                <option value="whatsapp">Whatsapp</option>
                <option value="x-twitter">X (Twitter)</option>
                <option value="xing">Xing</option>
                <option value="youtube">YouTube</option>
            </select>
        </label>
        <label>Link 6 <input id="social_link6" type="text" name="social_link6"></label>
        <label></label>
      </div>
      <div class="sparky_modal-footer">
        <p>Sparky Page Builder</p>
        <button id="save_block_settings_modal_social" class="btn btn-primary">Save</button>
      </div>
  </div>
</div>

<!-- Block Settings Modal (Custom HTML) -->
<div id="block_settings_modal_customhtml" class="sparky_modal">
  <div class="sparky_modal-content thin-modal">
      <div class="sparky_modal-header">
        <span id="close_block_settings_modal_customhtml" class="sparky_modal_close">&times;</span>
        <h3>Custom HTML Block Settings</h3>
      </div>
      <div class="sparky_modal-body">
        <label>Custom HTML ID <input id="customhtml_id" type="text" name="customhtml_id" placeholder="i.e. myBlock"></label>
        <label>Custom HTML Class <input id="customhtml_class" type="text" name="customhtml_class" placeholder="i.e. myClass"></label>
      </div>
      <div class="sparky_modal-footer">
        <p>Sparky Page Builder</p>
        <button id="save_block_settings_modal_customhtml" class="btn btn-primary">Save</button>
      </div>
  </div>
</div>

<!-- Block Settings Modal (Joomla Module) -->
<div id="block_settings_modal_joomlamodule" class="sparky_modal">
  <div class="sparky_modal-content">
      <div class="sparky_modal-header">
        <span id="close_block_settings_modal_joomlamodule" class="sparky_modal_close">&times;</span>
        <h3>Joomla Module Block Settings</h3>
      </div>
      <div class="sparky_modal-body">
        <label>Select Module
            <select id="joomlamodule_id">
                <option value="0">None</option>'
                . $joomla_modules_options .
                '
            </select>
        </label>
        <label>Module Container Class <input id="joomlamodule_class" type="text" name="joomlamodule_class" placeholder="i.e. myClass"></label>
      </div>
      <div class="sparky_modal-footer">
        <p>Sparky Page Builder</p>
        <button id="save_block_settings_modal_joomlamodule" class="btn btn-primary">Save</button>
      </div>
  </div>
</div>

<!-- Add Link to Paragraph -->
<div id="add_link_modal" class="sparky_modal">
  <div class="sparky_modal-content">
      <div class="sparky_modal-header">
        <span id="close_add_link_modal" class="sparky_modal_close">&times;</span>
        <h3>Add/Edit Link</h3>
      </div>
      <div class="sparky_modal-body">
        <label>Link <input id="add_link_link" type="text" name="add_link_link" placeholder="i.e. https://www.google.com"></label>
        <label>Target
            <select id="add_link_target">
                <option value="normal">Normal</option>
                <option value="blank">New Window</option>
            </select>
        </label>
      </div>
      <div class="sparky_modal-footer">
        <p>Sparky Page Builder</p>
        <button id="save_add_link_modal" class="btn btn-primary">Save</button>
        <button id="remove_link_modal" class="btn btn-danger">Remove link</button>
      </div>
  </div>
</div>

<script>
  var joomla_path = "'.URI :: root().'";
</script>
<script src="'.URI :: root().'media/plg_editors_sparky/js/sparky_editor.js"></script>
';

		return $editor;
	}

}
