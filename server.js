const express = require('express');
const axios = require('axios');
const { Proxy } = require('./database'); // Import the Proxy model
const app = express();
const port = process.env.PORT || 3000;

const apiUrl = 'http://pubproxy.com/api/proxy';

function fetchAndSaveProxies() {
  axios.get(apiUrl)
    .then(async (response) => {
      if (response.data && response.data.data) {
        const proxies = response.data.data;
        if (proxies.length > 0) {
          for (const proxy of proxies) {
            // Check if the proxy already exists in the database
            const existingProxy = await Proxy.findOne({ where: { ip: proxy.ip, port: proxy.port } });

            if (existingProxy) {
              // If it exists, update the lastUpdated timestamp
              await existingProxy.update({ lastUpdated: new Date() });
            } else {
              // If it doesn't exist, create a new record
              await Proxy.create({
                protocol: proxy.protocol,
                ip: proxy.ip,
                port: proxy.port,
                country: proxy.country,
                lastUpdated: new Date(),
              });
            }
          }
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

app.get('/proxies', async (req, res) => {
  try {
    const proxies = await Proxy.findAll();
    res.json(proxies);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Proxy service is running on port ${port}`);
  console.log(`Proxies will be fetched and saved every ${fetchInterval / 1000} seconds.`);
});
