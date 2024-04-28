#!/usr/bin/php
<?php


{


  ini_set("error_reporting", "-1");
  ini_set("display_errors", "1");
  ini_set("display_startup_errors", "1");
  ini_set("html_errors", "0");
  ini_set("log_errors", "0");


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

  $request_counter=0;
  $player_counter=0;
  foreach($pp as $nick => &$p){
    $p["matches"]=[];
    $page=0;
    $done=false;
    while(!$done){

      echo "(".++$request_counter.") ".$nick." page ".$page."\n";

      unset($matches);
      $matches=file_get_contents("https://mcsrranked.com/api/users/{$p["uuid"]}/".
                                 "matches?page=$page&count=50&type=2");

      unset($mm);
      $mm=json_decode($matches, true, 512, JSON_OBJECT_AS_ARRAY);

      $cpt=0;
      foreach($mm["data"] as $m){
        $date=((int)$m["date"]) * 1000;
        $win=$m["result"]["uuid"] === $p["uuid"];
        $opponent=null;
        $finalelo=0;
        foreach($m["players"] as $player){
          if($player["uuid"] !== $p["uuid"]){
            $opponent=$player["nickname"];
          }else{
            $finalelo=$player["eloRate"];
          }
        }
        $elo=0;
        $change=0;
        $placement=false;
        foreach($m["changes"] as $c){
          if($c["uuid"] === $p["uuid"]){
            $change=(int)$c["change"];
            $elo=(int)$c["eloRate"] + $change;
            if($c["change"] === null || $c["eloRate"] === null){
              $placement=true;
              $elo=$finalelo;
            }
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
                           "decayed" => $m["decayed"],
                           "placement" => $placement,];
        }else{
          $done=true;
          break;
        }
        ++$cpt;
      }
      if($cpt < 50){
        $done=true;
      }
      ++$page;
      if($page === 100){
        $done=true;
      }
    }

    echo "#".++$player_counter." ".$nick." ".count($p["matches"])." matches\n";

  }

  $data=["date" => $now, "players" => $pp];

  file_put_contents("../data/ranked.js", json_encode($data, JSON_PRETTY_PRINT));

  echo "season ".$players["data"]["season"]["number"]."\n";

  $season=["season" => $players["data"]["season"]["number"]];

  file_put_contents("../data/season.js", json_encode($season, JSON_PRETTY_PRINT));


}


