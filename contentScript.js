"use strict";

function main() {
  browser.storage.sync
    .get({
      apikey: ""
    })
    .then(setupQueries);
}

function setupQueries(storageData) {
  const apikey = storageData.apikey;
  if (apikey !== "") {
    const all = document.getElementsByClassName("full-width-tile--now-showing");
    for (var i = 0, max = all.length; i < max; i++) {
      const item = all[i];
      const title = item.getElementsByClassName("full-width-tile__title")[0]
        .innerHTML;
      const countryYear = item
        .getElementsByClassName(
          "now-showing-tile-director-year__year-country"
        )[0]
        .innerHTML.split(",");
      const year = countryYear[1].trim();
      getRating(title, year, item, apikey, false);
    }
    // process the hero item
    const hero = document.getElementsByClassName("showing-page-hero-tile")[0];
    const heroTitle = hero.getElementsByClassName(
      "showing-page-hero-tile__title"
    )[0].innerHTML;
    const heroCountryYear = hero
      .getElementsByClassName("now-showing-tile-director-year__year-country")[0]
      .innerHTML.split(",");
    const heroYear = heroCountryYear[1].trim();
    getRating(heroTitle, heroYear, hero, apikey, true);
  } else {
    showWarning();
  }
}

function getRating(title, year, item, apikey, hero) {
  const moviekey = `${title} / ${year}`;
  var query = {};
  query[moviekey] = "";
  browser.storage.local
    .get(query)
    .then(localData =>
      processMovieData(localData, moviekey, title, year, apikey, item, hero)
    );
}

function processMovieData(
  localData,
  moviekey,
  title,
  year,
  apikey,
  item,
  hero
) {
  if (localData[moviekey] === "") {
    console.log(`No rating found for ${moviekey} in local storage.`);
    const encodedTitle = encodeURIComponent(title);
    var xhr = new XMLHttpRequest();
    xhr.open(
      "GET",
      `https://www.omdbapi.com/?t=${encodedTitle}&y=${year}&apikey=${apikey}`,
      true
    );

    xhr.onload = function(e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          var result = JSON.parse(xhr.responseText);
          if (
            result.Response !== "False" &&
            result.Ratings &&
            result.Ratings.length > 0
          ) {
            var ratingStored = {};
            ratingStored[moviekey] = result.Ratings;
            browser.storage.local
              .set(ratingStored)
              .then(setItem(moviekey), onError);
            showRating(result.Ratings, item, hero);
          }
        } else if (xhr.status === 401) {
          console.error("OMDb API key seems to be invalid...");
        } else {
          console.error(xhr.statusText);
        }
      }
    };
    xhr.onerror = function(e) {
      console.error(xhr.statusText);
    };
    xhr.send(null);
  } else {
    console.log(`Rating found for ${moviekey} in local storage!`);
    showRating(localData[moviekey], item, hero);
  }
}

function showRating(ratings, item, hero) {
  if (ratings !== null) {
    var div = document.createElement("div");
    div.setAttribute("class", "ratings");
    div.innerHTML = '<span class="ratings-header">Ratings:</span>';
    for (var j = 0, numratings = ratings.length; j < numratings; j++) {
      var rating = document.createElement("div");
      rating.innerHTML = `<span class="rating-source">${
        ratings[j].Source
      }</span>: <span class="rating-value">${ratings[j].Value}</span>`;
      div.appendChild(rating);
    }
    if (hero) {
      item
        .getElementsByClassName("showing-page-hero-tile__our-take")[0]
        .appendChild(div);
    } else {
      item
        .getElementsByClassName("full-width-tile__our-take")[0]
        .appendChild(div);
    }
  }
}

function setItem(movie) {
  console.log(`Rating saved OK: ${movie}`);
}
function onError(error) {
  console.log(error);
}

function showWarning() {
  const hero = document.getElementsByClassName("showing-page-hero-tile")[0];
  var div = document.createElement("div");
  div.setAttribute("class", "warning");
  div.innerHTML =
    '<span class="warning">To show movie ratings, please add an OMDb key in the MubiScore options page!';
  hero
    .getElementsByClassName("showing-page-hero-tile__our-take")[0]
    .appendChild(div);
}

main();
