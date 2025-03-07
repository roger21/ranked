// url de base pour les données
const url = "https://raw.githubusercontent.com/roger21/ranked/main/data/";
//const url = "data/"

// tableau des couleurs pour les courbes
let colors = [
  [
    "hsl(0deg 80% 30%)", "hsl(30deg 80% 30%)",
    "hsl(60deg 80% 30%)", "hsl(90deg 80% 30%)",
    "hsl(175deg 80% 30%)", "hsl(195deg 80% 30%)",
    "hsl(220deg 80% 30%)", "hsl(265deg 80% 30%)",
    "hsl(280deg 80% 30%)", "hsl(310deg 80% 30%)",
  ],
  [
    "hsl(0deg 80% 40%)", "hsl(30deg 80% 40%)",
    "hsl(60deg 80% 40%)", "hsl(90deg 80% 40%)",
    "hsl(175deg 80% 40%)", "hsl(195deg 80% 40%)",
    "hsl(220deg 80% 40%)", "hsl(265deg 80% 40%)",
    "hsl(280deg 80% 40%)", "hsl(310deg 80% 40%)",
  ],
  [
    "hsl(0deg 80% 50%)", "hsl(30deg 80% 50%)",
    "hsl(60deg 80% 50%)", "hsl(90deg 80% 50%)",
    "hsl(175deg 80% 50%)", "hsl(195deg 80% 50%)",
    "hsl(220deg 80% 50%)", "hsl(265deg 80% 50%)",
    "hsl(280deg 80% 50%)", "hsl(310deg 80% 50%)",
  ],
  [
    "hsl(0deg 80% 65%)", "hsl(30deg 80% 65%)",
    "hsl(60deg 80% 65%)", "hsl(90deg 80% 65%)",
    "hsl(175deg 80% 65%)", "hsl(195deg 80% 65%)",
    "hsl(220deg 80% 65%)", "hsl(265deg 80% 65%)",
    "hsl(280deg 80% 65%)", "hsl(310deg 80% 65%)",
  ],
  [
    "hsl(0deg 80% 75%)", "hsl(30deg 80% 75%)",
    "hsl(60deg 80% 75%)", "hsl(90deg 80% 75%)",
    "hsl(175deg 80% 75%)", "hsl(195deg 80% 75%)",
    "hsl(220deg 80% 75%)", "hsl(265deg 80% 75%)",
    "hsl(280deg 80% 75%)", "hsl(310deg 80% 75%)",
  ],
];
// nombre de lignes (les luminositée 30%, 40%, 50%, 65% et 75%)
let nbRows = 5;
// nombre de colonnes (les teintes réparties entre 0° et 310°)
let nbColors = 10;
// lignes de décallage pour le passage d'une couleur à la suivante
let rowSkip = 3;
// colonnes de décallage pour le passage d'une couleur à la suivante
let colorSkip = 3;
// ligne de départ
let rowStart = 2;
// colonne de départ
let colorStart = 0;
// alpha channel à 0.1 pour les autres courbes sur un mouseover
let colorHover = " / .1)";
// couleur de chaque joueur
let playerColors = {};

// paramètres globaux de la langue
let currentLang = "en";
let currentLangLocal = "en-US";
let language;

// gestion de la correspondance elo - rank label
function getRankLabel(elo) {
  elo = parseInt(elo, 10);
  if(isNaN(elo) || elo < 0) {
    return ["unrated", language["Unrated"], null];
  } else if(elo < 400) {
    return ["coal", language["Coal"], "I"];
  } else if(elo < 500) {
    return ["coal", language["Coal"], "II"];
  } else if(elo < 600) {
    return ["coal", language["Coal"], "III"];
  } else if(elo < 700) {
    return ["iron", language["Iron"], "I"];
  } else if(elo < 800) {
    return ["iron", language["Iron"], "II"];
  } else if(elo < 900) {
    return ["iron", language["Iron"], "III"];
  } else if(elo < 1000) {
    return ["gold", language["Gold"], "I"];
  } else if(elo < 1100) {
    return ["gold", language["Gold"], "II"];
  } else if(elo < 1200) {
    return ["gold", language["Gold"], "III"];
  } else if(elo < 1300) {
    return ["emerald", language["Emerald"], "I"];
  } else if(elo < 1400) {
    return ["emerald", language["Emerald"], "II"];
  } else if(elo < 1500) {
    return ["emerald", language["Emerald"], "III"];
  } else if(elo < 1650) {
    return ["diamond", language["Diamond"], "I"];
  } else if(elo < 1800) {
    return ["diamond", language["Diamond"], "II"];
  } else if(elo < 2000) {
    return ["diamond", language["Diamond"], "III"];
  } else {
    return ["netherite", language["Netherite"], null];
  }
}

