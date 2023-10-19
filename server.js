const axios = require('axios');
const fs = require('fs');
const path = require('path');

const apiUrl = 'http://pubproxy.com/api/proxy';
const savePath = path.join(__dirname, 'proxies');

// Make a request to the API
axios.get(apiUrl)
  .then((response) => {
    // Check if the response data is as expected
    if (response.data && response.data.data) {
      const proxies = response.data.data;
      if (proxies.length > 0) {
        // Create the 'proxies' folder if it doesn't exist
        if (!fs.existsSync(savePath)) {
          fs.mkdirSync(savePath);
        }

        // Save the proxies as JSON in the 'proxies' folder
        fs.writeFileSync(path.join(savePath, 'proxies.json'), JSON.stringify(proxies, null, 2), 'utf8');

        // Now you can add code to check if the proxies work
        // You can use the 'proxies' array for this purpose
        console.log('Proxies have been saved.');
      } else {
        console.error('No proxies were retrieved from the API.');
      }
    } else {
      console.error('Invalid response from the API.');
    }
  })
  .catch((error) => {
    console.error('An error occurred:', error.message);
  });
