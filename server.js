const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const apiUrl = 'http://pubproxy.com/api/proxy';

let nextStatusCheck = 0; // Initialize countdown timer

const proxiesMap = new Map();

// Function to fetch and save proxies with a delay
async function fetchAndSaveProxiesWithDelay() {
  try {
    const response = await axios.get(apiUrl);

    if (response.data && response.data.data) {
      const proxies = response.data.data;
      for (const proxy of proxies) {
        const key = `${proxy.protocol}://${proxy.ip}:${proxy.port}`;
        if (!proxiesMap.has(key)) {
          // If it doesn't exist, add to the map
          proxiesMap.set(key, {
            protocol: proxy.protocol,
            ip: proxy.ip,
            port: proxy.port,
            country: proxy.country,
            lastUpdated: new Date(),
            status: 'Unknown',
          });
        }
      }
    }
  } catch (error) {
    console.error('An error occurred while fetching proxies:', error.message);
  }
}

// Apply a delay between requests
const requestDelay = 1000; // 1 second
const fetchAndSaveProxies = async () => {
  await fetchAndSaveProxiesWithDelay();
  setTimeout(fetchAndSaveProxies, requestDelay);
};

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
fetchAndSaveProxies();
setInterval(fetchAndSaveProxies, fetchInterval);

const checkInterval = 2000; // 2 seconds

setInterval(async () => {
  for (const [key, proxy] of proxiesMap) {
    const status = await checkProxyStatus(proxy);
    proxy.status = status;
    proxy.lastUpdated = new Date();
  }
  // Reset the countdown timer after each check
  nextStatusCheck = checkInterval;
}, checkInterval);

// Countdown route
app.get('/countdown', (req, res) => {
  res.json({ timeUntilNextStatusCheck: nextStatusCheck / 1000 }); // Convert to seconds
});

app.get('/proxies', (req, res) => {
  // Sort proxies by type (protocol) and send them as JSON
  const sortedProxies = Array.from(proxiesMap.values()).reduce((acc, proxy) => {
    acc[proxy.protocol] = acc[proxy.protocol] || [];
    acc[proxy.protocol].push(proxy);
    return acc;
  }, {});
  res.json(sortedProxies);
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
