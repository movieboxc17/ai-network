class Algorithm {
  constructor(id, isMain = false, parent = null) {
    this.id = id;
    this.isMain = isMain;
    this.parent = parent;
    this.children = [];
    this.efficiency = isMain ? 100 : Math.random() * 50 + 30; // 30-80 for sub-algorithms
    this.learningRate = Math.random() * 0.2 + 0.05; // 0.05-0.25
    this.age = 0;
    this.generation = parent ? parent.generation + 1 : 0;
    this.x = 0;
    this.y = 0;
    this.color = isMain ? 'rgba(231, 76, 60, 0.9)' : `rgba(52, 152, 219, ${Math.random() * 0.4 + 0.5})`;
    this.size = isMain ? 40 : Math.max(15, 35 - this.generation * 3);
    this.connections = [];
    this.lastImprovement = 0;
    this.specialization = isMain ? 'Admin' : this.generateSpecialization();
  }

  generateSpecialization() {
    const specializations = [
      'Data Processing', 'Pattern Recognition', 'Optimization',
      'Decision Making', 'Classification', 'Prediction',
      'Clustering', 'Feature Extraction', 'Anomaly Detection'
    ];
    return specializations[Math.floor(Math.random() * specializations.length)];
  }

  learn() {
    // Simulate learning process
    if (!this.isMain) {
      const previousEfficiency = this.efficiency;
      
      // Learning formula with diminishing returns
      const maxEfficiency = 95;
      const potentialGain = this.learningRate * (1 - this.efficiency / maxEfficiency);
      const randomFactor = Math.random() * 0.4 - 0.2; // -0.2 to 0.2 variability
      
      this.efficiency += potentialGain + randomFactor;
      this.efficiency = Math.min(this.efficiency, maxEfficiency);
      this.efficiency = Math.max(this.efficiency, 0);
      
      this.lastImprovement = this.efficiency - previousEfficiency;
    }
    
    this.age++;
    return this.efficiency;
  }

  addChild(child) {
    this.children.push(child);
    this.connections.push({
      source: this,
      target: child,
      strength: Math.random() * 0.5 + 0.5
    });
  }

  getStatus() {
    let status = '';
    if (this.isMain) {
      status = 'Supervising';
    } else {
      if (this.efficiency > 90) status = 'Excellent';
      else if (this.efficiency > 75) status = 'Efficient';
      else if (this.efficiency > 50) status = 'Learning';
      else status = 'Developing';
    }
    return status;
  }

  getInfo() {
    return {
      id: this.id,
      type: this.isMain ? 'Main Algorithm' : 'Sub-Algorithm',
      specialization: this.specialization,
      efficiency: this.efficiency.toFixed(2),
      learningRate: this.learningRate.toFixed(3),
      age: this.age,
      generation: this.generation,
      status: this.getStatus(),
      improvement: this.lastImprovement.toFixed(4)
    };
  }
}

class AINetwork {
  constructor() {
    this.algorithms = [];
    this.mainAlgorithm = null;
    this.cycleCount = 0;
    this.replacementCount = 0;
    this.isRunning = false;
  }

  initialize() {
    this.mainAlgorithm = new Algorithm('main', true);
    this.algorithms.push(this.mainAlgorithm);
  }

  generateSubAlgorithm() {
    if (!this.mainAlgorithm) return null;
    
    const id = `sub-${this.algorithms.length}`;
    const parent = this.selectParent();
    const subAlgorithm = new Algorithm(id, false, parent);
    
    this.algorithms.push(subAlgorithm);
    parent.addChild(subAlgorithm);
    
    return subAlgorithm;
  }

  selectParent() {
    // Select a parent algorithm based on a weighted probability
    // Main algorithm has higher chance at the beginning
    // As the system evolves, better performing sub-algorithms get higher chances
    if (this.algorithms.length < 5 || Math.random() < 0.3) {
      return this.mainAlgorithm;
    }
    
    // Filter out algorithms that already have too many children
    const potentialParents = this.algorithms.filter(
      algo => algo.children.length < 5 && algo.generation < 5
    );
    
    if (potentialParents.length === 0) return this.mainAlgorithm;
    
    // Sort by efficiency (weighted with age)
    potentialParents.sort((a, b) => {
      const scoreA = a.efficiency * (1 - a.generation * 0.1);
      const scoreB = b.efficiency * (1 - b.generation * 0.1);
      return scoreB - scoreA;
    });
    
    // Select from top performers with slight randomness
    const topCount = Math.min(5, Math.ceil(potentialParents.length / 3));
    const selectedIndex = Math.floor(Math.random() * topCount);
    return potentialParents[selectedIndex];
  }

  runLearningCycle() {
    if (!this.isRunning) return;
    
    this.cycleCount++;
    
    // Every algorithm learns
    this.algorithms.forEach(algo => algo.learn());
    
    // Check if we need to generate a new sub-algorithm
    if (this.algorithms.length < 500 && this.cycleCount % 5 === 0) {
      this.generateSubAlgorithm();
    }
    
    // If we have 500 algorithms, replace the weakest with a new one
    if (this.algorithms.length >= 500 && this.cycleCount % 10 === 0) {
      this.replaceWeakestAlgorithm();
    }
    
    return {
      totalAlgorithms: this.algorithms.length,
      cycleCount: this.cycleCount,
      replacementCount: this.replacementCount
    };
  }

  replaceWeakestAlgorithm() {
    // Get all non-main algorithms
    const subAlgorithms = this.algorithms.filter(algo => !algo.isMain);
    
    // Sort by efficiency (lowest first)
    subAlgorithms.sort((a, b) => a.efficiency - b.efficiency);
    
    // Get the weakest
    const weakest = subAlgorithms[0];
    
    // Remove it from its parent's children list
    if (weakest.parent) {
      const index = weakest.parent.children.indexOf(weakest);
      if (index !== -1) {
        weakest.parent.children.splice(index, 1);
      }
    }
    
    // Remove it from algorithms array
    const weakestIndex = this.algorithms.indexOf(weakest);
    if (weakestIndex !== -1) {
      this.algorithms.splice(weakestIndex, 1);
    }
    
    // Generate a replacement
    this.generateSubAlgorithm();
    this.replacementCount++;
  }

  getNetworkStatistics() {
    const subAlgorithms = this.algorithms.filter(algo => !algo.isMain);
    
    const avgEfficiency = subAlgorithms.reduce((sum, algo) => sum + algo.efficiency, 0) / 
                          (subAlgorithms.length || 1);
    
    const generations = {};
    subAlgorithms.forEach(algo => {
      generations[algo.generation] = (generations[algo.generation] || 0) + 1;
    });
    
    return {
      totalAlgorithms: this.algorithms.length,
      mainAlgorithmEfficiency: this.mainAlgorithm ? this.mainAlgorithm.efficiency : 0,
      averageSubAlgorithmEfficiency: avgEfficiency,
      generationDistribution: generations,
      cycleCount: this.cycleCount,
      replacementCount: this.replacementCount
    };
  }
}