// gestion du formatatge de la date pour le sous-titre
function dateFull(date) {
  return date.toLocaleString(currentLangLocal, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

// gestion du formatatge de la date pour les matchs
function dateShort(date) {
  return date.toLocaleString(currentLangLocal, {
    dateStyle: "long",
    timeStyle: "medium",
  })/*.replace(" 0", " ")*/;
}

// formatage des secondes pour le temps des matchs
const secFormat = new Intl.NumberFormat(currentLangLocal, {
  style: "decimal",
  minimumIntegerDigits: 2,
  minimumFractionDigits: 3,
  roundingMode: "trunc",
});

// formatage des secondes pour le temps moyen des matchs
const secMeanFormat = new Intl.NumberFormat(currentLangLocal, {
  style: "decimal",
  minimumIntegerDigits: 2,
  maximumFractionDigits: 0,
  roundingMode: "trunc",
});

// gestion du formatage des temps
function formatTime(time, formater) {
  if(time === 0) {
    return language["unknown"];
  }
  let sec = time / 1000;
  if(sec < 60) {
    return "0:" + formater.format(sec);
  } else {
    let min = Math.floor(sec / 60);
    // calcul de la soustraction sur les entiers
    // car avec les flotants on a des erreurs
    let msec = time - (min * 60000);
    sec = msec / 1000;
    return "" + min + ":" + formater.format(sec);
  }
}

// gestion du formatage du temps des matchs
function getTime(time) {
  return formatTime(time, secFormat);
}

// gestion du formatage du temps moyen des matchs
function getMeanTime(time) {
  return formatTime(time, secMeanFormat);
}

// formatage des pourcentages
const percentFormat = new Intl.NumberFormat(currentLangLocal, {
  style: "percent",
  minimumIntegerDigits: 1,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

// gestion du formatage des pourcentages
function getPercent(percent) {
  return percentFormat.format(percent);
}

// calcul des top alltime
function getTop(top) {
  let max = 0;
  let seasons = [];
  for(const i in top) {
    max = max > top[i] ? max : top[i];
  }
  for(const i in top) {
    if(top[i] === max) {
      seasons.push(i);
    }
  }
  if(max === 0) {
    return [max, ""];
  }
  if(seasons.length === 1) {
    return [max, language["in_season_"] + seasons[0]];
  }
  if(seasons.length === 2) {
    return [max, language["in_seasons_"] + seasons[0] + language["_and_"] +
      seasons[1]
    ];
  }
  return [max, language["in_seasons_"] +
    seasons.slice(0, seasons.length - 1).join(", ") +
    language["_and_"] + seasons[seasons.length - 1]
  ];
}

// date courrante pour le calcule des temps écoulés
let currentDate = new Date();

// gestion du formatage du temps écoulé pour le sous-titre
function agoCompute(number) {
  let ago;
  if(number > (365 * 24 * 60 * 60 * 1000)) {
    ago = Math.floor(number / (365 * 24 * 60 * 60 * 1000));
    return (ago > 1) ? " (" + language["il_y_a_"] + ago +
      language["_years_ago"] + ")" :
      " (" + language["one_year_ago"] + ")";
  } else if(number > (30 * 24 * 60 * 60 * 1000)) {
    ago = Math.floor(number / (30 * 24 * 60 * 60 * 1000));
    return (ago > 1) ? " (" + language["il_y_a_"] + ago +
      language["_months_ago"] + ")" :
      " (" + language["one_month_ago"] + ")";
  } else if(number > (7 * 24 * 60 * 60 * 1000)) {
    ago = Math.floor(number / (7 * 24 * 60 * 60 * 1000));
    return (ago > 1) ? " (" + language["il_y_a_"] + ago +
      language["_weeks_ago"] + ")" :
      " (" + language["one_week_ago"] + ")";
  } else if(number > (24 * 60 * 60 * 1000)) {
    ago = Math.floor(number / (24 * 60 * 60 * 1000));
    return (ago > 1) ? " (" + language["il_y_a_"] + ago +
      language["_days_ago"] + ")" :
      " (" + language["one_day_ago"] + ")";
  } else if(number > (60 * 60 * 1000)) {
    ago = Math.floor(number / (60 * 60 * 1000));
    return (ago > 1) ? " (" + language["il_y_a_"] + ago +
      language["_hours_ago"] + ")" :
      " (" + language["one_hour_ago"] + ")";
  } else if(number > (60 * 1000)) {
    ago = Math.floor(number / (60 * 1000));
    return (ago > 1) ? " (" + language["il_y_a_"] + ago +
      language["_minutes_ago"] + ")" :
      " (" + language["one_minute_ago"] + ")";
  } else if(number > (1000)) {
    ago = Math.floor(number / (1000));
    return (ago > 1) ? " (" + language["il_y_a_"] + ago +
      language["_seconds_ago"] + ")" :
      " (" + language["one_second_ago"] + ")";
  } else {
    return " (" + language["just_now"] + ")";
  }
}

// gestion du formatage du temps écoulé court (pas utilisé)
function agoComputeShort(number) {
  let ago;
  if(number > (365 * 24 * 60 * 60 * 1000)) {
    ago = Math.floor(number / (365 * 24 * 60 * 60 * 1000));
    return "(" + ago + language["short_year"] + ")";
  } else if(number > (30 * 24 * 60 * 60 * 1000)) {
    ago = Math.floor(number / (30 * 24 * 60 * 60 * 1000));
    return "(" + ago + language["short_month"] + ")";
  } else if(number > (7 * 24 * 60 * 60 * 1000)) {
    ago = Math.floor(number / (7 * 24 * 60 * 60 * 1000));
    return "(" + ago + language["short_week"] + ")";
  } else if(number > (24 * 60 * 60 * 1000)) {
    ago = Math.floor(number / (24 * 60 * 60 * 1000));
    return "(" + ago + language["short_day"] + ")";
  } else if(number > (60 * 60 * 1000)) {
    ago = Math.floor(number / (60 * 60 * 1000));
    return "(" + ago + language["short_hour"] + ")";
  } else if(number > (60 * 1000)) {
    ago = Math.floor(number / (60 * 1000));
    return "(" + ago + language["short_minute"] + ")";
  } else if(number > (1000)) {
    ago = Math.floor(number / (1000));
    return "(" + ago + language["short_second"] + ")";
  } else {
    return "(" + language["now"] + ")";
  }
}

// url pour l'image de la tête
function headUrl(uuid) {
  return "https://vzge.me/head/74/" + uuid + ".webp?y=70";
}

// images des têtes
let images = {};

// gestion de la récupération des paramètres dans l'url actuelle
function getParams(maxSeason) {
  let params = new URL(window.location).searchParams;
  let p = params.get("p");
  let d = params.get("d");
  let s = parseInt(params.get("s"), 10);
  let a = ["1", "5", "10", "15", "20", "25", "30", "35", "40", "45", "50"];
  p = a.includes(p) ? p : "50";
  d = a.includes(d) ? d : "50";
  s = s >= 1 && s <= maxSeason ? s : maxSeason;
  return [p, d, s];
}

// gestion de la création de l'url pour les liens
// en fonction des paramètres actuels et du lien
function getLink(p = "50", d = "50", s = "") {
  let pStr = (p === "50") ? "" : "p=" + p;
  let dStr = (d === "50") ? "" : "d=" + d;
  let sStr = (s === "") ? "" : "s=" + s;
  if(pStr !== "" || dStr !== "" || sStr !== "") {
    let href = "?" + pStr;
    href += (pStr !== "" && dStr !== "") ? "&" + dStr : dStr;
    href += ((pStr !== "" || dStr !== "") && sStr !== "") ?
      "&" + sStr : sStr;
    return href;
  } else {
    return window.location.origin + window.location.pathname;
  }
}

// plugin pour ajouter une couleur de fond et une bordure au graph
const chartborderandcolor = {
  id: "chartborderandcolor",
  beforeDraw(chart, args, options) {
    if(chart && chart.ctx && chart.chartArea) {
      let {
        chartArea: {
          left,
          top,
          width,
          height,
        }
      } = chart;
      left = Math.round(left);
      top = Math.round(top);
      width = Math.round(width);
      height = Math.round(height);
      chart.ctx.save();
      chart.ctx.fillStyle = options.fillColor;
      chart.ctx.fillRect(left, top + 1, width, height);
      chart.ctx.strokeStyle = options.strokeColor;
      chart.ctx.lineWidth = options.strokeWidth;
      chart.ctx.strokeRect(left, top + 1, width, height);
      chart.ctx.restore();
    }
  },
};

// tooltip sur les éléments de la légende
const legendTooltip = document.getElementById("legendtooltip");

// timer pour l'affichage de la tooltip sur les éléments de la légende
let legendTimer;
const legendTime = 1000;

// gestion de l'affichage de la tooltip sur les éléments de la légende
function displayLegendTooltip(target, data) {
  window.clearTimeout(legendTimer);
  legendTimer = window.setTimeout(function() {
    // suppression des éléments actuels de la tooltip
    while(legendTooltip.firstChild) {
      legendTooltip.removeChild(legendTooltip.firstChild);
    }

    // données du joueur
    const stats = data.stats;
    const alltime = data.alltime;

    // tête du joueur
    images[data.uuid].alt = currentLang === "en" ?
      data.label + language["head"] : language["head"] + data.label;
    legendTooltip.appendChild(images[data.uuid]);

    // bloc global des données de la saison du joueur
    const dataDiv = document.createElement("div");
    dataDiv.setAttribute("id", "data");
    legendTooltip.appendChild(dataDiv);
    const dataLegend = document.createElement("img");
    dataLegend.classList.add("legend");
    dataLegend.src = "img/s.svg"
    dataDiv.appendChild(dataLegend);

    // ligne rank / joueur / country / ranklabel / elo / points
    const dataRankDiv = document.createElement("div");
    dataDiv.appendChild(dataRankDiv);
    // rank
    const rankDiv = document.createElement("div");
    rankDiv.classList.add("rank");
    rankDiv.textContent = "#" + stats.rank;
    dataRankDiv.appendChild(rankDiv);
    // le joueur
    const playerDiv = document.createElement("div");
    playerDiv.classList.add("player");
    dataRankDiv.appendChild(playerDiv);
    const colorDiv = document.createElement("div");
    colorDiv.classList.add("color");
    colorDiv.style.background = data.backgroundColor;
    playerDiv.appendChild(colorDiv);
    const nameDiv = document.createElement("div");
    nameDiv.classList.add("name");
    nameDiv.textContent = data.label
    playerDiv.appendChild(nameDiv);
    // le drapeau
    if(data.country) {
      const flagDiv = document.createElement("div");
      flagDiv.className = "fi fi-" + data.country;
      playerDiv.appendChild(flagDiv);
    }
    // elo
    const toping = (stats.elo === stats.top);
    const eloDiv = document.createElement("div");
    eloDiv.classList.add("elo");
    eloDiv.classList.toggle("toping", toping);
    eloDiv.textContent = stats.elo + (toping ? " top elo" : " elo");
    dataRankDiv.appendChild(eloDiv);
    // top elo
    if(!toping) {
      const topEloDiv = document.createElement("div");
      topEloDiv.classList.add("topelo");
      topEloDiv.textContent = "(" + stats.top + " top)";
      dataRankDiv.appendChild(topEloDiv);
    }
    // le rank label
    const rankLabel = getRankLabel(stats.elo);
    const label = rankLabel[0];
    const fullLabel = rankLabel[1] +
      (rankLabel[2] ? " " + rankLabel[2] : "");
    const rankLabelDiv = document.createElement("div");
    rankLabelDiv.classList.add("ranklabel");
    dataRankDiv.appendChild(rankLabelDiv);
    const rankIconDiv = document.createElement("div");
    rankIconDiv.classList.add("rankicon");
    rankIconDiv.classList.add(label);
    rankLabelDiv.appendChild(rankIconDiv);
    const rankNameDiv = document.createElement("div");
    rankNameDiv.classList.add("rankname");
    rankNameDiv.textContent = fullLabel;
    rankLabelDiv.appendChild(rankNameDiv);
    // points
    if(stats.points) {
      const pointsDiv = document.createElement("div");
      pointsDiv.classList.add("points");
      pointsDiv.textContent = stats.points + " pts";
      dataRankDiv.appendChild(pointsDiv);
    }

    // ligne pb / streak / matches / temps moyens
    const dataPbDiv = document.createElement("div");
    dataDiv.appendChild(dataPbDiv);
    // pb
    const pbDiv = document.createElement("div");
    pbDiv.classList.add("pb");
    pbDiv.textContent = "pb " + getTime(stats.pb);
    dataPbDiv.appendChild(pbDiv);
    // streak
    const streaking = (stats.current === stats.streak);
    const streakDiv = document.createElement("div");
    streakDiv.classList.add("streak");
    streakDiv.classList.toggle("streaking", streaking);
    streakDiv.textContent =
      (streaking ? "top streak " : "streak ") + stats.current;
    dataPbDiv.appendChild(streakDiv);
    // top streak
    if(!streaking) {
      const topStreakDiv = document.createElement("div");
      topStreakDiv.classList.add("topstreak");
      topStreakDiv.textContent = "(" + stats.streak + " top)";
      dataPbDiv.appendChild(topStreakDiv);
    }
    // matches
    const matchesDiv = document.createElement("div");
    matchesDiv.classList.add("matches");
    matchesDiv.textContent = stats.matches +
      " " + language["matches"];
    dataPbDiv.appendChild(matchesDiv);
    // match moyen
    const matchTimeDiv = document.createElement("div");
    matchTimeDiv.classList.add("meantime");
    matchTimeDiv.textContent = language["mean_match"] +
      " " + getMeanTime(stats.playtime / stats.matches);
    dataPbDiv.appendChild(matchTimeDiv);
    // completion moyenne
    const completionTimeDiv = document.createElement("div");
    completionTimeDiv.classList.add("meantime");
    completionTimeDiv.textContent = language["mean_completion"] +
      " " + getMeanTime(stats.finishtime / stats.finished);
    dataPbDiv.appendChild(completionTimeDiv);

    // ligne stats
    const statsDiv = document.createElement("div");
    dataDiv.appendChild(statsDiv);
    // victoires
    const wonDiv = document.createElement("div");
    wonDiv.classList.add("statsdiv");
    wonDiv.classList.add("won");
    statsDiv.appendChild(wonDiv);
    const wonLabel = document.createElement("div");
    wonLabel.textContent = language["won"];
    wonDiv.appendChild(wonLabel);
    const wonPercent = document.createElement("div");
    wonPercent.textContent =
      getPercent(stats.won / stats.matches);
    wonDiv.appendChild(wonPercent);
    // completions
    const completedDiv = document.createElement("div");
    completedDiv.classList.add("statsdiv");
    completedDiv.classList.add("completed");
    statsDiv.appendChild(completedDiv);
    const completedLabel = document.createElement("div");
    completedLabel.textContent = language["completion"];
    completedDiv.appendChild(completedLabel);
    const completedPercent = document.createElement("div");
    completedPercent.textContent =
      getPercent(stats.finished / stats.matches);
    completedDiv.appendChild(completedPercent);
    // défaites
    const lostDiv = document.createElement("div");
    lostDiv.classList.add("statsdiv");
    lostDiv.classList.add("lost");
    statsDiv.appendChild(lostDiv);
    const lostLabel = document.createElement("div");
    lostLabel.textContent = language["lost"];
    lostDiv.appendChild(lostLabel);
    const lostPercent = document.createElement("div");
    lostPercent.textContent =
      getPercent(stats.lost / stats.matches);
    lostDiv.appendChild(lostPercent);
    // fofaits
    const forfeitedDiv = document.createElement("div");
    forfeitedDiv.classList.add("statsdiv");
    forfeitedDiv.classList.add("forfeited");
    statsDiv.appendChild(forfeitedDiv);
    const forfeitedLabel = document.createElement("div");
    forfeitedLabel.textContent = language["forfeited"];
    forfeitedDiv.appendChild(forfeitedLabel);
    const forfeitedPercent = document.createElement("div");
    forfeitedPercent.textContent =
      getPercent(stats.forfeited / stats.matches);
    forfeitedDiv.appendChild(forfeitedPercent);
    // égalités
    const drawDiv = document.createElement("div");
    drawDiv.classList.add("statsdiv");
    drawDiv.classList.add("draw");
    statsDiv.appendChild(drawDiv);
    const drawLabel = document.createElement("div");
    drawLabel.textContent = language["draw"];
    drawDiv.appendChild(drawLabel);
    const drawPercent = document.createElement("div");
    drawPercent.textContent = getPercent((stats.matches -
      (stats.won + stats.lost)) / stats.matches);
    drawDiv.appendChild(drawPercent);

    // bloc global des données alltime du joueur
    const alltimeDiv = document.createElement("div");
    alltimeDiv.setAttribute("id", "alltime");
    legendTooltip.appendChild(alltimeDiv);
    const alltimeLegend = document.createElement("img");
    alltimeLegend.classList.add("legend");
    alltimeLegend.src = "img/at.svg"
    alltimeDiv.appendChild(alltimeLegend);

    // ligne alltime top elo / ranklabel / top points
    const alltimeDataRankDiv = document.createElement("div");
    alltimeDiv.appendChild(alltimeDataRankDiv);
    // alltime top elo
    const elo = getTop(alltime.top);
    const alltimeEloDiv = document.createElement("div");
    alltimeEloDiv.classList.add("elo");
    alltimeEloDiv.textContent = elo[0] + " top elo";
    alltimeDataRankDiv.appendChild(alltimeEloDiv);
    // le rank label
    const alltimeRankLabel = getRankLabel(elo[0]);
    const alltimeLabel = alltimeRankLabel[0];
    const alltimeFullLabel = alltimeRankLabel[1] +
      (alltimeRankLabel[2] ? " " + alltimeRankLabel[2] : "");
    const alltimeRankLabelDiv = document.createElement("div");
    alltimeRankLabelDiv.classList.add("ranklabel");
    alltimeDataRankDiv.appendChild(alltimeRankLabelDiv);
    const alltimeRankIconDiv = document.createElement("div");
    alltimeRankIconDiv.classList.add("rankicon");
    alltimeRankIconDiv.classList.add(alltimeLabel);
    alltimeRankLabelDiv.appendChild(alltimeRankIconDiv);
    const alltimeRankNameDiv = document.createElement("div");
    alltimeRankNameDiv.classList.add("rankname");
    alltimeRankNameDiv.textContent = alltimeFullLabel;
    alltimeRankLabelDiv.appendChild(alltimeRankNameDiv);
    // alltime top elo seasons
    const alltimeEloSeasonsDiv = document.createElement("div");
    alltimeEloSeasonsDiv.classList.add("eloseasons");
    alltimeEloSeasonsDiv.textContent = "(" + elo[1] + ")";
    alltimeDataRankDiv.appendChild(alltimeEloSeasonsDiv);
    // alltime top points
    const points = getTop(alltime.points);
    if(points[0]) {
      const alltimePointsDiv = document.createElement("div");
      alltimePointsDiv.classList.add("points");
      alltimePointsDiv.textContent = points[0] + " top pts";
      alltimeDataRankDiv.appendChild(alltimePointsDiv);
      // alltime top points seasons
      const alltimePointsSeasonsDiv = document.createElement("div");
      alltimePointsSeasonsDiv.classList.add("pointsseasons");
      alltimePointsSeasonsDiv.textContent = "(" + points[1] + ")";
      alltimeDataRankDiv.appendChild(alltimePointsSeasonsDiv);
    }

    // ligne alltime pb / streak / matches / temps moyens
    const alltimeDataPbDiv = document.createElement("div");
    alltimeDiv.appendChild(alltimeDataPbDiv);
    // alltime pb
    const alltimePbDiv = document.createElement("div");
    alltimePbDiv.classList.add("pb");
    alltimePbDiv.textContent = "pb " + getTime(alltime.pb);
    alltimeDataPbDiv.appendChild(alltimePbDiv);
    // alltime top streak
    const alltimeTopStreakDiv = document.createElement("div");
    alltimeTopStreakDiv.classList.add("streak");
    alltimeTopStreakDiv.textContent = "top streak " + alltime.streak;
    alltimeDataPbDiv.appendChild(alltimeTopStreakDiv);
    // alltime matches
    const alltimeMatchesDiv = document.createElement("div");
    alltimeMatchesDiv.classList.add("matches");
    alltimeMatchesDiv.textContent = alltime.matches +
      " " + language["matches"];
    alltimeDataPbDiv.appendChild(alltimeMatchesDiv);
    // alltime match moyen
    const alltimeMatchTimeDiv = document.createElement("div");
    alltimeMatchTimeDiv.classList.add("meantime");
    alltimeMatchTimeDiv.textContent = language["mean_match"] +
      " " + getMeanTime(alltime.playtime / alltime.matches);
    alltimeDataPbDiv.appendChild(alltimeMatchTimeDiv);
    // alltime completion moyenne
    const alltimeCompletionTimeDiv = document.createElement("div");
    alltimeCompletionTimeDiv.classList.add("meantime");
    alltimeCompletionTimeDiv.textContent = language["mean_completion"] +
      " " + getMeanTime(alltime.finishtime / alltime.finished);
    alltimeDataPbDiv.appendChild(alltimeCompletionTimeDiv);

    // ligne alltime stats
    const alltimeStatsDiv = document.createElement("div");
    alltimeDiv.appendChild(alltimeStatsDiv);
    // alltime victoires
    const alltimeWonDiv = document.createElement("div");
    alltimeWonDiv.classList.add("alltimestatsdiv");
    alltimeWonDiv.classList.add("won");
    alltimeStatsDiv.appendChild(alltimeWonDiv);
    const alltimeWonLabel = document.createElement("div");
    alltimeWonLabel.textContent = language["won"];
    alltimeWonDiv.appendChild(alltimeWonLabel);
    const alltimeWonPercent = document.createElement("div");
    alltimeWonPercent.textContent =
      getPercent(alltime.won / alltime.matches);
    alltimeWonDiv.appendChild(alltimeWonPercent);
    // alltime completions
    const alltimeCompletedDiv = document.createElement("div");
    alltimeCompletedDiv.classList.add("alltimestatsdiv");
    alltimeCompletedDiv.classList.add("completed");
    alltimeStatsDiv.appendChild(alltimeCompletedDiv);
    const alltimeCompletedLabel = document.createElement("div");
    alltimeCompletedLabel.textContent = language["completion"];
    alltimeCompletedDiv.appendChild(alltimeCompletedLabel);
    const alltimeCompletedPercent = document.createElement("div");
    alltimeCompletedPercent.textContent =
      getPercent(alltime.finished / alltime.matches);
    alltimeCompletedDiv.appendChild(alltimeCompletedPercent);
    // alltime défaites
    const alltimeLostDiv = document.createElement("div");
    alltimeLostDiv.classList.add("alltimestatsdiv");
    alltimeLostDiv.classList.add("lost");
    alltimeStatsDiv.appendChild(alltimeLostDiv);
    const alltimeLostLabel = document.createElement("div");
    alltimeLostLabel.textContent = language["lost"];
    alltimeLostDiv.appendChild(alltimeLostLabel);
    const alltimeLostPercent = document.createElement("div");
    alltimeLostPercent.textContent =
      getPercent(alltime.lost / alltime.matches);
    alltimeLostDiv.appendChild(alltimeLostPercent);
    // alltime fofaits
    const alltimeForfeitedDiv = document.createElement("div");
    alltimeForfeitedDiv.classList.add("alltimestatsdiv");
    alltimeForfeitedDiv.classList.add("forfeited");
    alltimeStatsDiv.appendChild(alltimeForfeitedDiv);
    const alltimeForfeitedLabel = document.createElement("div");
    alltimeForfeitedLabel.textContent = language["forfeited"];
    alltimeForfeitedDiv.appendChild(alltimeForfeitedLabel);
    const alltimeForfeitedPercent = document.createElement("div");
    alltimeForfeitedPercent.textContent =
      getPercent(alltime.forfeited / alltime.matches);
    alltimeForfeitedDiv.appendChild(alltimeForfeitedPercent);
    // alltime égalités
    const alltimeDrawDiv = document.createElement("div");
    alltimeDrawDiv.classList.add("alltimestatsdiv");
    alltimeDrawDiv.classList.add("draw");
    alltimeStatsDiv.appendChild(alltimeDrawDiv);
    const alltimeDrawLabel = document.createElement("div");
    alltimeDrawLabel.textContent = language["draw"];
    alltimeDrawDiv.appendChild(alltimeDrawLabel);
    const alltimeDrawPercent = document.createElement("div");
    alltimeDrawPercent.textContent = getPercent((alltime.matches -
      (alltime.won + alltime.lost)) / alltime.matches);
    alltimeDrawDiv.appendChild(alltimeDrawPercent);

    // affichage de la tooltip
    legendTooltip.style.display = "flex";

    // positionnement de la tooltip
    let rect = target.getBoundingClientRect();
    let posX = Math.floor(rect.x + rect.width / 2);
    let posY = Math.floor(rect.y);
    let width = legendTooltip.offsetWidth;
    let height = legendTooltip.offsetHeight;
    let pageWidth = document.documentElement.clientWidth;
    legendTooltip.style.left = "" + posX + "px";
    legendTooltip.style.top = "" + (posY - height - 58) + "px";
    // le body, par rapport auquel on positionne la tooltip, est à
    // 32px du bord de la page (30px de margin du body + 2px de border du
    // body), on autorise que la tooltip puisse être à 10px du bord de la
    // page donc on rajoute 22px de débordement
    if(width / 2 > posX + 22) {
      let pos = "" + (posX + 22) + "px";
      legendTooltip.style.setProperty("--pos", pos);
    } else if(width / 2 > pageWidth - 64 - posX + 22) {
      let pos = "" + (width - (pageWidth - 64 - posX + 22)) + "px";
      legendTooltip.style.setProperty("--pos", pos);
    } else {
      legendTooltip.style.setProperty("--pos", "50%");
    }
  }, legendTime);
}

// gestion du masquage de la tooltip sur les éléments de la légende
function hideLegendTooltip() {
  window.clearTimeout(legendTimer);
  legendTooltip.style.display = "none";
}

// données pour la gestion des clics sur les éléments de la légende en html
let ctrlMode = false;
let lastClick = 0;
let clickTimer;
const clickTime = 300;

// gestion de la mise en valeur de la courbe et de l'atténuation des autres
// courbes
function highlightDataset(datasets, index) {
  datasets.forEach((dataset, i) => {
    if(!dataset.shadow) {
      if(i !== index) {
        // atténuation des autres courbes : passage du alpha channel à
        // 0.1 pour tous les éléménts de couleurs des autres courbes
        if(!dataset.borderColor.includes("/")) {
          dataset.borderColor =
            dataset.borderColor.replace(")", colorHover);
        }
        if(!dataset.backgroundColor.includes("/")) {
          dataset.backgroundColor =
            dataset.backgroundColor.replace(")", colorHover);
        }
        if(!dataset.pointBorderColor.includes("/")) {
          dataset.pointBorderColor =
            dataset.pointBorderColor.replace(")", colorHover);
        }
        if(!dataset.pointBackgroundColor.includes("/")) {
          dataset.pointBackgroundColor =
            dataset.pointBackgroundColor.replace(")", colorHover);
        }
        if(!dataset.pointHoverBorderColor.includes("/")) {
          dataset.pointHoverBorderColor =
            dataset.pointHoverBorderColor
            .replace(")", colorHover);
        }
        if(!dataset.pointHoverBackgroundColor.includes("/")) {
          dataset.pointHoverBackgroundColor =
            dataset.pointHoverBackgroundColor
            .replace(")", colorHover);
        }
      } else {
        // mise en valeur de la courbe et de ses points : tailles
        // plus épaisse, saturation des teintes à 100% et ordre à 0
        dataset.borderWidth = 3;
        dataset.borderColor =
          dataset.borderColor.replace(" 80% ", " 100% ");
        dataset.backgroundColor =
          dataset.backgroundColor.replace(" 80% ", " 100% ");
        dataset.pointBorderWidth = 1;
        dataset.pointBorderColor =
          dataset.borderColor.replace(" 80% ", " 100% ");
        dataset.pointBackgroundColor =
          dataset.backgroundColor.replace(" 80% ", " 100% ");
        dataset.pointHoverBorderColor =
          dataset.borderColor.replace(" 80% ", " 100% ");
        dataset.pointHoverBackgroundColor =
          dataset.backgroundColor.replace(" 80% ", " 100% ");
        dataset.order = 0;
      }
    }
  });
}

// gestion de la remise des courbe en visibilité normale
function unHighlightDataset(datasets, index) {
  datasets.forEach((dataset, i) => {
    if(!dataset.shadow) {
      if(i !== index) {
        // suppression de l'atténuation des autres courbes :
        // repassage du alpha channel à 1 pour tous les éléménts
        // de couleur des autres courbes
        if(dataset.borderColor.includes("/")) {
          dataset.borderColor =
            dataset.borderColor.replace(colorHover, ")");
        }
        if(dataset.backgroundColor.includes("/")) {
          dataset.backgroundColor =
            dataset.backgroundColor.replace(colorHover, ")");
        }
        if(dataset.pointBorderColor.includes("/")) {
          dataset.pointBorderColor =
            dataset.pointBorderColor.replace(colorHover, ")");
        }
        if(dataset.pointBackgroundColor.includes("/")) {
          dataset.pointBackgroundColor =
            dataset.pointBackgroundColor.replace(colorHover, ")");
        }
        if(dataset.pointHoverBorderColor.includes("/")) {
          dataset.pointHoverBorderColor =
            dataset.pointHoverBorderColor.replace(colorHover, ")");
        }
        if(dataset.pointHoverBackgroundColor.includes("/")) {
          dataset.pointHoverBackgroundColor =
            dataset.pointHoverBackgroundColor
            .replace(colorHover, ")");
        }
      } else {
        // rétabliessement de la visibilité normale de la courbe et
        // de ses points : taille normale, saturation à 80% et
        // ordre normal
        dataset.borderWidth = 2;
        dataset.borderColor =
          dataset.borderColor.replace(" 100% ", " 80% ");
        dataset.backgroundColor =
          dataset.backgroundColor.replace(" 100% ", " 80% ");
        dataset.pointBorderWidth = 0;
        dataset.pointBorderColor =
          dataset.borderColor.replace(" 100% ", " 80% ");
        dataset.pointBackgroundColor =
          dataset.backgroundColor.replace(" 100% ", " 80% ");
        dataset.pointHoverBorderColor =
          dataset.borderColor.replace(" 100% ", " 80% ");
        dataset.pointHoverBackgroundColor =
          dataset.backgroundColor.replace(" 100% ", " 80% ");
        dataset.order = dataset.number;
      }
    }
  });
}

// plugin pour la gestion de la legende en html
const htmllegend = {
  id: "htmllegend",
  afterUpdate(chart, args, options) {
    const legendElement = document.getElementById(options.legendId);
    // récupération des données pour les éléments de la légende
    const legendItems =
      chart.options.plugins.legend.labels.generateLabels(chart);
    // construction des éléments de la légende
    legendItems.forEach((legendItem, index, legendItems) => {
      const itemIndex = legendItem.datasetIndex;
      const legendLength = legendItems.length;
      let itemElement = legendElement.querySelector("div[data-name=\"" +
        legendItem.text + "\"]");
      if(itemElement === null) {
        itemElement = document.createElement("div");
        itemElement.dataset.name = legendItem.text;
        itemElement.classList.toggle("shadow", legendItem.shadow);
        legendElement.appendChild(itemElement);
        const box = document.createElement("span");
        box.className = "box";
        itemElement.appendChild(box);
        const text = document.createElement("span");
        text.textContent = legendItem.text;
        itemElement.appendChild(text);
        // gestion du clic, du double-clic et du ctrl + clic
        // sur les éléments présents de la légende
        if(!legendItem.shadow) {
          itemElement.addEventListener("click", function(event) {
            window.clearTimeout(clickTimer);
            let currentLastClick = Date.now();
            let hidden = !chart.isDatasetVisible(itemIndex);
            if((currentLastClick - lastClick) < clickTime) { // double clic
              // désactivation de la sélection sur double clic
              if(hidden || (!hidden && !ctrlMode)) {
                // tout cacher sauf lui
                ctrlMode = true;
                for(let i = 0; i < legendLength; ++i) {
                  chart.setDatasetVisibility(i, i === itemIndex);
                }
              } else {
                // afficher tout
                ctrlMode = false;
                for(let i = 0; i < legendLength; ++i) {
                  chart.setDatasetVisibility(i, true);
                }
              }
              chart.update();
            } else { // clic simple
              clickTimer = window.setTimeout(function() {
                if(event.ctrlKey) { // ctrl + clic
                  if(hidden || (!hidden && !ctrlMode)) {
                    // tout cacher sauf lui
                    ctrlMode = true;
                    for(let i = 0; i < legendLength; ++i) {
                      chart.setDatasetVisibility(i, i === itemIndex);
                    }
                  } else {
                    // afficher tout
                    ctrlMode = false;
                    for(let i = 0; i < legendLength; ++i) {
                      chart.setDatasetVisibility(i, true);
                    }
                  }
                } else { // clic sans ctrl
                  // inverser sa visibilité
                  chart.setDatasetVisibility(itemIndex, hidden);
                }
                chart.update();
              }, clickTime);
            }
            lastClick = currentLastClick;
          }, false);
          // gestion du mouseenter sur les éléments présents de la légende :
          // mise en valeur de la courbe et atténuation des autres courbes
          itemElement.addEventListener("mouseenter", function(event) {
            let datasets = chart.data.datasets;
            highlightDataset(datasets, itemIndex);
            chart.update();
          }, false);
          // gestion du mouseleave sur les éléments présents de la légende :
          // remise des courbes en visibilité normale
          itemElement.addEventListener("mouseleave", function(event) {
            let datasets = chart.data.datasets;
            unHighlightDataset(datasets, itemIndex);
            chart.update();
          }, false);
        }
        // gestion du mouseenter sur tous les éléments de la légende :
        // affichage de la tooltip sur les éléments de la légende
        itemElement.addEventListener("mouseenter", function(event) {
          displayLegendTooltip(event.currentTarget,
            chart.data.datasets[itemIndex]);
        }, false);
        // gestion du mouseleave sur tous les éléments de la légende :
        // masquage de la tooltip sur les éléments de la légende
        itemElement.addEventListener("mouseleave", function(event) {
          hideLegendTooltip();
        }, false);
      } // fin de la construction des éléments de la légende
      // mise à jour du style et de la couleur des éléments
      // après la mise à jour du graph
      itemElement.classList.toggle("hidden", legendItem.hidden);
      itemElement.querySelector("span.box").style.background =
        legendItem.fillStyle;
    });
  },
  defaults: {
    legendId: "legend",
  },
};

// gestion de la tooltip externe en html
function htmltooltip(context) {
  // récupération de la tooltip et du chart
  const {
    chart,
    tooltip,
  } = context;
  // le tooltip
  const tooltipDiv = document.getElementById("tooltip");
  // cache la tooltip si opacity = 0 ou si pas de données
  if(tooltip.opacity === 0 || typeof tooltip.dataPoints === "undefined") {
    tooltipDiv.style.display = "none";
    return;
  }
  // récupération des données
  let dataIndex = tooltip.dataPoints[0]?.dataIndex;
  let datasetIndex = tooltip.dataPoints[0]?.datasetIndex;
  let data = chart?.data?.datasets[datasetIndex]?.data[dataIndex];
  let player = chart?.data?.datasets[datasetIndex]?.label;
  let color = chart?.data?.datasets[datasetIndex]?.backgroundColor;
  let opponent = data?.opponent;
  let ocolor = playerColors[opponent];
  // suppression des éléments actuels de la tooltip
  while(tooltipDiv.firstChild) {
    tooltipDiv.removeChild(tooltipDiv.firstChild);
  }
  // ajout des lignes
  // ligne du résultat du joueur
  const resultPlayer = document.createElement("div");
  resultPlayer.classList.add("resultplayer");
  if(data.decayed) resultPlayer.classList.add("decayed");
  tooltipDiv.appendChild(resultPlayer);
  // le joueur
  const playerDiv = document.createElement("div");
  playerDiv.classList.add("player");
  resultPlayer.appendChild(playerDiv);
  const colorDiv = document.createElement("div");
  colorDiv.classList.add("color");
  colorDiv.style.background = color;
  playerDiv.appendChild(colorDiv);
  const nameDiv = document.createElement("div");
  nameDiv.classList.add("name");
  nameDiv.textContent = player
  playerDiv.appendChild(nameDiv);
  // le résultat du joueur
  const resultDiv = document.createElement("div");
  resultDiv.classList.add("result");
  resultDiv.classList.add(data.decayed ? "decayed" :
    (data.result === "lost" && data.forfeited ?
      "forfeited" : data.result));
  resultDiv.textContent = data.decayed ? language["ELO_DECAY"] :
    (data.result === "lost" && data.forfeited ?
      language["FORFEITED"] : language[data.result.toUpperCase()]);
  resultPlayer.appendChild(resultDiv);
  // l'elo du joueur
  const eloDiv = document.createElement("div");
  eloDiv.classList.add("elo");
  resultPlayer.appendChild(eloDiv);
  const newDiv = document.createElement("div");
  newDiv.classList.add("new");
  newDiv.textContent = data.elo;
  eloDiv.appendChild(newDiv);
  const diffDiv = document.createElement("div");
  diffDiv.classList.add("diff");
  diffDiv.classList.add(data.change < 0 ? "minus" :
    (data.change > 0 ? "plus" : "zero"));
  let sign = data.change < 0 ? "\u2212" : data.change > 0 ? "+" : "";
  diffDiv.textContent = "(" + sign + Math.abs(data.change) + ")";
  eloDiv.appendChild(diffDiv);
  if(!data.decayed) {
    // ligne du résultat de l'adversaire
    const resultOpponent = document.createElement("div");
    resultOpponent.classList.add("resultopponent");
    tooltipDiv.appendChild(resultOpponent);
    // l'elo de l'adversaire
    const oeloDiv = document.createElement("div");
    oeloDiv.classList.add("elo");
    resultOpponent.appendChild(oeloDiv);
    const odiffDiv = document.createElement("div");
    odiffDiv.classList.add("diff");
    odiffDiv.classList.add(data.ochange < 0 ? "minus" :
      (data.ochange > 0 ? "plus" : "zero"));
    let osign = data.ochange < 0 ? "\u2212" : data.ochange > 0 ? "+" : "";
    odiffDiv.textContent = "(" + osign + Math.abs(data.ochange) + ")";
    oeloDiv.appendChild(odiffDiv);
    const onewDiv = document.createElement("div");
    onewDiv.classList.add("new");
    onewDiv.textContent = data.oelo;
    oeloDiv.appendChild(onewDiv);
    // le résultat de l'adversaire
    const oresultDiv = document.createElement("div");
    oresultDiv.classList.add("result");
    oresultDiv.classList.add(data.result === "won" && data.forfeited ?
      "forfeited" : (data.result === "won" ? "lost" :
        (data.result === "lost" ? "won" : "draw")));
    oresultDiv.textContent = data.result === "won" && data.forfeited ?
      language["FORFEITED"] : (data.result === "won" ? language["LOST"] :
        (data.result === "lost" ? language["WON"] : language["DRAW"]));
    resultOpponent.appendChild(oresultDiv);
    // l'adversaire
    const opponentDiv = document.createElement("div");
    opponentDiv.classList.add("player");
    resultOpponent.appendChild(opponentDiv);
    const onameDiv = document.createElement("div");
    onameDiv.classList.add("name");
    onameDiv.textContent = opponent;
    opponentDiv.appendChild(onameDiv);
    const ocolorDiv = document.createElement("div");
    ocolorDiv.classList.add("color");
    ocolorDiv.style.background = ocolor ? ocolor : "url(img/color.png)";
    opponentDiv.appendChild(ocolorDiv);
    // ligne temps seed bastion
    const seedLine = document.createElement("div");
    seedLine.classList.add("seedline");
    tooltipDiv.appendChild(seedLine);
    const timeDiv = document.createElement("div");
    timeDiv.classList.add("time");
    timeDiv.textContent = getTime(data.time);
    seedLine.appendChild(timeDiv);
    const seedDiv = document.createElement("div");
    seedDiv.classList.add("seed");
    seedDiv.classList.add(data.type.toLowerCase());
    seedDiv.textContent = language[data.type.toLowerCase()];
    seedLine.appendChild(seedDiv);
    if(data.bastion) {
      const bastionDiv = document.createElement("div");
      bastionDiv.classList.add("bastion");
      bastionDiv.textContent = language[data.bastion.toLowerCase()];
      seedLine.appendChild(bastionDiv);
    }
  }
  // ligne de la date
  const dateLine = document.createElement("div");
  dateLine.classList.add("dateline");
  tooltipDiv.appendChild(dateLine);
  const dateDiv = document.createElement("div");
  dateDiv.classList.add("date");
  dateDiv.textContent = dateShort(new Date(data.date));
  dateLine.appendChild(dateDiv);
  const agoDiv = document.createElement("div");
  agoDiv.classList.add("ago");
  agoDiv.textContent = agoCompute(currentDate - data.date);
  dateLine.appendChild(agoDiv);
  // affichage et positionnement de la tooltip
  const {
    caretX: posX,
    caretY: posY,
  } = tooltip;
  tooltipDiv.style.display = "block";
  tooltipDiv.style.left = "" + posX + "px";
  tooltipDiv.style.top = "" + posY + "px";
  let width = tooltipDiv.offsetWidth;
  let pageWidth = document.documentElement.clientWidth;
  // la div du canvas, par rapport à laquelle on positionne la tooltip, est
  // à 62px du bord de la page (30px de margin du body + 2px de border du
  // body + 30px de padding du body), on autorise que la tooltip puisse être
  // à 10px du bord de la page donc on rajoute 52px de débordement
  if(width / 2 > posX + 52) {
    let pos = "" + (posX + 52) + "px";
    tooltipDiv.style.setProperty("--pos", pos);
  } else if(width / 2 > pageWidth - 124 - posX + 52) {
    let pos = "" + (width - (pageWidth - 124 - posX + 52)) + "px";
    tooltipDiv.style.setProperty("--pos", pos);
  } else {
    tooltipDiv.style.setProperty("--pos", "50%");
  }
}

// données pour le calcul des marges autour des courbes
// et de l'unité de temps
let noData = false;
let onePoint = false;
let dateMargin = 0;
let eloMargin = 0;
let timeUnit = "hour";
let oneDate, oneElo, defaultDate;
let minDate = Number.MAX_SAFE_INTEGER;
let maxDate = 0;
let minElo = Number.MAX_SAFE_INTEGER;
let maxElo = 0;

// gestion du calcul des marges autour des courbes et de l'unité
// de temps en fonction des données et des dimensions du graph
function computeMargins(chart = false) {
  if(noData) { // pas de données
    minDate = defaultDate;
    maxDate = defaultDate - (24 * 60 * 60 * 1000);
    dateMargin = 0;
    timeUnit = "hour";
    minElo = 1500;
    maxElo = 2500;
    eloMargin = 0;
    document.getElementById("loading").style.display = "none";
    document.getElementById("no-data").style.display = "block";
  } else if(onePoint) { // un seul point
    minDate = oneDate - (12 * 60 * 60 * 1000);
    maxDate = oneDate + (12 * 60 * 60 * 1000);
    dateMargin = 0;
    timeUnit = "hour";
    minElo = oneElo - 100;
    maxElo = oneElo + 100;
    eloMargin = 0;
  } else { // plusieurs points
    let marginDate = .01; // 1%
    // valeur par défaut pour l'initialisation du graph
    // (graph environ trois fois plus large que haut en 16/9)
    let marginElo = .03; // 3%
    if(chart && chart.chartArea) {
      // valeur calculée en fonction des dimensions du graph
      marginElo = marginDate *
        chart.chartArea.width / chart.chartArea.height;
    }
    dateMargin = Math.ceil((maxDate - minDate) * marginDate);
    eloMargin = Math.ceil((maxElo - minElo) * marginElo);
    if(minElo === maxElo) {
      minElo = minElo - 100;
      maxElo = maxElo + 100;
      eloMargin = 0;
    }
    timeUnit =
      ((maxDate - minDate + (2 * dateMargin)) <= (25 * 60 * 60 * 1000)) ?
      "hour" : "day";
  }
}

// données pour le plugin pour la mise à jour des marges autour des courbes
// et de l'unité de temps en fonction des données et des dimensions du graph
let hasResized = false;
let skipRender = true;

// plugin pour la mise à jour des marges autour des courbes et de l'unité
// de temps en fonction des données et des dimensions du graph
const updatemargins = {
  id: "updatemargins",
  beforeLayout(chart, args, options) {
    if(skipRender) {
      return false;
    }
  },
  afterLayout(chart, args, options) {
    if(hasResized) {
      hasResized = false;
      computeMargins(chart);
      chart.options.scales.x.min = minDate - dateMargin;
      chart.options.scales.x.max = maxDate + dateMargin;
      chart.options.scales.x.time.unit = timeUnit;
      chart.options.scales.y.min = minElo - eloMargin;
      chart.options.scales.y.max = maxElo + eloMargin;
      chart.update();
    }
  },
};

// nom du cookie de langue
let langCookie = "ranked_lang";

// valeur du cookie de langue
let langCookieValues = ["en", "fr"];

// gestion de la lecture d'un cookie
function readCookie(cookie) {
  return document.cookie.split("; ")
    .find((r) => r.startsWith(cookie + "="))?.split("=")[1];
}

// gestion de l'écriture d'un cookie
function writeCookie(cookiel, value) {
  let date = new Date;
  date.setFullYear(date.getFullYear() + 1); // durée de vie du cookie : 1 an
  document.cookie = cookiel + "=" + encodeURIComponent(value) +
    "; expires=" + date.toUTCString() + "; samesite=lax";
}

// gestion de la récupération de la langue
function getLang() {
  let cookieValue = readCookie(langCookie);
  if(cookieValue && langCookieValues.includes(cookieValue)) {
    return cookieValue;
  } else {
    const indexEn = navigator.languages.findIndex(lang =>
      lang.toLowerCase().split("-")[0] === "en");
    const indexFr = navigator.languages.findIndex(lang =>
      lang.toLowerCase().split("-")[0] === "fr");
    return ((indexEn !== -1 && indexEn < indexFr) || indexFr === -1) ?
      "en" : "fr";
  }
}

// gestion du chargement du fichier de langue
async function loadLang(lang) {
  let urlLang = "lang/" + lang + ".js?" + Date.now();
  const responseLang = await fetch(urlLang, {
    cache: "no-store",
  });
  return await responseLang.json();
}

// gestion du chargement et de la mise à jour de la langue de l'interface
async function setLang(lang) {
  currentLang = lang;
  currentLangLocal = lang + (lang === "en" ? "-US" : "-FR");
  language = await loadLang(lang);
  document.getElementById("en").classList
    .toggle("selected", currentLang === "en");
  document.getElementById("fr").classList
    .toggle("selected", currentLang === "fr");
  document.querySelectorAll("[data-lang]").forEach((element) => {
    element.firstChild.textContent =
      language[element.getAttribute("data-lang")];
  });
}

// données pour la gestion du onHover sur le graph
let lastHoverIndex;

// gestion du onHover sur le graph
function onHover(event, elements, chart) {
  let datasets = chart.data.datasets;
  let update = false;
  if(lastHoverIndex !== null) {
    update = true;
    // remise des courbe en visibilité normale
    unHighlightDataset(datasets, lastHoverIndex);
    lastHoverIndex = null;
  }
  if(elements.length && typeof elements[0].datasetIndex === "number") {
    let index = elements[0].datasetIndex;
    if(index !== lastHoverIndex) {
      update = true;
      lastHoverIndex = index;
      // mise en valeur de la courbe et atténuation des autres courbes
      highlightDataset(datasets, lastHoverIndex);
    }
  }
  if(update) {
    chart.update();
  }
}

// plugin pour la gestion du onHover out qui permet de gérer la sortie du
// graph qui n'est pas gérée par onHover qui ne répond plus en dehors du
// graph
const onhoverout = {
  id: "onhoverout",
  beforeEvent(chart, args, pluginOptions) {
    if(lastHoverIndex !== null) {
      // remise des courbe en visibilité normale
      unHighlightDataset(chart.data.datasets, lastHoverIndex);
      lastHoverIndex = null;
      chart.update();
    }
  }
}

// gestion du chargement des données et de la
// construction du graph au chargement de la page
async function loadData() {

  // chargement et actualisation de la langue
  let lang = getLang();
  if(currentLang !== lang) {
    setLang(lang);
  } else {
    language = await loadLang(lang);
  }

  // récupération de la saison actuelle
  let urlCurrent = url + "current.js?" + Date.now();
  const responseCurrent = await fetch(urlCurrent, {
    cache: "no-store",
  });
  const current = await responseCurrent.json();

  // récupération et construction de tous les
  // paramètres actuels (players, days, seasons)
  let maxSeason = parseInt(current.season, 10);
  let nbPlayers, nbDays, currentSeason, seasonParam;
  [nbPlayers, nbDays, currentSeason] = getParams(maxSeason);
  seasonParam = currentSeason === maxSeason ? "" : "" + currentSeason;

  // construction de l'url des liens "players"
  // en fonction des paramètres actuels
  let linksPlayers = document.querySelectorAll("div#players > a");
  for(let link of linksPlayers) {
    let nb = link.getAttribute("id").substring(1);
    link.setAttribute("href", getLink(nb, nbDays, seasonParam));
    link.classList.toggle("selected", nb === nbPlayers);
  }

  // construction de l'url des liens "days"
  // en fonction des paramètres actuels
  let linksDays = document.querySelectorAll("div#days > a");
  for(let link of linksDays) {
    let nb = link.getAttribute("id").substring(1);
    link.setAttribute("href", getLink(nbPlayers, nb, seasonParam));
    link.classList.toggle("selected", nb === nbDays);
  }

  // construction de l'url des liens "seasons"
  // en fonction des paramètres actuels
  let seasons = document.querySelector("div#seasons");
  for(let s = 1; s <= maxSeason; ++s) {
    let seasonLink = document.createElement("a");
    seasonLink.textContent = "" + s;
    seasonLink.setAttribute("href", getLink(nbPlayers, nbDays,
      (s < maxSeason) ? "" + s : ""));
    seasonLink.classList.toggle("selected", s === currentSeason);
    seasons.insertBefore(seasonLink, seasons.lastElementChild);
  }

  // récupération des données de la saison
  let urlSeason = url + "season" + seasonParam + ".js?" + Date.now();
  const responseSeason = await fetch(urlSeason, {
    cache: "no-store",
  });
  const season = await responseSeason.json();

  // récupération des données alltime
  let urlAlltime = url + "alltime.js?" + Date.now();
  const responseAlltime = await fetch(urlAlltime, {
    cache: "no-store",
  });
  const alltime = await responseAlltime.json();

  // construction de la date et du temps écoulé depuis
  // la compilation des données
  let date, ago, past;
  date = new Date(season.date);
  ago = currentDate - date;
  past = season.date - (nbDays * 24 * 60 * 60 * 1000);

  // récupération des éléments de la page
  //(titre, sous-titre, légende, graph et canvas)
  let title = document.getElementById("title");
  let subtitle = document.getElementById("subtitle");
  let legend = document.getElementById("legend");
  let graph = document.getElementById("graph");
  let canvas = document.getElementById("ranked");

  // gestion de la mise à jour du titre et du sous-titre
  function setTitle(title, subtitle, nbPlayers, nbDays, currentSeason) {
    let strTop = (nbPlayers === "1") ?
      language["title_top_"] : language["title_tops_"];
    let strPlayers = (nbPlayers === "1") ?
      language["title_player_"] : language["title_players_"];
    let strLast = (nbDays === "1") ?
      language["title_last_"] : language["title_lasts_"];
    let strDays = (nbDays === "1") ?
      language["title_day_"] : language["title_days_"];
    title.textContent = strTop + (nbPlayers === "1" ? "" : nbPlayers) +
      strPlayers + strLast + (nbDays === "1" ? "" : nbDays) + strDays +
      language["of_season_"] + currentSeason;
    subtitle.textContent = language["data_updated_on_"] +
      dateFull(date) + agoCompute(ago);
  }

  // construction du titre et du sous-titre
  setTitle(title, subtitle, nbPlayers, nbDays, currentSeason);

  // données pour la construction des données pour les courbes
  let players = season.players;
  let data = [];
  let m;
  let cpt = 0;
  let cptRows = rowStart;
  let cptColors = colorStart;
  let nbP = parseInt(nbPlayers, 10);
  let allColors = [];

  // construction des données pour les courbes
  for(let p in players) {

    // récupération des matchs du joueur et détermination
    // des min et des max globaux et de la présence de données
    // ou pas pour ce joueur
    let mm = players[p].matches.reverse().filter((m) => m.date >= past);
    let shadow = false;
    if(mm.length > 0) {
      m = Math.min(...mm.map(e => e.date));
      if(m < minDate) minDate = m;
      m = Math.max(...mm.map(e => e.date));
      if(m > maxDate) maxDate = m;
      m = Math.min(...mm.map(e => e.elo));
      if(m < minElo) minElo = m;
      m = Math.max(...mm.map(e => e.elo));
      if(m > maxElo) maxElo = m;
    } else {
      shadow = true; // pas de données sur la periode pour ce joueur
    }

    // determination de la couleur pour cette courbe
    let color = colors[cptRows % nbRows][cptColors % nbColors];
    color = shadow ? color.replace(")", colorHover) : color;

    // cache de l'image de la tête du joueur
    let image = new Image();
    image.src = headUrl(players[p].uuid);
    images[players[p].uuid] = image;

    // données pour cette courbe
    data.push({
      label: players[p].nickname,
      uuid: players[p].uuid,
      country: players[p].country,
      stats: players[p].stats,
      alltime: alltime[players[p].uuid],
      // tous les points pour avoir la continuité, mais
      // finalement non, ça encombre le graph pour rien
      //data: players[p].matches.reverse(),
      data: mm,
      borderWidth: 2,
      borderColor: color,
      backgroundColor: color,
      pointBorderWidth: 0,
      pointBorderColor: color,
      pointBackgroundColor: color,
      pointHoverBorderColor: color,
      pointHoverBackgroundColor: color,
      shadow: shadow,
      number: cpt + 1,
      order: cpt + 1,
    });

    // vérification que la couleur n'a pas déjà été utilisée
    let currentColor = "" + cptRows % nbRows + " " + cptColors % nbColors;
    //console.log("currentColor", currentColor);
    if(allColors.includes(currentColor)) {
      throw new Error("MOTHER FUCKER");
    }
    allColors.push(currentColor);
    //console.log("allColors", allColors.length);

    // enregistrement de la couleur du joueur
    playerColors[players[p].nickname] = color;

    // deplacement des curseurs pour la couleur suivante
    cptRows += rowSkip;
    cptColors += colorSkip;
    if((cptColors % nbColors) === 0) {
      cptRows += rowSkip;
      //console.log("cptRows", cptRows);
    }

    // limitation au nombre de players demandés en paramètre
    ++cpt;
    if(cpt === nbP) {
      break;
    }

  }

  // calcul des marges initiales
  noData = (maxDate === 0);
  onePoint = (minDate === maxDate);
  oneDate = minDate;
  oneElo = minElo;
  defaultDate = season.date;
  computeMargins();

  // récupération des éléments de la page pour la gestion du zoom
  let rect = document.getElementById("rect");
  let pan = document.getElementById("pan");
  let reset = document.getElementById("reset");
  let zoom = document.getElementById("zoom");
  let zoomtime = document.getElementById("zoomtime");
  let zoomelo = document.getElementById("zoomelo");
  let loading = document.getElementById("loading");

  // dimmensions pour le zoom maximum
  let maxZoomX = 30 * 60 * 1000; // ms
  let maxZoomY = 20; // elo

  // gestion de la touche "Control" pour passer
  // facilement au mode zoom rectangle
  let ctrlKey = false;

  // valeurs par défaut du graph (font et couleur)
  Chart.defaults.color = "#303030";
  Chart.defaults.font.family = "verdana, arial, helvetica, sans-serif";

  // construction du graph
  let chart = new Chart(canvas, {
    type: "line",

    // données pour les courbes
    data: {
      datasets: data,
    },

    // options du graph
    options: {
      aspectRatio: 2,
      maintainAspectRatio: false,
      animation: false,
      onResize: function() {
        hasResized = true;
      },
      onHover: onHover,
      parsing: {
        xAxisKey: "date",
        yAxisKey: "elo",
      },
      layout: {
        autoPadding: false,
        padding: {
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
        },
      },
      elements: {
        line: {
          borderCapStyle: "round",
          borderJoinStyle: "round",
        },
        point: {
          radius: 3,
          hoverRadius: 5,
          hitRadius: 25,
          hoverBorderWidth: 0,
        },
      },
      scales: {
        x: {
          alignToPixels: true,
          title: {
            display: true,
            text: language["time"],
            padding: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            },
            font: {
              size: 14,
              weight: "bold",
            },
          },
          type: "time",
          time: {
            unit: timeUnit,
            displayFormats: language["displayFormats"],
          },
          min: minDate - dateMargin,
          max: maxDate + dateMargin,
          grid: {
            tickColor: "#303030",
            tickLength: 6,
          },
          ticks: {
            includeBounds: false,
            padding: 5,
            minRotation: 45,
          },
          adapters: {
            date: {
              locale: currentLangLocal,
            },
          },
        },
        y: {
          alignToPixels: true,
          title: {
            display: true,
            text: "elo",
            padding: {
              top: 0,
              right: 0,
              bottom: 4,
              left: 0,
            },
            font: {
              size: 14,
              weight: "bold",
            },
          },
          type: "linear",
          min: minElo - eloMargin,
          max: maxElo + eloMargin,
          grid: {
            tickColor: "#303030",
            tickLength: 6,
          },
          ticks: {
            includeBounds: false,
            padding: 5,
            callback: function(value) {
              return new Intl.NumberFormat(currentLangLocal).format(value);
            },
          },
        },
      },
      plugins: {
        chartborderandcolor: {
          fillColor: "#e0e0e0",
          strokeColor: "#303030",
          strokeWidth: 1,
        },
        htmllegend: {
          legendId: "legend",
        },
        title: {
          display: false,
        },
        subtitle: {
          display: false,
        },
        legend: {
          display: false,
          labels: {
            generateLabels: function(chart) {
              return chart.data.datasets.map((dataset, i) => ({
                text: dataset.label,
                strokeStyle: dataset.borderColor,
                fillStyle: dataset.backgroundColor,
                fontColor: dataset.shadow ? "#c0c0c0" : "#303030",
                datasetIndex: i,
                borderRadius: 1,
                lineCap: "round",
                lineJoin: "round",
                lineWidth: 0,
                hidden: !chart.isDatasetVisible(i),
                shadow: dataset.shadow,
              }));
            },
          },
        },
        tooltip: {
          enabled: false,
          mode: "nearest",
          intersect: true,
          position: "nearest",
          external: htmltooltip,
        },
        zoom: {
          limits: {
            x: {
              min: "original",
              max: "original",
              minRange: maxZoomX,
            },
            y: {
              min: "original",
              max: "original",
              minRange: maxZoomY,
            },
          },
          pan: {
            enabled: true,
            mode: "xy",
            scaleMode: "xy",
            threshold: 1,
            onPan(o) {
              if(!noData && !onePoint) {
                canvas.style.cursor = "grabbing";
                // masquage de la tooltip
                o.chart.tooltip.setActiveElements([], {
                  x: 0,
                  y: 0,
                });
              }
            },
            onPanComplete(o) {
              if(!noData && !onePoint) {
                canvas.style.cursor = "crosshair";
              }
            },
          },
          zoom: {
            mode: "xy",
            scaleMode: "xy",
            wheel: {
              enabled: true,
              speed: .25,
            },
            drag: {
              enabled: false,
              backgroundColor: "rgb(0, 127, 255, .2)",
              borderColor: "rgb(0, 127, 255, .8)",
              borderWidth: 1,
              threshold: 10,
            },
            pinch: {
              enabled: true,
            },
            onZoomStart(o) {
              // désactivation du zoom si pas de données ou si un seul point
              if(noData || onePoint) {
                return false;
              }
              // masquage de la tooltip
              o.chart.tooltip.setActiveElements([], {
                x: 0,
                y: 0,
              });
              // désactivation du zoom si on atteint le zoom maximum
              // pour éviter le pan collatéral
              if(o.event.deltaY < 0) {
                let x = o.chart.scales.x;
                let y = o.chart.scales.y;
                if(Math.floor(x.max - x.min) <= maxZoomX &&
                  Math.floor(y.max - y.min) <= maxZoomY) {
                  return false;
                }
              }
            },
            onZoom: function(o) {
              // mise à jour des informations de zoom
              let initial = o.chart.getInitialScaleBounds();
              let scales = o.chart.scales;
              let zoomx = Math.round((initial.x.max - initial.x.min) /
                (scales.x.max - scales.x.min) * 100) / 100;
              let zoomy = Math.round((initial.y.max - initial.y.min) /
                (scales.y.max - scales.y.min) * 100) / 100;
              zoomtime.textContent = zoomx;
              zoomelo.textContent = zoomy;
              zoom.classList.toggle("selected",
                (zoomx !== 1 || zoomy !== 1));
              zoom.classList.toggle("max",
                (scales.x.max - scales.x.min) <= maxZoomX &&
                (scales.y.max - scales.y.min) <= maxZoomY);
              // mise à jour de l'unité de temps
              if((scales.x.max - scales.x.min) <= (61 * 60 * 1000)) {
                chart.options.scales.x.time.unit = "minute";
              } else if((scales.x.max - scales.x.min) <=
                (25 * 60 * 60 * 1000)) {
                chart.options.scales.x.time.unit = "hour";
              } else {
                chart.options.scales.x.time.unit = "day";
              }
              // retour au mode pan automatique après un zoom
              // si on n'utilise pas la touche "Control"
              if(!ctrlKey) {
                switchRectPan(true);
              }
            },
          },
        },
      },
    },

    // plugins
    plugins: [chartborderandcolor, htmllegend, updatemargins, onhoverout],
  });

  // gestion du passage du mode zoom rectangle au mode pan
  function switchRectPan(p) {
    rect.classList.toggle("selected", !noData && !onePoint && !p);
    pan.classList.toggle("selected", !noData && !onePoint && p);
    chart.options.plugins.zoom.zoom.drag.enabled = !p;
    chart.options.plugins.zoom.pan.enabled = p;
    chart.update();
  }

  // gestion de la réinitialisation du zoom, des informations
  // de zoom et de l'unité de temps
  function resetZoom() {
    chart.options.scales.x.time.unit =
      ((maxDate - minDate + (2 * dateMargin)) <= (25 * 60 * 60 * 1000)) ?
      "hour" : "day";
    zoomtime.textContent = "1";
    zoomelo.textContent = "1";
    zoom.classList.toggle("selected", false);
    zoom.classList.toggle("max", false);
    // retour au mode pan
    switchRectPan(true);
    chart.resetZoom("none");
  }

  // désactivation des boutons de zoom si pas de données ou si un seul point
  if(noData || onePoint) {
    [rect, pan, reset].forEach((elmnt) => {
      elmnt.classList.toggle("zoom", false);
    });
  } else {
    // action du bouton "rect" (zoom rectangle)
    rect.addEventListener("click", () => {
      switchRectPan(false);
    }, false);
    // action du bouton "pan" (déplacement)
    pan.addEventListener("click", () => {
      switchRectPan(true);
    }, false);
    // action du bouton "reset"
    reset.addEventListener("click", resetZoom, false);
    // gestion de la touche "Control" pour passer
    // facilement au mode zoom rectangle
    document.addEventListener("keydown", function(event) {
      if(event.key === "Control") {
        ctrlKey = true;
        switchRectPan(false);
      }
    }, false);
    document.addEventListener("keyup", function(event) {
      if(event.key === "Control") {
        ctrlKey = false;
        switchRectPan(true);
      }
    }, false);
  }

  // gestion du changement de la langue
  async function changeLang(event) {
    let lang = event.target.getAttribute("id");
    if(currentLang !== lang) {
      writeCookie(langCookie, lang);
      await setLang(lang);
      setTitle(title, subtitle, nbPlayers, nbDays, currentSeason);
      chart.options.scales.x.title.text = language["time"];
      chart.options.scales.x.time.displayFormats =
        language["displayFormats"];
      chart.options.scales.x.adapters.date.locale = currentLangLocal;
      chart.options.scales.y.ticks.format = currentLangLocal;
      chart.update();
    }
  }

  // gestion des boutons de langue
  document.getElementById("en").addEventListener("click",
    changeLang, false);
  document.getElementById("fr").addEventListener("click",
    changeLang, false);

  // fenêtre d'aide
  const helpwindow = document.querySelector("dialog#helpwindow");

  // gestion du bouton d'ouverture de la fenêtre d'aide
  document.getElementById("help").addEventListener("click", () => {
    helpwindow.showModal();
    helpwindow.querySelector("div.content").scroll({
      top: 0,
      left: 0
    });
  }, false);

  // gestion des boutons de fermeture de la fenêtre de l'aide
  let closes = document.querySelectorAll("dialog#helpwindow > span.close");
  for(let close of closes) {
    close.addEventListener("click", () => {
      helpwindow.close();
    }, false);
  }

  // masquage du message "loading data..."
  loading.style.display = "none";

  // gestion du mouseout sur le graph en complement du plugin onhoverout qui
  // ne fonctionne pas lorsque l'on quite le canvas en même temps que l'on
  // quite le graph et avec une tempo parcequ'il peut être déclanché avant
  // qu'un onHover ne soit traité...
  let mouseoutTimer = null;
  graph.addEventListener("mouseout", function() {
    window.clearTimeout(mouseoutTimer);
    mouseoutTimer = window.setTimeout(function() {
      if(lastHoverIndex !== null) {
        // remise des courbe en visibilité normale
        unHighlightDataset(chart.data.datasets, lastHoverIndex);
        lastHoverIndex = null;
        chart.update();
      }
    }, 100);
  }, false);

  // gestion du redimensionnement du graph en fonction de la place
  // disponible, le plugin "updatemargins" met à jour automatiquement
  // les marges et l'unité de temps après le passage de hasResized à
  // true dans chart.onResize
  function resize() {
    skipRender = true;
    resetZoom();
    skipRender = false;
    let topHeight = title.offsetHeight + 5 + subtitle.offsetHeight + 10 +
      legend.offsetHeight - 5;
    graph.style.height = "calc(100vh - 124px - " + topHeight + "px)";
  }
  window.addEventListener("resize", resize, false);
  resize();

}
window.addEventListener("DOMContentLoaded", loadData, false);