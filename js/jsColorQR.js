class jsColorQR {
    constructor() {
        this.worker = new Worker("./js/readMainWorker.js");
    }

    readRGBCode(imageData, successFunction) {
        let canvas = document.createElement("canvas");
        canvas.height = imageData.height
        canvas.width = imageData.width
        let context = canvas.getContext("2d");
        context.putImageData(imageData, 0, 0);
        let myimageData = context.getImageData(0, 0, canvas.width, canvas.height)

        let sendData = {
            width: imageData.width,
            height: imageData.height,
            imageDataList: [
                new Uint8ClampedArray(myimageData.data),
                new Uint8ClampedArray(myimageData.data),
                new Uint8ClampedArray(myimageData.data)
            ]
        };
        this.worker.onmessage = function (event) {
            successFunction(event.data);
        };
        this.worker.postMessage(sendData,
            [sendData.imageDataList[0].buffer],
            [sendData.imageDataList[1].buffer],
            [sendData.imageDataList[2].buffer]);
    }

    makeRGBCode(text, size, outputSelector) {
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
            outputSelector.qrcode({
                width: size,
                height: size,
                text: source
            });
            // ColorQRコード作成
            let canvas = outputSelector.children().eq(0).get(0);
            let context = canvas.getContext("2d");
            let imageData = context.getImageData(0, 0, size, size);
            canvas.remove();
            imageDataRGB[i] = this.convertRGB(imageData, i, size);
        }
        this.margeRGB(imageDataRGB, size, outputSelector);
    }

    convertRGB(imageData, type, size) {
        let canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        let context = canvas.getContext("2d");
        context.putImageData(imageData, 0, 0);

        // TODO WebWorkerに処理を委譲する
        let sparationImgData = context.getImageData(0, 0, canvas.width, canvas.height)
        let data = sparationImgData.data
        for (let i = 0; i < data.length; i += 4) {
            // 元になるQRコードは[0,0,0]か[255,255,255]なので赤成分だけで判断可能
            data[i + type] = data[i] >= 255 / 2 ?
                255 :
                0;
            data[i + (type + 1) % 3] = data[i + (type + 2) % 3] = 0;
        }
        context.putImageData(sparationImgData, 0, 0);
        return sparationImgData;
    }

    margeRGB(imageDataArray, size, outputSelector) {
        let canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        outputSelector.append(canvas);
        let context = canvas.getContext("2d");
        context.putImageData(imageDataArray[0], 0, 0);
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

}