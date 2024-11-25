#!/usr/bin/php
<?php


{


  ini_set("error_reporting", "-1");
  ini_set("display_errors", "1");
  ini_set("display_startup_errors", "1");
  ini_set("html_errors", "0");
  ini_set("log_errors", "0");


  $url="s6";
  $caca=file_get_contents("https://mcsrranked.com/api/tourneys/showdown_$url");
  $cucu=json_decode($caca, true, 512, JSON_OBJECT_AS_ARRAY);
  $seeds=count($cucu["data"]["matches"]);
  $players=$cucu["data"]["players"];
  $pp=[];
  foreach($players as $p){
    $pp[$p["uuid"]]=$p["nickname"];
  }
  $brackets=$cucu["data"]["brackets"];
  $table=[];
  foreach($brackets as $b){
    $table[$pp[$b["uuid"]]]=["rank" => $b["rank"],
                             "comp" => $b["completions"],
                             "total" => $b["point"],
                             "out" => $b["eliminated"]];
  }
  $tbl="<table>\n";
  $tbl.="<tr class=\"header\"><td>rank</td><td>player</td>";
  for($i=1; $i <= $seeds; ++$i){
    $tbl.="<td>seed $i</td>";
  }
  $tbl.="<td>points</td><td>eliminated</td></tr>\n";
  foreach($table as $nick => $row){
    $tbl.="<tr><td class=\"rank\">{$row["rank"]}</td><td class=\"nick\">$nick</td>";
    for($i=0; $i < $seeds; ++$i){
      if($row["comp"][$i] === null){
        $place="-";
        $points="0 pts";
      }else{
        $place=$row["comp"][$i]["place"];
        $place=($place === 1 ? "1st" :
                ($place === 2 ? "2nd" :
                 ($place === 3 ? "3rd" :
                  "".$place."th")));
        $points=$row["comp"][$i]["score"];
        $points=$points." pts";
      }
      $tbl.="<td class=\"points\">$place / $points</td>";
    }
    $total=$row["total"];
    $total=$total." pts";
    $out=$row["out"] ? "eliminated" : "still alive";
    $class=$row["out"] ? "bad" : "good";
    $tbl.="<td class=\"total\">$total</td><td class=\"out $class\">$out</td></tr>\n";
  }
  $tbl.="</table>\n";


}


?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title><?=$url?></title>
<style type="text/css">
  html,body,table,tr,td{
    margin:0;
    border:0;
    padding:0;
  }
  body{
    font-family:"lucida console";
    font-size:10px;
  }
  table{
    border-collapse:collapse;
    border-spacing:0;
    margin:20px auto;
    width:95%;
  }
  td{
    padding:5px 10px;
    border:1px solid #808080;
  }
  tr.header > td{
    text-align:center;
    font-weight:bold;
  }
  td.rank{
    text-align:right;
  }
  td.points{
    text-align:right;
  }
  td.total{
    text-align:right;
  }
  td.out{
    text-align:center;
  }
  td.out.bad{
    color:red;
  }
  td.out.good{
    color:green;
  }
</style>
</head>
<body>
<?=$tbl?>
</body>
</html>