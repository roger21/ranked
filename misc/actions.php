#!/usr/bin/php
<?php

{

  ini_set("error_reporting", "-1");
  ini_set("display_errors", "1");
  ini_set("display_startup_errors", "1");
  ini_set("html_errors", "0");
  ini_set("log_errors", "0");

  $run_array=[];
  $date_array=[];
  $time_array=[];
  $date_time_array=[];
  $diff1_array=[];
  $diff2_array=[];

  // boucle sur les pages
  for($i=1; $i <= 100; ++$i){

    echo("$i\n");

    // page
    $url="https://github.com/roger21/ranked/actions?page=$i";
    $page=file_get_contents($url);
    if($page === false){
      echo("\nERROR page $i\n");
      die;
    }
    $dom=new DOMDocument();
    @$dom->loadHTML($page);
    $xpath=new DOMXPath($dom);

    // runs
    // div.d-table > div.d-table-cell > a[aria-label^="completed successfully:"] span.h4
    $runs=$xpath->query(".//div[contains(concat(\" \",normalize-space(@class),\" \"),".
                        "\" d-table \")]/div[contains(concat(\" \",".
                        "normalize-space(@class),\" \"),\" d-table-cell \")]/".
                        "a[starts-with(@aria-label,\"completed successfully:\")]//".
                        "span[contains(concat(\" \",normalize-space(@class),\" \"),".
                        "\" h4 \")]");
    if($runs === false){
      echo("\nERROR runs\n");
      die;
    }
    foreach($runs as $run){
      $value=trim($run->nodeValue);
      $reg=preg_match("/^run #(?P<run>[0-9]+) on schedule$/", $value, $run_data);
      if($reg === false || $reg === 0){
        echo("\nERROR reg run $value\n");
        die;
      }
      $run_array[]=(int)$run_data["run"];
    }

    // dates
    // div.d-table > div.d-table-cell > a[aria-label^="completed successfully:"] ~ div
    // svg.octicon-calendar + relative-time
    $dates=$xpath->query(".//div[contains(concat(\" \",normalize-space(@class),\" \"),".
                         "\" d-table \")]/div[contains(concat(\" \",".
                         "normalize-space(@class),\" \"),\" d-table-cell \")]/".
                         "a[starts-with(@aria-label,\"completed successfully:\")]/".
                         "following-sibling::div//svg[contains(concat(\" \",".
                         "normalize-space(@class),\" \"),\" octicon-calendar \")]/".
                         "following-sibling::*[1]/self::relative-time");
    if($dates === false){
      echo("\nERROR dates\n");
      die;
    }
    foreach($dates as $date){
      $datetime=$date->attributes->getNamedItem("datetime")->nodeValue;
      $date=date_create_immutable_from_format(DATE_RFC3339, $datetime);
      $date_array[]=(int)$date->format("U");
    }

    // times
    // div.d-table > div.d-table-cell > a[aria-label^="completed successfully:"] ~ div
    // svg.octicon-stopwatch + span
    $times=$xpath->query(".//div[contains(concat(\" \",normalize-space(@class),\" \"),".
                         "\" d-table \")]/div[contains(concat(\" \",".
                         "normalize-space(@class),\" \"),\" d-table-cell \")]/".
                         "a[starts-with(@aria-label,\"completed successfully:\")]/".
                         "following-sibling::div//svg[contains(concat(\" \",".
                         "normalize-space(@class),\" \"),\" octicon-stopwatch \")]/".
                         "following-sibling::*[1]/self::span");
    if($times === false){
      echo("\nERROR times\n");
      die;
    }
    foreach($times as $time){
      $value=trim($time->nodeValue);
      $reg=preg_match("/^(?:(?P<hou>[0-9]+)h )?(?:(?P<min>[0-9]+)m )?(?<sec>[0-9]+)s$/",
                      $value, $time_data);
      if($reg === false){
        echo("\nERROR reg time $value\n");
        die;
      }
      if($reg === 0){
        echo("NOTICE reg time $value\n");
        $time_array[]=-1;
      }else{
        $time_array[]=(int)$time_data["hou"] * 3600 +
                     (int)$time_data["min"] * 60 + (int)$time_data["sec"];
      }
    }

  }

  // taille des tableaux 1
  if(count($run_array) !== count($date_array) ||
     count($date_array) !== count($time_array)){
    echo("\nERROR count 1 ".count($run_array)." ".
         count($date_array)." ".count($time_array)."\n");
    die;
  }

  // time 1
  echo("\ncount time 1: ".count($time_array)."\n");
  echo("min time 1: ".(min($time_array) / 60)."\n");
  echo("max time 1: ".(max($time_array) / 60)."\n");
  echo("mean time 1: ".(array_sum($time_array) / count($time_array) / 60)."\n");

  // élimination des temps foireux
  for($i=0; $i < count($time_array); ++$i){
    if($time_array[$i] === -1){
      unset($run_array[$i]);
      unset($date_array[$i]);
      unset($time_array[$i]);
    }
  }
  $run_array=array_values($run_array);
  $date_array=array_values($date_array);
  $time_array=array_values($time_array);

  // taille des tableaux 2
  if(count($run_array) !== count($date_array) ||
     count($date_array) !== count($time_array)){
    echo("\nERROR count 2 ".count($run_array)." ".
         count($date_array)." ".count($time_array)."\n");
    die;
  }

  // time 2
  echo("\ncount time 2: ".count($time_array)."\n");
  echo("min time 2: ".(min($time_array) / 60)."\n");
  echo("max time 2: ".(max($time_array) / 60)."\n");
  echo("mean time 2: ".(array_sum($time_array) / count($time_array) / 60)."\n");

  // ordre des dates et élimination des dates non-ordonnées
  $order_ok=true;
  do{
    for($i=1; $i < count($date_array); ++$i){
      if($date_array[$i - 1] <= $date_array[$i]){
        echo("\nNOTICE date order {$run_array[$i - 1]}: ".
             date(DATE_RFC3339, $date_array[$i - 1])." {$run_array[$i]}: ".
             date(DATE_RFC3339, $date_array[$i])."\n");
        unset($run_array[$i]);
        unset($date_array[$i]);
        unset($time_array[$i]);
        $run_array=array_values($run_array);
        $date_array=array_values($date_array);
        $time_array=array_values($time_array);
        $order_ok=false;
        break;
      }
      $order_ok=true;
    }
  }while(!$order_ok);

  // taille des tableaux 3
  if(count($run_array) !== count($date_array) ||
     count($date_array) !== count($time_array)){
    echo("\nERROR count 3 ".count($run_array)." ".
         count($date_array)." ".count($time_array)."\n");
    die;
  }

  // time 3
  echo("\ncount time 3: ".count($time_array)."\n");
  echo("min time 3: ".(min($time_array) / 60)."\n");
  echo("max time 3: ".(max($time_array) / 60)."\n");
  echo("mean time 3: ".(array_sum($time_array) / count($time_array) / 60)."\n");

  // diff 1
  $previous=0;
  foreach($date_array as $date){
    if(!$previous){
      $previous=$date;
    }else{
      $diff1_array[]=($previous - $date) / 60;
      $previous=$date;
    }
  }

  // diff 1
  echo("\ncount diff 1: ".count($diff1_array)."\n");
  echo("min diff 1: ".min($diff1_array)."\n");
  echo("max diff 1: ".max($diff1_array)."\n");
  echo("mean diff 1: ".(array_sum($diff1_array) / count($diff1_array))."\n");

  // dates + times
  foreach($date_array as $i => $date){
    $date_time_array[$i]=$date + $time_array[$i];
  }

  // ordre des dates + times et élimination des dates + times non-ordonnées
  $order_ok=true;
  do{
    for($i=1; $i < count($date_time_array); ++$i){
      if($date_time_array[$i - 1] <= $date_time_array[$i]){
        echo("\nNOTICE date + time order {$run_array[$i - 1]}: ".
             date(DATE_RFC3339, $date_time_array[$i - 1])." {$run_array[$i]}: ".
             date(DATE_RFC3339, $date_time_array[$i])."\n");
        unset($run_array[$i]);
        unset($date_array[$i]);
        unset($time_array[$i]);
        unset($date_time_array[$i]);
        $run_array=array_values($run_array);
        $date_array=array_values($date_array);
        $time_array=array_values($time_array);
        $date_time_array=array_values($date_time_array);
        $order_ok=false;
        break;
      }
      $order_ok=true;
    }
  }while(!$order_ok);

  // taille des tableaux 4
  if(count($run_array) !== count($date_array) ||
     count($date_array) !== count($time_array) ||
     count($time_array) !== count($date_time_array)){
    echo("\nERROR count 4 ".count($run_array)." ".count($date_array).
         " ".count($time_array)." ".count($date_time_array)."\n");
    die;
  }

  // time 4
  echo("\ncount time 4: ".count($time_array)."\n");
  echo("min time 4: ".(min($time_array) / 60)."\n");
  echo("max time 4: ".(max($time_array) / 60)."\n");
  echo("mean time 4: ".(array_sum($time_array) / count($time_array) / 60)."\n");

  // diff 2
  $previous=0;
  foreach($date_time_array as $date){
    if(!$previous){
      $previous=$date;
    }else{
      $diff2_array[]=($previous - $date) / 60;
      $previous=$date;
    }
  }

  // diff 2
  echo("\ncount diff 2: ".count($diff2_array)."\n");
  echo("min diff 2: ".min($diff2_array)."\n");
  echo("max diff 2: ".max($diff2_array)."\n");
  echo("mean diff 2: ".(array_sum($diff2_array) / count($diff2_array))."\n");

}