const express = require('express');
const axios = require('axios');
const { Proxy } = require('./database'); // Import the Proxy model
const app = express();
const port = process.env.PORT || 3000;

const apiUrl = 'http://pubproxy.com/api/proxy';

let nextStatusCheck = 0; // Initialize countdown timer

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

async function checkProxyStatus(proxy) {
  try {
    const response = await axios.get('https://example.com', {
      proxy: {
        host: proxy.ip,
        port: proxy.port,
        protocol: proxy.protocol,
      },
    });
    return response.status === 200 ? 'Working' : 'Not Working';
  } catch (error) {
    return 'Not Working';
  }
}

const fetchInterval = 60000; // 1 minute
fetchAndSaveProxies()
setInterval(fetchAndSaveProxies, fetchInterval);

const checkInterval = 2000; // 2 seconds

setInterval(async () => {
  const proxies = await Proxy.findAll();
  for (const proxy of proxies) {
    const status = await checkProxyStatus(proxy);
    await proxy.update({ status });
  }
  // Reset the countdown timer after each check
  nextStatusCheck = checkInterval;
}, checkInterval);

// Countdown route
app.get('/countdown', (req, res) => {
  res.json({ timeUntilNextStatusCheck: nextStatusCheck / 1000 }); // Convert to seconds
});

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
  console.log(`Proxy status will be checked every ${checkInterval / 1000} seconds.`);

  // Countdown timer for the next status check
  setInterval(() => {
    nextStatusCheck -= 1000; // Decrease by 1 second
  }, 1000);
});
