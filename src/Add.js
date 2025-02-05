import FullScreen from './download.png';
import cross from './cross.png';
import Dustbin from './dustbin.png';
import Logo from './logo.png';
import React, { useState, useRef } from 'react';

function Add({ closeNote,onClose }) {
  const [selectedImages, setSelectedImages] = useState([]); // Store image files
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);

  // Handle file selection and preview
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const newImages = files.map(file => ({
      file, // Store the file itself
      preview: URL.createObjectURL(file), // Preview URL for image
    }));
    setSelectedImages(prevImages => [...prevImages, ...newImages]);
  };

  // Remove selected image
  const removeImage = (index) => {
    setSelectedImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  // Open file explorer
  const openFileExplorer = () => {
    fileInputRef.current.click();
  };

  const handleSave = async () => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token=')).split('=')[1];
    const heading = inputRef.current.value
    const content = document.getElementById('transPara').innerText;
    
    if (!heading || !content) {
      alert("Heading and content cannot be empty!");
      return;
    }

    const formData = new FormData();
    formData.append("heading", heading);
    formData.append("content", content);
    formData.append('username', token);

    // Append files to formData
    selectedImages.forEach(image => {
      formData.append("images", image.file); // Append the actual file, not the preview URL
    });

    try {
      const response = await fetch("http://localhost:8000/writtenNote", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        alert("Saved Successfully")
        closeNote();
        onClose();
        setSelectedImages([]);  // Clear selected images
      } else {
        alert(data.error || "Failed to upload images");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong!");
    }
  };

  return (
    <div id='add'>
      <div>
        <div id='add-top'>
          <div id='pen'><img src={FullScreen} alt='FullScreen' /></div>
          <div>
            <div id='pen' style={{ width: '50px', borderRadius: '20px' }} onClick={handleSave}>
              <p style={{ transform: 'translate(9px,-19px)' }}>Save</p>
            </div>
            <div id='pen' onClick={() => closeNote()}>
              <img src={cross} alt='Cross' />
            </div>
          </div>
        </div>

        <div id='title'>
          <input 
            ref={inputRef}
            placeholder='Heading' 
            style={{ width: 'fit-content', minWidth: '100px', fontSize: '20px', margin: '10px 0px', outline: 'none', border: 'none', borderBottom: '1px solid gray', marginTop: '20px' }} 
          />
        </div>

        <div id='transcription' style={{ height: '200px', overflowY: 'scroll', scrollbarWidth: '0px' }}>
          <h2>Transcription</h2>
          <div className="transcription-content">
            <p id='transPara' contentEditable style={{ border: 'none', minHeight: '1000%', outline: 'none', overflowY: 'scroll' }}></p>
            <div className="transcription-actions">
              <button id="copy-button">Copy</button>
            </div>
          </div>
        </div>

        <div id='images'>
          {/* Display each selected image in its own "add-images" div */}
          {selectedImages.map((image, index) => (
            <div key={index} id='add-images' style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={image.preview} alt={`Preview ${index}`} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }} />
              <img 
                src={Dustbin} 
                id='dustbin' 
                alt="Delete" 
                onClick={() => removeImage(index)} 
                style={{ position: 'absolute', top: '-5px', right: '-5px', width: '20px', cursor: 'pointer' }} 
              />
            </div>
          ))}

          {/* "Add Image" button */}
          <div id='add-images' onClick={openFileExplorer} style={{ cursor: 'pointer' }}>
            <p>+</p>
            <p>Image</p>
          </div>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
        </div>
      </div>
    </div>
  );
}

export default Add;
