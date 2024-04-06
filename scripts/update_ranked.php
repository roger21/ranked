#!/usr/bin/php
<?php


{


  $max_ppl=30;

  $max_time=30; // days

  $now=(int)date("U");

  $past=$now - ($max_time * 24 * 3600);

  $lb=file_get_contents("https://mcsrranked.com/api/leaderboard");

  //var_dump($lb);

  $ppl=json_decode($lb, true, 512, JSON_OBJECT_AS_ARRAY);

  $pp=[];
  $cpt=0;
  foreach($ppl["data"]["users"] as $p){
    $pp[$p["nickname"]]=["uuid" => $p["uuid"], "nickname" => $p["nickname"]];
    ++$cpt;
    if($cpt === $max_ppl){
      break;
    }
  }

  //var_dump($pp);

  foreach($pp as $n => &$p){
    $p["matches"]=[];
    $page=0;
    $done=false;
    while(!$done){

      echo $n." ".$page."\n";

      unset($matches);
      $matches=file_get_contents("https://mcsrranked.com/api/users/{$p["uuid"]}/".
                                 "matches?page=$page&count=50&type=2");

      //var_dump($matches);

      unset($mm);
      $mm=json_decode($matches, true, 512, JSON_OBJECT_AS_ARRAY);

      foreach($mm["data"] as $m){
        $date=(int)$m["date"];
        $win=$m["result"]["uuid"] === $p["uuid"];
        $opponent=null;
        foreach($m["players"] as $player){
          if($player["uuid"] !== $p["uuid"]){
            $opponent=$player["nickname"];
            break;
          }
        }
        $elo=0;
        $change=0;
        foreach($m["changes"] as $c){
          if($c["uuid"] === $p["uuid"]){
            $change=(int)$c["change"];
            $elo=(int)$c["eloRate"] + $change;
            break;
          }
        }if($date >= $past){
          $p["matches"][$date]=["date" => $date,
                                "type" => $m["seedType"],
                                "result"=> $win ? "win" : "lost",
                                "opponent" => $opponent,
                                "elo" => $elo,
                                "change" => $change,
                                "time" => $m["result"]["time"],
                                "forfeited" => $m["forfeited"],
                                "decayed" => $m["decayed"] ];
        }else{
          $done=true;
          break;
        }
      }
      ++$page;
    }

    echo count($p["matches"])."\n";

  }

  file_put_contents("../ranked.js", "export default\n".
                    json_encode($pp, JSON_PRETTY_PRINT).";");


}


