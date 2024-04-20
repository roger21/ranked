#!/usr/bin/php
<?php


{


  $max_players=50;

  $max_days=50;

  $now=((int)date("U")) * 1000;

  $past=$now - ($max_days * 24 * 60 * 60 * 1000);

  $leaderboard=file_get_contents("https://mcsrranked.com/api/leaderboard");

  $players=json_decode($leaderboard, true, 512, JSON_OBJECT_AS_ARRAY);

  $pp=[];
  $cpt=0;
  foreach($players["data"]["users"] as $p){
    $pp[$p["nickname"]]=["uuid" => $p["uuid"], "nickname" => $p["nickname"]];
    ++$cpt;
    if($cpt === $max_players){
      break;
    }
  }

  foreach($pp as $nick => &$p){
    $p["matches"]=[];
    $page=0;
    $done=false;
    while(!$done){

      echo $nick." ".$page."\n";

      unset($matches);
      $matches=file_get_contents("https://mcsrranked.com/api/users/{$p["uuid"]}/".
                                 "matches?page=$page&count=50&type=2");

      unset($mm);
      $mm=json_decode($matches, true, 512, JSON_OBJECT_AS_ARRAY);

      foreach($mm["data"] as $m){
        $date=((int)$m["date"]) * 1000;
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
        }
        if($date >= $past){
          $p["matches"][]=["date" => $date,
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

  $data=["date" => $now, "players" => $pp];

  file_put_contents("../data/current.js", json_encode($data, JSON_PRETTY_PRINT));


}


