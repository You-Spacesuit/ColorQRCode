class jsColorQR {
    constructor(outputSelector, maxColorTone = 255, minColorTone = 0, debug = false) {
        this.outputSelector = outputSelector;
        this.maxColorTone = maxColorTone;
        this.minColorTone = minColorTone;
        this.debug = debug;
    }
    clearRGBCode() {
        this.outputSelector.children().remove();
    }

    // TODO async化して成功関数を削除する
    readRGBCode(imageData, successFunction) {
        let canvas = document.createElement("canvas");
        canvas.setAttribute("id", "QR");
        canvas.height = imageData.height
        canvas.width = imageData.width
        let context = canvas.getContext("2d");
        context.putImageData(imageData, 0, 0);

        let myimageData = context.getImageData(0, 0, canvas.width, canvas.height)
        let data = myimageData.data
        let sendData = {
            width: imageData.width,
            height: imageData.height,
            imageDataList: [
                new Uint8ClampedArray(data),
                new Uint8ClampedArray(data),
                new Uint8ClampedArray(data)
            ]
        };
        // WebWorkerへ処理を移す
        const worker = new Worker("./js/readRGBCodeWorker.js");
        worker.onmessage = function (event) {
            successFunction(event.data);
        };
        worker.postMessage(sendData,
            [sendData.imageDataList[0].buffer],
            [sendData.imageDataList[1].buffer],
            [sendData.imageDataList[2].buffer]);
    }

    makeRGBCode(text, size) {
        let textArray = []
        const len = text.length
        // 文字列長で分割
        textArray.push(text.slice(0, len / 3))
        textArray.push(text.slice(len / 3, len / 3 * 2))
        textArray.push(text.slice(len / 3 * 2, len))

        // RGBに変換したQRコードのImageDataを格納
        let imageDataRGB = [new Object(), new Object(), new Object()];

        // 分割したテキストをQRコードに変換する
        for (let i = 0; i < textArray.length; i++) {
            let row = textArray[i];
            // SJISにエンコードする
            let source = Encoding.convert(row, 'SJIS');
            // QRコード作成
            this.outputSelector.qrcode({
                width: size,
                height: size,
                text: source
            });

            // ColorQRコード作成
            let canvas = !this.debug
                ? this.outputSelector.children().eq(0).get(0)
                : this.outputSelector.children().eq(i * 2).get(0);
            let context = canvas.getContext("2d");
            let imageData = context.getImageData(0, 0, size, size);
            // if (this.debug) console.log(imageData);
            if (!this.debug) canvas.remove();

            imageDataRGB[i] = this.convertRGB(imageData, i, size);

        }
        this.margeRGB(imageDataRGB, size);
    }

    convertRGB(imageData, type, size) {
        let canvas = document.createElement("canvas");
        // canvasCqr.setAttribute("id", this.inputId);
        canvas.width = canvas.height = size;
        if (this.debug) this.outputSelector.append(canvas);
        let context = canvas.getContext("2d");
        context.putImageData(imageData, 0, 0);

        // TODO WebWorkerに処理を委譲する
        let sparationImgData = context.getImageData(0, 0, canvas.width, canvas.height)
        let data = sparationImgData.data
        for (let i = 0; i < data.length; i += 4) {
            // 元になるQRコードは[0,0,0]か[255,255,255]なので赤成分だけで判断可能
            data[i + type] = data[i] >= 255 / 2
                ? this.maxColorTone
                : this.minColorTone;
            data[i + (type + 1) % 3] = data[i + (type + 2) % 3] = 0;
        }
        context.putImageData(sparationImgData, 0, 0);
        return sparationImgData;
    }

    margeRGB(imageDataArray, size) {
        let canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        this.outputSelector.append(canvas);
        let context = canvas.getContext("2d");
        context.putImageData(imageDataArray[0], 0, 0);

        // TODO WebWorkerに処理を委譲する
        let imageData = context.getImageData(0, 0, size, size);
        let data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] += imageDataArray[1].data[i] + imageDataArray[2].data[i]
            data[i + 1] += imageDataArray[1].data[i + 1] + imageDataArray[2].data[i + 1]
            data[i + 2] += imageDataArray[1].data[i + 2] + imageDataArray[2].data[i + 2]
        }
        context.putImageData(imageData, 0, 0);
        return imageData;
    }

    getLen(str) {
        let result = 0;
        for (let i = 0; i < str.length; i++) {
            let chr = str.charCodeAt(i);
            if ((chr >= 0x00 && chr < 0x81) ||
                (chr === 0xf8f0) ||
                (chr >= 0xff61 && chr < 0xffa0) ||
                (chr >= 0xf8f1 && chr < 0xf8f4)) {
                //半角文字の場合は1を加算
                result += 1;
            } else {
                //それ以外の文字の場合は2を加算
                result += 2;
            }
        }
        //結果を返す
        return result;
    }

    debugOutPutCanvas(imageDataArray, width, height) {
        let children = this.outputSelector.children();
        if (children.length >= 3) {
            children.remove();
        }
        let canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        this.outputSelector.append(canvas);
        let context = canvas.getContext("2d");
        // TODO WebWorkerに処理を委譲する
        let imgData = context.getImageData(0, 0, canvas.width, canvas.height)
        let data = imgData.data
        for (let i = 0; i < data.length; i += 1) {
            data[i] = imageDataArray[i];
        }
        context.putImageData(imgData, 0, 0);
    }

}
