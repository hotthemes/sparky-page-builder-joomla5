<?php
/*------------------------------------------------------------------------
# "Sparky Content Plugin" Joomla plugin
# Copyright (C) 2021 HotThemes. All Rights Reserved.
# License: GNU/GPLv3 http://www.gnu.org/licenses/gpl-3.0.html
# Author: HotJoomlaTemplates.com
# Website: https://www.hotjoomlatemplates.com
-------------------------------------------------------------------------*/

// No direct access to this file
defined('_JEXEC') or die('Restricted access');

use Joomla\CMS\Factory;
 
class PlgContentSparkyeditorInstallerScript
{
   /**
    * method to run after an install/update/uninstall method
    *
    * @return void
    */
   function postflight($type, $parent) 
   {
      // Enable plugin
      $db  = Factory::getDbo();
      $query = $db->getQuery(true);
      $query->update('#__extensions');
      $query->set($db->quoteName('enabled') . ' = 1');
      $query->where($db->quoteName('element') . ' = ' . $db->quote('sparkyeditor'));
      $query->where($db->quoteName('type') . ' = ' . $db->quote('plugin'));
      $db->setQuery($query);
      $db->execute();
   }
}