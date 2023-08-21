const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');
const path = require('path');
const { Interaction, Pact } = require('@pact-foundation/pact');

const pact = new Pact({
  consumer: 'ConsumerName',
  provider: 'ProviderName',
});

// Set to keep track of responses already added as interactions
const seenResponses = new Set();

// Specify the path to the pact file
const pactFilePath = path.resolve(__dirname, 'pacts', 'pactfile.json');

// Load existing interactions from the pact file (if any)
if (fs.existsSync(pactFilePath)) {
  const existingInteractions = JSON.parse(fs.readFileSync(pactFilePath, 'utf8'));
  existingInteractions.forEach((interaction) => {
    pact.addInteraction(new Interaction().fromObject(interaction));
  });
}

// Create a proxy instance
const proxy = createProxyMiddleware({
  target: 'http://your-api-server.com', // Replace with your API server's URL
  changeOrigin: true,
  onProxyRes(proxyRes, req, res) {
    // ... (rest of the code remains the same as in your example)
    // After adding the interaction:
    fs.writeFileSync(pactFilePath, JSON.stringify(pact.specification.interactions, null, 2));
  },
});

// Start the proxy server
proxy.listen(8080, () => {
  console.log('Proxy server listening on port 8080');
});
