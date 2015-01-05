<?php
require_once "../include/common.php";

require_once "../include/htmlskeleton.php";

global $gRedisHost, $gRedisPort, $gRedisPassword;

$redis = new Redis();
$redis->connect($gRedisHost, $gRedisPort);
$redis->auth($gRedisPassword);

?>
<table cellpadding=0 cellspacing=0 width=100% id="logs-table"><tr>
<td width="70" class='panel' style='border-right:1px solid rgba(0,0,0,0.3);'>
        <div style="width:70px;">
        <?php
        foreach($characterlist as $hid=>$hname){
            $result=execute_query("SELECT count(log_id) AS amount FROM chatlog WHERE character_id='{$hid}' AND account_id='".CurrentUser::$user->accountID."'");
            $row=pg_fetch_assoc($result);
            $amount=$row['amount'];
            if($amount>0){
                echo "<a href='#' class='panel list-highlight' onclick='$(\"#log-list-data\").html(\"\");currentOffset=0;FetchLogUsers(" . $hid . ");' style='padding:10px;display:block;'><img src='https://static.f-list.net/images/avatar/".strtolower($hname).".png' style='width:50px;'/></a>";
            }
        }
        $redis->close();
        ?>
        </div>
</td><td width="200" class='panel'>
        <div id="log-list-users" style="width:250px;overflow-y:scroll;">
        
        </div>
</td><td>
        <div id="log-list-data" class="panel" style="width:100%;overflow-y:scroll;">
        </div>
        </td>
</tr>
</table>

        <script>
        var currentOffset=0;
        var currentChara="";
        var currentDest="";
        
        $(window).resize(function() {
        $("#logs-table").css("height", $(window).height());
        $("#log-list-data").css("height", $(window).height());
        $("#log-list-users").css("height", $(window).height());
});
        $(function() {
        $("#logs-table").css("height", $(window).height());
        $("#log-list-data").css("height", $(window).height());
        $("#log-list-users").css("height", $(window).height());
});
  
        function FetchLogUsers(_id){
        $.ajax({
			type: "GET",
			url: domain + "json/character-get-logs.json",
			dataType: "json",
			timeout: (timeoutsec * 1000),
			data: ({
				character_id: _id
			}),
			success: function (data) {
				if(data.error==""){
                    $("#log-list-users").html("");
                    $.each(data.logs, function(i, log){
                        var date = new Date(log.datetime_stored*1000);
                        date=(date.getMonth()+1) + "/" +  date.getDate() + "/" +  date.getFullYear();
                        $("#log-list-users").append("<a class='panel list-highlight log-list-item' style='text-decoration:none;display:none;padding:10px;display:block;' href='#'>" + log.tab_title + ", " + date + "</a>");
                        if(log.tab_type=="user"){
                            $(".log-list-item:last").append("<img src='https://static.f-list.net/images/avatar/" + log.tab_id.toLowerCase() + ".png' style='width:30px;margin:-9px 9px -9px 0px;float:left;vertical-align:top;'/>");
                        } else if(log.tab_type=="channel"){
                            $(".log-list-item:last").append("<img src='https://static.f-list.net/images/icons/hash.png' style='width:30px;margin:-9px 9px -9px 0px;float:left;vertical-align:top;'/>");
                        } else {
                            $(".log-list-item:last").append("<img src='https://static.f-list.net/images/icons/terminal.png' style='width:30px;margin:-9px 9px -9px 0px;float:left;vertical-align:top;'/>");                       
                        }
                        $(".log-list-item:last").click(function(){
                            FetchLogs(log);
                        });
                    });
                    $("#log-list-users div").fadeIn("fast");
				} else {
					FList.Common_displayError(data.error);
				}
			},
			error: function (objAJAXRequest, strError, errorThrown) {
				FList.Common_displayError(strError + ", " + errorThrown);
			}
		});
        }
        
        function next(){
        currentOffset=currentOffset+50;
        FetchLogs(currentChara, currentDest);
        }
        
        function prev(){
        currentOffset=currentOffset-50;
        FetchLogs(currentChara, currentDest);
        }
        
        function DeleteLogs(_id){
            if(confirm("Are you sure you want to purge this log entry from the server?")){
                $.ajax({
                    type: "POST",
                    url: domain + "json/character-logs-delete.json",
                    dataType: "json",
                    timeout: (timeoutsec * 1000),
                    data: ({
                        log_id: _id
                    }),
                    success: function (data) {
                        if(data.error==""){
                            $("#log-list-users").html("");
                            $("#log-list-data").html("");
                        } else {
                            FList.Common_displayError(data.error);
                        }
                    },
                    error: function (objAJAXRequest, strError, errorThrown) {
                        FList.Common_displayError(strError + ", " + errorThrown);
                    }
                });
            }
        }
        
        function FetchLogs(log){
            var logdata=JSON.parse(log.log);
            $("#log-list-data").html("<a href='#' style='float:right;' class='log-list-delete' onclick='DeleteLogs(" + log.log_id + ");'></a>");
            var date = new Date(log.datetime_stored*1000);
            date=(date.getMonth()+1) + "/" +  date.getDate() + "/" +  date.getFullYear();
            $("#log-list-data").append("<h2>Logs, " + log.tab_title + ", " + date + "</h2>");
            $.each(logdata, function(i, item){
                $("#log-list-data").append(item.html);
            });
        }
        </script>
<style>
body, html {
margin:0px;
padding:0px;
}
#log-list-data .chat-message, #log-list-data h2 {
margin-left:10px;
}
.log-list-delete {
float:right;
margin:10px 10px 0px 0px;
background-image:url('https://static.f-list.net/images/icons/cross.png');
background-repeat:no-repeat;
 background-color:rgba(0,0,0,0.2);
 background-position:center center;
 cursor:pointer;
 border-radius:5px;
 -moz-border-radius:5px;
 -webkit-border-radius:5px;
width:16px;
height:16px;
padding:5px;
}
</style>
<?php
$charlist=getCharacterList();
echo "<input type='hidden' id='c-l' value='".serialize($charlist)."'/>";
?>
