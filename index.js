/* https://codepen.io/one20/pen/LGgxQP inspired */

// IIFE
(function() {

  // Set variables
  const playStopBtn = document.querySelector('#play-stop-btn');
  let analyser, frequency, soundsrc;
  let isPlaying = false;

  // Initiator 
  function init() {
    const context = getAudioContext(); 

    if (context) {
      // loadSound(context, 'https://audio-dls.s3.us-east-2.amazonaws.com/CharlestheFirst/Kirra.mp3');
      loadSound(context, 'https://audio-dls.s3.us-east-2.amazonaws.com/Flume/Ezra.mp3');

      d3.select('body')
        .append('svg')
        .attr('width', '100vh')
        .attr('height', '100vh')

    } else {
      alert('Audio API not supported in current browser.');
    }
  }

  // Returns audio context if browser supported 
  function getAudioContext() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    if (window.AudioContext) return new AudioContext();
    return null;
  }

  // Sends HTTP GET request to audio source 
  function loadSound(context, url) {
    // XHR objects are used to interact with servers, to retrieve data from a URL without having to do a page refresh.
    let request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer'; // Specifies type of data contained in the response

    // Runs when the request transaction completes successfully 
    request.onload = function() { 

      context.decodeAudioData(request.response) // Decodes audio file data 
        .then(decodedData => {
          console.log('decodedData', decodedData);
          // => AudioBuffer {length: 9578001, duration: 217.188231292517, sampleRate: 44100, numberOfChannels: 2}

          // Display the play button
          playStopBtn.style.display = 'block';

          // Add event handler when play button is clicked 
          playStopBtn.onclick = () => {
            !isPlaying ? playSound(context, decodedData) : stopSound(); 
          }
        })
        .catch(() => {
          alert('Sound file could not be loaded.');
        })

    }

    // If removed, XHR doesn't finish loading GET request from specified URL. 
    // (XHR finished loading: GET "https://audio-dls.s3.us-east-2.amazonaws.com/Flume/Ezra.mp3".) 
    request.send();
  }

  // Plays audio file & renders visualization
  function playSound(context, data) {
    if (!isPlaying) {
      playStopBtn.className = '';
      playStopBtn.classList.add('stop-btn'); // Changes button icon from play to stop
      playStopBtn.classList.add('fade-out');
      isPlaying = true;
      soundsrc = context.createBufferSource(); // Creates a new AudioBufferSourceNode, to play audio data contained in an AudioBuffer object. 
      analyser = context.createAnalyser(); // Creates an AnalyserNode, used to expose audio time and frequency data.
      analyser.fftSize = 256;
      frequency = new Uint8Array(analyser.frequencyBinCount); // Bin count is half of FFT size, equates to number of data values you have to utilize.
      // At this point, frequency is an array with length of analyser.frequencyBinCount, but no values
      // Uint8Array(1024)
      console.log('frequency before', frequency)
      soundsrc.buffer = data; // Provides the ability to play back audio using an AudioBuffer as the source of the sound data. (AudioBuffer data)

      // Connect one of the node's outputs to a target
      soundsrc.connect(context.destination); 
      soundsrc.connect(analyser);

      // Ended event fired when playback or streaming has stopped b/c the end of the media was reached or b/c no further data is available. 
      soundsrc.addEventListener('ended', function(){
        stopSound();
      });
      
      // Begin playing audio source 
      soundsrc.start();
      render();
    }
  }
  
  // Stop audio source & reset state
  function stopSound(){
    soundsrc.stop();
    isPlaying = false;
    playStopBtn.className = '';
  }

  function render() {
    requestAnimationFrame(render);

    // Copies the frequency data from analyser into our frequency Uint8Array
    analyser.getByteFrequencyData(frequency);

    // D3 stuff
    d3.select('svg').selectAll('circle')
      .data(frequency.slice(0, 20)) // increase the second parameter to add more circles
      .attr('r', function(d) { // r = radius
        return ((d / 255) * 30) + '%';
      })
      .attr('stroke', function(d) { // can also replace stroke with fill for different look
        const r = d,
              g = Math.floor(d/2),
              b = 255;
              
        return `rgb(${r},${g},${b})`
      })
      .enter().append('circle') // enter returns an enter selection which represents the elements that need to be added
      .attr('cx', '50%')
      .attr('cy', '50%')
  }

  init();
})();
