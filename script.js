/** Global Status */
const gstat = {
    /** @type {HTMLVideoElement} */
    video: undefined,
    /**
     * canvas（截屏用）
     * @type {HTMLCanvasElement}
     */
    captureCanvas: undefined,
    /**
     * canvas（绘制像素画用）
     * @type {HTMLCanvasElement}
     */
    pixelCanvas: undefined,
    /** @type {HTMLButtonElement} */
    playBtn: undefined,
    /** 
     * “分辨率宽度”拖动条
     *  @type {HTMLInputElement}
     */
    capWidthBar: undefined,
    /** 
     * “清屏间隔”拖动条
     * @type {HTMLInputElement}
     */
    clsBar: undefined,
    /** @type {number} */
    intervalId: undefined,
    /** 残留在控制台中的画面数量 */
    counter: 0,
    /** @type {'image' | 'text'} */
    outputType: 'image',
    /** 刷新间隔 (ms) */
    get timeout() { return this.outputType === 'image' ? 100 : 300; },
    /** 清屏间隔（张数） */
    get clearCount() { return this.outputType === 'image' ? 100 : parseInt(this.clsBar.value); }
};

/** @type {string} */
const NEW_LINES = Array(60).fill('\n').join('');

function setCaptureSize() {
    const video = gstat.video;
    const capture = gstat.captureCanvas;
    capture.width = gstat.outputType === 'image' ? parseInt(gstat.capWidthBar.value) : 40;
    capture.height = capture.width * (video.videoHeight / video.videoWidth);
}

function updateScreen() {
    setCaptureSize();

    const capture = gstat.captureCanvas;
    const width = capture.width;
    const height = capture.height;
    const context = capture.getContext('2d');
    context.drawImage(video, 0, 0, width, height);
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;

    //定期清屏，以防残留内容过多导致卡顿
    if (gstat.counter === 0 || gstat.counter >= gstat.clearCount) {
        console.clear();
        console.log(NEW_LINES);
        gstat.counter = 1;
    } else {
        gstat.counter++;
    }

    if (gstat.outputType === 'image') {
        printAsImage(data, width, height);
    } else {
        printAsText(data, width, height);
    }
}

/**
 * @param {Uint8ClampedArray} data
 * @param {number} width
 * @param {number} height
 */
function printAsText(data, width, height) {
    /** @type {string[]} */
    const text = [];
    /** @type {string []} */
    const css = [];
    for (let i = 0; i < height; i++) {
        text.push('\n');
        for (let j = 0; j < width; j++) {
            const offset = (i * width + j) * 4;
            const [r, g, b, a] = [data[offset + 0], data[offset + 1], data[offset + 2], data[offset + 3]];
            text.push('%c  ');
            css.push(`color: transparent; background: rgba(${r}, ${g}, ${b}, ${a});`);
        }
    }
    console.log(text.join(''), ...css);
}

/**
 * @param {Uint8ClampedArray} data
 * @param {number} width
 * @param {number} height
 */
function printAsImage(data, width, height) {
    const canvas = gstat.pixelCanvas;
    const step = 8; //色块的边长 (px)
    canvas.width = width * step;
    canvas.height = height * step;

    const context = canvas.getContext('2d');
    for (let i = 0; i < height; i++) {
        for (let j = 0; j < width; j++) {
            const offset = (i * width + j) * 4;
            const [r, g, b, a] = [data[offset + 0], data[offset + 1], data[offset + 2], data[offset + 3]];
            context.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
            context.fillRect(j * step, i * step, step, step);
        }
    }
    const url = canvas.toDataURL('image/png');
    const cssWidth = 250;
    const cssHeight = cssWidth * (canvas.height / canvas.width);
    const style =
        `padding: ${cssHeight}px ${cssWidth}px;` +
        `background: url(${url});` +
        'background-size: contain;' +
        'background-repeat: no-repeat;';
    console.log('\n\n\n%c ', style);
}

/** 视频播放时的动作 */
function videoPlay() {
    gstat.intervalId = setInterval(updateScreen, gstat.timeout);
    gstat.playBtn.innerText = '⏸ Pause';
}

/** 视频暂停时的动作 */
function videoPause() {
    if (gstat.intervalId != null) {
        clearInterval(gstat.intervalId);
        gstat.intervalId = undefined;
    }
    gstat.playBtn.innerText = '▶️ Play';
}

/** 点击“播放/暂停”按钮时的动作 */
function playBtnClick() {
    const video = gstat.video;
    if (video.paused) {
        video.play();
    } else {
        video.pause();
    }
}

/** 切换到 image 输出方式 */
function selectImageOut() {
    gstat.outputType = 'image';
    document.getElementById('imagePanel').style.display = 'block';
    document.getElementById('textPanel').style.display = 'none';
    if (gstat.intervalId != null) {
        clearInterval(gstat.intervalId);
    }
    console.clear();
    gstat.counter = 0;
    if (!gstat.video.paused) {
        gstat.intervalId = setInterval(updateScreen, gstat.timeout);
    }
}

/** 切换到 text 输出方式 */
function selectTextOut() {
    gstat.outputType = 'text';
    document.getElementById('imagePanel').style.display = 'none';
    document.getElementById('textPanel').style.display = 'block';
    if (gstat.intervalId != null) {
        clearInterval(gstat.intervalId);
    }
    console.clear();
    gstat.counter = 0;
    if (!gstat.video.paused) {
        gstat.intervalId = setInterval(updateScreen, gstat.timeout);
    }
}

window.onload = () => {
    console.log('window loaded');
    gstat.video = document.getElementById('video');
    gstat.playBtn = document.getElementById('playBtn');
    gstat.capWidthBar = document.getElementById('capWidthBar');
    gstat.clsBar = document.getElementById('clsBar');
    gstat.video.onloadedmetadata = () => console.log('video metadata loaded');
    gstat.captureCanvas = document.createElement('canvas');
    gstat.pixelCanvas = document.createElement('canvas');
};
