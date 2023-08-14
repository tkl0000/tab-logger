// event to run execute.js content when extension's button is clicked

const apiKey = "AIzaSyC3SZ8MhUkGHBvWnOVbfbo0hfhnHB6XwJs";

function parseUrl(url) {
  const start = "https://";
  const end = "/";
  const startIndex = url.indexOf(start) + start.length;
  const endIndex = url.indexOf(end, startIndex);
  let substring = url.substring(startIndex, endIndex);
  if (substring.startsWith("www.")) substring = substring.slice(4);
  return substring;
}

const options = {
  // weekday: 'long',   // e.g., "Thursday"
  // year: 'numeric',   // e.g., "2023"
  // month: 'long',     // e.g., "August"
  // day: 'numeric',    // e.g., "5"
  hour: 'numeric',   // e.g., "10" (use '2-digit' for leading zeros)
  minute: 'numeric', // e.g., "30" (use '2-digit' for leading zeros)
  second: 'numeric', // e.g., "15" (use '2-digit' for leading zeros)
  hour12: false      // Use 12-hour time format (e.g., "10:30 AM" instead of "10:30:15")
};

chrome.tabs.onActivated.addListener(newPage);
chrome.tabs.onUpdated.addListener(newPage);
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.session.set({key: []}).then(()=> {
    console.log("log initialized");
  });
});

async function getTabInfo() {
  const tabs = await chrome.tabs.query({active: true, currentWindow: true});
  if (tabs.length > 0) {
    return {url: tabs[0].url, fav: "https://s2.googleusercontent.com/s2/favicons?domain_url=" + tabs[0].url};
  }
  else {
    return null;
  }
}

async function init() {
  chrome.storage.session.set({'key': []}).then(()=> {
    console.log("log initialized");
  });
}

async function getTopic(url) {
  const google = "www.google.com/search";
  const youtube = "www.youtube.com/watch";
  if (url.indexOf(google) > -1) {
    const terms = (url.split(/[=&]/)[1]).split("+");
    return terms.join(" ");
  }
  else if (url.indexOf(youtube) > -1) {
    const id = url.split(/[=&]/)[1];
    console.log(id);
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${id}&type=video&part=snippet&key=${apiKey}`;
    var ret = "";
    await fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
          if (data.items.length > 0) {
            ret = data.items[0].snippet.title;
          } else {
            console.log('Video not found or API response is empty.');
          }
      })
      .catch(error => {
          console.error('An error occurred:', error);
      });
    return ret;
  }
  else return "";
}

async function newPage() {
  const {url, fav} = await getTabInfo();
  const time = new Date();
  const formattedTime = time.toLocaleString('en-US', options);
  chrome.storage.session.get(['key']).then(async (data) => {
    const currentLog = data.key;
    const addUrl = parseUrl(url);
    const siteTopic = await getTopic(url);
    if (addUrl === "") return; 
    if (currentLog.length > 0) {
      const prevUrl = currentLog[currentLog.length - 1].url;
      if (addUrl === prevUrl) {
        const prevTopic = currentLog[currentLog.length - 1].topic;
        if (prevTopic === siteTopic) return;
      }
      currentLog[currentLog.length - 1].end = formattedTime;
    }   
    const addFav = fav;
    currentLog.push({url: addUrl, fav: addFav, start: formattedTime, end: "", topic: siteTopic});
    chrome.storage.session.set({key: currentLog}).then(()=> {
      console.log("added entry");
    });
  });
}

