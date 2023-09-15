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

async function getTitleFromUrl(url) {
  // Make an HTTP GET request to the URL
  return fetch(url)
    .then((response) => {
      // Check if the request was successful (status code 200)
      if (response.ok) {
        return response.text();
      } else {
        throw new Error(`Failed to retrieve the page. Status code: ${response.status}`);
      }
    })
    .then((html) => {
      // Use the regular expression to extract the title content
      var regex = /<title>(.*?)<\/title>/i
      var siteHtml = html
      var ret = (siteHtml.match(regex))[0]
      ret = ret.replace("<title>", "")
      ret = ret.replace("</title>", "")
      return ret
  })
  console.log(ret)
  return ret
}

async function getTopic(url) {
  var ret
  if (!url.startsWith("https://")) {
    ret =  "Title not found on the page."
  }
  else {
    ret = await getTitleFromUrl(url)
  }
  console.log("title: " + ret)
  return ret
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

