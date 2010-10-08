<?php 

header('Content-type:application/json');
$obj = new stdClass();
$obj->success = true;
$obj->debug = '<p>debug info would be here</p>';
$obj->data = new stdClass();
$obj->data->field1 = "some data";
$obj->data->request = new stdClass();

//cycle through the post field adding it to the data field
foreach($_REQUEST as $key => $value) {
	if ($key = 'requestId') {
		$obj->$key = $value;
	} else {
		$obj->data->request->$key = $value;
	}
}

echo json_encode($obj);

?>