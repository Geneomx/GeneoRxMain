<?php
/**
 * Use this file ONLY for OPTION B (document root = public_html).
 *
 * 1. Clone app to /home/genecisu/repositories/GeneoRxMain
 * 2. Copy this file to /home/genecisu/public_html/index.php
 * 3. Run: bash .../scripts/sync-public-html.sh
 *
 * Laravel application root (under home, sibling of public_html):
 */
$appRoot = dirname(__DIR__) . '/repositories/GeneoRxMain';

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

if (file_exists($maintenance = $appRoot . '/storage/framework/maintenance.php')) {
    require $maintenance;
}

require $appRoot . '/vendor/autoload.php';

/** @var Application $app */
$app = require_once $appRoot . '/bootstrap/app.php';

$app->handleRequest(Request::capture());
