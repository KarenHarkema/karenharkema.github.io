// Initialize the audio context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// The message to be displayed and "transmitted"
const message = "Hello World, how can I help you today?";

// Convert text to binary representation
function textToBinary(text) {
  return text.split('').map(char => {
    return char.charCodeAt(0).toString(2).padStart(8, '0');
  }).join('');
}

// Create different tones for 0s and 1s to mimic data sounds
function createDataSound(binaryData) {
  const startTime = audioContext.currentTime;
  const duration = 0.03; // Duration of each bit in seconds
  
  // Create a gain node to control volume
  const masterGain = audioContext.createGain();
  masterGain.gain.value = 0.2; // Lower volume to avoid being too loud
  masterGain.connect(audioContext.destination);
  
  // Different frequencies for different bits
  const freqs = {
    '0': [1200, 1800], // Typical modem frequencies
    '1': [2400, 2800],
    'start': [800, 1000, 1200], // Connection initialization sound
    'end': [900, 700, 500]      // Connection termination sound
  };
  
  // Create a start sound (modem handshake)
  playMultiTone(freqs.start, startTime, 0.5, masterGain);
  
  // Play each bit of data
  let currentTime = startTime + 0.8; // Start after the handshake
  
  for (let i = 0; i < binaryData.length; i++) {
    const bit = binaryData[i];
    
    // Create modulation effect for each bit
    const oscillator = audioContext.createOscillator();
    const bitGain = audioContext.createGain();
    
    oscillator.type = i % 2 === 0 ? 'sine' : 'square'; // Alternate waveforms
    oscillator.frequency.setValueAtTime(freqs[bit][0], currentTime);
    oscillator.frequency.setValueAtTime(freqs[bit][1], currentTime + duration/2);
    
    bitGain.gain.setValueAtTime(0, currentTime);
    bitGain.gain.linearRampToValueAtTime(0.8, currentTime + duration * 0.1);
    bitGain.gain.linearRampToValueAtTime(0.8, currentTime + duration * 0.9);
    bitGain.gain.linearRampToValueAtTime(0, currentTime + duration);
    
    oscillator.connect(bitGain);
    bitGain.connect(masterGain);
    
    oscillator.start(currentTime);
    oscillator.stop(currentTime + duration);
    
    currentTime += duration;
  }
  
  // Create an end sound (connection termination)
  playMultiTone(freqs.end, currentTime, 0.5, masterGain);
  
  return currentTime + 0.5; // Return the end time
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
function typeMessage(message, element, endTime) {
  let index = 0;
  
  // Start typing shortly after the handshake sound
  setTimeout(() => {
    const interval = setInterval(() => {
      if (index < message.length) {
        element.textContent += message[index];
        index++;
      } else {
        clearInterval(interval);
      }
    }, 100); // Type each character with a slight delay
  }, 800); // Start typing after the handshake sound
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
    // Clear previous text
    textElement.textContent = '';
    
    // Convert message to binary
    const binaryData = textToBinary(message);
    
    // Create and play the sound
    const endTime = createDataSound(binaryData);
    
    // Display the message character by character
    typeMessage(message, textElement, endTime);
    
    // Disable button during transmission
    button.disabled = true;
    button.textContent = 'Transmitting...';
    
    // Re-enable button after transmission
    setTimeout(() => {
      button.disabled = false;
      button.textContent = 'Start Transmission';
    }, endTime * 1000 + 500);
  });
  
  // Add elements to the container
  container.appendChild(textElement);
  container.appendChild(button);
  
  // Add the container to the document
  document.body.appendChild(container);
}

// Initialize when the page loads
window.addEventListener('load', init);