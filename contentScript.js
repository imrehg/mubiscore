function main() {
  chrome.storage.sync.get(
    {
      apikey: ""
    },
    function(items) {
      const apikey = items.apikey;
      if (apikey !== "") {
        const all = document.getElementsByClassName(
          "full-width-tile--now-showing"
        );
        for (var i = 0, max = all.length; i < max; i++) {
          const item = all[i];
          // console.log(item);
          const title = item.getElementsByClassName("full-width-tile__title")[0]
            .innerHTML;
          const countryYear = item
            .getElementsByClassName(
              "now-showing-tile-director-year__year-country"
            )[0]
            .innerHTML.split(",");
          const year = countryYear[1].trim();
          getRating(title, year, item, apikey);
        }
      }
    }
  );
}

function getRating(title, year, item, apikey) {
  const moviekey = `${title} / ${year}`;
  var query = {};
  query[moviekey] = "";
  chrome.storage.local.get(query, function(items) {
    if (items[moviekey] === "") {
      console.log(`No rating found for ${moviekey} in local storage.`);
      const encodedTitle = encodeURIComponent(title);
      var xhr = new XMLHttpRequest();
      xhr.open(
        "GET",
        `https://www.omdbapi.com/?t=${encodedTitle}&y=${year}&apikey=${apikey}`,
        false
      );
      xhr.send();
      var result = JSON.parse(xhr.responseText);
      if (
        result.Response !== "False" &&
        result.Ratings &&
        result.Ratings.length > 0
      ) {
        console.log(result.Ratings);
        var ratingStored = {};
        ratingStored[moviekey] = result.Ratings;
        chrome.storage.local.set(ratingStored, function() {
          console.log(
            "Value is set to " + JSON.stringify(ratingStored, null, 2)
          );
        });
        showRating(result.Ratings, item);
      }
    } else {
      console.log(`Rating found for ${moviekey} in local storage!`);
      showRating(items[moviekey], item);
    }
  });
}

function showRating(ratings, item) {
  console.log(ratings);
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
    var target = item.getElementsByClassName("full-width-tile__our-take")[0];
    target.appendChild(div);
  }
}

main();
