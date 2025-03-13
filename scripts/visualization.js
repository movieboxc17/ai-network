class HexagonalVisualization {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.selectedAlgorithm = null;
    
    this.hexHeight = 60;
    this.hexWidth = this.hexHeight * 0.866; // sqrt(3)/2
    
    this.resizeCanvas();
    this.setupEventListeners();
  }
  
  resizeCanvas() {
    this.canvas.width = this.canvas.parentElement.clientWidth;
    this.canvas.height = this.canvas.parentElement.clientHeight;
    
    // Center the view
    this.offsetX = this.canvas.width / 2;
    this.offsetY = this.canvas.height / 3;
  }
  
  setupEventListeners() {
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // Mouse wheel for zooming
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomIntensity = 0.1;
      const zoom = e.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity;
      
      // Calculate mouse position relative to canvas
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calculate mouse position in world coordinates
      const worldX = (mouseX - this.offsetX) / this.scale;
      const worldY = (mouseY - this.offsetY) / this.scale;
      
      // Apply zoom
      this.scale *= zoom;
      this.scale = Math.min(Math.max(0.2, this.scale), 5); // Limit scale between 0.2 and 5
      
      // Adjust offset to zoom centered on mouse position
      this.offsetX = mouseX - worldX * this.scale;
      this.offsetY = mouseY - worldY * this.scale;
      
      this.render();
    });
    
    // Mouse drag for panning
    this.canvas.addEventListener('mousedown', (e) => {
      this.dragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.canvas.style.cursor = 'grabbing';
    });
    
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.dragging) {
        this.offsetX += e.clientX - this.lastX;
        this.offsetY += e.clientY - this.lastY;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        this.render();
      } else {
        // Check for hovering over hexagons
        this.checkHover(e);
      }
    });
    
    window.addEventListener('mouseup', () => {
      this.dragging = false;
      this.canvas.style.cursor = 'default';
    });
    
    // Click to select algorithm
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Transform to world coordinates
      const worldX = (mouseX - this.offsetX) / this.scale;
      const worldY = (mouseY - this.offsetY) / this.scale;
      
      this.selectedAlgorithm = null;
      
      // Check if any algorithm is clicked
      for (const algo of this.algorithms) {
        if (this.isPointInHexagon(worldX, worldY, algo.x, algo.y, algo.size)) {
          this.selectedAlgorithm = algo;
          this.updateInfoPanel(algo);
          break;
        }
      }
      
      this.render();
    });
    
    // Zoom buttons
    document.getElementById('zoom-in').addEventListener('click', () => {
      this.scale *= 1.2;
      this.scale = Math.min(this.scale, 5);
      this.render();
    });
    
    document.getElementById('zoom-out').addEventListener('click', () => {
      this.scale *= 0.8;
      this.scale = Math.max(this.scale, 0.2);
      this.render();
    });
    
    document.getElementById('reset-view').addEventListener('click', () => {
      this.scale = 1;
      this.offsetX = this.canvas.width / 2;
      this.offsetY = this.canvas.height / 3;
      this.render();
    });
  }
  
  checkHover(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Transform to world coordinates
    const worldX = (mouseX - this.offsetX) / this.scale;
    const worldY = (mouseY - this.offsetY) / this.scale;
    
    let hovering = false;
    
    for (const algo of this.algorithms) {
      if (this.isPointInHexagon(worldX, worldY, algo.x, algo.y, algo.size)) {
        this.canvas.style.cursor = 'pointer';
        hovering = true;
        break;
      }
    }
    
    if (!hovering) {
      this.canvas.style.cursor = 'default';
    }
  }
  
  isPointInHexagon(x, y, hexX, hexY, size) {
    // Convert from world coordinates to local hexagon coordinates
    const localX = x - hexX;
    const localY = y - hexY;
    
    // Check if point is inside the hexagon
    const q2x = Math.abs(localX);
    const q2y = Math.abs(localY);
    
    if (q2x > size * 0.866 || q2y > size) return false;
    return size * 0.866 * 2 * size - size * 0.866 * q2y - size * q2x >= 0;
  }
  
  updateAlgorithms(algorithms) {
    this.algorithms = algorithms;
    this.layoutAlgorithms();
    this.render();
  }
  
  layoutAlgorithms() {
    if (!this.algorithms || this.algorithms.length === 0) return;
  
    const mainAlgo = this.algorithms.find(algo => algo.isMain);
    if (!mainAlgo) return;
  
    // Position the main algorithm at the center
    mainAlgo.x = 0;
    mainAlgo.y = 0;
  
    // Hexagonal directions (six directions in a hexagonal grid)
    const directions = [
      { x: this.hexWidth * 2, y: 0 },              // right
      { x: this.hexWidth, y: this.hexHeight * 1.5 },   // bottom right
      { x: -this.hexWidth, y: this.hexHeight * 1.5 },  // bottom left
      { x: -this.hexWidth * 2, y: 0 },             // left
      { x: -this.hexWidth, y: -this.hexHeight * 1.5 }, // top left
      { x: this.hexWidth, y: -this.hexHeight * 1.5 }   // top right
    ];
  
    // Track occupied positions in the grid
    const occupiedPositions = new Set();
    occupiedPositions.add(`0,0`); // Mark center as occupied
  
    // Process algorithms by parent-child relationship (breadth-first)
    const queue = [mainAlgo];
    const processed = new Set([mainAlgo.id]);
  
    while (queue.length > 0) {
      const parent = queue.shift();
    
      // Process all children of this parent
      if (parent.children && parent.children.length > 0) {
        // Sort children by efficiency for more stable layout
        const sortedChildren = [...parent.children].sort((a, b) => b.efficiency - a.efficiency);
      
        // Calculate positions for children
        let directionIndex = 0;
        for (const child of sortedChildren) {
          if (processed.has(child.id)) continue;
        
          // Find available position for this child
          let posFound = false;
          let level = 1;
          let childX, childY;
        
          while (!posFound && level <= 10) { // Limit search depth
            // Try positions in increasing distances
            for (let i = 0; i < directions.length; i++) {
              const dir = (directionIndex + i) % directions.length;
              childX = parent.x + directions[dir].x * level;
              childY = parent.y + directions[dir].y * level;
            
              const posKey = `${Math.round(childX)},${Math.round(childY)}`;
              if (!occupiedPositions.has(posKey)) {
                occupiedPositions.add(posKey);
                posFound = true;
                directionIndex = (dir + 1) % directions.length; // Start from next direction for next child
                break;
              }
            }
            level++;
          }
        
          if (!posFound) {
            // If no position found, place with offset from parent
            childX = parent.x + (Math.random() - 0.5) * this.hexWidth * 4;
            childY = parent.y + (Math.random() - 0.5) * this.hexHeight * 4;
          }
        
          // Set position
          child.x = childX;
          child.y = childY;
        
          // Add to processed and queue
          processed.add(child.id);
          queue.push(child);
        }
      }
    }
  
    // For any algorithms not processed (no parent-child relationship),
    // place them in a ring around the outside
    this.algorithms.forEach(algo => {
      if (!processed.has(algo.id)) {
        const angle = Math.random() * Math.PI * 2;
        const distance = this.hexHeight * 5;
        algo.x = Math.cos(angle) * distance;
        algo.y = Math.sin(angle) * distance;
        processed.add(algo.id);
      }
    });
  }  
  render() {
    if (!this.algorithms) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw connections first (so they're behind the hexagons)
    this.drawConnections();
    
    // Draw hexagons
    this.algorithms.forEach(algo => {
      this.drawHexagon(algo);
    });
  }
  
  drawConnections() {
    this.ctx.save();
    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.scale, this.scale);
    
    this.algorithms.forEach(algo => {
      if (algo.children && algo.children.length > 0) {
        algo.children.forEach(child => {
          this.ctx.beginPath();
          this.ctx.moveTo(algo.x, algo.y);
          this.ctx.lineTo(child.x, child.y);
          
          // Style based on relationship
          const gradient = this.ctx.createLinearGradient(algo.x, algo.y, child.x, child.y);
          gradient.addColorStop(0, algo.color);
          gradient.addColorStop(1, child.color);
          
          this.ctx.strokeStyle = gradient;
          this.ctx.lineWidth = Math.max(1, 3 * (child.efficiency / 100));
          this.ctx.globalAlpha = 0.6;
          this.ctx.stroke();
        });
      }
    });
    
    this.ctx.restore();
  }
  
  drawHexagon(algo) {
    this.ctx.save();
    this.ctx.translate(this.offsetX, this.offsetY);
    this.ctx.scale(this.scale, this.scale);
    
    const x = algo.x;
    const y = algo.y;
    const size = algo.size;
    
    // Create hexagon path
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI / 3) - (Math.PI / 6);
      const hx = x + size * Math.cos(angle);
      const hy = y + size * Math.sin(angle);
      
      if (i === 0) {
        this.ctx.moveTo(hx, hy);
      } else {
        this.ctx.lineTo(hx, hy);
      }
    }
    this.ctx.closePath();
    
    // Fill with algorithm color
    this.ctx.fillStyle = algo === this.selectedAlgorithm ? 
                         'rgba(46, 204, 113, 0.9)' : 
                         algo.color;
    
    this.ctx.fill();
    
    // Draw border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.lineWidth = algo.isMain ? 3 : 1.5;
    this.ctx.stroke();
    
    // Add algorithm ID text
    this.ctx.fillStyle = 'white';
    this.ctx.font = `${Math.max(10, size / 3)}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // For main algorithm, display "Main"
    const label = algo.isMain ? 'Main' : algo.id.split('-')[1];
    this.ctx.fillText(label, x, y);
    
    // Draw efficiency indicator below the hexagon
    if (!algo.isMain) {
      this.ctx.fillStyle = this.getEfficiencyColor(algo.efficiency);
      this.ctx.fillRect(x - size / 2, y + size + 5, size, 3);
    }
    
    this.ctx.restore();
  }
  
  getEfficiencyColor(efficiency) {
    // Color gradient from red (low efficiency) to green (high efficiency)
    const red = Math.floor(255 * (1 - efficiency / 100));
    const green = Math.floor(255 * (efficiency / 100));
    return `rgb(${red}, ${green}, 0)`;
  }
  
  updateInfoPanel(algorithm) {
    const infoPanel = document.getElementById('algorithm-info');
    if (!algorithm) {
      infoPanel.innerHTML = '<p>Click on a hexagon to view algorithm details</p>';
      return;
    }
    
    const info = algorithm.getInfo();
    
    infoPanel.innerHTML = `
      <div class="algo-details">
        <p><strong>ID:</strong> ${info.id}</p>
        <p><strong>Type:</strong> ${info.type}</p>
        <p><strong>Specialization:</strong> ${info.specialization}</p>
        <p><strong>Efficiency:</strong> ${info.efficiency}%</p>
        <p><strong>Learning Rate:</strong> ${info.learningRate}</p>
        <p><strong>Age:</strong> ${info.age} cycles</p>
        <p><strong>Generation:</strong> ${info.generation}</p>
        <p><strong>Status:</strong> ${info.status}</p>
        <p><strong>Last Improvement:</strong> ${info.improvement}%</p>
      </div>
    `;
  }
}
