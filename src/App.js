import React, { useState } from "react";
import "./App.css";
import ImageCropper from "./components/ImageCropper";

function App() {
  const [imageToCrop, setImageToCrop] = useState(undefined);
  const [croppedImage, setCroppedImage] = useState(undefined);
  const [imageKey, setImageKey] = useState(0); 

  const onUploadFile = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      const fileType = file.type;
      if (fileType !== "image/jpeg" && fileType !== "image/png") {
        alert("Only JPG and PNG files are allowed!");
        return;
      }

      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageToCrop(reader.result);
        setImageKey((prevKey) => prevKey + 1); 
      });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="app">
      <h1>Image Cropper</h1>
      <input
        className="file-input"
        type="file"
        accept="image/jpeg, image/png"
        onChange={onUploadFile}
      />
      <ImageCropper
        key={imageKey} 
        imageToCrop={imageToCrop}
        onImageCropped={(img) => setCroppedImage(img)}
      />
    </div>
  );
}

export default App;