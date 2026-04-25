const sharp = require("sharp");
const ort = require("onnxruntime-node");

const IMAGE_SIZE = 224;
const CHANNELS = 3;

// ImageNet normalization values (used during model training)
const NORMALIZE_MEAN = [0.485, 0.456, 0.406];
const NORMALIZE_STD = [0.229, 0.224, 0.225];

async function imageBufferToTensor(imageBuffer) {
  const resizedRawBuffer = await sharp(imageBuffer)
    .resize(IMAGE_SIZE, IMAGE_SIZE, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer();

  const floatData = new Float32Array(
    IMAGE_SIZE * IMAGE_SIZE * CHANNELS
  );

  for (let i = 0; i < IMAGE_SIZE * IMAGE_SIZE; i += 1) {
    const pixelIndex = i * CHANNELS;
    // Normalize to [0, 1] then apply ImageNet normalization
    const r = (resizedRawBuffer[pixelIndex] / 255 - NORMALIZE_MEAN[0]) / NORMALIZE_STD[0];
    const g = (resizedRawBuffer[pixelIndex + 1] / 255 - NORMALIZE_MEAN[1]) / NORMALIZE_STD[1];
    const b = (resizedRawBuffer[pixelIndex + 2] / 255 - NORMALIZE_MEAN[2]) / NORMALIZE_STD[2];

    floatData[i] = r;
    floatData[IMAGE_SIZE * IMAGE_SIZE + i] = g;
    floatData[2 * IMAGE_SIZE * IMAGE_SIZE + i] = b;
  }

  return new ort.Tensor("float32", floatData, [1, CHANNELS, IMAGE_SIZE, IMAGE_SIZE]);
}

module.exports = {
  imageBufferToTensor
};
