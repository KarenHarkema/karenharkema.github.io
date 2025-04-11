// Initialize the audio context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// The message to be displayed and "transmitted"
const message = "Hello World, how can I help you today?";

// Function to create sounds based on character ASCII values
function createCharacterSounds(text) {
  const startTime = audioContext.currentTime;
  const messageLength = text.length;
  
  // Calculate character duration to sync with text display
  const typingTimePerChar = 120; // ms per character for typing
  const totalTypingTimeMs = messageLength * typingTimePerChar;
  const charDuration = 0.08; // seconds per character
  
  // Create a gain node to control volume
  const masterGain = audioContext.createGain();
  masterGain.gain.value = 0.2; // Lower volume to avoid being too loud
  masterGain.connect(audioContext.destination);
  
  // Create a start sound (modem handshake)
  const startDuration = 0.4;
  const startFreqs = [800, 1000, 1200, 1400];
  playMultiTone(startFreqs, startTime, startDuration, masterGain);
  
  // Play each character's sound
  let currentTime = startTime + startDuration;
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    
    // Generate frequencies based on ASCII value
    // Base frequency between 600-1200 Hz
    const baseFreq = 600 + (charCode % 26) * 25;
    
    // Secondary frequency based on character type
    let secondFreq;
    if (/[A-Z]/.test(text[i])) {
      // Capital letters - higher range
      secondFreq = 1800 + (charCode % 10) * 40;
    } else if (/[a-z]/.test(text[i])) {
      // Lowercase letters - mid range
      secondFreq = 1400 + (charCode % 12) * 30;
    } else if (/[0-9]/.test(text[i])) {
      // Numbers - lower range
      secondFreq = 1200 + (charCode % 10) * 60;
    } else {
      // Punctuation and special characters - varied range
      secondFreq = 1000 + (charCode % 20) * 45;
    }
    
    // Third frequency component for more complex sound
    const thirdFreq = 2200 + (charCode % 15) * 30;
    
    // Create ASCII-based sound for this character
    createCharacterSound(charCode, currentTime, charDuration, masterGain, baseFreq, secondFreq, thirdFreq);
    
    currentTime += charDuration;
  }
  
  // Create an end sound (connection termination)
  const endDuration = 0.3;
  const endFreqs = [1200, 900, 700, 500];
  playMultiTone(endFreqs, currentTime, endDuration, masterGain);
  
  return {
    endTime: currentTime + endDuration,
    charDuration: charDuration,
    totalDuration: (currentTime + endDuration) - startTime
  };
}

// Create sound for a specific character
function createCharacterSound(charCode, startTime, duration, output, baseFreq, secondFreq, thirdFreq) {
  // Create oscillators for a richer sound
  const oscTypes = ['sine', 'square', 'sawtooth'];
  const gains = [0.6, 0.25, 0.15]; // Different volumes for each component
  
  // Create binary representation for modulation pattern
  const binaryRep = charCode.toString(2).padStart(8, '0');
  const segmentDuration = duration / 8;
  
  // Create primary carrier tone
  const mainOsc = audioContext.createOscillator();
  const mainGain = audioContext.createGain();
  
  mainOsc.type = oscTypes[0];
  mainOsc.frequency.value = baseFreq;
  
  mainGain.gain.setValueAtTime(0, startTime);
  mainGain.gain.linearRampToValueAtTime(gains[0], startTime + 0.01);
  mainGain.gain.linearRampToValueAtTime(gains[0], startTime + duration - 0.01);
  mainGain.gain.linearRampToValueAtTime(0, startTime + duration);
  
  mainOsc.connect(mainGain);
  mainGain.connect(output);
  
  mainOsc.start(startTime);
  mainOsc.stop(startTime + duration);
  
  // Create secondary modulated tone
  const secondOsc = audioContext.createOscillator();
  const secondGain = audioContext.createGain();
  
  secondOsc.type = oscTypes[1];
  secondOsc.frequency.value = secondFreq;
  
  secondGain.gain.setValueAtTime(0, startTime);
  secondGain.gain.linearRampToValueAtTime(gains[1], startTime + 0.01);
  
  // Modulate based on binary representation of char code
  for (let i = 0; i < binaryRep.length; i++) {
    const bitTime = startTime + i * segmentDuration;
    const bitValue = parseInt(binaryRep[i]);
    
    // Modulate frequency slightly based on bit value
    secondOsc.frequency.setValueAtTime(
      bitValue ? secondFreq * 1.1 : secondFreq * 0.9, 
      bitTime
    );
    
    // Modulate amplitude based on bit value
    secondGain.gain.setValueAtTime(
      bitValue ? gains[1] : gains[1] * 0.6,
      bitTime
    );
  }
  
  secondGain.gain.linearRampToValueAtTime(0, startTime + duration);
  
  secondOsc.connect(secondGain);
  secondGain.connect(output);
  
  secondOsc.start(startTime);
  secondOsc.stop(startTime + duration);
  
  // Add third overtone for richness
  const thirdOsc = audioContext.createOscillator();
  const thirdGain = audioContext.createGain();
  
  thirdOsc.type = oscTypes[2];
  thirdOsc.frequency.value = thirdFreq;
  
  thirdGain.gain.setValueAtTime(0, startTime);
  thirdGain.gain.linearRampToValueAtTime(gains[2], startTime + 0.01);
  thirdGain.gain.linearRampToValueAtTime(gains[2], startTime + duration - 0.01);
  thirdGain.gain.linearRampToValueAtTime(0, startTime + duration);
  
  thirdOsc.connect(thirdGain);
  thirdGain.connect(output);
  
  thirdOsc.start(startTime);
  thirdOsc.stop(startTime + duration);
}

