const { createProxyMiddleware } = require('http-proxy-middleware');
const fs = require('fs');
const { Transform } = require('stream');

// Create a proxy instance
const proxy = createProxyMiddleware({
  target: 'http://your-api-server.com', // Replace with your API server's URL
  changeOrigin: true,
  onProxyReq(proxyReq, req, res) {
    // Intercept the request and read the request body
    if (req.body) {
      const chunks = [];
      const transform = new Transform({
        transform(chunk, encoding, callback) {
          chunks.push(chunk);
          callback(null, chunk);
        },
      });

      req.on('data', chunk => transform.write(chunk));
      req.on('end', () => {
        transform.end();
        const requestBody = Buffer.concat(chunks).toString('utf8');
        
        // Include the request body in the intercepted data
        req.interceptedData = { ...req.interceptedData, requestBody };
      });
    }
  },
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

      // Collect request and response data
      const data = {
        request: {
          method: req.method,
          url: req.url,
          headers: req.headers,
          requestBody: req.interceptedData.requestBody,
        },
        response: {
          statusCode: proxyRes.statusCode,
          headers: proxyRes.headers,
          responseBody,
        },
      };

      // Write the data to a JSON file
      fs.writeFileSync('intercepted-data.json', JSON.stringify(data, null, 2));
    });
  },
});

// Start the proxy server
proxy.listen(8080, () => {
  console.log('Proxy server listening on port 8080');
});
