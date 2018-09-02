chrome.storage.sync.get(
  {
    apikey: ""
  },
  function(items) {
    const apikey = items.apikey;
    if (apikey !== "") {
      var xhr = new XMLHttpRequest();
      const all = document.getElementsByClassName(
        "full-width-tile--now-showing"
      );
      for (var i = 0, max = all.length; i < max; i++) {
        const item = all[i];
        console.log(item);
        const title = item.getElementsByClassName("full-width-tile__title")[0]
          .innerHTML;
        const countryYear = item
          .getElementsByClassName(
            "now-showing-tile-director-year__year-country"
          )[0]
          .innerHTML.split(",");
        const year = countryYear[1].trim();
        console.log(`${title} ${year}`);
        const moviekey = `${title}/${year}`;
        const encodedTitle = encodeURIComponent(title);
        xhr.open(
          "GET",
          `https://www.omdbapi.com/?t=${encodedTitle}&y=${year}&apikey=${apikey}`,
          false
        );
        xhr.send();
        var result = JSON.parse(xhr.responseText);
        console.log(result.Ratings);
        if (result.Ratings && result.Ratings.length > 0) {
          var div = document.createElement("div");
          div.setAttribute("class", "ratings");
          div.innerHTML = '<span class="ratings-header">Ratings:</span>';
          for (
            var j = 0, numratings = result.Ratings.length;
            j < numratings;
            j++
          ) {
            var rating = document.createElement("div");
            rating.innerHTML = `<span class="rating-source">${
              result.Ratings[j].Source
            }</span>: <span class="rating-value">${
              result.Ratings[j].Value
            }</span>`;
            div.appendChild(rating);
          }
          var target = item.getElementsByClassName(
            "full-width-tile__our-take"
          )[0];
          target.appendChild(div);
        }
      }
    }
  }
);
