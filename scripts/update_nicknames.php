#!/usr/bin/php
<?php

{

  ini_set("error_reporting", "-1");
  ini_set("display_errors", "1");
  ini_set("display_startup_errors", "1");
  ini_set("html_errors", "0");
  ini_set("log_errors", "0");

  //$api_url="https://api.mojang.com/user/profile/";
  $api_url="https://mowojang.matdoes.dev/";

  $request_counter=0;

  $nicknames=@file_get_contents("../data/nicknames.js");
  if($nicknames === false){
    $nicks=[];
    echo "new nicknames\n";
  }else{
    $nicks=json_decode($nicknames, true, 512, JSON_OBJECT_AS_ARRAY);
  }

  foreach($nicks as $uuid => $nick){
    $user=file_get_contents($api_url.$uuid);
    if($user === false ||
       !isset($http_response_header[0]) ||
       $http_response_header[0] !== "HTTP/1.1 200 OK"){
      echo "request error ".($http_response_header[0] ?? "no header").
                           " uuid {$uuid} nick {$nick}\n";
      die(1);
    }
    unset($u);
    $u=json_decode($user, true, 512, JSON_OBJECT_AS_ARRAY);
    $newnick=$u["name"];
    $nicks[$uuid]=$newnick;
    if($nick !== $newnick){
      echo "(".(++$request_counter).
              ") uuid {$uuid} oldnick {$nick} newnick {$newnick}\n";
    }else{
      echo "(".(++$request_counter).
              ") uuid {$uuid} samenick {$newnick}\n";
    }
    //usleep(500000);
  }

  ksort($nicks, SORT_STRING);
  file_put_contents("../data/nicknames.js",
                    json_encode($nicks, JSON_PRETTY_PRINT));

}

