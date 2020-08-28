<?php
if ($_REQUEST['source'] && $_REQUEST['search']) {
  readfile("https://{$_REQUEST['source']}/w/index.php?search=" . urlencode($_REQUEST['search']));
}

if ($_REQUEST['source'] && $_REQUEST['page']) {
  readfile("https://{$_REQUEST['source']}/wiki/" . urlencode(strtr($_REQUEST['page'], array(' ' => '_'))));
}
