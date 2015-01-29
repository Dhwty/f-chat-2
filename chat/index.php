<?php
require_once "../include/common.php";
$pageTitle="Chat";
if(!is_logged_in()){
	display_message("You have to be logged in to access this page.");
}	
$deviceScaling=true;
require_once "../include/htmlskeleton.php";
?>
<div id="chat-body">

</div>
<link rel="stylesheet" type="text/css" href="chat.css?t=<?php echo $trigger;?>" />
<input type="hidden" id="chat-account-id" value="<?php echo CurrentUser::$user->accountID;?>"/>
<input type="hidden" id="chat-account" value="<?php echo CurrentUser::$user->username;?>"/>
<input type="hidden" id="iss" value="<?php echo intval(CurrentUser::$user->isSubscribed);?>"/>
<input type="hidden" id="perm" value="<?php echo intval(CurrentUser::$user->permissions);?>"/>
<input type="hidden" id="isa" value="<?php echo intval(Rights::hasPermission(CurrentUser::$user->accountID, "admin"));?>"/>
<input type="hidden" id="chat-default-id" value="<?php echo intval(CurrentUser::$user->defaultCharacterID);?>"/>
<?php
$charlist=getCharacterList();
echo "<script>var characterdata = ".json_encode($charlist).";</script>";
?>
<script src='https://ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js' type='text/javascript'></script>
<script src='https://www.f-list.net/js/FABridge.js' type='text/javascript'></script> 
<script src='chat.js?t=<?php echo $trigger;?>' type='text/javascript'></script> 
<script src='ui.js?t=<?php echo $trigger;?>' type='text/javascript'></script> 
<script src='menu.js?t=<?php echo $trigger;?>' type='text/javascript'></script> 
<script src='commands.js?t=<?php echo $trigger;?>' type='text/javascript'></script> 
<script src='connection.js?t=<?php echo $trigger;?>' type='text/javascript'></script> 
<script src='data.js?t=<?php echo $trigger;?>' type='text/javascript'></script> 
<script src='help.js?t=<?php echo $trigger;?>' type='text/javascript'></script> 
<script src='input.js?t=<?php echo $trigger;?>' type='text/javascript'></script> 
<script type="text/javascript">
$(function(){
    //FList.Chat_init(true);
});
</script>
</body>
</html>
