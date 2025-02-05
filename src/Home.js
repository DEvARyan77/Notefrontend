import React, { useEffect, useState, useRef } from 'react';
import './Home.css';
import Logo from './logo.png';
import Search from './search.svg';
import Equalizer from './equalizer.png';
import Pen from './pen.svg';
import Gallery from './gallery.png';
import cross from './cross.png';
import SaveOver from './Save';
import NoteCard from './NoteCard';
import Note from './Add'

function Home() {
  const [username, setUsername] = useState('');
  const [activeMenu, setActiveMenu] = useState('home');
  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalTime, setTotalTime] = useState(6);
  const [transcripts, setTranscripts] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [savedNote, setSavedNote] = useState(null);
  const [showNote, setShowNote] = useState(false);
  const popupRef = useRef(null);
  const intervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const playingLineRef = useRef(null);
  const followDotRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [notes, setNotes] = useState([]);
  const [showFavourites, setShowFavourites] = useState(false);
  const [sortAscending, setSortAscending] = useState(true);
  const [searchText, setSearchText] = useState("");

  const toggleNote = () => {
    setShowNote(true);
  };

  const closeNote = () => {
    setShowNote(false);
  };

  const handleSort = () => {
    const sortedNotes = [...notes].sort((a, b) => {
      if (sortAscending) {
        return a.heading.localeCompare(b.heading); // Sort in ascending order
      } else {
        return b.heading.localeCompare(a.heading); // Sort in descending order
      }
    });
  
    setNotes(sortedNotes);
    setSortAscending(!sortAscending); // Toggle sorting order for next click
  };

  const handleMenuClickFavourite = (menu) => {
    setActiveMenu(menu);
    setShowFavourites(menu === 'favourites');
  };

  // Helper function to get a cookie by name
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  };

  useEffect(() => {
    const fetchNotes = async () => {
      const token = document.cookie.split('; ').find(row => row.startsWith('token=')).split('=')[1];
      const response = await fetch('https://tv5cv6-8000.csb.app/fetchNotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: token })
      });
      const data = await response.json();
      setNotes(data);
    };

    fetchNotes();
  }, []);

  useEffect(() => {
    const validateToken = async () => {
      const token = getCookie('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      try {
        const response = await fetch('https://tv5cv6-8000.csb.app/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (response.status !== 200) {
          window.location.href = '/login'; // Redirect to login page
        }
        const data = await response.json();
        setUsername(data.username);
      } catch (error) {
        console.error('Error:', error);
        alert('Validation failed');
      }
    };

    validateToken();
  }, []);

  const togglePopup = () => {
    setIsPopupVisible(!isPopupVisible);
  };

  const handleClickOutside = (event) => {
    if (popupRef.current && !popupRef.current.contains(event.target)) {
      setIsPopupVisible(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
    handleMenuClickFavourite(menu);
  };

  const startRecording = () => {
    setIsRecording(true);
    setTimeLeft(60);
    setElapsedTime(0);
    intervalRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(intervalRef.current);
          stopRecording();
          return 60;
        }
        return prevTime - 1;
      });
      setElapsedTime((prevElapsedTime) => prevElapsedTime + 1);
    }, 1000);

    if (!('webkitSpeechRecognition' in window)) {
      alert('Your browser does not support speech recognition.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      console.log('Transcription:', transcript);
      setTranscripts(transcript);
      document.getElementById('save-over').style.display='flex';
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'network') {
        alert('Network error occurred during speech recognition. Please check your internet connection and try again.');
        stopRecording();
      } else {
        alert(`Speech recognition error: ${event.error}`);
        stopRecording();
      }
    };

    recognition.start();

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = event => {
          setAudioBlob(event.data);
        };
        mediaRecorderRef.current.start();
      })
      .catch(error => {
        console.error('Error accessing microphone:', error);
      });
  };

  const stopRecording = () => {
    clearInterval(intervalRef.current);
    setIsRecording(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      const tracks = mediaRecorderRef.current.stream.getTracks();
      tracks.forEach(track => track.stop());  // Stop each track in the stream
    }
  };

  useEffect(() => {
    let playInterval = null;
    if (isPlaying) {
      playInterval = setInterval(() => {
        setElapsedTime((prevElapsedTime) => {
          if (prevElapsedTime >= totalTime) {
            clearInterval(playInterval);
            setIsPlaying(false);
            return totalTime;
          }
          return prevElapsedTime + 1;
        });
      }, 1000);
    } else if (!isPlaying && playInterval !== null) {
      clearInterval(playInterval);
    }
    return () => clearInterval(playInterval);
  }, [isPlaying, totalTime]);

  useEffect(() => {
    if(elapsedTime===totalTime){
      followDotRef.current.style.transform = `translate(0px,-50%)`;
      setElapsedTime(0);
      setIsPlaying(false);
      return
    }
    if (playingLineRef.current && followDotRef.current) {
      const playingLineWidth = playingLineRef.current.offsetWidth;
      const followDotPosition = (elapsedTime / totalTime) * playingLineWidth;
      followDotRef.current.style.transform = `translate(${followDotPosition}px,-50%)`;
    }
  }, [elapsedTime, totalTime]);


  const handleSaveOverClose = async() => {
    const token = document.cookie.split('; ').find(row => row.startsWith('token=')).split('=')[1];
      const response = await fetch('http://localhost:8000/fetchNotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: token })
      });
      const data = await response.json();
      setNotes(data);
  };
  return (
    <div id="home">
      <div id="left">
        <div id='left' style={{border: 'none'}}>
          <div id='logo'>
            <img src={Logo} alt='Logo'></img>
            <p>AI Notes</p>
          </div>
          <div id='menu' className={activeMenu === 'home' ? 'active' : ''}
          onClick={() => handleMenuClick('home')}>
            <svg width="24" height="24" style={{fill:'gray'}} xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 48 48">
              <path d="M39.5,43h-9c-1.381,0-2.5-1.119-2.5-2.5v-9c0-1.105-0.895-2-2-2h-4c-1.105,0-2,0.895-2,2v9c0,1.381-1.119,2.5-2.5,2.5h-9	C7.119,43,6,41.881,6,40.5V21.413c0-2.299,1.054-4.471,2.859-5.893L23.071,4.321c0.545-0.428,1.313-0.428,1.857,0L39.142,15.52	C40.947,16.942,42,19.113,42,21.411V40.5C42,41.881,40.881,43,39.5,43z"></path>
            </svg>
            <p>Home</p>
          </div>
          <div id='menu' className={activeMenu === 'favourites' ? 'active' : ''}
          onClick={() => handleMenuClick('favourites')}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="currentColor"/>
            </svg>
            <p>Favourites</p>
          </div>
        </div>
        <div id='username'>
          <div className="initial-circle">
            {username.charAt(0).toUpperCase()}
          </div>
          <p>{username}</p>
          <svg color='gray' onClick={togglePopup} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 10l5 5 5-5H7z" fill="currentColor"/>
          </svg>
          {isPopupVisible && (
            <div ref={popupRef} className="popup">
              <ul>
                <li style={{borderBottom:'1px solid gray'}} onClick={() => setIsPopupVisible(false)}>Profile</li>
                <li style={{color:'red'}} onClick={() => {
                  document.cookie = 'token=; Max-Age=0; path=/'; // Delete the token cookie
                  setIsPopupVisible(false);
                  window.location.href = '/login'; // Redirect to login page
                }}>Log Out</li>
              </ul>
            </div>
          )}
        </div>
      </div>
      <div id='right'>
        <div>
        <div id='right-top'>
        <div id='search'>
  <img src={Search} alt='Search' className='gray-image' />
  <input
    placeholder='Search'
    value={searchText}
    onChange={(e) => setSearchText(e.target.value.toLowerCase())} // Convert to lowercase for case-insensitive search
  />
</div>

          <div id='sort' onClick={handleSort}>
            <img src={Equalizer} alt='equilizer'></img>
            <p>Sort</p>
          </div>
        </div>
        <div
  id="middle"
  style={{
    justifyContent:
      notes.filter(note => note.heading.toLowerCase().includes(searchText)).length === 0
        ? 'center'
        : 'left',
  }}
>
  {notes
    .filter((note) => 
      note.heading.toLowerCase().includes(searchText) // Filter based on heading
    )
    .filter((note) => !showFavourites || note.favourite) // Show all or only favourites
    .map((note) => (
      <NoteCard key={note._id} note={note} save={handleSaveOverClose} />
    ))
  }
  {notes.filter(note => note.heading.toLowerCase().includes(searchText)).length === 0 && (
    <p style={{ textAlign: "center", color: "gray" }}>No notes found</p>
  )}
</div>
        </div>
        <div id='Bottom'>
          <div id='Bottom-div'>
            <div>
              <div id='pen' onClick={toggleNote}><img src={Pen} alt='Pen'></img></div>
              <div id='pen' onClick={toggleNote}><img src={Gallery} alt='Gallery'></img></div>
            </div>
            <button
              id='Recorder'
              onClick={isRecording ? stopRecording : startRecording}
              style={{
                borderColor: isRecording ? `rgba(255, 255, 255, ${1 - timeLeft / 60})` : 'transparent',
              }}
            >
              {isRecording ? `${timeLeft}s` : <div id='insideButton'><span className="dot"></span><p>start recording</p></div>}
            </button>
          </div>
        </div>
      </div>


      <SaveOver transcripts={transcripts} setTranscripts={setTranscripts} cross={cross} audioBlob={audioBlob} setAudioBlob={setAudioBlob} onClose={handleSaveOverClose} />
      {showNote && <Note closeNote={closeNote} onClose={handleSaveOverClose}/>}
    </div>
  );
}

export default Home;