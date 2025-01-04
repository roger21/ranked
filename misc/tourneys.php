#!/usr/bin/php
<?php


{


  ini_set("error_reporting", "-1");
  ini_set("display_errors", "1");
  ini_set("display_startup_errors", "1");
  ini_set("html_errors", "0");
  ini_set("log_errors", "0");


  if($argc === 3 && isset($argv[1]) && isset($argv[2]) &&
     ($argv[1] === "q" || $argv[1] === "s") &&
     ctype_digit($argv[2]) && $argv[2] >= 5){
    $type=$argv[1] === "q" ? "qualifiers" : "showdown";
    $url="s".$argv[2];
  }else{
    die(1);
  }

  $caca=file_get_contents("https://mcsrranked.com/api/tourneys/{$type}_{$url}");
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
                             "bonus" => $b["bonus"],
                             "total" => $b["point"],
                             "out" => $b["eliminated"]];
  }
  $tbl="<table>\n";
  $tbl.="<tr class=\"header\"><td>rank</td><td>player</td>";
  for($i=1; $i <= $seeds; ++$i){
    $tbl.="<td>seed $i</td>";
  }
  $tbl.="<td>bonus</td><td>points</td><td>eliminated</td></tr>\n";
  foreach($table as $nick => $row){
    $tbl.="<tr><td class=\"right\">{$row["rank"]} / ".count($table)."</td><td class=\"nick\">$nick</td>";
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
      $tbl.="<td class=\"right\">$place / $points</td>";
    }
    $bonus=$row["bonus"]." pts";
    $total=$row["total"]." pts";
    $out=$row["out"] ? "eliminated" : "still alive";
    $class=$row["out"] ? "bad" : "good";
    $tbl.="<td class=\"right\">$bonus</td><td class=\"right\">$total</td><td class=\"out $class\">$out</td></tr>\n";
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
    width:calc(100% - 40px);
  }
  td{
    padding:5px 10px;
    border:1px solid #808080;
  }
  tr.header > td{
    text-align:center;
    font-weight:bold;
  }
  td.right{
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