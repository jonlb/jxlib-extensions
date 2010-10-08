<?php

header('Content-type:application/json');
$obj = new stdClass();
$obj->success = false;
$obj->debug = '<p>debug info</p>';
$obj->requestId = $_REQUEST['requestId'];
$obj->error = new stdClass();
$obj->error->code = 200;
$obj->error->message = 'a test of the error handler';
$obj->error->validationErrors = new StdClass();
$obj->error->validationErrors->username = 'incorrect username or password';
$obj->error->validationErrors->password = 'incorrect username or password';

echo json_encode($obj);

?>