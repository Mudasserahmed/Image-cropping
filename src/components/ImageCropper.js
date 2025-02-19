import React, { useState, useEffect } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import * as faceapi from "face-api.js";

function ImageCropper({ imageToCrop, onImageCropped }) {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cropConfig, setCropConfig] = useState({
    unit: "%",
    width: 50,
    aspect: 1 / 1,
  });
  const [imageRef, setImageRef] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [finalAspect, setFinalAspect] = useState("4:5");

  const aspectRatios = {
    "1:1": 1 / 1,
    "4:5": 4 / 5,
    "16:9": 16 / 9,
  };
  useEffect(() => {
    setCropConfig({
      unit: "%",
      width: 50, 
      aspect: aspectRatios[finalAspect],
    });
  }, [finalAspect]);
  
  useEffect(() => {
    setCropConfig((prev) => ({
      ...prev,
      aspect: aspectRatios[finalAspect],
    }));
  }, [finalAspect]);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + "/models";

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (modelsLoaded && imageRef) {
      detectFaceAndAdjustCrop();
    }
  }, [modelsLoaded, imageRef]);

  async function detectFaceAndAdjustCrop() {
    const img = imageRef;
    if (!img) return;

    const detections = await faceapi
      .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    if (detections.length > 0) {
      const { x, y, width, height } = detections[0].detection.box;
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;

      const cropX = (x / imgWidth) * 100;
      const cropY = (y / imgHeight) * 100;
      const cropWidth = (width / imgWidth) * 100;
      const cropHeight = (height / imgHeight) * 100;

      setCropConfig({
        unit: "%",
        x: cropX,
        y: cropY,
        width: cropWidth * 1.5, 
        height: cropHeight * 1.5, 
        aspect: aspectRatios[finalAspect],
      });
    }
  }

  async function cropImage(crop) {
    if (!imageRef || !crop.width || !crop.height) return;
    const { url } = await getCroppedImage(imageRef, crop, aspectRatios[finalAspect]);
    setCroppedImage(url);
    onImageCropped(url);
  }

  function getCroppedImage(sourceImage, cropConfig, targetAspect) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const scaleX = sourceImage.naturalWidth / sourceImage.width;
      const scaleY = sourceImage.naturalHeight / sourceImage.height;
      const croppedWidth = cropConfig.width * scaleX;
      const croppedHeight = cropConfig.height * scaleY;

      let finalWidth, finalHeight;
      if (targetAspect > croppedWidth / croppedHeight) {
        finalWidth = croppedWidth;
        finalHeight = croppedWidth / targetAspect;
      } else {
        finalHeight = croppedHeight;
        finalWidth = croppedHeight * targetAspect;
      }

      canvas.width = finalWidth;
      canvas.height = finalHeight;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        sourceImage,
        cropConfig.x * scaleX,
        cropConfig.y * scaleY,
        croppedWidth,
        croppedHeight,
        0,
        0,
        finalWidth,
        finalHeight
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        const croppedImageUrl = URL.createObjectURL(blob);
        resolve({ url: croppedImageUrl, blob });
      }, "image/jpeg");
    });
  }

  function downloadCroppedImage() {
    if (!croppedImage) return;
    const a = document.createElement("a");
    a.href = croppedImage;
    a.download = "cropped-image.jpeg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="crop-container" style={{ display: "flex", gap: "20px" }}>
      {imageToCrop && (
        <div>
          <ReactCrop
            crop={cropConfig}
            onChange={(newCrop) => setCropConfig(newCrop)}
            onComplete={cropImage}
            keepSelection
          >
            <img
              src={imageToCrop}
              alt="Crop"
              onLoad={(e) => setImageRef(e.target)}
              style={{ maxWidth: "100%", borderRadius: "8px" }}
            />
          </ReactCrop>
              {/* you'll have to move the crop cursor after selecting the ratio to reflect the effect on ui */}
          <label> Aspect Ratio:</label>
          <select onChange={(e) => setFinalAspect(e.target.value)} value={finalAspect}>
            <option value="1:1">1:1 (Square)</option>
            <option value="4:5">4:5 (Portrait)</option>
            <option value="16:9">16:9 (Landscape)</option>
          </select>
        </div>
      )}

      {croppedImage && (
        <div className="image-preview">
          <h2>Preview</h2>
          <img
            src={croppedImage}
            alt="Cropped"
            style={{ maxWidth: "100%", borderRadius: "5px" }}
          />
          <button className="download-btn" onClick={downloadCroppedImage}>
            Download Image
          </button>
        </div>
      )}
    </div>
  );
}

export default ImageCropper;
