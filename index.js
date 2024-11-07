const process = require('child_process');

const proxies = Array.from(Array(20).keys()).map((i) => `167.99.135.79:${10000 + i}`);
const goodProxies = [];

async function doRequest(proxy) {
  return new Promise(async (resolve) => {
    const curl = `curl -sL -m 10 -x ${proxy} -w "%{http_code}\\n" google.com -o /dev/null`;
    console.log(curl);
    process.exec(curl, (_, stdout) => {
      const isOK = stdout.startsWith('2') || stdout.startsWith('3');
      console.log(`proxy -> ${proxy} is ${isOK}`);
      resolve(isOK);
    });
  });
}

async function doCheck() {
  for (const proxy of proxies) {
    const isOK = await doRequest(proxy);
    if (isOK) goodProxies.push(proxy);
  }
  console.log(`goodProxies`, goodProxies);
}

doCheck();
