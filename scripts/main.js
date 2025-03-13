document.addEventListener('DOMContentLoaded', () => {
  // Initialize the simulation
  const aiNetwork = new AINetwork();
  aiNetwork.initialize();
  
  // Initialize the visualization
  const visualization = new HexagonalVisualization('visualization');
  
  // Update initial visualization
  visualization.updateAlgorithms(aiNetwork.algorithms);
  
  // UI elements
  const startButton = document.getElementById('start-btn');
  const pauseButton = document.getElementById('pause-btn');
  const mainStatus = document.getElementById('main-status');
  const subCount = document.getElementById('sub-count');
  const cyclesCount = document.getElementById('cycles');
  
  // Simulation loop
  let simulationInterval;
  
  // Start simulation
  startButton.addEventListener('click', () => {
    if (!aiNetwork.isRunning) {
      aiNetwork.isRunning = true;
      startButton.textContent = "Running...";
      startButton.disabled = true;
      mainStatus.textContent = "Active";
      
      // Run simulation loop
      simulationInterval = setInterval(() => {
        // Run a learning cycle
        const stats = aiNetwork.runLearningCycle();
        
        // Update UI
        subCount.textContent = stats.totalAlgorithms - 1; // Subtract main algorithm
        cyclesCount.textContent = stats.cycleCount;
        
        // Update visualization
        visualization.updateAlgorithms(aiNetwork.algorithms);
        
      }, 1000); // Update every second
    }
  });
  
  // Pause simulation
  pauseButton.addEventListener('click', () => {
    if (aiNetwork.isRunning) {
        aiNetwork.isRunning = false;
        clearInterval(simulationInterval);
        startButton.textContent = "Resume Simulation";
        startButton.disabled = false;
        mainStatus.textContent = "Paused";
      }
    });
    
    // Add initial algorithms to populate the visualization
    for (let i = 0; i < 10; i++) {
      aiNetwork.generateSubAlgorithm();
    }
    visualization.updateAlgorithms(aiNetwork.algorithms);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      visualization.resizeCanvas();
      visualization.render();
    });
    
    // Function to generate algorithms in batches
    const generateBatch = (count) => {
      for (let i = 0; i < count; i++) {
        aiNetwork.generateSubAlgorithm();
      }
      visualization.updateAlgorithms(aiNetwork.algorithms);
      subCount.textContent = aiNetwork.algorithms.length - 1;
    };
    
    // Speed up development for demo purposes - automatically create more algorithms
    setTimeout(() => {
      generateBatch(20);
      
      setTimeout(() => {
        generateBatch(30);
        
        setTimeout(() => {
          generateBatch(40);
        }, 3000);
      }, 2000);
    }, 1000);
    
    // Log network statistics to console occasionally for debugging
    setInterval(() => {
      if (aiNetwork.isRunning) {
        console.log('Network Statistics:', aiNetwork.getNetworkStatistics());
      }
    }, 10000);
  });
  