// Helper function to play multiple tones in sequence
function playMultiTone(frequencies, startTime, totalDuration, output) {
  const segmentDuration = totalDuration / frequencies.length;
  
  frequencies.forEach((freq, index) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = freq;
    
    gain.gain.setValueAtTime(0, startTime + index * segmentDuration);
    gain.gain.linearRampToValueAtTime(0.8, startTime + index * segmentDuration + segmentDuration * 0.1);
    gain.gain.linearRampToValueAtTime(0.8, startTime + index * segmentDuration + segmentDuration * 0.9);
    gain.gain.linearRampToValueAtTime(0, startTime + (index + 1) * segmentDuration);
    
    oscillator.connect(gain);
    gain.connect(output);
    
    oscillator.start(startTime + index * segmentDuration);
    oscillator.stop(startTime + (index + 1) * segmentDuration);
  });
}

// Function to display the message character by character
function typeMessage(message, element, soundInfo) {
  let index = 0;
  
  // Calculate typing speed to match audio duration
  const typingInterval = soundInfo.charDuration * 1000;
  
  // Start typing shortly after the handshake sound
  setTimeout(() => {
    const interval = setInterval(() => {
      if (index < message.length) {
        element.textContent += message[index];
        index++;
      } else {
        clearInterval(interval);
      }
    }, typingInterval); // Use the same duration as sound per character
  }, 400); // Start typing after the handshake sound
}

// Create HTML elements and start the process
function init() {
  // Create and style the container
  const container = document.createElement('div');
  container.style.fontFamily = 'monospace';
  container.style.fontSize = '20px';
  container.style.padding = '20px';
  container.style.maxWidth = '600px';
  container.style.margin = '0 auto';
  container.style.backgroundColor = '#000';
  container.style.color = '#0f0';
  container.style.borderRadius = '5px';
  
  // Create a text element for the message
  const textElement = document.createElement('div');
  textElement.style.minHeight = '30px';
  
  // Create a button to start the transmission
  const button = document.createElement('button');
  button.textContent = 'Start Transmission';
  button.style.marginTop = '20px';
  button.style.padding = '10px';
  button.style.backgroundColor = '#333';
  button.style.color = '#0f0';
  button.style.border = '1px solid #0f0';
  button.style.cursor = 'pointer';
  
  // Add event listener to button
  button.addEventListener('click', () => {
    // Ensure AudioContext is resumed (needed for browsers that suspend it)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    
    // Clear previous text
    textElement.textContent = '';
    
    // Create and play the sound
    const soundInfo = createCharacterSounds(message);
    
    // Display the message character by character
    typeMessage(message, textElement, soundInfo);
    
    // Disable button during transmission
    button.disabled = true;
    button.textContent = 'Transmitting...';
    
    // Re-enable button after transmission
    setTimeout(() => {
      button.disabled = false;
      button.textContent = 'Start Transmission';
    }, soundInfo.totalDuration * 1000 + 200);
  });
  
  // Add elements to the container
  container.appendChild(textElement);
  container.appendChild(button);
  
  // Add the container to the document
  document.body.appendChild(container);
}

// Initialize when the page loads
window.addEventListener('load', init);