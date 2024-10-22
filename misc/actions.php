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
  $diff_array=[];
  $time_array=[];
  $date1_array=[];
  $date2_array=[];
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
      if($reg === false){
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
    // svg.octicon-calendar + relative-time
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
      $reg=preg_match("/^(?P<min>[0-9]+)m (?<sec>[0-9]+)s$/", $value, $time_data);
      if($reg === false){
        echo("\nERROR reg time $value\n");
        die;
      }
      $time_array[]=(int)$time_data["min"] * 60 + (int)$time_data["sec"];
    }

  }

  // taille des tableaux
  if(count($run_array) !== count($date_array) ||
     count($date_array) !== count($time_array)){
    echo("\nERROR count ".count($run_array)." ".
         count($date_array)." ".count($time_array)."\n");
    die;
  }

  // time
  echo("\ncount time: ".count($time_array)."\n");
  echo("min time: ".(min($time_array) / 60)."\n");
  echo("max time: ".(max($time_array) / 60)."\n");
  echo("mean time: ".(array_sum($time_array) / count($time_array) / 60)."\n");

  // ordre des dates
  for($i=1; $i < count($date_array); ++$i){
    if($date_array[$i - 1] <= $date_array[$i]){
      echo("\nERROR order {$run_array[$i - 1]}: {$date_array[$i - 1]} ".
           "{$run_array[$i]}: {$date_array[$i]}\n");
      die;
    }
  }

  // diff
  $previous=0;
  foreach($date_array as $date){
    if(!$previous){
      $previous=$date;
    }else{
      $diff_array[]=($previous - $date) / 60;
      $previous=$date;
    }
  }

  // diff
  echo("\ncount diff: ".count($diff_array)."\n");
  echo("min diff: ".min($diff_array)."\n");
  echo("max diff: ".max($diff_array)."\n");
  echo("mean diff: ".(array_sum($diff_array) / count($diff_array))."\n");

  // date1 (date + time)
  foreach($date_array as $i => $date){
    $date1_array[$i]=$date + $time_array[$i];
  }

  // ordre des date1
  for($i=1; $i < count($date1_array); ++$i){
    if($date1_array[$i - 1] <= $date1_array[$i]){
      echo("\nNOTICE order 1 {$run_array[$i - 1]}: {$date1_array[$i - 1]} ".
           "{$run_array[$i]}: {$date1_array[$i]}\n");
    }
  }

  // date2 (élimination des date1 non ordonnées)
  for($i=0; $i < count($date1_array); ++$i){
    if($i){
      if($date1_array[$i - 1] > $date1_array[$i]){
        $date2_array[]=$date1_array[$i];
      }
    }else{
      $date2_array[]=$date1_array[$i];
    }
  }

  // diff2
  $previous=0;
  foreach($date2_array as $date){
    if(!$previous){
      $previous=$date;
    }else{
      $diff2_array[]=($previous - $date) / 60;
      $previous=$date;
    }
  }

  // diff2
  echo("\ncount diff2: ".count($diff2_array)."\n");
  echo("min diff2: ".min($diff2_array)."\n");
  echo("max diff2: ".max($diff2_array)."\n");
  echo("mean diff2: ".(array_sum($diff2_array) / count($diff2_array))."\n");

}