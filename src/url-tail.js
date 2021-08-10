module.exports = function(remoteUrl, errorCallback, newDataCallback, options) {
    if(!options)
        options = {};

    const debug = options.debug === true;
    const tailBytes = options.tailBytes || 10*1024; // load up to 10KB
    const checkInterval = options.checkInterval || 1000; // check for new data every 1s

    const storage = {
        position: 0
    };

    let destroyed = false;

    if(debug) console.log(`> HEAD request`);
    checkForNewData = () => {
        if(destroyed) {
            if(debug) console.log(`Destroyed, exiting`);
            return;
        }
        
        fetch(remoteUrl, {method: 'HEAD'}).then((result) => {
            const {headers} = result;
            const currentFileSize = headers.get(`content-length`);
            let reset = false;
            storage.currentFileSize = currentFileSize;
            if(debug) console.log(`< HEAD response :: currentFileSize => ${currentFileSize}`);

            if( storage.currentFileSize < storage.previousFileSize ) {
                if(debug) console.log(`Remote file truncated`);
                storage.position = 0;
                reset = true;
            }
            storage.previousFileSize = storage.currentFileSize;

            let from = storage.position, to=storage.currentFileSize;

            if(from === 0 && (storage.currentFileSize ) > tailBytes ) {
                from = storage.currentFileSize - tailBytes;
            }

            if(from === to) {
                if(debug) console.log(`Nothing new, waiting for next loop.`);
                setTimeout(checkForNewData, checkInterval);
                return;
            }

            if( from > 0) {
                from -= 1;
            }

            if(debug) console.log(`> GET from ${from} to ${to}`);
            fetch(remoteUrl, {
                headers: {
                    'content-type': 'multipart/byteranges',
                    'range': `bytes=${from}-${to}`,
                }
            }).then( response => {
                storage.position = to;
                response.text().then( text =>  {
                    const trimmedText = text;
                    newDataCallback(trimmedText, reset);
                    setTimeout(checkForNewData, checkInterval);
                    return;
                });
            }).catch( e => {
                errorCallback(`Error fetching range from ${from} to ${to}`);
            });

        }).catch( e => {
            if(debug) console.error(`< HEAD error`, e);
            errorCallback(`Error fetching file size`);
        });
    }

    checkForNewData();


    return () => {
        destroyed = true;
    };
};
