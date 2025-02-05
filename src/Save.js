import React, { useState, useEffect, useRef } from 'react';

const SaveOver = ({ transcripts, setTranscripts, cross, audioBlob, setAudioBlob, onClose }) => {
  const [heading, setHeading] = useState('');
  const transcriptsRef = useRef(null);

  useEffect(() => {
    if (transcriptsRef.current) {
      transcriptsRef.current.innerHTML = transcripts;
    }
  }, [transcripts]);
  

  const handleSave = async () => {
    setTranscripts(document.getElementById('transcripts').innerText)
    console.log(transcripts)
    if (!heading.trim()) {
      alert('Heading cannot be empty');
      return;
    }

    if (!transcripts) {
      alert('Transcripts cannot be empty');
      return;
    }

    const token = document.cookie.split('; ').find(row => row.startsWith('token=')).split('=')[1];

    const formData = new FormData();
    formData.append('heading', heading);
    formData.append('content', transcripts);
    formData.append('username', token);
    console.log("Audio Blob:", audioBlob);
    if (audioBlob) {
      formData.append('audio', audioBlob, 'audio.webm');
    } else {
      console.log("No Audio");
      return
    }

    // Log all form data before sending it
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    try {
      const response = await fetch('http://localhost:8000/notes', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        alert('Note saved successfully');
        document.getElementById('save-over').style.display = 'none';
        setHeading(''); // Clear the heading input
        setTranscripts(''); // Clear the transcripts
        onClose();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
    setAudioBlob(null)
  };

  const handleInput = () => {
    if (transcriptsRef.current) {
      setTranscripts(transcriptsRef.current.innerHTML);
    }
  };

  const handleClose = () => {
    onClose({ heading, transcripts, audioBlob });
    document.getElementById('save-over').style.display = 'none';
  };

  return (
    <div id='save-over'>
      <div id='main-save'>
        <div id='save'>
          <div id='pen'>
            <img src={cross} onClick={handleClose} alt="close" />
          </div>
          <button id='save-button' onClick={handleSave}>Save</button>
        </div>
        <h2 id='transcript-heading'>Transcript</h2>
        <input
          id='heading'
          placeholder='Heading'
          value={heading}
          onChange={(e) => setHeading(e.target.value)}
        />
        <div contentEditable id='transcripts' onChange={(e) => setTranscripts(e.target.value)}>{transcripts}</div>
        <div id='tool'>
          <div id="toolbar">
            <button onClick={() => document.execCommand('bold', false, null)}>B</button>
            <button onClick={() => document.execCommand('italic', false, null)}>I</button>
            <button onClick={() => document.execCommand('underline', false, null)}>U</button>
            <button onClick={() => document.execCommand('strikeThrough', false, null)}>S</button>
            <button onClick={() => document.execCommand('undo', false, null)}>Undo</button>
            <button onClick={() => document.execCommand('redo', false, null)}>Redo</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveOver;