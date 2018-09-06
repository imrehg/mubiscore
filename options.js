function save_options() {
  var apikey = document.getElementById("apikey").value;
  browser.storage.sync
    .set({
      apikey: apikey
    })
    .then(setItem);
}

function setItem() {
  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.textContent = "Options saved.";
  setTimeout(function() {
    status.textContent = "";
  }, 2000);
}

function restore_options() {
  browser.storage.sync
    .get({
      apikey: ""
    })
    .then(items => {
      document.getElementById("apikey").value = items.apikey;
    });
}

document.addEventListener("DOMContentLoaded", restore_options);
document.getElementById("save").addEventListener("click", save_options);
