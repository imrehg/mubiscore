"use strict";

function main() {
  browser.storage.sync
    .get({
      apikey: "",
    })
    .then(setupQueries);
}

function parseArticle(article) {
  const titleHeader = article.querySelector("div > div > h2");
  const title = titleHeader ? titleHeader.innerText : undefined;
  const countryYear = article.querySelector(
    "div > div > h3 > span:nth-child(2)"
  );
  const year = countryYear
    ? countryYear.innerText.split(",")[1].trim()
    : undefined;
  return { title: title, year: year };
}

function setupQueries(storageData) {
  const apikey = storageData.apikey;
  if (apikey !== "") {
    const all_articles = document.getElementsByTagName("article");
    for (var i = 0, max = all_articles.length; i < max; i++) {
      const item = all_articles[i];
      const film = parseArticle(item);
      if (film.title && film.year) {
        getRating(film.title, film.year, item, apikey, false);
      }
    }
  } else {
    showWarning();
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
    header.innerHTML = `${ratingHeaders[mainLanguage]}:`;
    return header;
  }
}

function showRating(ratings, item) {
  if (ratings !== null) {
    var div = document.createElement("div");
    div.setAttribute("class", "ratings");
    console.log(document.documentElement.lang);
    const header = getRatingHeader();
    if (header) {
      div.appendChild(header);
    }
    for (var j = 0, numratings = ratings.length; j < numratings; j++) {
      var rating = document.createElement("div");
      rating.innerHTML = `<span class="rating-source">${ratings[j].Source}</span>: <span class="rating-value">${ratings[j].Value}</span>`;
      div.appendChild(rating);
    }
    item.querySelector("p").appendChild(div);
  }
}

function setItem(movie) {
  console.log(`Rating saved OK: ${movie}`);
}
function onError(error) {
  console.error(error);
}

function showWarning() {
  const hero = document.getElementsByTagName("article")[0];
  var div = document.createElement("div");
  div.setAttribute("class", "warning");
  div.innerHTML =
    '<span class="warning">⚠️To show movie ratings, please add an OMDb key in the MubiScore options page!⚠️';
  hero.querySelector("p").appendChild(div);
}

main();
