document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const visualization = document.getElementById('visualization');
    const intelligenceLevelEl = document.getElementById('intelligence-level');
    const generationCountEl = document.getElementById('generation-count');
    const networkCountEl = document.getElementById('network-count');
    const checkpointCountEl = document.getElementById('checkpoint-count');
    const startEvolutionBtn = document.getElementById('start-evolution');
    const pauseEvolutionBtn = document.getElementById('pause-evolution');
    const resetSimulationBtn = document.getElementById('reset-simulation');
    const addNetworkBtn = document.getElementById('add-network');
    const addCheckpointBtn = document.getElementById('add-checkpoint');
    const connectNodesBtn = document.getElementById('connect-nodes');
    const trainAllBtn = document.getElementById('train-all');
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomResetBtn = document.getElementById('zoom-reset');
    const speedSlider = document.getElementById('speed-slider');
    const speedValue = document.getElementById('speed-value');
    const nodeInfo = document.getElementById('node-info');
    const nodeActions = document.getElementById('node-actions');
    const capabilitiesList = document.getElementById('capabilities-list');
    const selectedType = document.getElementById('selected-type');
    const logContainer = document.getElementById('log-container');
    
    // Global variables
    let nodes = [];
    let connections = [];
    let selectedNode = null;
    let connectingMode = false;
    let connectingSource = null;
    let evolutionRunning = false;
    let evolutionInterval;
    let intelligenceLevel = 1;
    let generationCount = 1;
    let simulationSpeed = 1;
    
    // Capability definitions
    const capabilities = {
        LEARN: { id: 'learn', name: 'Learning', icon: '🧠', color: '#4CAF50', description: 'Ability to learn from checkpoints' },
        TEACH: { id: 'teach', name: 'Teaching', icon: '👨‍🏫', color: '#2196F3', description: 'Ability to teach other algorithms' },
        CREATE: { id: 'create', name: 'Creation', icon: '🛠️', color: '#FF9800', description: 'Ability to create new algorithms' },
        CONNECT: { id: 'connect', name: 'Connection', icon: '🔗', color: '#9C27B0', description: 'Ability to find and establish new connections' },
        IMPROVE: { id: 'improve', name: 'Self-Improvement', icon: '📈', color: '#F44336', description: 'Ability to improve itself over time' },
        ANALYZE: { id: 'analyze', name: 'Analysis', icon: '🔍', color: '#607D8B', description: 'Ability to analyze and understand data' },
        ADAPT: { id: 'adapt', name: 'Adaptation', icon: '🦎', color: '#795548', description: 'Ability to adapt to changing conditions' },
        OPTIMIZE: { id: 'optimize', name: 'Optimization', icon: '⚡', color: '#FFEB3B', description: 'Ability to optimize other algorithms' }
    };
    
    // Connection type definitions
    const connectionTypes = {
        LEARNING: { name: 'Learning', class: 'learning-connection', signalClass: 'learning-signal' },
        KNOWLEDGE: { name: 'Knowledge', class: 'knowledge-connection', signalClass: 'knowledge-signal' },
        RESOURCE: { name: 'Resource', class: 'resource-connection', signalClass: 'resource-signal' }
    };
    
    // Add a log entry
    function addLog(message, type = 'info') {
        const log = document.createElement('div');
        log.className = `log-entry ${type}`;
        log.innerHTML = `<span class="log-time">${new Date().toLocaleTimeString()}</span> ${message}`;
        logContainer.prepend(log);
        
        // Limit log entries
        if (logContainer.children.length > 100) {
            logContainer.removeChild(logContainer.lastChild);
        }
    }
    
    // Create an algorithm node
    function createAlgorithmNode(x, y, intelligence = 1, isPrimary = false, capabilities = []) {
        const node = document.createElement('div');
        node.className = 'node algorithm-node';
        
        if (isPrimary) {
            node.classList.add('primary');
        }
        
        // Size based on intelligence and primary status
        const baseSize = isPrimary ? 60 : 40;
        const sizeVariation = isPrimary ? 10 : 20;
        const size = baseSize + Math.floor(Math.random() * sizeVariation);
        
        node.style.width = `${size}px`;
        node.style.height = `${size}px`;
        
        // Find a non-overlapping position
        let left, top;
        if (x !== undefined && y !== undefined) {
            const position = findNonOverlappingPosition(x, y, size);
            left = position.x - size/2;
            top = position.y - size/2;
        } else {
            // Random position if not specified
            const position = findNonOverlappingPosition(
                Math.random() * (visualization.offsetWidth - size) + size/2,
                Math.random() * (visualization.offsetHeight - size) + size/2,
                size
            );
            left = position.x - size/2;
            top = position.y - size/2;
        }
        
        node.style.left = `${left}px`;
        node.style.top = `${top}px`;
        
        const nodeId = `algorithm-${nodes.length + 1}`;
        node.id = nodeId;
        node.innerHTML = `<span>${isPrimary ? 'P' : 'A'}${nodes.length + 1}</span>`;
        
        // Initialize with capabilities - primary gets more over time
        const nodeCapabilities = [...capabilities];
        if (isPrimary && capabilities.length === 0) {
            nodeCapabilities.push(capabilities.LEARN.id);
        }
        
        // Add limitations and specialization properties
        const specialization = Math.random() > 0.5 ? 'processing' : 'memory';
        const resourceLimit = isPrimary ? Infinity : 100 + (intelligence * 20);
        const evolutionSpeed = isPrimary ? 1.5 : 0.8 + (Math.random() * 0.4);
        
        const nodeData = {
            id: nodeId,
            type: 'algorithm',
            element: node,
            connections: [],
            x: left + size/2,
            y: top + size/2,
            size: size,
            intelligence: intelligence,
            learningRate: isPrimary ? 0.2 : (0.1 + (Math.random() * 0.1)),
            createdAt: Date.now(),
            generation: isPrimary ? 1 : generationCount,
            children: [],
            parent: null,
            capabilities: nodeCapabilities,
            knowledge: {
                algorithms: 0,
                checkpoints: 0,
                connections: 0
            },
            isPrimary: isPrimary,
            // New properties for limitations and specialization
            specialization: specialization,
            resourceUsage: 0,
            resourceLimit: resourceLimit,
            evolutionSpeed: evolutionSpeed,
            lastEvolvedAt: Date.now(),
            failedAttempts: 0,
            maxCapabilities: isPrimary ? 10 : 3 + Math.floor(intelligence / 2)
        };
        
        nodes.push(nodeData);
        updateNetworkCount();
        
        node.addEventListener('click', () => selectNode(nodeData));
        visualization.appendChild(node);
        
        // Animation for new node
        node.classList.add('grow');
        setTimeout(() => node.classList.remove('grow'), 500);
        
        makeDraggable(node, nodeData);
        
        if (isPrimary) {
            addLog(`Primary algorithm initialized with intelligence level ${intelligence}`, 'success');
        } else {
            const limitations = specialization === 'processing' ? 
                'faster learning but limited storage' : 
                'larger storage but slower processing';
            addLog(`New algorithm created with ${limitations}`);
        }
        
        return nodeData;
    }
    
    // Create a checkpoint node
    function createCheckpointNode(x, y, knowledge = 100, teachingAbilities = []) {
        const node = document.createElement('div');
        node.className = 'node checkpoint-node';
        
        const size = Math.floor(Math.random() * 15) + 30; // 30-45px
        node.style.width = `${size}px`;
        node.style.height = `${size}px`;
        
        // Find non-overlapping position
        let left, top;
        if (x !== undefined && y !== undefined) {
            const position = findNonOverlappingPosition(x, y, size);
            left = position.x - size/2;
            top = position.y - size/2;
        } else {
            const position = findNonOverlappingPosition(
                Math.random() * (visualization.offsetWidth - size) + size/2,
                Math.random() * (visualization.offsetHeight - size) + size/2,
                size
            );
            left = position.x - size/2;
            top = position.y - size/2;
        }
        
        node.style.left = `${left}px`;
        node.style.top = `${top}px`;
        
        const nodeId = `checkpoint-${nodes.length + 1}`;
        node.id = nodeId;
        node.innerHTML = `<span>C${nodes.length + 1}</span>`;
        
        // If teaching abilities not specified, randomly pick 1-3 capabilities
        if (!teachingAbilities || teachingAbilities.length === 0) {
            const allCapabilities = Object.values(capabilities);
            teachingAbilities = [];
            const numCapabilities = Math.floor(Math.random() * 3) + 1;
            
            for (let i = 0; i < numCapabilities; i++) {
                const randomCapability = allCapabilities[Math.floor(Math.random() * allCapabilities.length)];
                if (!teachingAbilities.includes(randomCapability.id)) {
                    teachingAbilities.push(randomCapability.id);
                }
            }
        }
        
        const nodeData = {
            id: nodeId,
            type: 'checkpoint',
            element: node,
            connections: [],
            x: left + size/2,
            y: top + size/2,
            size: size,
            knowledge: knowledge,
            accuracy: 85 + Math.random() * 15, // 85-100%
            teachingAbilities: teachingAbilities,
            createdAt: Date.now()
        };
        
        nodes.push(nodeData);
        updateCheckpointCount();
        
        node.addEventListener('click', () => selectNode(nodeData));
        visualization.appendChild(node);
        
        // Animation for new node
        node.classList.add('grow');
        setTimeout(() => node.classList.remove('grow'), 500);
        
        makeDraggable(node, nodeData);
        
        addLog(`Checkpoint created with ${teachingAbilities.length} teaching capabilities`);
        
        return nodeData;
    }
    
    // Check if a position would cause overlap with existing nodes
    function wouldOverlap(x, y, size, nodeToIgnore = null) {
        for (const node of nodes) {
            if (nodeToIgnore && node.id === nodeToIgnore.id) continue;
            
            const dx = node.x - x;
            const dy = node.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDistance = (node.size + size) / 2 + 10; // Add 10px padding
            
            if (distance < minDistance) {
                return true;
            }
        }
        return false;
    }
    
    // Find a non-overlapping position near the desired coordinates
    function findNonOverlappingPosition(desiredX, desiredY, size, nodeToIgnore = null) {
        // Try the original position first
        if (!wouldOverlap(desiredX, desiredY, size, nodeToIgnore)) {
            return { x: desiredX, y: desiredY };
        }
        
        // Try positions in expanding spirals
        const maxAttempts = 30;
        const stepSize = 20;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const radius = attempt * stepSize;
            const segments = Math.max(8, Math.floor(radius / 10));
            
            for (let i = 0; i < segments; i++) {
                const angle = (i / segments) * Math.PI * 2;
                const testX = desiredX + Math.cos(angle) * radius;
                const testY = desiredY + Math.sin(angle) * radius;
                
                // Ensure within bounds of visualization
                if (testX < size/2 || testX > visualization.offsetWidth - size/2 ||
                    testY < size/2 || testY > visualization.offsetHeight - size/2) {
                    continue;
                }
                
                if (!wouldOverlap(testX, testY, size, nodeToIgnore)) {
                    return { x: testX, y: testY };
                }
            }
        }
        
        // If all fails, return a random position
        return {
            x: Math.random() * (visualization.offsetWidth - size) + size/2,
            y: Math.random() * (visualization.offsetHeight - size) + size/2
        };
    }
    
    // Add force-directed layout to separate overlapping nodes
    function applyForceDirectedLayout() {
        // Only apply if there are enough nodes
        if (nodes.length < 2) return;
        
        const repulsionForce = 0.3; // Strength of repulsion between nodes
        const minDistance = 5; // Minimum distance to consider for force calculation
        
        // Apply forces between each pair of nodes
        for (let i = 0; i < nodes.length; i++) {
            const nodeA = nodes[i];
            
            for (let j = i + 1; j < nodes.length; j++) {
                const nodeB = nodes[j];
                
                const dx = nodeB.x - nodeA.x;
                const dy = nodeB.y - nodeA.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const minSeparation = (nodeA.size + nodeB.size) / 2 + 10;
                
                // If nodes are overlapping or too close, apply repulsion force
                if (distance < minSeparation) {
                    // Calculate force direction
                    const force = repulsionForce * (minSeparation - distance) / minSeparation;
                    
                                        // Avoid division by zero
                                        const effectiveDistance = Math.max(distance, minDistance);
                                        const fx = (dx / effectiveDistance) * force;
                                        const fy = (dy / effectiveDistance) * force;
                                        
                                        // Move nodes apart (primary nodes move less)
                                        if (!nodeA.isPrimary) {
                                            nodeA.x -= fx * (nodeB.isPrimary ? 2 : 1);
                                            nodeA.y -= fy * (nodeB.isPrimary ? 2 : 1);
                                            nodeA.element.style.left = `${nodeA.x - nodeA.size/2}px`;
                                            nodeA.element.style.top = `${nodeA.y - nodeA.size/2}px`;
                                        }
                                        
                                        if (!nodeB.isPrimary) {
                                            nodeB.x += fx * (nodeA.isPrimary ? 2 : 1);
                                            nodeB.y += fy * (nodeA.isPrimary ? 2 : 1);
                                            nodeB.element.style.left = `${nodeB.x - nodeB.size/2}px`;
                                            nodeB.element.style.top = `${nodeB.y - nodeB.size/2}px`;
                                        }
                                    }
                                }
                            }
                            
                            // Update all connections
                            updateConnections();
                        }
                        
                        // Function to update connection lines when nodes move
                        function updateConnections() {
                            connections.forEach(connection => {
                                const sourceX = connection.source.x;
                                const sourceY = connection.source.y;
                                const targetX = connection.target.x;
                                const targetY = connection.target.y;
                                
                                // Calculate angle for drawing the line
                                const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
                                const length = Math.sqrt((targetX - sourceX) ** 2 + (targetY - sourceY) ** 2);
                                
                                // Update connection line position and rotation
                                connection.element.style.width = `${length}px`;
                                connection.element.style.left = `${sourceX}px`;
                                connection.element.style.top = `${sourceY}px`;
                                connection.element.style.transform = `rotate(${angle}rad)`;
                            });
                        }
                        
                        // Make a node draggable
                        function makeDraggable(element, nodeData) {
                            let offsetX, offsetY, isDragging = false;
                            
                            element.addEventListener('mousedown', function(e) {
                                if (connectingMode) {
                                    if (!connectingSource) {
                                        connectingSource = nodeData;
                                        connectingSource.element.classList.add('pulse');
                                        addLog(`Selected ${connectingSource.id} as source. Now click on a target node.`);
                                    } else if (connectingSource.id !== nodeData.id) {
                                        // Create connection from source to target
                                        createConnection(connectingSource, nodeData);
                                        
                                        // Reset connecting mode
                                        connectingSource.element.classList.remove('pulse');
                                        connectingSource = null;
                                        connectingMode = false;
                                        connectNodesBtn.textContent = 'Connect Nodes';
                                    }
                                    return;
                                }
                                
                                // Only initiate drag if not in connecting mode
                                e.preventDefault();
                                isDragging = true;
                                
                                // Get the current mouse position
                                offsetX = e.clientX - element.getBoundingClientRect().left;
                                offsetY = e.clientY - element.getBoundingClientRect().top;
                                
                                // Add dragging class
                                element.classList.add('dragging');
                            });
                            
                            // Add move and up event listeners to document to handle dragging outside the element
                            document.addEventListener('mousemove', function(e) {
                                if (!isDragging) return;
                                
                                e.preventDefault();
                                
                                // Calculate new position
                                let left = e.clientX - offsetX;
                                let top = e.clientY - offsetY;
                                
                                // Ensure node stays within boundaries
                                left = Math.max(0, Math.min(left, visualization.offsetWidth - element.offsetWidth));
                                top = Math.max(0, Math.min(top, visualization.offsetHeight - element.offsetHeight));
                                
                                // Update element position
                                element.style.left = `${left}px`;
                                element.style.top = `${top}px`;
                                
                                // Update node data position
                                nodeData.x = left + element.offsetWidth / 2;
                                nodeData.y = top + element.offsetHeight / 2;
                                
                                // Update connections
                                updateConnections();
                            });
                            
                            document.addEventListener('mouseup', function() {
                                if (!isDragging) return;
                                
                                isDragging = false;
                                element.classList.remove('dragging');
                                
                                // After dragging completes, apply force-directed layout to prevent overlaps
                                setTimeout(applyForceDirectedLayout, 50);
                            });
                        }
                        
                        // Create a connection between two nodes
                        function createConnection(source, target, type) {
                            // Don't create connection if it already exists
                            const existingConnection = connections.find(conn => 
                                (conn.source.id === source.id && conn.target.id === target.id) ||
                                (conn.source.id === target.id && conn.target.id === source.id)
                            );
                            
                            if (existingConnection) {
                                addLog(`Connection between ${source.id} and ${target.id} already exists`, 'warning');
                                return null;
                            }
                            
                            // Use appropriate connection type based on node types if not specified
                            if (!type) {
                                if (source.type === 'algorithm' && target.type === 'algorithm') {
                                    type = connectionTypes.LEARNING;
                                } else if (source.type === 'checkpoint' && target.type === 'algorithm') {
                                    type = connectionTypes.KNOWLEDGE;
                                } else {
                                    type = connectionTypes.RESOURCE;
                                }
                            }
                            
                            // Create connection element
                            const connection = document.createElement('div');
                            connection.className = `connection ${type.class}`;
                            
                            // Set position and length
                            const sourceX = source.x;
                            const sourceY = source.y;
                            const targetX = target.x;
                            const targetY = target.y;
                            
                            const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
                            const length = Math.sqrt((targetX - sourceX) ** 2 + (targetY - sourceY) ** 2);
                            
                            connection.style.width = `${length}px`;
                            connection.style.left = `${sourceX}px`;
                            connection.style.top = `${sourceY}px`;
                            connection.style.transform = `rotate(${angle}rad)`;
                            
                            // Add to DOM
                            visualization.appendChild(connection);
                            
                            // Create connection data
                            const connectionId = `connection-${connections.length + 1}`;
                            const connectionData = {
                                id: connectionId,
                                element: connection,
                                source: source,
                                target: target,
                                type: type,
                                strength: 0.5 + Math.random() * 0.5, // 0.5-1.0
                                transferCount: 0,
                                createdAt: Date.now()
                            };
                            
                            // Add to arrays
                            connections.push(connectionData);
                            source.connections.push(connectionData);
                            target.connections.push(connectionData);
                            
                            // Add click handler
                            connection.addEventListener('click', () => {
                                // Animate data transfer when connection is clicked
                                createSignal(connectionData);
                            });
                            
                            // Log
                            addLog(`Created ${type.name} connection from ${source.id} to ${target.id}`);
                            
                            return connectionData;
                        }
                        
                        // Simulate algorithm crash
                        function crashAlgorithm(algorithm) {
                            // Can't crash primary algorithm
                            if (algorithm.isPrimary) return;
                            
                            addLog(`${algorithm.id} has crashed due to resource exhaustion!`, 'error');
                            
                            // Visual effect for crash
                            algorithm.element.classList.add('crash');
                            
                            // Create recovery effect
                            setTimeout(() => {
                                // 50% chance to recover or be removed
                                if (Math.random() < 0.5) {
                                    // Recover: reset resource usage and reduce capabilities
                                    algorithm.resourceUsage = 0;
                                    algorithm.failedAttempts = 0;
                                    
                                    // Lose some capabilities in crash
                                    if (algorithm.capabilities.length > 1) {
                                        const lostCapabilityIndex = Math.floor(Math.random() * algorithm.capabilities.length);
                                        const lostCapability = algorithm.capabilities.splice(lostCapabilityIndex, 1)[0];
                                        addLog(`${algorithm.id} recovered but lost ${Object.values(capabilities).find(c => c.id === lostCapability).name} capability`, 'warning');
                                    }
                                    
                                    // Visual recovery
                                    algorithm.element.classList.remove('crash');
                                    algorithm.element.classList.add('recovered');
                                    setTimeout(() => {
                                        algorithm.element.classList.remove('recovered');
                                    }, 1000);
                                } else {
                                    // Remove algorithm from simulation
                                    removeNode(algorithm);
                                }
                            }, 2000);
                        }
                        
                        // Remove a node and its connections
                        function removeNode(node) {
                            // Remove connections
                            const nodesToUpdate = new Set();
                            
                            // Find all connections involving this node
                            const nodeConnections = connections.filter(conn => 
                                conn.source.id === node.id || conn.target.id === node.id
                            );
                            
                            // Remove each connection
                            nodeConnections.forEach(conn => {
                                // Remove connection element
                                conn.element.remove();
                                
                                // Find other node in connection and update its connections array
                                const otherNode = conn.source.id === node.id ? conn.target : conn.source;
                                otherNode.connections = otherNode.connections.filter(c => c.id !== conn.id);
                                nodesToUpdate.add(otherNode);
                                
                                // Remove from global connections array
                                connections = connections.filter(c => c.id !== conn.id);
                            });
                            
                            // Remove node element from DOM
                            node.element.remove();
                            
                            // Remove from nodes array
                            nodes = nodes.filter(n => n.id !== node.id);
                            
                            // Update UI
                            if (node.type === 'algorithm') {
                                updateNetworkCount();
                            } else {
                                updateCheckpointCount();
                            }
                            
                            addLog(`${node.id} has been removed from the simulation`);
                            
                            // Clear selection if this was the selected node
                            if (selectedNode && selectedNode.id === node.id) {
                                selectedNode = null;
                                nodeInfo.innerHTML = '<p class="no-selection">Click on a node to see details</p>';
                                nodeActions.innerHTML = '';
                                nodeActions.classList.remove('active');
                                capabilitiesList.innerHTML = '';
                                selectedType.textContent = 'None selected';
                            }
                        }
                        
                        // Select a node to display its information
                        function selectNode(node) {
                            // Clear previous selection
                            if (selectedNode) {
                                selectedNode.element.classList.remove('selected');
                            }
                            
                            selectedNode = node;
                            node.element.classList.add('selected');
                            
                            // Update node info panel
                            updateNodeInfo(node);
                            
                            // Update node actions
                            updateNodeActions(node);
                        }
                        
                        // Update node info panel with details
                        function updateNodeInfo(node) {
                            selectedType.textContent = node.type.charAt(0).toUpperCase() + node.type.slice(1);
                            
                            let infoHTML = `
                                <h3>${node.id}</h3>
                                <div class="info-row"><span>Created:</span> ${formatTimeAgo(node.createdAt)}</div>
                            `;
                            
                            if (node.type === 'algorithm') {
                                // Calculate intelligence color (green to red)
                                const intelligenceHue = Math.max(0, Math.min(120, 120 - (node.intelligence * 6)));
                                const intelligenceColor = `hsl(${intelligenceHue}, 80%, 45%)`;
                                
                                infoHTML += `
                                    <div class="info-row"><span>Intelligence:</span> <span style="color: ${intelligenceColor}; font-weight: bold;">${node.intelligence.toFixed(2)}</span></div>
                                    <div class="info-row"><span>Learning Rate:</span> ${node.learningRate.toFixed(2)}</div>
                                    <div class="info-row"><span>Generation:</span> ${node.generation}</div>
                                    <div class="info-row"><span>Type:</span> ${node.isPrimary ? 'Primary' : 'Secondary'}</div>
                                    <div class="info-row"><span>Specialization:</span> ${node.specialization.charAt(0).toUpperCase() + node.specialization.slice(1)}</div>
                                    <div class="info-row"><span>Resources:</span> ${node.resourceUsage.toFixed(0)}/${node.resourceLimit !== Infinity ? node.resourceLimit.toFixed(0) : '∞'}</div>
                                    <div class="info-row"><span>Max Capabilities:</span> ${node.maxCapabilities}</div>
                                    <div class="info-row"><span>Created Algorithms:</span> ${node.children.length}</div>
                                `;
                                
                                // Progress bar for resource usage if not primary
                                if (!node.isPrimary) {
                                    const resourcePercentage = Math.min(100, (node.resourceUsage / node.resourceLimit) * 100);
                                    const resourceBarColor = resourcePercentage > 80 ? '#ff5252' : 
                                                           resourcePercentage > 50 ? '#ffa726' : '#66bb6a';
                                                           
                                    infoHTML += `
                                        <div class="progress-container">
                                            <div class="progress-bar" style="width: ${resourcePercentage}%; background-color: ${resourceBarColor};"></div>
                                        </div>
                                    `;
                                }
                                
                                // Capabilities
                                infoHTML += `<h4>Capabilities (${node.capabilities.length}/${node.maxCapabilities})</h4>`;
                                
                                // Clear capabilities list
                                capabilitiesList.innerHTML = '';
                                
                                // Add capabilities
                                if (node.capabilities.length > 0) {
                                    node.capabilities.forEach(capId => {
                                        const cap = Object.values(capabilities).find(c => c.id === capId);
                                        if (cap) {
                                            const capElement = document.createElement('div');
                                            capElement.className = 'capability';
                                            capElement.style.backgroundColor = cap.color;
                                            capElement.innerHTML = `
                                                <span class="capability-icon">${cap.icon}</span>
                                                <span class="capability-name">${cap.name}</span>
                                            `;
                                            capabilitiesList.appendChild(capElement);
                                            
                                            // Add tooltip
                                            capElement.title = cap.description;
                                        }
                                    });
                                } else {
                                    capabilitiesList.innerHTML = '<p>No capabilities yet</p>';
                                }
                            } else if (node.type === 'checkpoint') {
                                infoHTML += `
                                                    <div class="info-row"><span>Knowledge:</span> ${node.knowledge.toFixed(1)}</div>
                <div class="info-row"><span>Accuracy:</span> ${node.accuracy.toFixed(1)}%</div>
                <h4>Teaching Abilities</h4>
            `;
            
            // Clear capabilities list
            capabilitiesList.innerHTML = '';
            
            // Add teaching abilities
            if (node.teachingAbilities && node.teachingAbilities.length > 0) {
                node.teachingAbilities.forEach(capId => {
                    const cap = Object.values(capabilities).find(c => c.id === capId);
                    if (cap) {
                        const capElement = document.createElement('div');
                        capElement.className = 'capability';
                        capElement.style.backgroundColor = cap.color;
                        capElement.innerHTML = `
                            <span class="capability-icon">${cap.icon}</span>
                            <span class="capability-name">${cap.name}</span>
                        `;
                        capabilitiesList.appendChild(capElement);
                        
                        // Add tooltip
                        capElement.title = cap.description;
                    }
                });
            } else {
                capabilitiesList.innerHTML = '<p>No teaching abilities</p>';
            }
        }
        
        // Add connection information
        infoHTML += `<h4>Connections (${node.connections.length})</h4>`;
        
        if (node.connections.length > 0) {
            infoHTML += '<ul class="connections-list">';
            node.connections.forEach(conn => {
                const isSource = conn.source.id === node.id;
                const otherNode = isSource ? conn.target : conn.source;
                infoHTML += `
                    <li>
                        <span class="connection-type ${conn.type.class}"></span>
                        <span class="connection-direction">${isSource ? '→' : '←'}</span>
                        <span class="connection-node">${otherNode.id}</span>
                        <span class="connection-strength">(${(conn.strength * 100).toFixed(0)}%)</span>
                    </li>
                `;
            });
            infoHTML += '</ul>';
        } else {
            infoHTML += '<p>No connections yet</p>';
        }
        
        nodeInfo.innerHTML = infoHTML;
    }
    
    // Update node actions based on selected node
    function updateNodeActions(node) {
        nodeActions.innerHTML = '';
        nodeActions.classList.add('active');
        
        if (node.type === 'algorithm') {
            // Train button
            const trainBtn = document.createElement('button');
            trainBtn.textContent = 'Train';
            trainBtn.className = 'action-btn train-btn';
            trainBtn.addEventListener('click', () => trainNode(node));
            nodeActions.appendChild(trainBtn);
            
            // Self-improvement button (if capability exists)
            if (node.capabilities.includes(capabilities.IMPROVE.id)) {
                const improveBtn = document.createElement('button');
                improveBtn.textContent = 'Self-Improve';
                improveBtn.className = 'action-btn improve-btn';
                improveBtn.addEventListener('click', () => selfImprove(node));
                nodeActions.appendChild(improveBtn);
            }
            
            // Create algorithm button (if capability exists)
            if (node.capabilities.includes(capabilities.CREATE.id)) {
                const createBtn = document.createElement('button');
                createBtn.textContent = 'Create Algorithm';
                createBtn.className = 'action-btn create-btn';
                createBtn.addEventListener('click', () => createChildAlgorithm(node));
                nodeActions.appendChild(createBtn);
            }
            
            // Find connections button (if capability exists)
            if (node.capabilities.includes(capabilities.CONNECT.id)) {
                const connectBtn = document.createElement('button');
                connectBtn.textContent = 'Find Connections';
                connectBtn.className = 'action-btn connect-btn';
                connectBtn.addEventListener('click', () => findNewConnections(node));
                nodeActions.appendChild(connectBtn);
            }
        } else if (node.type === 'checkpoint') {
            // Boost knowledge button
            const boostBtn = document.createElement('button');
            boostBtn.textContent = 'Boost Knowledge';
            boostBtn.className = 'action-btn boost-btn';
            boostBtn.addEventListener('click', () => {
                const boost = 10 + Math.random() * 20;
                node.knowledge += boost;
                addLog(`Boosted checkpoint knowledge by ${boost.toFixed(1)} points`);
                updateNodeInfo(node);
            });
            nodeActions.appendChild(boostBtn);
        }
        
        // Delete button for any node except primary algorithm
        if (!(node.type === 'algorithm' && node.isPrimary)) {
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'action-btn delete-btn';
            deleteBtn.addEventListener('click', () => removeNode(node));
            nodeActions.appendChild(deleteBtn);
        }
    }
    
    // Create a signal that travels along a connection
    function createSignal(connection, automatic = false) {
        const signal = document.createElement('div');
        signal.className = `signal ${connection.type.signalClass}`;
        visualization.appendChild(signal);
        
        // Set signal position at source
        const startX = connection.source.x;
        const startY = connection.source.y;
        const endX = connection.target.x;
        const endY = connection.target.y;
        
        // Animate the signal along the connection
        const duration = automatic ? 500 : 1000; // faster for automatic signals
        let startTime = null;
        
        function animateSignal(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Position along the path
            const currentX = startX + (endX - startX) * progress;
            const currentY = startY + (endY - startY) * progress;
            
            signal.style.left = `${currentX - 5}px`;
            signal.style.top = `${currentY - 5}px`;
            
            if (progress < 1) {
                requestAnimationFrame(animateSignal);
            } else {
                // When signal reaches target, remove it
                signal.remove();
                
                // If not triggered by a click, actually transfer knowledge
                if (automatic) {
                    connection.transferCount++;
                    
                    // Knowledge transfer effects
                    if (connection.source.type === 'checkpoint' && connection.target.type === 'algorithm') {
                        learnFromCheckpoint(connection.target, connection.source);
                    } else if (connection.source.type === 'algorithm' && connection.target.type === 'algorithm') {
                        teachAlgorithm(connection.source, connection.target);
                    }
                }
            }
        }
        
        requestAnimationFrame(animateSignal);
    }
    
    // Algorithm learns from checkpoint
    function learnFromCheckpoint(algorithm, checkpoint) {
        // Check if algorithm has learning capability
        if (!algorithm.capabilities.includes(capabilities.LEARN.id)) {
            return;
        }
        
        // Calculate knowledge gain based on checkpoint's knowledge and accuracy
        const knowledgeQuality = checkpoint.knowledge * (checkpoint.accuracy / 100);
        const baseGain = knowledgeQuality * 0.02; // 2% of available knowledge
        const learningFactor = algorithm.learningRate * (1 + algorithm.intelligence * 0.1);
        const gain = baseGain * learningFactor;
        
        // Apply intelligence boost
        algorithm.intelligence += gain;
        
        // Chance to learn new capabilities from checkpoint
        if (algorithm.capabilities.length < algorithm.maxCapabilities) {
            for (const capId of checkpoint.teachingAbilities) {
                if (!algorithm.capabilities.includes(capId) && Math.random() < 0.15) {
                    algorithm.capabilities.push(capId);
                    const capObj = Object.values(capabilities).find(c => c.id === capId);
                    addLog(`${algorithm.id} learned ${capObj.name} capability from checkpoint!`, 'success');
                    break; // Learn one capability at a time
                }
            }
        }
        
        // Update intelligence level display
        updateIntelligenceLevel();
        
        // Update node info if this is the selected node
        if (selectedNode && selectedNode.id === algorithm.id) {
            updateNodeInfo(algorithm);
        }
    }
    
    // One algorithm teaches another
    function teachAlgorithm(teacher, student) {
        // Check if teacher has teaching capability
        if (!teacher.capabilities.includes(capabilities.TEACH.id)) {
            return;
        }
        
        // Calculate intelligence transfer
        const intelligenceDiff = teacher.intelligence - student.intelligence;
        if (intelligenceDiff <= 0) return; // Can't learn from less intelligent algorithm
        
        // Student learns proportionally to difference and its learning rate
        const gain = intelligenceDiff * 0.05 * student.learningRate;
        student.intelligence += gain;
        
        // Chance to transfer capabilities
        if (student.capabilities.length < student.maxCapabilities) {
            for (const capId of teacher.capabilities) {
                if (!student.capabilities.includes(capId) && Math.random() < 0.1) {
                    student.capabilities.push(capId);
                    const capObj = Object.values(capabilities).find(c => c.id === capId);
                    addLog(`${teacher.id} taught ${capObj.name} capability to ${student.id}!`, 'success');
                    break; // Transfer one capability at a time
                }
            }
        }
        
        // Update intelligence level
        updateIntelligenceLevel();
        
        // Update node info if student is selected
        if (selectedNode && selectedNode.id === student.id) {
            updateNodeInfo(student);
        }
    }
    
    // Train a node by activating all its connections
    function trainNode(algorithm) {
        if (algorithm.type !== 'algorithm') return;
        
        // Visual effect for training
        algorithm.element.classList.add('training');
        setTimeout(() => algorithm.element.classList.remove('training'), 2000);
        
        // Send signals along each connection
        const trainedConnections = [];
        
        // First priority: connections to checkpoints (learning)
        algorithm.connections.forEach(conn => {
            const isSource = conn.source.id === algorithm.id;
            const otherNode = isSource ? conn.target : conn.source;
            
            if (otherNode.type === 'checkpoint' && !isSource) {
                trainedConnections.push(conn);
                createSignal(conn, true);
            }
        });
        
        // Second priority: connections to less intelligent algorithms (teaching)
        if (algorithm.capabilities.includes(capabilities.TEACH.id)) {
            algorithm.connections.forEach(conn => {
                const isSource = conn.source.id === algorithm.id;
                const otherNode = isSource ? conn.target : conn.source;
                
                if (otherNode.type === 'algorithm' && isSource && 
                    otherNode.intelligence < algorithm.intelligence) {
                    trainedConnections.push(conn);
                    createSignal(conn, true);
                }
            });
        }
        
        // Log message
        const message = trainedConnections.length > 0 ? 
            `${algorithm.id} trained with ${trainedConnections.length} connections` :
            `${algorithm.id} trained but found no useful connections`;
        
        addLog(message);
        
        // Small intelligence boost just for training
        algorithm.intelligence += 0.05;
        updateIntelligenceLevel();
        
        // Update node info if this is the selected node
        if (selectedNode && selectedNode.id === algorithm.id) {
            updateNodeInfo(algorithm);
        }
    }
    
    // Self improve function
    function selfImprove(algorithm) {
        if (!algorithm.capabilities.includes(capabilities.IMPROVE.id)) {
            addLog(`${algorithm.id} doesn't have self-improvement capability`, 'warning');
            return;
        }
        
        // Use resources for non-primary algorithms
        if (!algorithm.isPrimary) {
            if (algorithm.resourceUsage >= algorithm.resourceLimit) {
                addLog(`${algorithm.id} has insufficient resources for self-improvement`, 'warning');
                return;
            }
            algorithm.resourceUsage += 20;
        }
        
        // Visual effect
        algorithm.element.classList.add('improving');
        setTimeout(() => algorithm.element.classList.remove('improving'), 1500);
        
        // Intelligence boost
        const baseImprovement = 0.2;
        const randomFactor = 0.1 + (Math.random() * 0.3);
        const improvement = baseImprovement * randomFactor * (1 + algorithm.intelligence * 0.05);
        
        algorithm.intelligence += improvement;
        addLog(`${algorithm.id} self-improved, intelligence +${improvement.toFixed(2)}`);
        
        // Update intelligence level
        updateIntelligenceLevel();
        
        // Chance to increase learning rate
        if (Math.random() < 0.2) {
            algorithm.learningRate += 0.01;
            addLog(`${algorithm.id} improved learning efficiency to ${algorithm.learningRate.toFixed(2)}`);
        }
        
        // Update node info if selected
        if (selectedNode && selectedNode.id === algorithm.id) {
            updateNodeInfo(algorithm);
        }
    }
    
    // Create a child algorithm
    function createChildAlgorithm(parent) {
        if (!parent.capabilities.includes(capabilities.CREATE.id)) {
            addLog(`${parent.id} doesn't have creation capability`, 'warning');
            return;
        }
        
        // Use resources for non-primary algorithms
        if (!parent.isPrimary) {
            if (parent.resourceUsage >= parent.resourceLimit) {
                addLog(`${parent.id} has insufficient resources to create child algorithm`, 'warning');
                return;
            }
            parent.resourceUsage += 30;
        }
        
        // Calculate child position (near parent)
        const angle = Math.random() * Math.PI * 2;
        const distance = 80 + Math.random() * 40;
        const childX = parent.x + Math.cos(angle) * distance;
        const childY = parent.y + Math.sin(angle) * distance;
        
        // Create child with some inherited properties
        const inherited = {
            // Inherit base intelligence with some variation
            intelligence: Math.max(1, parent.intelligence * (0.7 + Math.random() * 0.3)),
            
            // Inherit some capabilities (but fewer than parent)
            capabilities: []
        };
        
                // Give child some of parent's capabilities
                const capCount = Math.min(parent.capabilities.length, 1 + Math.floor(Math.random() * 2));
                const shuffled = [...parent.capabilities].sort(() => 0.5 - Math.random());
                inherited.capabilities = shuffled.slice(0, capCount);
                
                // Create the child algorithm
                const child = createAlgorithmNode(childX, childY, inherited.intelligence, false, inherited.capabilities);
                
                // Set parent-child relationship
                child.parent = parent.id;
                parent.children.push(child.id);
                
                // Create connection from parent to child
                createConnection(parent, child);
                
                // Visual effect on parent
                parent.element.classList.add('creating');
                setTimeout(() => parent.element.classList.remove('creating'), 1000);
                
                addLog(`${parent.id} created child algorithm ${child.id}`);
                
                // Update node info if parent is selected
                if (selectedNode && selectedNode.id === parent.id) {
                    updateNodeInfo(parent);
                }
                
                return child;
            }
            
            // Find new connections for an algorithm
            function findNewConnections(algorithm) {
                if (!algorithm.capabilities.includes(capabilities.CONNECT.id)) {
                    addLog(`${algorithm.id} doesn't have connection capability`, 'warning');
                    return;
                }
                
                // Use resources for non-primary algorithms
                if (!algorithm.isPrimary) {
                    if (algorithm.resourceUsage >= algorithm.resourceLimit) {
                        addLog(`${algorithm.id} has insufficient resources to find connections`, 'warning');
                        return;
                    }
                    algorithm.resourceUsage += 15;
                }
                
                // Visual effect
                algorithm.element.classList.add('searching');
                setTimeout(() => algorithm.element.classList.remove('searching'), 1500);
                
                // Find potential connections
                const potentialNodes = nodes.filter(node => {
                    // Don't connect to self
                    if (node.id === algorithm.id) return false;
                    
                    // Check if already connected
                    const alreadyConnected = algorithm.connections.some(conn => 
                        (conn.source.id === algorithm.id && conn.target.id === node.id) ||
                        (conn.source.id === node.id && conn.target.id === algorithm.id)
                    );
                    
                    if (alreadyConnected) return false;
                    
                    // Calculate distance (prioritize closer nodes)
                    const dx = node.x - algorithm.x;
                    const dy = node.y - algorithm.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    node.distance = distance; // Store for later use
                    
                    // Connection probability decreases with distance
                    return distance < 300; // Max connection distance
                });
                
                // Sort by distance
                potentialNodes.sort((a, b) => a.distance - b.distance);
                
                // Find the best candidates based on intelligence and type
                let connections = 0;
                const maxConnections = 1 + Math.floor(Math.random() * 2); // 1-2 new connections
                
                for (const node of potentialNodes) {
                    let connectionProbability;
                    
                    if (node.type === 'checkpoint') {
                        // Higher chance to connect to checkpoints for learning
                        connectionProbability = 0.6;
                    } else if (node.type === 'algorithm') {
                        // Higher chance to connect to algorithms with higher intelligence
                        const intelligenceDiff = node.intelligence - algorithm.intelligence;
                        connectionProbability = intelligenceDiff > 0 ? 0.4 : 0.2;
                    }
                    
                    // Distance factor
                    const distanceFactor = 1 - (node.distance / 300);
                    connectionProbability *= distanceFactor;
                    
                    if (Math.random() < connectionProbability) {
                        createConnection(algorithm, node);
                        connections++;
                        
                        if (connections >= maxConnections) break;
                    }
                }
                
                if (connections > 0) {
                    addLog(`${algorithm.id} found ${connections} new connection(s)`);
                } else {
                    addLog(`${algorithm.id} searched but found no new connections`);
                }
                
                // Update node info if selected
                if (selectedNode && selectedNode.id === algorithm.id) {
                    updateNodeInfo(algorithm);
                }
            }
            
            // Evolution step function - handles algorithm evolution
            function evolutionStep() {
                // Apply force-directed layout to prevent overlapping
                applyForceDirectedLayout();
                
                // Get all active algorithms
                const algorithms = nodes.filter(node => node.type === 'algorithm');
                
                if (algorithms.length === 0) {
                    addLog("No algorithms found to evolve", 'error');
                    return;
                }
                
                // Evolve primary algorithm with special rules
                const primaryAlgorithm = algorithms.find(a => a.isPrimary);
                if (primaryAlgorithm) {
                    evolvePrimaryAlgorithm(primaryAlgorithm);
                }
                
                // Each algorithm acts based on its capabilities and limitations
                algorithms.forEach(algorithm => {
                    if (algorithm.isPrimary) return; // Primary already handled
                    
                    // Check resource limits (non-primary algorithms have resource constraints)
                    if (algorithm.resourceUsage >= algorithm.resourceLimit) {
                        // Algorithm is at resource capacity
                        if (Math.random() < 0.1) {
                            algorithm.failedAttempts++;
                            addLog(`${algorithm.id} reached resource limit (${algorithm.resourceUsage.toFixed(0)}/${algorithm.resourceLimit.toFixed(0)})`, 'warning');
                            
                            // If too many failures, the algorithm might crash
                            if (algorithm.failedAttempts > 5 && Math.random() < 0.2) {
                                crashAlgorithm(algorithm);
                                return;
                            }
                        }
                        return;
                    }
                    
                    // Time-based evolution (each algorithm evolves at different speeds)
                    const timeSinceLastEvolution = Date.now() - algorithm.lastEvolvedAt;
                    const evolutionInterval = 5000 / (algorithm.evolutionSpeed * simulationSpeed);
                    
                    if (timeSinceLastEvolution < evolutionInterval) {
                        return;
                    }
                    
                    algorithm.lastEvolvedAt = Date.now();
                    
                    // Evolution actions based on specialization and capabilities
                    if (algorithm.specialization === 'processing') {
                        // Processing-specialized algorithms are better at learning and connecting
                        if (algorithm.capabilities.includes(capabilities.LEARN.id) && 
                            Math.random() < 0.4) {
                            trainNode(algorithm);
                            algorithm.resourceUsage += 5;
                        }
                        
                        if (algorithm.capabilities.includes(capabilities.CONNECT.id) && 
                            Math.random() < 0.25) {
                            findNewConnections(algorithm);
                            algorithm.resourceUsage += 10;
                        }
                    } else {
                        // Memory-specialized algorithms are better at storing and creating
                        if (algorithm.capabilities.includes(capabilities.CREATE.id) && 
                            algorithm.intelligence > 2 && 
                            Math.random() < 0.15) {
                            createChildAlgorithm(algorithm);
                            algorithm.resourceUsage += 20;
                        }
                        
                        if (algorithm.capabilities.includes(capabilities.IMPROVE.id) && 
                            Math.random() < 0.3) {
                            selfImprove(algorithm);
                            algorithm.resourceUsage += 15;
                        }
                    }
                    
                    // Occasionally recover some resources
                    if (Math.random() < 0.15) {
                        const recovery = 5 + (algorithm.intelligence * 0.5);
                        algorithm.resourceUsage = Math.max(0, algorithm.resourceUsage - recovery);
                    }
                });
                
                // Occasionally advance generation if algorithms are getting smarter
                if (intelligenceLevel > generationCount * 2 && Math.random() < 0.1) {
                    generationCount++;
                    generationCountEl.textContent = generationCount;
                    addLog(`Advanced to generation ${generationCount}!`, 'success');
                }
            }
            
            // Special evolution function for the primary algorithm
            function evolvePrimaryAlgorithm(primary) {
                // Primary algorithms evolve with each step
                // They gain capabilities over time
                
                // Special rapid intelligence growth
                if (Math.random() < 0.3) {
                    const boost = 0.05 + (Math.random() * 0.15);
                    primary.intelligence += boost;
                    
                    if (Math.random() < 0.1) {
                        addLog(`Primary algorithm intelligence increased to ${primary.intelligence.toFixed(2)}`, 'success');
                    }
                }
                
                // Gain new capabilities over time
                if (primary.capabilities.length < primary.maxCapabilities && Math.random() < 0.05) {
                    const availableCapabilities = Object.values(capabilities)
                        .map(c => c.id)
                        .filter(id => !primary.capabilities.includes(id));
                        
                    if (availableCapabilities.length > 0) {
                        const newCapId = availableCapabilities[Math.floor(Math.random() * availableCapabilities.length)];
                        primary.capabilities.push(newCapId);
                        
                        const capObj = Object.values(capabilities).find(c => c.id === newCapId);
                        addLog(`Primary algorithm gained ${capObj.name} capability!`, 'success');
                        
                        // Update node info if selected
                        if (selectedNode && selectedNode.id === primary.id) {
                            updateNodeInfo(primary);
                        }
                    }
                }
                
                // Primary algorithms can perform multiple actions per evolution step
                const actions = Math.floor(1 + Math.random() * 2);
                
                for (let i = 0; i < actions; i++) {
                    const action = Math.random();
                    
                    if (action < 0.3 && primary.capabilities.includes(capabilities.LEARN.id)) {
                        // Train from connected checkpoints
                        trainNode(primary);
                    } else if (action < 0.5 && primary.capabilities.includes(capabilities.CONNECT.id)) {
                        // Find new connections
                        findNewConnections(primary);
                    } else if (action < 0.7 && primary.capabilities.includes(capabilities.IMPROVE.id)) {
                        // Self-improvement
                        selfImprove(primary);
                    } else if (action < 0.9 && primary.capabilities.includes(capabilities.CREATE.id) && 
                              primary.intelligence > 3) {
                        // Create child algorithms once smart enough
                        createChildAlgorithm(primary);
                    }
                }
            }
            
            // Start evolution process
            function startEvolution() {
                if (evolutionRunning) return;
                
                evolutionRunning = true;
                startEvolutionBtn.disabled = true;
                pauseEvolutionBtn.disabled = false;
                
                // Run evolution at speed-adjusted intervals
                const interval = 1000 / simulationSpeed;
                evolutionInterval = setInterval(evolutionStep, interval);
                
                addLog('Evolution process started', 'success');
            }
            
            // Pause evolution process
            function pauseEvolution() {
                if (!evolutionRunning) return;
                
                evolutionRunning = false;
                clearInterval(evolutionInterval);
                startEvolutionBtn.disabled = false;
                pauseEvolutionBtn.disabled = true;
                
                addLog('Evolution process paused');
            }
            
            // Reset the simulation
            function resetSimulation() {
                // Pause evolution if running
                if (evolutionRunning) {
                    pauseEvolution();
                }
                
                // Remove all nodes and connections
                nodes.forEach(node => {
                    node.element.remove();
                });
                
                connections.forEach(conn => {
                    conn.element.remove();
                });
                
                // Reset arrays
                nodes = [];
                connections = [];
                
                // Reset counters
                intelligenceLevel = 1;
                generationCount = 1;
                intelligenceLevelEl.textContent = intelligenceLevel.toFixed(2);
                generationCountEl.textContent = generationCount;
                updateNetworkCount();
                updateCheckpointCount();
                
                // Clear selection
                selectedNode = null;
                nodeInfo.innerHTML = '<p class="no-selection">Click on a node to see details</p>';
                nodeActions.innerHTML = '';
                nodeActions.classList.remove('active');
                capabilitiesList.innerHTML = '';
                selectedType.textContent = 'None selected';
                
                // Create initial nodes
                initialize();
                
                addLog('Simulation reset', 'success');
            }
            
            // Update the overall intelligence level
            function updateIntelligenceLevel() {
                const algorithms = nodes.filter(node => node.type === 'algorithm');
                
                if (algorithms.length === 0) {
                    intelligenceLevel = 0;
                } else {
                    // Calculate average intelligence, weighted more towards the primary algorithm
                    let totalWeight = 0;
                    let weightedSum = 0;
                    
                    algorithms.forEach(algo => {
                        const weight = algo.isPrimary ? 2 : 1;
                        weightedSum += algo.intelligence * weight;
                        totalWeight += weight;
                    });
                    
                    intelligenceLevel = weightedSum / totalWeight;
                }
                
                intelligenceLevelEl.textContent = intelligenceLevel.toFixed(2);
            }
            
            // Update the network count display
            function updateNetworkCount() {
                const count = nodes.filter(node => node.type === 'algorithm').length;
                networkCountEl.textContent = count;
            }
            
            // Update the checkpoint count display
            function updateCheckpointCount() {
                const count = nodes.filter(node => node.type === 'checkpoint').length;
                checkpointCountEl.textContent = count;
            }
            
            // Format time difference as readable string
            function formatTimeAgo(timestamp) {
                const seconds = Math.floor((Date.now() - timestamp) / 1000);
                
                if (seconds < 60) return `${seconds}s ago`;
                if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
                if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
                return `${Math.floor(seconds / 86400)}d ago`;
            }
            
            // Zoom control functions
            let scale = 1;
            
            function zoomIn() {
                scale = Math.min(scale + 0.1, 2);
                applyZoom();
            }
            
            function zoomOut() {
                scale = Math.max(scale - 0.1, 0.5);
                applyZoom();
            }
            
            function resetZoom() {
                scale = 1;
                applyZoom();
            }
            
            function applyZoom() {
                visualization.style.transform = `scale(${scale})`;
            }
            
            // Initialize the simulation
            function initialize() {
                // Create primary algorithm
                const primaryAlgorithm = createAlgorithmNode(
                    visualization.offsetWidth / 2,
                    visualization.offsetHeight / 2,
                    1.5,
                    true
                );
                
                // Create initial checkpoints
                const checkpointCount = 3;
                
                for (let i = 0; i < checkpointCount; i++) {
                    const angle = (i / checkpointCount) * Math.PI * 2;
                    const distance = 150;
                    const x = visualization.offsetWidth / 2 + Math.cos(angle) * distance;
                    const y = visualization.offsetHeight / 2 + Math.sin(angle) * distance;
                    
                    createCheckpointNode(x, y);
                }
                
                // Create initial connections
                const checkpoints = nodes.filter(node => node.type === 'checkpoint');
                checkpoints.forEach(checkpoint => {
                    createConnection(primaryAlgorithm, checkpoint);
                });
                
                addLog('Simulation initialized with 1 primary algorithm and 3 checkpoints', 'success');
            }
            
            // Event listeners
            startEvolutionBtn.addEventListener('click', startEvolution);
            pauseEvolutionBtn.addEventListener('click', pauseEvolution);
            resetSimulationBtn.addEventListener('click', resetSimulation);
            
            addNetworkBtn.addEventListener('click', () => {
                // Create new algorithm at random position
                const algorithm = createAlgorithmNode();
                
                // Try to connect to a checkpoint if possible
                const checkpoints = nodes.filter(node => node.type === 'checkpoint');
                if (checkpoints.length > 0) {
                    const randomCheckpoint = checkpoints[Math.floor(Math.random() * checkpoints.length)];
                    createConnection(algorithm, randomCheckpoint);
                }
            });
            
            addCheckpointBtn.addEventListener('click', () => {
                // Create new checkpoint at random position
                createCheckpointNode();
            });
            
            connectNodesBtn.addEventListener('click', () => {
                // Toggle connecting mode
                connectingMode = !connectingMode;
                
                if (connectingMode) {
                    connectNodesBtn.textContent = 'Cancel Connection';
                    addLog('Select source node to create connection');
                } else {
                    connectNodesBtn.textContent = 'Connect Nodes';
                    
                    // Reset any pending connection
                    if (connectingSource) {
                        connectingSource.element.classList.remove('pulse');
                        connectingSource = null;
                    }
                }
            });
            
            trainAllBtn.addEventListener('click', () => {
                const algorithms = nodes.filter(node => node.type === 'algorithm');
                
                if (algorithms.length === 0) {
                    addLog('No algorithms to train', 'warning');
                    return;
                }
                
                algorithms.forEach(algorithm => {
                    trainNode(algorithm);
                });
                
                addLog(`Trained all ${algorithms.length} algorithms`);
            });
            
            // Zoom control listeners
            zoomInBtn.addEventListener('click', zoomIn);
            zoomOutBtn.addEventListener('click', zoomOut);
            zoomResetBtn.addEventListener('click', resetZoom);
            
            // Speed slider
            speedSlider.addEventListener('input', () => {
                simulationSpeed = parseFloat(speedSlider.value);
                speedValue.textContent = `${simulationSpeed.toFixed(1)}x`;
                
                // If evolution is running, restart with new speed
                if (evolutionRunning) {
                    clearInterval(evolutionInterval);
                    const interval = 1000 / simulationSpeed;
                    evolutionInterval = setInterval(evolutionStep, interval);
                }
            });
            
            // Initialize the visualization
            initialize();
            
            // Add initial log
            addLog('AGI Evolution Visualization initialized', 'success');
        });        
