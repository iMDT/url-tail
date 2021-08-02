# url-tail

This package allows you to monitor changes to a remote file using polling of an external URL.

This polling uses HTTP range, so only new data is transferred.

## Usage

```sh
npm install @imdt-os/url-tail
```

## Sample code

```js
const urlTail = require('@imdt-os/url-tail');
urlTail("http://127.0.0.1/log.txt", ()=>{
    console.error("Error");
}, (newData, reset)=>{
    if(reset){
        console.log("Discard old data - file was truncated");
    }
    console.log("New data available", newData);
}, {debug: false});
```
