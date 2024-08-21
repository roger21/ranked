#!/usr/bin/php
<?php


{


  ini_set("error_reporting", "-1");
  ini_set("display_errors", "1");
  ini_set("display_startup_errors", "1");
  ini_set("html_errors", "0");
  ini_set("log_errors", "0");


  $request_counter=0;

  $max_players=50;
  $max_days=50;

  $season="";
  $season_p="";
  $season_p1="";

  $now=((int)date("U")) * 1000;

  if($argc === 2 && isset($argv[1]) && ctype_digit($argv[1]) && $argv[1]){
    $season=$argv[1];
    $season_p="&season=$season";
    $season_p1="?season=$season";

    $last_match=file_get_contents("https://mcsrranked.com/api/matches?page=0".
                                  "&count=1type=2&includedecay$season_p");

    echo "(".++$request_counter.") season $season\n";

    $last_date=json_decode($last_match, true, 512, JSON_OBJECT_AS_ARRAY);

    $now=((int)$last_date["data"][0]["date"]) * 1000;
  }

  $past=$now - ($max_days * 24 * 60 * 60 * 1000);

  echo "now $now\n";
  echo "past $past\n";

  $leaderboard=file_get_contents("https://mcsrranked.com/api/leaderboard?lol$season_p");

  echo "(".++$request_counter.") leaderboard\n";

  $players=json_decode($leaderboard, true, 512, JSON_OBJECT_AS_ARRAY);

  $pp=[];
  $cpt=0;
  foreach($players["data"]["users"] as $p){
    $pp[]=["uuid" => $p["uuid"], "nickname" => $p["nickname"]];
    ++$cpt;
    if($cpt === $max_players){
      break;
    }
  }

  $player_counter=0;
  foreach($pp as &$p){
    $p["stats"]=[];

    unset($stats);
    $stats=file_get_contents("https://mcsrranked.com/api/users/{$p["uuid"]}$season_p1");

    echo "(".++$request_counter.") {$p["nickname"]} stats\n";

    unset($ss);
    $ss=json_decode($stats, true, 512, JSON_OBJECT_AS_ARRAY);

    $p["stats"]["rank"]=$ss["data"]["seasonResult"]["last"]["eloRank"];
    $p["stats"]["elo"]=$ss["data"]["seasonResult"]["last"]["eloRate"];
    $p["stats"]["peak"]=$ss["data"]["seasonResult"]["highest"];
    $p["stats"]["points"]=$ss["data"]["seasonResult"]["last"]["phasePoint"];
    $p["stats"]["current"]=$ss["data"]["statistics"]["season"]["currentWinStreak"]["ranked"];
    $p["stats"]["streak"]=$ss["data"]["statistics"]["season"]["highestWinStreak"]["ranked"];
    $p["stats"]["pb"]=$ss["data"]["statistics"]["season"]["bestTime"]["ranked"];
    $p["stats"]["matches"]=$ss["data"]["statistics"]["season"]["playedMatches"]["ranked"];
    $p["stats"]["finished"]=$ss["data"]["statistics"]["season"]["completions"]["ranked"];
    $p["stats"]["won"]=$ss["data"]["statistics"]["season"]["wins"]["ranked"];
    $p["stats"]["lost"]=$ss["data"]["statistics"]["season"]["loses"]["ranked"];
    $p["stats"]["forfeited"]=$ss["data"]["statistics"]["season"]["forfeits"]["ranked"];
    $p["stats"]["finishtime"]=$ss["data"]["statistics"]["season"]["completionTime"]["ranked"];

    $p["matches"]=[];
    $page=0;
    $done=false;
    while(!$done){

      unset($matches);
      $matches=file_get_contents("https://mcsrranked.com/api/users/{$p["uuid"]}/".
                                 "matches?page=$page&count=50&type=2$season_p");

      echo "(".++$request_counter.") {$p["nickname"]} page $page\n";

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
        $oelo=0;
        $ochange=0;
        $placement=false;
        foreach($m["changes"] as $c){
          if($c["uuid"] === $p["uuid"]){
            $change=(int)$c["change"];
            $elo=(int)$c["eloRate"] + $change;
            if($c["change"] === null || $c["eloRate"] === null){
              $placement=true;
            }
          }else{
            $ochange=(int)$c["change"];
            $oelo=(int)$c["eloRate"] + $ochange;
          }
        }
        if($date >= $past && !$placement){
          $p["matches"][]=["date" => $date,
                           "type" => $m["seedType"],
                           "result"=> $win,
                           "opponent" => $opponent,
                           "elo" => $elo,
                           "change" => $change,
                           "oelo" => $oelo,
                           "ochange" => $ochange,
                           "time" => $m["result"] === null ? 0 : $m["result"]["time"],
                           "forfeited" => $m["forfeited"],
                           "decayed" => $m["decayed"],];
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

    echo "#".++$player_counter." {$p["nickname"]} ".count($p["matches"])." matches\n";

  }

  $data=["date" => $now, "players" => $pp];
  file_put_contents("../data/season{$season}.js", json_encode($data, JSON_PRETTY_PRINT));

  if($season === ""){
    $season=$players["data"]["season"]["number"];
    $season_j=["season" => $season];
    file_put_contents("../data/current.js", json_encode($season_j, JSON_PRETTY_PRINT));

    echo "season $season\n";

  }


}


