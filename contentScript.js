"use strict";

function main() {
  var next_button = document.querySelector("div.film-of-the-days-swiper-button-next");
  if (next_button) {
    next_button.onclick = process;
  }
  var prev_button = document.querySelector("div.film-of-the-days-swiper-button-prev");
  if (prev_button) {
    prev_button.onclick = process;
  }
  process();
}

function process() {
  browser.storage.sync
    .get({
      apikey: "",
    })
    .then(setupQueries);
}

function parseTile(tile) {
  const titleHeader = tile.querySelector("div > h3");
  const title = titleHeader ? titleHeader.innerText : undefined;
  const year = tile.querySelector(
    "div > div > span:nth-child(3)"
  ).innerText.trim();
  return { title: title, year: year };
}

function setupQueries(storageData) {
  const apikey = storageData.apikey;
  if (apikey !== "") {
    const all_tiles = document.getElementsByClassName("film-tile-inner");
    for (var i = 0, max = all_tiles.length; i < max; i++) {
      const item = all_tiles[i];
      const film = parseTile(item);
      if (film.title && film.year) {
        getRating(film.title, film.year, item, apikey, false);
      }
    }
  } else {
    // Can't reliably find a way yet where to present this warning
    // showWarning();
  }
}

function getRating(title, year, item, apikey) {
  const moviekey = `${title} / ${year}`;
  var query = {};
  query[moviekey] = "";
  browser.storage.local
    .get(query)
    .then((localData) =>
      processMovieData(localData, moviekey, title, year, apikey, item)
    );
}

function processMovieData(localData, moviekey, title, year, apikey, item) {
  if (localData[moviekey] === "") {
    console.debug(`No rating found for ${moviekey} in local storage.`);
    const encodedTitle = encodeURIComponent(title);
    var xhr = new XMLHttpRequest();
    xhr.open(
      "GET",
      `https://www.omdbapi.com/?t=${encodedTitle}&y=${year}&apikey=${apikey}`,
      true
    );

    xhr.onload = function (e) {
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
            showRating(result.Ratings, item);
          } else{
            // No rating returned, store that fact
            var ratingStored = {};
            ratingStored[moviekey] = null;
            browser.storage.local
              .set(ratingStored)
              .then(setEmpty(moviekey), onError);
            // Since no rating, no need to display anything
          }
        } else if (xhr.status === 401) {
          console.error("OMDb API key seems to be invalid...");
        } else {
          console.error(xhr.statusText);
        }
      }
    };
    xhr.onerror = function (e) {
      console.error(xhr.statusText);
    };
    xhr.send(null);
  } else {
    console.debug(`Rating found for ${moviekey} in local storage!`);
    showRating(localData[moviekey], item);
  }
}

const ratingHeaders = {
  en: "Ratings",
  fr: "Évaluations",
  de: "Bewertungen",
};
function getRatingHeader() {
  const language = document.documentElement.lang;
  const mainLanguage = language.split("-")[0];
  if (ratingHeaders[mainLanguage]) {
    var header = document.createElement("span");
    header.setAttribute("class", "ratings-header");
    header.innerText = `${ratingHeaders[mainLanguage]}:`;
    return header;
  }
}

function showRating(ratings, item) {
  if (ratings !== null) {
    if (item.querySelector("div.ratings")) {
      // Already seem to have rating
      return
    }
    var div = document.createElement("div");
    div.setAttribute("class", "ratings");
    const header = getRatingHeader();
    if (header) {
      div.appendChild(header);
    }
    for (var j = 0, numratings = ratings.length; j < numratings; j++) {
      var rating = document.createElement("div");

      var source = document.createElement("span");
      source.setAttribute("class", "rating-source");
      source.innerText = `${ratings[j].Source}: `;
      rating.appendChild(source);

      var value = document.createElement("span");
      value.setAttribute("class", "rating-value");
      value.innerText = `${ratings[j].Value}`;
      rating.appendChild(value);
      div.appendChild(rating);
    }
    item.querySelector("div:nth-child(2)").appendChild(div);
  }
}

function setItem(movie) {
  console.log(`Rating saved OK: ${movie}`);
}
function setEmpty(movie) {
  console.log(`Empty rating saved: ${movie}`);
}
function onError(error) {
  console.error(error);
}

// function showWarning() {
//   const hero = document.getElementsByTagName("article")[0];
//   var div = document.createElement("div");
//   div.setAttribute("class", "warning");
//   var warning = document.createElement("span");
//   warning.setAttribute("class", "warning");
//   warning.innerText =
//     "⚠️To show movie ratings, please add an OMDb key in the MubiScore options page!⚠️";
//   div.appendChild(warning);
//   hero.querySelector("p").appendChild(div);
// }

main();
