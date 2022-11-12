/**
 * Generates image of ZX Spectrum screen data (first 6912 bytes of data), including border - size 320x240.
 *
 * - returns Base64 encoded image
 *   - PNG if no flash is used
 *   - (animated) GIF if use of flash detected
 */

const Jimp = require("jimp");
const { GifFrame, GifUtil, GifCodec } = require("gifwrap");
const log = require("electron-log");

const chars_spectrum = [
  [0, 0, 0, 0, 0, 0, 0, 0], // 32 = space
  [0, 16, 16, 16, 16, 0, 16, 0],
  [0, 36, 36, 0, 0, 0, 0, 0],
  [0, 36, 126, 36, 36, 126, 36, 0],
  [0, 8, 62, 40, 62, 10, 62, 8],
  [0, 98, 100, 8, 16, 38, 70, 0],
  [0, 16, 40, 16, 42, 68, 58, 0],
  [0, 8, 16, 0, 0, 0, 0, 0],
  [0, 4, 8, 8, 8, 8, 4, 0],
  [0, 32, 16, 16, 16, 16, 32, 0],
  [0, 0, 20, 8, 62, 8, 20, 0],
  [0, 0, 8, 8, 62, 8, 8, 0],
  [0, 0, 0, 0, 0, 8, 8, 16],
  [0, 0, 0, 0, 62, 0, 0, 0],
  [0, 0, 0, 0, 0, 24, 24, 0],
  [0, 0, 2, 4, 8, 16, 32, 0],
  [0, 60, 70, 74, 82, 98, 60, 0],
  [0, 24, 40, 8, 8, 8, 62, 0],
  [0, 60, 66, 2, 60, 64, 126, 0],
  [0, 60, 66, 12, 2, 66, 60, 0],
  [0, 8, 24, 40, 72, 126, 8, 0],
  [0, 126, 64, 124, 2, 66, 60, 0],
  [0, 60, 64, 124, 66, 66, 60, 0],
  [0, 126, 2, 4, 8, 16, 16, 0],
  [0, 60, 66, 60, 66, 66, 60, 0],
  [0, 60, 66, 66, 62, 2, 60, 0],
  [0, 0, 0, 16, 0, 0, 16, 0],
  [0, 0, 16, 0, 0, 16, 16, 32],
  [0, 0, 4, 8, 16, 8, 4, 0],
  [0, 0, 0, 62, 0, 62, 0, 0],
  [0, 0, 16, 8, 4, 8, 16, 0],
  [0, 60, 66, 4, 8, 0, 8, 0],
  [0, 60, 74, 86, 94, 64, 60, 0],
  [0, 60, 66, 66, 126, 66, 66, 0],
  [0, 124, 66, 124, 66, 66, 124, 0],
  [0, 60, 66, 64, 64, 66, 60, 0],
  [0, 120, 68, 66, 66, 68, 120, 0],
  [0, 126, 64, 124, 64, 64, 126, 0],
  [0, 126, 64, 124, 64, 64, 64, 0],
  [0, 60, 66, 64, 78, 66, 60, 0],
  [0, 66, 66, 126, 66, 66, 66, 0],
  [0, 62, 8, 8, 8, 8, 62, 0],
  [0, 2, 2, 2, 66, 66, 60, 0],
  [0, 68, 72, 112, 72, 68, 66, 0],
  [0, 64, 64, 64, 64, 64, 126, 0],
  [0, 66, 102, 90, 66, 66, 66, 0],
  [0, 66, 98, 82, 74, 70, 66, 0],
  [0, 60, 66, 66, 66, 66, 60, 0],
  [0, 124, 66, 66, 124, 64, 64, 0],
  [0, 60, 66, 66, 82, 74, 60, 0],
  [0, 124, 66, 66, 124, 68, 66, 0],
  [0, 60, 64, 60, 2, 66, 60, 0],
  [0, 254, 16, 16, 16, 16, 16, 0],
  [0, 66, 66, 66, 66, 66, 60, 0],
  [0, 66, 66, 66, 66, 36, 24, 0],
  [0, 66, 66, 66, 66, 90, 36, 0],
  [0, 66, 36, 24, 24, 36, 66, 0],
  [0, 130, 68, 40, 16, 16, 16, 0],
  [0, 126, 4, 8, 16, 32, 126, 0],
  [0, 14, 8, 8, 8, 8, 14, 0],
  [0, 0, 64, 32, 16, 8, 4, 0],
  [0, 112, 16, 16, 16, 16, 112, 0],
  [0, 16, 56, 84, 16, 16, 16, 0],
  [0, 0, 0, 0, 0, 0, 0, 255],
  [0, 28, 34, 120, 32, 32, 126, 0],
  [0, 0, 56, 4, 60, 68, 60, 0],
  [0, 32, 32, 60, 34, 34, 60, 0],
  [0, 0, 28, 32, 32, 32, 28, 0],
  [0, 4, 4, 60, 68, 68, 60, 0],
  [0, 0, 56, 68, 120, 64, 60, 0],
  [0, 12, 16, 24, 16, 16, 16, 0],
  [0, 0, 60, 68, 68, 60, 4, 56],
  [0, 64, 64, 120, 68, 68, 68, 0],
  [0, 16, 0, 48, 16, 16, 56, 0],
  [0, 4, 0, 4, 4, 4, 36, 24],
  [0, 32, 40, 48, 48, 40, 36, 0],
  [0, 16, 16, 16, 16, 16, 12, 0],
  [0, 0, 104, 84, 84, 84, 84, 0],
  [0, 0, 120, 68, 68, 68, 68, 0],
  [0, 0, 56, 68, 68, 68, 56, 0],
  [0, 0, 120, 68, 68, 120, 64, 64],
  [0, 0, 60, 68, 68, 60, 4, 6],
  [0, 0, 28, 32, 32, 32, 32, 0],
  [0, 0, 56, 64, 56, 4, 120, 0],
  [0, 16, 56, 16, 16, 16, 12, 0],
  [0, 0, 68, 68, 68, 68, 56, 0],
  [0, 0, 68, 68, 40, 40, 16, 0],
  [0, 0, 68, 84, 84, 84, 40, 0],
  [0, 0, 68, 40, 16, 40, 68, 0],
  [0, 0, 68, 68, 68, 60, 4, 56],
  [0, 0, 124, 8, 16, 32, 124, 0],
  [0, 14, 8, 48, 8, 8, 14, 0],
  [0, 8, 8, 8, 8, 8, 8, 0],
  [0, 112, 16, 12, 16, 16, 112, 0],
  [0, 20, 40, 0, 0, 0, 0, 0],
  [60, 66, 153, 161, 161, 153, 66, 60],
];

