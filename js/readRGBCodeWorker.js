// readRGBCodeWorker
self.onmessage = function (event) {
    importScripts("../lib/jsQR.js");
    let imageData = event.data.imageDataList;
    let width = event.data.width;
    let height = event.data.height;
    for (let i = 0; i < imageData[0].length; i += 4) {
        imageData[0][i] = imageData[0][i + 1] = imageData[0][i + 2] = imageData[0][i] >= 255 / 2
            ? 255
            : 0;
        imageData[1][i] = imageData[1][i + 1] = imageData[1][i + 2] = imageData[1][i + 1] >= 255 / 2
            ? 255
            : 0;
        imageData[2][i] = imageData[2][i + 1] = imageData[2][i + 2] = imageData[2][i + 2] >= 255 / 2
            ? 255
            : 0;
    }
    let count = 0;
    let joinedString = "";
    for (let i = 0; i < imageData.length; i++) {
        const code = jsQR(imageData[i], width, height);
        if (code) {
            let text_decoder = new TextDecoder("shift_jis");
            let str = text_decoder.decode(Uint8Array.from(code.binaryData).buffer);
            joinedString += str;
            count++;
        }
        // if (this.debug) { this.debugOutPutCanvas(imageData[i], width, height); }
    }
    if (count < imageData.length) {
        joinedString = undefined;
    }
    self.postMessage(joinedString);
    self.close();
};