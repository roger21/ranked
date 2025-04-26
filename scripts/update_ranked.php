#!/usr/bin/php
<?php

{

  ini_set("error_reporting", "-1");
  ini_set("display_errors", "1");
  ini_set("display_startup_errors", "1");
  ini_set("html_errors", "0");
  ini_set("log_errors", "0");

  $api_url="https://api.mcsrranked.com/";

  $context=null;
  if(isset($_SERVER["API_KEY"]) && $_SERVER["API_KEY"] !== ""){
    $apikey=$_SERVER["API_KEY"];
    $context=stream_context_create(["http" => ["method" => "GET",
                                               "header" => "API-Key: ".
                                               $apikey."\r\n"]]);
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
    $last_match=(file_get_contents($api_url."matches?count=1&".
                                   "type=2&includedecay{$season_p}",
                                   false, $context));
    if($last_match === false ||
       !isset($http_response_header[0]) ||
       $http_response_header[0] !== "HTTP/1.1 200 OK"){
      echo "request error ".($http_response_header[0] ?? "no header").
                           " season {$season}\n";
      die(1);
    }
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
  $oldtime=@file_get_contents("../data/oldtime.js");
  if($oldtime === false){
    $ot=[];
    echo "new old time\n";
  }else{
    $ot=json_decode($oldtime, true, 512, JSON_OBJECT_AS_ARRAY);
  }
  $visited=[];
  $new=[];

  $leaderboard=(file_get_contents($api_url."leaderboard{$season_p1}",
                                  false, $context));
  if($leaderboard === false ||
     !isset($http_response_header[0]) ||
     $http_response_header[0] !== "HTTP/1.1 200 OK"){
    echo "request error ".($http_response_header[0] ?? "no header").
                         " leaderboard\n";
    die(1);
  }
  echo "(".(++$request_counter).") leaderboard\n";
  $players=json_decode($leaderboard, true, 512, JSON_OBJECT_AS_ARRAY);

  $sss=$season;
  if($season === ""){
    $sss=$players["data"]["season"]["number"];
    if(!$sss){
      echo "data error no seson\n";
      die(1);
    }
    $oldcurrent=@file_get_contents("../data/current.js");
    if($oldcurrent === false){
      echo "no oldcurrent\n";
    }else{
      $oc=json_decode($oldcurrent, true, 512, JSON_OBJECT_AS_ARRAY);
      $oldseason=$oc["season"];
      if($oldseason !== $sss){
        file_put_contents("../data/oldseason.txt", $oldseason);
        echo "oldseason $oldseason\n";
        echo "newseason $sss\n";
      }
    }
    $season_j=["season" => $sss];
    file_put_contents("../data/current.js",
                      json_encode($season_j, JSON_PRETTY_PRINT));
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
    $stats=(file_get_contents($api_url."users/{$p["uuid"]}{$season_p1}",
                              false, $context));
    if($stats === false ||
       !isset($http_response_header[0]) ||
       $http_response_header[0] !== "HTTP/1.1 200 OK"){
      echo "request error ".($http_response_header[0] ?? "no header").
                           " {$p["nickname"]} stats season {$sss}\n";
      die(1);
    }
    echo "(".(++$request_counter).
            ") {$p["nickname"]} stats season {$sss}\n";
    unset($ss);
    $ss=json_decode($stats, true, 512, JSON_OBJECT_AS_ARRAY);

    $p["country"]=$ss["data"]["country"];
    $p["stats"]["rank"]=$ss["data"]["seasonResult"]["last"]["eloRank"];
    $p["stats"]["elo"]=$ss["data"]["seasonResult"]["last"]["eloRate"];
    $p["stats"]["top"]=$ss["data"]["seasonResult"]["highest"];
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
    $at[$p["uuid"]]["country"]=$ss["data"]["country"];
    $at[$p["uuid"]]["top"][$sss]=$ss["data"]["seasonResult"]["highest"] ?? 0;
    ksort($at[$p["uuid"]]["top"], SORT_NUMERIC);
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
    $before_id="";
    $before="";
    $done=false;
    $request=0;
    while(!$done){
      unset($matches);
      $matches=(file_get_contents($api_url."users/{$p["uuid"]}/".
                                  "matches?count=100&type=2".
                                  "{$season_p}{$before}",
                                  false, $context));
      if($matches === false ||
         !isset($http_response_header[0]) ||
         $http_response_header[0] !== "HTTP/1.1 200 OK"){
        echo "request error ".($http_response_header[0] ?? "no header").
                             " {$p["nickname"]} before {$before_id}\n";
        die(1);
      }
      echo "(".(++$request_counter).") {$p["nickname"]} before {$before_id}\n";
      unset($mm);
      $mm=json_decode($matches, true, 512, JSON_OBJECT_AS_ARRAY);
      if(!is_array($mm) || count($mm) === 0){
        echo "not an array or empty\n";
        $done=true;
        continue;
      }
      ++$request;
      if($request > 30){
        echo "more than 30 requests\n";
        $done=true;
        continue;
      }
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
                           "type" => $m["seedType"] ?? null,
                           "bastion" => $m["bastionType"] ?? null,
                           "result"=> $win,
                           "opponent" => $opponent,
                           "elo" => $elo,
                           "change" => $change,
                           "oelo" => $oelo,
                           "ochange" => $ochange,
                           "time" => $m["result"] === null ?
                           0 : $m["result"]["time"],
                           "forfeited" => $m["forfeited"],
                           "decayed" => $m["decayed"],];
        }else{
          $done=true;
          break;
        }
        $before_id=$m["id"];
        $before="&before=".$before_id;
      }
    }
    echo "#".(++$player_counter)." {$p["nickname"]} ".
            (count($p["matches"]))." matches\n";
    unset($p);
  }

  $data=["date" => $now, "players" => $pp];
  file_put_contents("../data/season{$season}.js",
                    json_encode($data, JSON_PRETTY_PRINT));

  sort($visited, SORT_STRING);
  $ot[$sss]=$visited;
  ksort($ot, SORT_NUMERIC);
  file_put_contents("../data/oldtime.js",
                    json_encode($ot, JSON_PRETTY_PRINT));

  $ooo=[];
  echo "count(\$ooo) ".count($ooo)."\n";
  foreach($ot as $o){
    $ooo=array_merge($ooo, $o);
    echo "count(\$ooo) ".count($ooo)."\n";
  }
  $ooo=array_unique($ooo, SORT_STRING);
  echo "unique(\$ooo) ".count($ooo)."\n";
  echo "count(\$at) ".count($at)."\n";

  // mise à jour des all time pour les joueurs
  // déjà présents mais pas sur cette saison (les old)
  $old_cpt=0;
  foreach($at as $uuid => &$a){
    if(!in_array($uuid, $ooo, true)){
      unset($at[$uuid]);
      echo "removed {$uuid} from alltime\n";
    }elseif(!in_array($uuid, $visited, true)){
      unset($stats);
      $stats=(file_get_contents($api_url."users/{$uuid}{$season_p1}",
                                false, $context));
      if($stats === false ||
         !isset($http_response_header[0]) ||
         $http_response_header[0] !== "HTTP/1.1 200 OK"){
        echo "request error ".($http_response_header[0] ?? "no header").
                             " old {$uuid} stats season {$sss}\n";
        die(1);
      }
      echo "(".(++$request_counter).") old {$uuid} stats season {$sss}\n";
      unset($ss);
      $ss=json_decode($stats, true, 512, JSON_OBJECT_AS_ARRAY);

      $a["nickname"]=$ss["data"]["nickname"];
      $a["country"]=$ss["data"]["country"];
      $a["top"][$sss]=$ss["data"]["seasonResult"]["highest"] ?? 0;
      ksort($a["top"], SORT_NUMERIC);
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
  echo "count(\$at) ".count($at)."\n";

  // mise à jour des all time pour les nouveaux joueurs
  // sur cette saison (les new)
  $new_cpt=0;
  foreach($new as $uuid){
    unset($stats);
    $stats=(file_get_contents($api_url."users/{$uuid}/seasons",
                              false, $context));
    if($stats === false ||
       !isset($http_response_header[0]) ||
       $http_response_header[0] !== "HTTP/1.1 200 OK"){
      echo "request error ".($http_response_header[0] ?? "no header").
                           " new {$uuid} stats seasons\n";
      die(1);
    }
    echo "(".(++$request_counter).") new {$uuid} stats seasons\n";
    unset($ss);
    $ss=json_decode($stats, true, 512, JSON_OBJECT_AS_ARRAY);
    foreach($ss["data"]["seasonResults"] as $s => $sr){

      $at[$uuid]["top"][$s]=$sr["highest"] ?? 0;
      $at[$uuid]["points"][$s]=$sr["last"]["phasePoint"] ?? 0;

    }
    ksort($at[$uuid]["top"], SORT_NUMERIC);
    ksort($at[$uuid]["points"], SORT_NUMERIC);
    ++$new_cpt;
  }
  echo "{$new_cpt} new\n";

  ksort($at, SORT_STRING);
  file_put_contents("../data/alltime.js",
                    json_encode($at, JSON_PRETTY_PRINT));

}

