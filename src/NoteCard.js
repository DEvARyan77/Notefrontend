import React, { useState, useRef, useEffect } from "react";
import blackPlayIcon from "./blackplay.png";
import Gallery from "./gallery.png";
import Copy from "./copy.png";
import FullScreen from "./download.png";
import Star from "./star.png";
import share from "./share.svg";
import cross from "./cross.png";
import playIcon from "./play.png";
import pauseIcon from "./pause.png";
import downloadIcon from "./install.png";
import Dustbin from "./dustbin.png";
import Pen from "./pen.svg";
import WhiteStar from "./whiteStar.png";
import Logo from "./logo.png";
import trash from './trash.png'

const NoteCard = ({ note,save }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showDetailsIn, setShowDetailsIn] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [activeOption, setActiveOption] = useState("Transcript");
  const followDotRef = useRef(null);
  const playingLineRef = useRef(null);

  const formatDate = (date) => {
    const optionsDate = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(date).toLocaleDateString('en-GB', optionsDate); // Format to "2 Jan, 2025"
  };

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const formatTimeWithAmPm = (date) => {
    const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true };
    return new Date(date).toLocaleTimeString('en-GB', optionsTime); // Format to "hh:mm AM/PM"
  };

  const handleOptionClick = (option) => {
    setActiveOption(option);
  };

  const handleCopy = () => {
    const transcriptionText = document.querySelector(".transcription-content p").innerText;
    navigator.clipboard.writeText(transcriptionText).then(() => {
      const copyButton = document.getElementById("copy-button");
      copyButton.innerText = "Copied";
      setTimeout(() => {
        copyButton.innerText = "Copy";
      }, 5000);
    });
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const display = () => {
    setShowDetails(false);
    console.log("Close");
    console.log(showDetails);
    console.log(showDetailsIn);
  };

  const getAudioDurationWithPlay = async (audioUrl) => {
    const audio = new Audio(audioUrl);
    audio.crossOrigin = "anonymous";
    return new Promise((resolve, reject) => {
      audio.addEventListener("loadedmetadata", () => {
        if (isFinite(audio.duration) && audio.duration > 0) {
          resolve(audio.duration);
        } else {
          audio.play().then(() => {
            resolve(audio.duration);
            audio.pause();
          }).catch(() => reject("Autoplay blocked. Play audio manually to get duration."));
        }
      });

      audio.addEventListener("error", () => reject("Error loading audio."));
    });
  };

  const Open = () => {
    setShowDetails(true);
    console.log("Open");
    console.log(showDetails);
    getAudioDurationWithPlay(note.audio)
      .then(duration => setTotalTime(duration))
      .catch(error => console.error(error));
  };

  const handleDownload = async () => {
    if (!note.audio) return;

    try {
      const response = await fetch(note.audio);
      const blob = await response.blob(); // Convert response to Blob
      const blobUrl = URL.createObjectURL(blob); // Create a temporary URL

      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", "audio.webm"); // Force download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const Screen = () => {
    const element = document.getElementById("ADD");
    console.log(element.style.width);
    if (element.style.width < '100vw') {
      element.style.width = '100vw';
      element.style.height = '100vh';
      element.style.borderRadius = '0px';
    } else {
      element.style.width = '1000px';
      element.style.height = '90vh';
      element.style.borderRadius = '20px';
    }
  };

  const addImage = async (event) => {
    event.preventDefault(); // Prevent default behavior

    // Create an input element for file selection
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*"; // Accept only images

    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];

      if (!file) {
        alert("No file selected");
        return;
      }

      const heading = note.heading.trim();
      if (!heading) {
        alert("Heading cannot be empty");
        return;
      }

      // Extract the token from cookies
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];

      if (!token) {
        alert("User not authenticated");
        return;
      }

      const formData = new FormData();
      formData.append("heading", heading);
      formData.append("username", token);
      formData.append("image", file); // Append the selected image

      try {
        const response = await fetch("http://localhost:8000/addImage", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          alert("Image added successfully");
          document.getElementById("save-over").style.display = "none";
          save();
        } else {
          const errorData = await response.json();
          alert(`Error: ${errorData.error}`);
        }
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    });

    // Trigger file selection
    fileInput.click();
  };

  const deleteImage = async (img) => {
    const heading = note.heading.trim();
    if (!heading) {
      alert("Heading cannot be empty");
      return;
    }

    // Extract the token from cookies
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      alert("User not authenticated");
      return;
    }
    console.log(heading);
    const formData = new FormData();
    formData.append("heading", heading);
    formData.append("username", token);
    formData.append("image", img); // Append the selected image
    console.log("FormData being sent:");
    for (let pair of formData.entries()) {
      console.log(pair[0] + ", " + pair[1]);
    }
    try {
      const response = await fetch("http://localhost:8000/deleteImage", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: token, heading: heading, image: img })
      });

      if (response.ok) {
        alert("Image deleted successfully");
        save();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  // Using useEffect to fetch audio duration when `note.audio` changes
  useEffect(() => {
    if (note.audio) {
      getAudioDurationWithPlay(note.audio)
        .then(duration => setTotalTime(duration))
        .catch(error => console.error(error));
    }
  }, [note.audio]);

  function makeEdit(){
    document.getElementById('note-heading').contentEditable = true;
    document.getElementById('note-heading').style.borderBottom = '1px solid gray';
    document.getElementById('note-heading').style.paddingRight = '20px';
  }
  async function saveHeading(){
     console.log(note.heading)
     console.log(document.getElementById('note-heading').innerText)
     const oldHeading = note.heading.trim();
     const heading = document.getElementById('note-heading').innerText.trim();
    if (!heading) {
      alert("Heading cannot be empty");
      return;
    }

    // Extract the token from cookies
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      alert("User not authenticated");
      return;
    }
    console.log(heading);
    const formData = new FormData();
    formData.append("heading", heading);
    formData.append("username", token);
    console.log("FormData being sent:");
    for (let pair of formData.entries()) {
      console.log(pair[0] + ", " + pair[1]);
    }
    try {
      const response = await fetch("http://localhost:8000/saveHeading", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: token, heading: heading, oldheading: oldHeading })
      });

      if (response.ok) {
        alert("Heading changed successfully");
        document.getElementById('note-heading').contentEditable = false;
        document.getElementById('note-heading').style.borderBottom = '0px solid gray';
        document.getElementById('note-heading').style.paddingRight = '0px';
        save();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }
  async function makeFavourite(){
     console.log(note.heading)
     const heading = note.heading.trim();
    if (!heading) {
      alert("Heading cannot be empty");
      return;
    }

    // Extract the token from cookies
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      alert("User not authenticated");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/makeFavourite", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: token, heading: heading})
      });

      if (response.ok) {
        save();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }
  async function DeleteNote(){
     console.log(note.heading)
     const heading = note.heading.trim();
    if (!heading) {
      alert("Heading cannot be empty");
      return;
    }

    // Extract the token from cookies
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      alert("User not authenticated");
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/deleteNote", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: token, heading: heading})
      });

      if (response.ok) {
        save();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }

  return (
    <div>
      <div key={note._id} id="card" onClick={Open}>
        <div id="top">
          <div id="top-div">
            <div id="top-para">
              {note.new && <p style={{ marginRight: "10px" }} id="new">NEW</p>}
              <p>{formatDate(note.createdAt)}, {formatTimeWithAmPm(note.createdAt)}</p>
            </div>
            <p style={{ display: "flex", alignItems: "center" }} id="type">
              {note.audio ? (
                <>
                  <img src={blackPlayIcon} id="blackplay" alt="Play Icon" />
                  <p>{formatTime(elapsedTime) || 'Audio'}</p>
                </>
              ) : (
                <p style={{ paddingBottom: "1px" }}>Text</p>
              )}
            </p>
          </div>
          <div>
            <h3>{note.heading}</h3>
            <p>{note.content}</p>
            {note.images && note.images.length > 0 && (
              <div id="image-status">
                <img src={Gallery} alt="Gallery Icon" />
                <p>{note.images.length} Image{note.images.length > 1 ? "s" : ""}</p>
              </div>
            )}
          </div>
        </div>
        <div id="bottom">
          <img src={Copy} id="copy" alt="Copy Icon" />
          <p>+</p>
          <img src={trash} style={{width:'16px',height:'20px',marginLeft:'5px',marginRight:'5px',zIndex:'5'}} onClick={(e) => {
            e.stopPropagation(); // Prevents the click from triggering the parent div
            DeleteNote();
          }}></img>
        </div>

        {/* Details Section */}
      </div>
      {showDetails && showDetailsIn && (
        <div id="add">
          <div id="ADD">
            <div id="add-top">
              <div id="pen" onClick={Screen}><img src={FullScreen} alt="FullScreen" /></div>
              <div>
                <div id="pen" onClick={makeFavourite} style={{
                    backgroundColor: note.favourite ? "#A65EF6":"",
                  }}><img src={note.favourite ? WhiteStar : Star} alt="Star" /></div>
                <div id="pen"><img src={share} alt="Share" /></div>
                <div id="pen" onClick={display}><img src={cross} alt="Close" /></div>
              </div>
            </div>
            <div id="title">
              <h1 id="note-heading" onBlur={saveHeading}>{note.heading}</h1>
              <div id="pen" style={{ backgroundColor: "transparent" }}><img src={Pen} alt="Pen" onClick={makeEdit}/></div>
            </div>
            {note.audio && (
              <div id="recording">
                <button onClick={togglePlayPause}>
                  <img src={isPlaying ? pauseIcon : playIcon} alt="Play/Pause" />
                </button>
                <div className="playing-line" ref={playingLineRef}>
                  <div id="playing-dot" ref={followDotRef}></div>
                </div>
                <p style={{ marginRight: "10px" }} id="time">{formatTime(elapsedTime)}/{formatTime(totalTime*100)}</p>
                <button onClick={handleDownload}>
                  <img src={downloadIcon} alt="Download" />
                  <p>Download Audio</p>
                </button>
              </div>
            )}
            <div id="options-add">
              <p className={activeOption === "Notes" ? "active-option" : ""} onClick={() => handleOptionClick("Notes")}>Notes</p>
              <p className={activeOption === "Transcript" ? "active-option" : ""} onClick={() => handleOptionClick("Transcript")}>Transcript</p>
              <p className={activeOption === "Create" ? "active-option" : ""} onClick={() => handleOptionClick("Create")}>Create</p>
              <p className={activeOption === "Speaker Transcript" ? "active-option" : ""} onClick={() => handleOptionClick("Speaker Transcript")}>Speaker Transcript</p>
            </div>
            <div id="transcription">
              <h2>Transcription</h2>
              <div className="transcription-content">
                <p>{note.content}</p>
                <div className="transcription-actions">
                  <button id="copy-button" onClick={handleCopy}>Copy</button>
                </div>
                <p className="read-more">Read more</p>
              </div>
            </div>
            <div id="images">
              {note.images && note.images.map((img, index) => (
                <div key={index} id="add-images">
                  <img src={img} alt={`Uploaded ${index}`} />
                  <img src={Dustbin} id="dustbin" alt="Dustbin" onClick={() => deleteImage(img)} />
                </div>
              ))}
              <div id="add-images" onClick={addImage}>
                <p>+</p>
                <p>Image</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteCard;
