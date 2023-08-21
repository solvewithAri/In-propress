const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');
const { Interaction, Pact } = require('@pact-foundation/pact');

const pact = new Pact({
  consumer: 'ConsumerName',
  provider: 'ProviderName',
});

// Set to keep track of responses already added as interactions
const seenResponses = new Set();

// Create a proxy instance
const proxy = createProxyMiddleware({
  target: 'http://your-api-server.com', // Replace with your API server's URL
  changeOrigin: true,
  onProxyRes(proxyRes, req, res) {
    // Intercept the response and read the response body
    const chunks = [];
    const transform = new Transform({
      transform(chunk, encoding, callback) {
        chunks.push(chunk);
        callback(null, chunk);
      },
    });

    proxyRes.on('data', chunk => transform.write(chunk));
    proxyRes.on('end', () => {
      transform.end();
      const responseBody = Buffer.concat(chunks).toString('utf8');

      // Generate a unique response identifier based on status code and body
      const responseIdentifier = `${proxyRes.statusCode}-${responseBody}`;
     
      // Check if this response has already been seen
      if (!seenResponses.has(responseIdentifier)) {
        // Create Pact interactions from the intercepted data
        const interaction = new Interaction()
          .given('A given state')
          .uponReceiving('A request')
          .withRequest({
            method: req.method,
            path: req.url,
            headers: req.headers,
          })
          .willRespondWith({
            status: proxyRes.statusCode,
            headers: proxyRes.headers,
            body: responseBody,
          });

        // Add the interaction to the Pact instance
        pact.addInteraction(interaction);

        // Add the response identifier to the set of seen responses
        seenResponses.add(responseIdentifier);
      }
    });
  },
});

// Start the proxy server
proxy.listen(8080, () => {
  console.log('Proxy server listening on port 8080');
});