// 76543210
// FBPPPIII
// Flash: approx. every 0.64 sec.
const colors = [
  /* bright 0 */
  "#000000",
  "#0000D7",
  "#D70000",
  "#D700D7",
  "#00D700",
  "#00D7D7",
  "#D7D700",
  "#D7D7D7",
  /* brigth 1 */
  "#000000",
  "#0000FF",
  "#FF0000",
  "#FF00FF",
  "#00FF00",
  "#00FFFF",
  "#FFFF00",
  "#FFFFFF",
];

const offsetX = 32,
  offsetY = 24;

function createSCR(data, border) {
  let frame0 = new Jimp(320, 240, Jimp.cssColorToHex(colors[border]), (err, image) => {
    if (err) throw err;
  });

  let frame1 = new Jimp(320, 240, Jimp.cssColorToHex(colors[border]), (err, image) => {
    if (err) throw err;
  });

  var useFlash = false;
  for (let index = 0; index < 6144; index++) {
    const adr = 0x4000 + index;
    const y = ((adr & 0b0000011100000000) >> 8) + ((adr & 0b0000000011100000) >> 2) + ((adr & 0b0001100000000000) >> 5);
    const x = adr & 0b00011111;
    let byte = data[index];

    let attrY = y >> 3;

    let attr = data[6144 + (attrY * 32 + x)];
    let ink = attr & 0b00000111;
    let pap = (attr >> 3) & 0b00000111;
    let flash = attr & 0b10000000;
    let bright = attr & 0b01000000;
    if (bright) {
      ink += 8;
      pap += 8;
    }
    if (flash) {
      useFlash = true;
      //
    }

    for (let b = 0; b < 8; b++) {
      if (byte & (128 >> b)) {
        frame0.setPixelColor(Jimp.cssColorToHex(colors[ink]), offsetX + x * 8 + b, offsetY + y);
        if (flash) {
          frame1.setPixelColor(Jimp.cssColorToHex(colors[pap]), offsetX + x * 8 + b, offsetY + y);
        } else {
          frame1.setPixelColor(Jimp.cssColorToHex(colors[ink]), offsetX + x * 8 + b, offsetY + y);
        }
      } else {
        frame0.setPixelColor(Jimp.cssColorToHex(colors[pap]), offsetX + x * 8 + b, offsetY + y);
        if (flash) {
          frame1.setPixelColor(Jimp.cssColorToHex(colors[ink]), offsetX + x * 8 + b, offsetY + y);
        } else {
          frame1.setPixelColor(Jimp.cssColorToHex(colors[pap]), offsetX + x * 8 + b, offsetY + y);
        }
      }
    }
  }

  if (useFlash) {
    const frames = [];
    let frame = new GifFrame(320, 240, { delayCentisecs: 50 });
    frame.bitmap.data = frame0.bitmap.data;
    frames.push(frame);
    frame = new GifFrame(320, 240, { delayCentisecs: 50 });
    frame.bitmap.data = frame1.bitmap.data;
    frames.push(frame);
    const codec = new GifCodec();
    return codec.encodeGif(frames, { loops: 0 });
  } else {
    return frame0.getBase64Async(Jimp.MIME_PNG);
  }
}

function printAt(image, x, y, text) {
  const mylog = log.scope("printAt");

  mylog.debug(`${text}`);

  for (var i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i) - 32;
    const fontData = chars_spectrum[c];
    for (var r = 0; r < 8; r++) {
      const byte = fontData[r];
      const yc = offsetY + y * 8 + r;
      // byte = nnnnnnnn
      for (var b = 0; b < 8; b++) {
        const xc = offsetX + (x + i) * 8 + b;
        const pixel = byte & (0b1000000 >> b);
        if (pixel) {
          image.setPixelColor(Jimp.cssColorToHex(colors[0]), xc, yc);
        } else {
          image.setPixelColor(Jimp.cssColorToHex(colors[7]), xc, yc);
        }
      }
    }
  }
}

exports.createSCR = createSCR;
exports.printAt = printAt;
