/**
 * Generates image of ZX Spectrum screen data (first 6912 bytes of data), including border - size 320x240.
 *
 * - returns Base64 encoded image
 *   - PNG if no flash is used
 *   - (animated) GIF if use of flash detected
 */

const Jimp = require("jimp");
const { GifFrame, GifUtil, GifCodec } = require("gifwrap");

function createSCR(data, border) {
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

  let frame0 = new Jimp(
    320,
    240,
    Jimp.cssColorToHex(colors[border]),
    (err, image) => {
      if (err) throw err;
    }
  );

  let frame1 = new Jimp(
    320,
    240,
    Jimp.cssColorToHex(colors[border]),
    (err, image) => {
      if (err) throw err;
    }
  );

  var useFlash = false;
  for (let index = 0; index < 6144; index++) {
    const adr = 0x4000 + index;
    const y =
      ((adr & 0b0000011100000000) >> 8) +
      ((adr & 0b0000000011100000) >> 2) +
      ((adr & 0b0001100000000000) >> 5);
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
        frame0.setPixelColor(
          Jimp.cssColorToHex(colors[ink]),
          offsetX + x * 8 + b,
          offsetY + y
        );
        if (flash) {
          frame1.setPixelColor(
            Jimp.cssColorToHex(colors[pap]),
            offsetX + x * 8 + b,
            offsetY + y
          );
        } else {
          frame1.setPixelColor(
            Jimp.cssColorToHex(colors[ink]),
            offsetX + x * 8 + b,
            offsetY + y
          );
        }
      } else {
        frame0.setPixelColor(
          Jimp.cssColorToHex(colors[pap]),
          offsetX + x * 8 + b,
          offsetY + y
        );
        if (flash) {
          frame1.setPixelColor(
            Jimp.cssColorToHex(colors[ink]),
            offsetX + x * 8 + b,
            offsetY + y
          );
        } else {
          frame1.setPixelColor(
            Jimp.cssColorToHex(colors[pap]),
            offsetX + x * 8 + b,
            offsetY + y
          );
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

exports.createSCR = createSCR;
