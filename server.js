const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const apiUrl = 'http://pubproxy.com/api/proxy';
const savePath = path.join(__dirname, 'proxies');

function fetchAndSaveProxies() {
  axios.get(apiUrl)
    .then((response) => {
      if (response.data && response.data.data) {
        const proxies = response.data.data;
        if (proxies.length > 0) {
          if (!fs.existsSync(savePath)) {
            fs.mkdirSync(savePath);
          }
          fs.writeFileSync(path.join(savePath, 'proxies.json'), JSON.stringify(proxies, null, 2), 'utf8');
        }
      }
    })
    .catch((error) => {
      console.error('An error occurred:', error.message);
    });
}

const fetchInterval = 3600000; // 1 hour
fetchAndSaveProxies();
setInterval(fetchAndSaveProxies, fetchInterval);

app.get('/proxies', (req, res) => {
  // Read the saved proxies and send them as a response
  const proxiesPath = path.join(savePath, 'proxies.json');
  if (fs.existsSync(proxiesPath)) {
    const proxies = JSON.parse(fs.readFileSync(proxiesPath, 'utf8'));
    res.json(proxies);
  } else {
    res.status(404).json({ message: 'No proxies available.' });
  }
});

app.listen(port, () => {
  console.log(`Proxy service is running on port ${port}`);
  console.log(`Proxies will be fetched and saved every ${fetchInterval / 1000} seconds.`);
});
