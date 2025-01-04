#!/usr/bin/php
<?php

{

  ini_set("error_reporting", "-1");
  ini_set("display_errors", "1");
  ini_set("display_startup_errors", "1");
  ini_set("html_errors", "0");
  ini_set("log_errors", "0");

  $context=null;
  if(isset($_SERVER["API_KEY"]) && $_SERVER["API_KEY"] !== ""){
    $apikey=$_SERVER["API_KEY"];
    $context=stream_context_create(["http" => ["method" => "GET",
                                               "header" => "API-Key: ".$apikey."\r\n"]]);
    echo "apikey ok ".(strlen($apikey))."\n"; // 64
  }else{
    echo "no apikey\n";
  }

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
    $last_match=(file_get_contents("https://mcsrranked.com/api/matches?page=0".
                                   "&count=1type=2&includedecay{$season_p}",
                                   false, $context));
    echo "(".(++$request_counter).") season {$season}\n";
    $last_date=json_decode($last_match, true, 512, JSON_OBJECT_AS_ARRAY);
    $now=((int)$last_date["data"][0]["date"]) * 1000;
  }

  $past=$now - ($max_days * 24 * 60 * 60 * 1000);

  echo "now {$now}\n";
  echo "past {$past}\n";

  $alltime=@file_get_contents("../data/alltime.js");
  if($alltime === false){
    $at=[];
    echo "new all time\n";
  }else{
    $at=json_decode($alltime, true, 512, JSON_OBJECT_AS_ARRAY);
  }
  $visited=[];
  $new=[];

  $leaderboard=(file_get_contents("https://mcsrranked.com/api/leaderboard{$season_p1}",
                                  false, $context));
  echo "(".(++$request_counter).") leaderboard\n";
  $players=json_decode($leaderboard, true, 512, JSON_OBJECT_AS_ARRAY);

  $sss=$season;
  if($season === ""){
    $sss=$players["data"]["season"]["number"];
    $season_j=["season" => $sss];
    file_put_contents("../data/current.js", json_encode($season_j, JSON_PRETTY_PRINT));
    echo "season $sss\n";
  }

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
    if(!isset($at[$p["uuid"]])){
      $at[$p["uuid"]]=[];
      $new[]=$p["uuid"];
    }
    $visited[]=$p["uuid"];
    $p["stats"]=[];
    unset($stats);
    $stats=(file_get_contents("https://mcsrranked.com/api/users/{$p["uuid"]}{$season_p1}",
                              false, $context));
    echo "(".(++$request_counter).") {$p["nickname"]} stats season {$sss}\n";
    unset($ss);
    $ss=json_decode($stats, true, 512, JSON_OBJECT_AS_ARRAY);

    $p["stats"]["rank"]=$ss["data"]["seasonResult"]["last"]["eloRank"];
    $p["stats"]["elo"]=$ss["data"]["seasonResult"]["last"]["eloRate"];
    $p["stats"]["peak"]=$ss["data"]["seasonResult"]["highest"];
    $p["stats"]["points"]=$ss["data"]["seasonResult"]["last"]["phasePoint"];
    $p["stats"]["pb"]=$ss["data"]["statistics"]["season"]["bestTime"]["ranked"];
    $p["stats"]["current"]=$ss["data"]["statistics"]["season"]["currentWinStreak"]["ranked"];
    $p["stats"]["streak"]=$ss["data"]["statistics"]["season"]["highestWinStreak"]["ranked"];
    $p["stats"]["matches"]=$ss["data"]["statistics"]["season"]["playedMatches"]["ranked"];
    $p["stats"]["playtime"]=$ss["data"]["statistics"]["season"]["playtime"]["ranked"];
    $p["stats"]["finished"]=$ss["data"]["statistics"]["season"]["completions"]["ranked"];
    $p["stats"]["finishtime"]=$ss["data"]["statistics"]["season"]["completionTime"]["ranked"];
    $p["stats"]["won"]=$ss["data"]["statistics"]["season"]["wins"]["ranked"];
    $p["stats"]["lost"]=$ss["data"]["statistics"]["season"]["loses"]["ranked"];
    $p["stats"]["forfeited"]=$ss["data"]["statistics"]["season"]["forfeits"]["ranked"];

    $at[$p["uuid"]]["nickname"]=$ss["data"]["nickname"];
    $at[$p["uuid"]]["peak"][$sss]=$ss["data"]["seasonResult"]["highest"] ?? 0;
    ksort($at[$p["uuid"]]["peak"], SORT_NUMERIC);
    $at[$p["uuid"]]["points"][$sss]=$ss["data"]["seasonResult"]["last"]["phasePoint"] ?? 0;
    ksort($at[$p["uuid"]]["points"], SORT_NUMERIC);
    $at[$p["uuid"]]["pb"]=$ss["data"]["statistics"]["total"]["bestTime"]["ranked"];
    $at[$p["uuid"]]["streak"]=$ss["data"]["statistics"]["total"]["highestWinStreak"]["ranked"];
    $at[$p["uuid"]]["matches"]=$ss["data"]["statistics"]["total"]["playedMatches"]["ranked"];
    $at[$p["uuid"]]["playtime"]=$ss["data"]["statistics"]["total"]["playtime"]["ranked"];
    $at[$p["uuid"]]["finished"]=$ss["data"]["statistics"]["total"]["completions"]["ranked"];
    $at[$p["uuid"]]["finishtime"]=$ss["data"]["statistics"]["total"]["completionTime"]["ranked"];
    $at[$p["uuid"]]["won"]=$ss["data"]["statistics"]["total"]["wins"]["ranked"];
    $at[$p["uuid"]]["lost"]=$ss["data"]["statistics"]["total"]["loses"]["ranked"];
    $at[$p["uuid"]]["forfeited"]=$ss["data"]["statistics"]["total"]["forfeits"]["ranked"];

    $p["matches"]=[];
    $page=0;
    $done=false;
    while(!$done){
      unset($matches);
      $matches=(file_get_contents("https://mcsrranked.com/api/users/{$p["uuid"]}/".
                                  "matches?page={$page}&count=50&type=2{$season_p}",
                                  false, $context));
      echo "(".(++$request_counter).") {$p["nickname"]} page {$page}\n";
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
                           "bastion" => $m["bastionType"],
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
    echo "#".(++$player_counter)." {$p["nickname"]} ".(count($p["matches"]))." matches\n";
    unset($p);
  }

  $data=["date" => $now, "players" => $pp];
  file_put_contents("../data/season{$season}.js", json_encode($data, JSON_PRETTY_PRINT));

  // mise à jour des all time pour les joueurs déjà présents mais pas sur cette saison (les old)
  $old_cpt=0;
  foreach($at as $uuid => &$a){
    if(!in_array($uuid, $visited, true)){
      unset($stats);
      $stats=(file_get_contents("https://mcsrranked.com/api/users/{$uuid}{$season_p1}",
                                false, $context));
      echo "(".(++$request_counter).") old {$uuid} stats season {$sss}\n";
      unset($ss);
      $ss=json_decode($stats, true, 512, JSON_OBJECT_AS_ARRAY);

      $a["nickname"]=$ss["data"]["nickname"];
      $a["peak"][$sss]=$ss["data"]["seasonResult"]["highest"] ?? 0;
      ksort($a["peak"], SORT_NUMERIC);
      $a["points"][$sss]=$ss["data"]["seasonResult"]["last"]["phasePoint"] ?? 0;
      ksort($a["points"], SORT_NUMERIC);
      $a["pb"]=$ss["data"]["statistics"]["total"]["bestTime"]["ranked"];
      $a["streak"]=$ss["data"]["statistics"]["total"]["highestWinStreak"]["ranked"];
      $a["matches"]=$ss["data"]["statistics"]["total"]["playedMatches"]["ranked"];
      $a["playtime"]=$ss["data"]["statistics"]["total"]["playtime"]["ranked"];
      $a["finished"]=$ss["data"]["statistics"]["total"]["completions"]["ranked"];
      $a["finishtime"]=$ss["data"]["statistics"]["total"]["completionTime"]["ranked"];
      $a["won"]=$ss["data"]["statistics"]["total"]["wins"]["ranked"];
      $a["lost"]=$ss["data"]["statistics"]["total"]["loses"]["ranked"];
      $a["forfeited"]=$ss["data"]["statistics"]["total"]["forfeits"]["ranked"];

      ++$old_cpt;
    }
    unset($a);
  }
  echo "{$old_cpt} old\n";

  // mise à jour des all time pour les nouveaux joueurs sur cette saison (les new)
  $new_cpt=0;
  foreach($new as $uuid){
    for($s=1; $s < $sss; ++$s){
      $season_l="?season=".$s;
      unset($stats);
      $stats=(file_get_contents("https://mcsrranked.com/api/users/{$uuid}{$season_l}",
                                false, $context));
      echo "(".(++$request_counter).") new {$uuid} stats season {$s}\n";
      unset($ss);
      $ss=json_decode($stats, true, 512, JSON_OBJECT_AS_ARRAY);

      $at[$uuid]["peak"][$s]=$ss["data"]["seasonResult"]["highest"] ?? 0;
      $at[$uuid]["points"][$s]=$ss["data"]["seasonResult"]["last"]["phasePoint"] ?? 0;

    }
    ksort($at[$uuid]["peak"], SORT_NUMERIC);
    ksort($at[$uuid]["points"], SORT_NUMERIC);
    ++$new_cpt;
  }
  echo "{$new_cpt} new\n";

  file_put_contents("../data/alltime.js", json_encode($at, JSON_PRETTY_PRINT));

}

