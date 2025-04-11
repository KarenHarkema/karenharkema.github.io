// Initialize the audio context
let audioContext;

// Function to create sounds based on character ASCII values
function createCharacterSounds(text) {
  // Create audio context on first interaction (browser requirement)
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  const startTime = audioContext.currentTime;
  const messageLength = text.length;
  
  // Calculate character duration to sync with text display
  const typingTimePerChar = 120; // ms per character for typing
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

// Create UI elements and start the application
function init() {
  // Create and style the container
  const container = document.createElement('div');
  container.style.fontFamily = 'monospace';
  container.style.fontSize = '18px';
  container.style.padding = '20px';
  container.style.maxWidth = '800px';
  container.style.margin = '0 auto';
  container.style.backgroundColor = '#111';
  container.style.color = '#0f0';
  container.style.borderRadius = '8px';
  container.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
  
  // Create title
  const title = document.createElement('h2');
  title.textContent = 'Digital Sound Text Transmitter';
  title.style.textAlign = 'center';
  title.style.margin = '0 0 20px 0';
  title.style.color = '#0f0';
  
  // Create input area
  const inputLabel = document.createElement('div');
  inputLabel.textContent = 'Enter your text:';
  inputLabel.style.marginBottom = '10px';
  
  const textInput = document.createElement('textarea');
  textInput.placeholder = 'Type or paste your text here...';
  textInput.style.width = '100%';
  textInput.style.height = '100px';
  textInput.style.padding = '10px';
  textInput.style.backgroundColor = '#222';
  textInput.style.color = '#0f0';
  textInput.style.border = '1px solid #0f0';
  textInput.style.borderRadius = '4px';
  textInput.style.resize = 'vertical';
  textInput.style.fontFamily = 'monospace';
  textInput.style.marginBottom = '15px';
  
  // Create a text element for the output
  const outputLabel = document.createElement('div');
  outputLabel.textContent = 'Transmission output:';
  outputLabel.style.marginBottom = '10px';
  
  const outputContainer = document.createElement('div');
  outputContainer.style.backgroundColor = '#000';
  outputContainer.style.border = '1px solid #0f0';
  outputContainer.style.borderRadius = '4px';
  outputContainer.style.padding = '15px';
  outputContainer.style.minHeight = '100px';
  outputContainer.style.marginBottom = '15px';
  outputContainer.style.overflowY = 'auto';
  outputContainer.style.maxHeight = '300px';
  
  const outputText = document.createElement('div');
  outputContainer.appendChild(outputText);
  
  // Create controls
  const controlsContainer = document.createElement('div');
  controlsContainer.style.display = 'flex';
  controlsContainer.style.justifyContent = 'space-between';
  controlsContainer.style.marginTop = '10px';
  
  // Create a button to start the transmission
  const transmitButton = document.createElement('button');
  transmitButton.textContent = 'Start Transmission';
  transmitButton.style.padding = '10px 20px';
  transmitButton.style.backgroundColor = '#222';
  transmitButton.style.color = '#0f0';
  transmitButton.style.border = '1px solid #0f0';
  transmitButton.style.borderRadius = '4px';
  transmitButton.style.cursor = 'pointer';
  transmitButton.style.fontFamily = 'monospace';
  transmitButton.style.fontSize = '16px';
  
  // Create a button to clear everything
  const clearButton = document.createElement('button');
  clearButton.textContent = 'Clear All';
  clearButton.style.padding = '10px 20px';
  clearButton.style.backgroundColor = '#222';
  clearButton.style.color = '#f55';
  clearButton.style.border = '1px solid #f55';
  clearButton.style.borderRadius = '4px';
  clearButton.style.cursor = 'pointer';
  clearButton.style.fontFamily = 'monospace';
  clearButton.style.fontSize = '16px';
  
  // Create a status indicator
  const statusIndicator = document.createElement('div');
  statusIndicator.textContent = 'Ready';
  statusIndicator.style.padding = '10px';
  statusIndicator.style.textAlign = 'center';
  statusIndicator.style.color = '#0f0';
  statusIndicator.style.fontSize = '14px';
  
  // Add controls to the container
  controlsContainer.appendChild(transmitButton);
  controlsContainer.appendChild(clearButton);
  
  // Add event listener to the transmit button
  transmitButton.addEventListener('click', () => {
    const text = textInput.value.trim();
    
    if (!text) {
      statusIndicator.textContent = 'Error: Please enter some text';
      statusIndicator.style.color = '#f55';
      return;
    }
    
    // Clear previous output
    outputText.textContent = '';
    
    // Update status
    statusIndicator.textContent = 'Transmitting...';
    statusIndicator.style.color = '#ff0';
    
    // Create and play the sound
    const soundInfo = createCharacterSounds(text);
    
    // Display the message character by character
    typeMessage(text, outputText, soundInfo);
    
    // Disable button during transmission
    transmitButton.disabled = true;
    transmitButton.style.opacity = '0.5';
    
    // Re-enable button after transmission
    setTimeout(() => {
      transmitButton.disabled = false;
      transmitButton.style.opacity = '1';
      statusIndicator.textContent = 'Transmission complete';
      statusIndicator.style.color = '#0f0';
    }, soundInfo.totalDuration * 1000 + 200);
  });
  
  // Add event listener to the clear button
  clearButton.addEventListener('click', () => {
    textInput.value = '';
    outputText.textContent = '';
    statusIndicator.textContent = 'Ready';
    statusIndicator.style.color = '#0f0';
  });
  
  // Add elements to the container
  container.appendChild(title);
  container.appendChild(inputLabel);
  container.appendChild(textInput);
  container.appendChild(outputLabel);
  container.appendChild(outputContainer);
  container.appendChild(controlsContainer);
  container.appendChild(statusIndicator);
  
  // Add the container to the document
  document.body.appendChild(container);
  
  // Add default text to the input
  textInput.value = "Hello World, how can I help you today?";
}

// Initialize when the page loads
window.addEventListener('load', init);