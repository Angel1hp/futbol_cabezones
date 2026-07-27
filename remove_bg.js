const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'client', 'public', 'assets');
const files = ['char_freezer.png', 'char_goku_base.png'];

async function processImages() {
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) continue;
    
    try {
      const image = await Jimp.read(filePath);
      
      image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
        const red   = this.bitmap.data[idx + 0];
        const green = this.bitmap.data[idx + 1];
        const blue  = this.bitmap.data[idx + 2];
        const alpha = this.bitmap.data[idx + 3];

        // If pixel is very close to white, make it transparent
        if (red > 240 && green > 240 && blue > 240) {
          this.bitmap.data[idx + 3] = 0; // set alpha to 0
        }
      });
      
      await image.writeAsync(filePath);
      console.log('Processed', file);
    } catch (e) {
      console.error('Error processing', file, e);
    }
  }
}

processImages();
