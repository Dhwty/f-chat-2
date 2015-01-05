<?php
die();
require_once "../include/common.php";

if (!is_logged_in())
    display_message("You have to be logged in to access this page.");

$character_id = intval($_POST["character_id"]);
if($character_id==0) json_error("Invalid character id.");
$account_id = CurrentUser::$user->accountID;
$log = escape_input($_POST["logs"]);
$now=time();
$tab_type=escape_input($_POST['type']);
$tab_id=escape_input($_POST['id']);
$tab_title=escape_input($_POST['title']);

$check = execute_query("SELECT character_id, name FROM \"character\" WHERE character_id = '{$character_id}' AND account_id = '{$account_id}'");
if (pg_num_rows($check) == 0) display_message("Unauthorized.");
$row=pg_fetch_assoc($check);
$name=$row['name'];
$addlog = execute_query("INSERT INTO chatlog (name, account_id, character_id, log, datetime_stored, tab_type, tab_id, tab_title) VALUES ('{$name}',{$account_id}, '{$character_id}', '{$log}','{$now}','{$tab_type}','{$tab_id}','{$tab_title}') RETURNING log_id");

$logid = pg_fetch_assoc($addlog);

$data = array("log_id" => $logid["log_id"]);
json_output($data);
?>