const maxNumRender = 9;
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

document.addEventListener("DOMContentLoaded", loadPage);

function parseUrl(url) {
    const start = "https://";
    const end = "/";
    const startIndex = url.indexOf(start) + start.length;
    const endIndex = url.indexOf(end, startIndex);
    let substring = url.substring(startIndex, endIndex);
    if (substring.startsWith("www.")) substring = substring.slice(4);
    return substring;
}

async function renderEntry(log, entry) {
    const {url, fav, start, end} = entry;
    const newEntry = document.createElement("tr");
    newEntry.className = "entry";

    const info = document.createElement("td");
    info.className = "detail";
    const favicon = document.createElement("img")
    favicon.src = fav;
    const site = document.createElement("p");
    site.innerHTML = url;

    info.appendChild(favicon);
    info.appendChild(site);

    const startTime = document.createElement("td");
    startTime.innerHTML = `<p>${start}</p>`
    startTime.className = "time";
    const endTime = document.createElement("td");
    endTime.innerHTML = `<p>${end}</p>`
    endTime.className = "time";

    newEntry.appendChild(info);
    newEntry.appendChild(startTime);
    newEntry.appendChild(endTime);
    log.appendChild(newEntry);
}

async function viewLog(currentLog = []) {
    const popupLog = document.getElementById("log");
    if (!document.getElementById("logTable")) {
        const lt = document.createElement("table");
        lt.id = "logTable";
        popupLog.appendChild(lt);
    }
    const logTable = document.getElementById("logTable");
    logTable.innerHTML = "<th>Website</th> <th>Start</th> <th>End</th>";
    if (currentLog.length > 0) {
        for (let i = 0; i < Math.min(maxNumRender, currentLog.length); i++) {
            const entry = currentLog[i];
            renderEntry(logTable, entry);
        }
        if (currentLog.length > maxNumRender) {
            const overflow = document.createElement("tr");
            overflow.innerHTML = "<td colspan='3'><p id='overflow'>...</p></td>"
            logTable.appendChild(overflow);
        }
    } else {
        const empty = document.createElement("tr");
        empty.innerHTML = "<td colspan='3'><p id='empty'>No activity recorded.. yet</p></td>"
        logTable.appendChild(empty);
    }
}

async function clearLog() {
    chrome.storage.session.set({'key': []}).then(()=> {
        console.log("log cleared");
        viewLog([]);
    });

}

function formatTwoDigits(num) {
    return num.toString().padStart(2, '0');
  }

async function getFormattedTime() {
    const time = new Date();
    const year = time.getFullYear();
    const month = time.getMonth() + 1; // Months are zero-indexed, so we add 1.
    const day = time.getDate();
    const hour = time.getHours();
    const minute = time.getMinutes();
    const second = time.getSeconds();
    const formattedDate = `${year}-${formatTwoDigits(month)}-${formatTwoDigits(day)}`;
    const formattedTime = `${formatTwoDigits(hour)}-${formatTwoDigits(minute)}-${formatTwoDigits(second)}`;
    return formattedDate + "_" + formattedTime;
}

async function exportData() {
    const formattedTime = await getFormattedTime();
    chrome.storage.session.get(['key'], (data) => {
        const currentLog = data['key'];
        if (currentLog.length == 0) {
            alert("No data recorded!");
            return;
        }
        else {
            const timeEnd = new Date();
            currentLog[currentLog.length-1].end = timeEnd.toLocaleString('en-US', options);
            viewLog(currentLog);
        }
        const headers = ['url', 'start', 'end', 'topic'];
        const csvRows = [headers.join(',')];
        for (const entry of currentLog) {
            const values = headers.map(header => entry[header]);
            csvRows.push(values.join(','));
        }
        const csvData = csvRows.join('\n');
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `data_${formattedTime}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

async function addButtons() {
    const clear = document.createElement("button");
    clear.type = "button";
    clear.innerHTML = "Clear Log";
    clear.addEventListener("click", clearLog);
    const download = document.createElement("button");
    download.type = "button";
    download.innerHTML = "Export";
    download.addEventListener("click", exportData);

    document.body.insertBefore(download, document.getElementById("log"));
    document.body.insertBefore(clear, download);
}

async function loadPage() {
    addButtons();
    chrome.storage.session.get(['key'], (data) => {
        const currentLog = data['key'];
        viewLog(currentLog);
    });
}