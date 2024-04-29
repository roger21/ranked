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

  $season="";
  $season_p="";

  $now=((int)date("U")) * 1000;
  if($argc === 2 && isset($argv[1]) && ctype_digit($argv[1]) && $argv[1]){
    $season=$argv[1];
    $season_p="&season=$season";

    echo "season $season\n";

    $last_match=file_get_contents("https://mcsrranked.com/api/matches?page=0".
                                  "&count=1type=2&includedecay$season_p");
    $last_date=json_decode($last_match, true, 512, JSON_OBJECT_AS_ARRAY);

    $now=((int)$last_date["data"][0]["date"]) * 1000;
  }
  $past=$now - ($max_days * 24 * 60 * 60 * 1000);

  echo "now $now\n";
  echo "past $past\n";

  $leaderboard=file_get_contents("https://mcsrranked.com/api/leaderboard?lol$season_p");
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
                                 "matches?page=$page&count=50&type=2$season_p");
      unset($mm);
      $mm=json_decode($matches, true, 512, JSON_OBJECT_AS_ARRAY);

      foreach($mm["data"] as $m){
        $date=((int)$m["date"]) * 1000;
        $win=$m["result"] === null ? "elo decay" :
            ($m["result"]["uuid"] === null ? "draw" :
             ($m["result"]["uuid"] === $p["uuid"] ? "won" : "lost"));
        $opponent=null;
        foreach($m["players"] as $player){
          if($player["uuid"] !== $p["uuid"]){
            $opponent=$player["nickname"];
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
            }
            break;
          }
        }
        if($date >= $past && !$placement){
          $p["matches"][]=["date" => $date,
                           "type" => $m["seedType"],
                           "result"=> $win,
                           "opponent" => $opponent,
                           "elo" => $elo,
                           "change" => $change,
                           "time" => $m["result"] === null ? 0 : $m["result"]["time"],
                           "forfeited" => $m["forfeited"],
                           "decayed" => $m["decayed"],
                           "placement" => $placement,];
        }else{
          $done=true;
          break;
        }
      }
      ++$page;
      if($page === 100){
        $done=true;
      }
    }

    echo "#".++$player_counter." $nick ".count($p["matches"])." matches\n";

  }

  $data=["date" => $now, "players" => $pp];
  file_put_contents("../data/ranked{$season}.js", json_encode($data, JSON_PRETTY_PRINT));

  if($season === ""){
    $season=$players["data"]["season"]["number"];
    $season_j=["season" => $season];
    file_put_contents("../data/season.js", json_encode($season_j, JSON_PRETTY_PRINT));

    echo "season $season\n";

  }


}


