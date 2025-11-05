// Dino Runner Game Logic
// Converted from the Chrome T-Rex Runner game

const FPS = 60;
const IS_HIDPI = window.devicePixelRatio > 1;
const IS_MOBILE = /Mobi/.test(window.navigator.userAgent);
const IS_IOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
const IS_ANDROID = /Android/.test(window.navigator.userAgent);
const DEFAULT_WIDTH = 800;

interface RunnerConfig {
  ACCELERATION: number;
  BG_CLOUD_SPEED: number;
  BOTTOM_PAD: number;
  CLEAR_TIME: number;
  CLOUD_FREQUENCY: number;
  GAMEOVER_CLEAR_TIME: number;
  GAP_COEFFICIENT: number;
  GRAVITY: number;
  INITIAL_JUMP_VELOCITY: number;
  MAX_CLOUDS: number;
  MAX_OBSTACLE_LENGTH: number;
  MAX_SPEED: number;
  MIN_JUMP_HEIGHT: number;
  MOBILE_SPEED_COEFFICIENT: number;
  SPEED: number;
  SPEED_DROP_COEFFICIENT: number;
  STARTUP_RAMP_MS: number;
}

const DEFAULT_CONFIG: RunnerConfig = {
  ACCELERATION: 0.0006, // Slower gradual speed increase for smoother difficulty curve
  BG_CLOUD_SPEED: 0.2,
  BOTTOM_PAD: 10,
  CLEAR_TIME: 3000,
  CLOUD_FREQUENCY: 0.35,
  GAMEOVER_CLEAR_TIME: 750,
  GAP_COEFFICIENT: 0.7,
  GRAVITY: 0.58, // Smooth gravity for easier gameplay
  INITIAL_JUMP_VELOCITY: 15, // Higher jump for easy obstacle clearing
  MAX_CLOUDS: 6,
  MAX_OBSTACLE_LENGTH: 3,
  MAX_SPEED: 6, // Slower max speed for smoother gameplay
  MIN_JUMP_HEIGHT: 32, // Higher minimum jump
  MOBILE_SPEED_COEFFICIENT: IS_ANDROID ? 0.7 : (IS_IOS ? 0.7 : 0.8), // Slightly faster for better gameplay
  SPEED: 2.5, // Reduced starting speed for gentler start
  SPEED_DROP_COEFFICIENT: 3,
  STARTUP_RAMP_MS: 1500, // Extended ramp time for smoother acceleration
};

interface Obstacle {
  xPos: number;
  yPos: number;
  width: number;
  height: number;
  size: number;
  typeConfig: any;
  remove: boolean;
  gap: number;
}

class Trex {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  xPos: number;
  yPos: number;
  groundYPos: number;
  jumping: boolean;
  jumpVelocity: number;
  speedDrop: boolean;
  reachedMinHeight: boolean;
  minJumpHeight: number;
  config: any;
  dinoImage: HTMLImageElement | null = null;
  width: number = 50;  // Increased for better visibility
  height: number = 55; // Increased for better visibility
  onJump?: () => void;

  constructor(canvas: HTMLCanvasElement, dimensions: any, onJump?: () => void) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.xPos = 50;
    this.groundYPos = dimensions.HEIGHT - this.height - DEFAULT_CONFIG.BOTTOM_PAD;
    this.yPos = this.groundYPos;
    this.jumping = false;
    this.jumpVelocity = 0;
    this.speedDrop = false;
    this.reachedMinHeight = false;
    this.minJumpHeight = this.groundYPos - DEFAULT_CONFIG.MIN_JUMP_HEIGHT;
    this.config = { ...DEFAULT_CONFIG };
    this.onJump = onJump;
    
    // Load dino image
    this.dinoImage = new Image();
    this.dinoImage.src = '/img/dino/dino-2.gif';
  }

  startJump() {
    if (!this.jumping) {
      this.jumping = true;
      this.jumpVelocity = -this.config.INITIAL_JUMP_VELOCITY;
      this.reachedMinHeight = false;
      this.speedDrop = false;
      // Play jump sound
      if (this.onJump) {
        this.onJump();
      }
    }
  }

  endJump() {
    if (this.reachedMinHeight && this.jumpVelocity < -this.config.SPEED_DROP_COEFFICIENT) {
      this.jumpVelocity = -this.config.SPEED_DROP_COEFFICIENT;
    }
  }

  updateJump(deltaTime: number) {
    const msPerFrame = 1000 / FPS;
    const framesElapsed = deltaTime / msPerFrame;

    if (this.speedDrop) {
      this.yPos += Math.round(this.jumpVelocity * this.config.SPEED_DROP_COEFFICIENT * framesElapsed);
    } else {
      this.yPos += Math.round(this.jumpVelocity * framesElapsed);
    }

    this.jumpVelocity += this.config.GRAVITY * framesElapsed;

    if (this.yPos < this.minJumpHeight || this.speedDrop) {
      this.reachedMinHeight = true;
    }

    if (this.yPos > this.groundYPos) {
      this.reset();
    }
  }

  reset() {
    this.yPos = this.groundYPos;
    this.jumpVelocity = 0;
    this.jumping = false;
    this.speedDrop = false;
  }

  draw() {
    if (this.dinoImage && this.dinoImage.complete) {
      this.ctx.drawImage(
        this.dinoImage,
        this.xPos,
        this.yPos,
        this.width,
        this.height
      );
    } else {
      // Fallback rectangle with vibrant red-orange gradient for character
      const gradient = this.ctx.createLinearGradient(
        this.xPos, 
        this.yPos, 
        this.xPos, 
        this.yPos + this.height
      );
      gradient.addColorStop(0, '#FF6B4A'); // Bright coral red
      gradient.addColorStop(0.5, '#FF4726'); // Vibrant red-orange
      gradient.addColorStop(1, '#E03616'); // Deep red
      
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(this.xPos, this.yPos, this.width, this.height);
      
      // Add dark outline for character
      this.ctx.strokeStyle = '#8B1E0F';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(this.xPos, this.yPos, this.width, this.height);
    }
  }
}

export class DinoRunner {
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: RunnerConfig;
  private dimensions: { WIDTH: number; HEIGHT: number };
  private currentSpeed: number;
  private distanceRan: number;
  private time: number;
  private runningTime: number;
  private msPerFrame: number;
  private activated: boolean;
  private crashed: boolean;
  private paused: boolean;
  private started: boolean;
  private raqId: number;
  private tRex: Trex;
  private onGameOver?: (score: number) => void;
  private obstacles: Obstacle[] = [];
  private obstacleImage: HTMLImageElement;
  private highScore: number = 0;
  private lastScoreMilestone: number = 0;
  
  // Background particles/bubbles
  private particles: Array<{
    x: number;
    y: number;
    size: number;
    speedY: number;
    speedX: number;
    opacity: number;
    type: 'particle' | 'bubble' | 'orb' | 'cloud-bubble' | 'white-dot';
  }> = [];
  
  // Clouds
  private clouds: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    opacity: number;
  }> = [];
  
  // Underground animations (below ground line)
  private undergroundElements: Array<{
    x: number;
    y: number;
    size: number;
    speed: number;
    opacity: number;
    type: 'root' | 'glow';
  }> = [];
  
  // Trees for background
  private trees: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    type: 'tree';
  }> = [];
  
  // Sun position (static)
  private sun = {
    x: 0,
    y: 0,
    radius: 40
  };
  
  // Sound effects
  private jumpSound: HTMLAudioElement;
  private scoreSound: HTMLAudioElement;
  private gameOverSound: HTMLAudioElement;
  
  // Startup ramp to normalize initial speed across devices (esp. Android Telegram)
  private startupElapsed: number = 0;

  // Compute effective speed considering platform coefficient and startup ramp
  private getEffectiveSpeed(): number {
    const base = this.currentSpeed * this.config.MOBILE_SPEED_COEFFICIENT;
    const t = Math.min(1, this.startupElapsed / this.config.STARTUP_RAMP_MS);
    // Ease-out for a smooth ramp up; start even slower for better control
    const eased = 1 - Math.pow(1 - t, 3);
    const ramp = Math.max(0.25, eased); // Slightly higher floor so obstacles move enough during first jump
    return base * ramp;
  }
  
  // Obstacle types configuration  
  private obstacleTypes = [
    {
      type: 'CACTUS_SMALL',
      width: 12,   // Increased for better visibility
      height: 30,  // Increased height for better visibility
      yPos: 0, // Will be calculated
      multipleSpeed: 3,
  minGap: 180,  // Increased gap for easier gameplay
    },
    {
      type: 'CACTUS_LARGE',
      width: 16,   // Increased for better visibility
      height: 38,  // Increased height for better visibility
      yPos: 0, // Will be calculated
      multipleSpeed: 6,
  minGap: 180,  // Increased gap for easier gameplay
    }
  ];

  constructor(container: HTMLDivElement, onGameOver?: (score: number) => void) {
    this.container = container;
    this.config = { ...DEFAULT_CONFIG };
    this.onGameOver = onGameOver;
    
    // Clear any existing canvases in the container
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    
    // Set dimensions - position game with small gap below header
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const containerWidth = container.offsetWidth || viewportWidth;
    const containerHeight = container.offsetHeight || viewportHeight;
    
    // Reserve safe area for the bottom navigation/footer
    const navEl = document.querySelector('nav[aria-label="Bottom navigation"]') as HTMLElement | null;
    const navHeight = navEl?.offsetHeight ?? 80;
    
    // Get actual header height (stats section at top)
  // Use a robust selector that doesn't depend on exact Tailwind classes
  const headerEl = document.querySelector('[data-header="dino-stats"]') as HTMLElement | null;
    const headerHeight = headerEl?.offsetHeight ?? 0;
    
    // Calculate available height - position play area much higher with more top space
    const screenHeight = viewportHeight;
    // Slightly reduce bottom gaps to free more play area height and show full jump
    const dynamicBottomGap = screenHeight > 750 ? 100 : screenHeight > 650 ? 80 : screenHeight > 550 ? 70 : 60;
    const bottomGap = navHeight + dynamicBottomGap;
    // Move play area a little down (lower from top) for all screens
    const topGap = headerHeight + 140;
    const availableHeight = viewportHeight - topGap - bottomGap;
    // Larger minimum heights for better gameplay area
    const minHeight = screenHeight > 700 ? 180 : screenHeight > 600 ? 160 : 140;
    const finalHeight = Math.max(minHeight, availableHeight);

    this.dimensions = {
      WIDTH: Math.min(containerWidth, viewportWidth),
      HEIGHT: finalHeight,
    };
    
    // Create canvas
    this.canvas = document.createElement('canvas');
  // Plain full-bleed canvas (no border/box)
  this.canvas.className = 'runner-canvas';
    this.canvas.width = this.dimensions.WIDTH;
    this.canvas.height = this.dimensions.HEIGHT;
    this.canvas.style.maxWidth = '100%';
    this.canvas.style.width = '100%';
    this.canvas.style.height = `${this.dimensions.HEIGHT}px`;
    this.canvas.style.display = 'block';
    this.canvas.style.margin = '0 auto';
    this.ctx = this.canvas.getContext('2d')!;
    container.appendChild(this.canvas);
    
    this.currentSpeed = this.config.SPEED;
    this.distanceRan = 0;
    this.time = 0;
    this.runningTime = 0;
    this.msPerFrame = 1000 / FPS;
    this.activated = false;
    this.crashed = false;
    this.paused = false;
    this.started = false;
    this.raqId = 0;
    
    // Initialize Web Audio API for sound effects
    this.jumpSound = this.createBeepSound(600, 0.1, 0.3); // High pitched, short
    this.scoreSound = this.createBeepSound(800, 0.15, 0.4); // Pleasant tone
    this.gameOverSound = this.createBeepSound(200, 0.3, 0.5); // Low, longer
    
    // Create T-Rex with jump sound callback
    this.tRex = new Trex(this.canvas, this.dimensions, () => this.playJumpSound());
    
    // Load obstacle image
    this.obstacleImage = new Image();
    this.obstacleImage.src = '/img/dino/dino-1.gif';
    
    // Calculate obstacle Y positions
    const groundY = this.dimensions.HEIGHT - 12;
    this.obstacleTypes[0].yPos = groundY - this.obstacleTypes[0].height;
    this.obstacleTypes[1].yPos = groundY - this.obstacleTypes[1].height;
    
    // Load high score from localStorage
    const savedHighScore = localStorage.getItem('dinoHighScore');
    if (savedHighScore) {
      this.highScore = parseInt(savedHighScore, 10);
    }
    
    // Initialize background particles
    this.initParticles();
    this.initClouds();
    this.initUndergroundElements();
    
    this.init();
  }
  
  private initSun() {
    // Position sun in top-left area
    this.sun.x = 80;
    this.sun.y = 60;
    this.sun.radius = 40;
  }
  
  private initTrees() {
    // Create 3-4 trees in the background
    const groundY = this.dimensions.HEIGHT - 12;
    const numTrees = 3 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < numTrees; i++) {
      this.trees.push({
        x: Math.random() * this.dimensions.WIDTH,
        y: groundY - 40 - Math.random() * 20, // Trees sit on ground, vary height slightly
        width: 30 + Math.random() * 15,
        height: 40 + Math.random() * 20,
        speed: Math.random() * 0.1 + 0.05, // Slow parallax
        type: 'tree'
      });
    }
  }

  private initClouds() {
    // Create clouds at different heights
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * this.dimensions.WIDTH,
        y: Math.random() * (this.dimensions.HEIGHT * 0.4), // Upper 40% of screen
        width: Math.random() * 60 + 40,
        height: Math.random() * 20 + 15,
        speed: Math.random() * 0.3 + 0.2,
        opacity: Math.random() * 0.15 + 0.08
      });
    }
  }

  private initUndergroundElements() {
    const groundY = this.dimensions.HEIGHT - 12;
    
    // Create underground roots/veins
    for (let i = 0; i < 8; i++) {
      this.undergroundElements.push({
        x: Math.random() * this.dimensions.WIDTH,
        y: groundY + Math.random() * 30 + 5,
        size: Math.random() * 15 + 5,
        speed: Math.random() * 0.1 + 0.05,
        opacity: Math.random() * 0.2 + 0.1,
        type: 'root'
      });
    }
    
    // Create glowing underground particles
    for (let i = 0; i < 12; i++) {
      this.undergroundElements.push({
        x: Math.random() * this.dimensions.WIDTH,
        y: groundY + Math.random() * 40 + 2,
        size: Math.random() * 4 + 2,
        speed: Math.random() * 0.15 + 0.05,
        opacity: Math.random() * 0.3 + 0.15,
        type: 'glow'
      });
    }
  }

  private initParticles() {
    // Create small bubbles throughout the screen (very minimal, well-spaced)
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: Math.random() * this.dimensions.WIDTH,
        y: Math.random() * this.dimensions.HEIGHT,
        size: Math.random() * 3 + 2, // Small bubbles: 2-5px
        speedY: -(Math.random() * 0.3 + 0.15),
        speedX: (Math.random() - 0.5) * 0.1,
        opacity: Math.random() * 0.2 + 0.08, // Very subtle
        type: 'particle'
      });
    }
    
    // Create small white dots throughout entire screen (stars/sparkles)
    // Reduced to 35 for very spacious look, well distributed
    for (let i = 0; i < 35; i++) {
      this.particles.push({
        x: Math.random() * this.dimensions.WIDTH,
        y: Math.random() * this.dimensions.HEIGHT,
        size: Math.random() * 1.5 + 1, // Smaller: 1-2.5px
        speedY: 0, // Static (no movement)
        speedX: 0,
        opacity: Math.random() * 0.5 + 0.15, // More subtle: 0.15-0.65
        type: 'white-dot'
      });
    }
  }

  private updateClouds() {
    for (const cloud of this.clouds) {
      cloud.x -= cloud.speed;
      
      // Wrap around when cloud goes off screen
      if (cloud.x + cloud.width < 0) {
        cloud.x = this.dimensions.WIDTH + Math.random() * 100;
        cloud.y = Math.random() * (this.dimensions.HEIGHT * 0.4);
      }
    }
  }
  
  private updateTrees() {
    const groundY = this.dimensions.HEIGHT - 12;
    
    for (const tree of this.trees) {
      tree.x -= tree.speed;
      
      // Wrap around when tree goes off screen
      if (tree.x + tree.width < 0) {
        tree.x = this.dimensions.WIDTH + Math.random() * 50;
        tree.y = groundY - 40 - Math.random() * 20;
      }
    }
  }

  private updateUndergroundElements() {
    const groundY = this.dimensions.HEIGHT - 12;
    
    for (const element of this.undergroundElements) {
      element.x -= element.speed;
      
      // Wrap around
      if (element.x < -element.size) {
        element.x = this.dimensions.WIDTH + element.size;
        if (element.type === 'root') {
          element.y = groundY + Math.random() * 30 + 5;
        } else {
          element.y = groundY + Math.random() * 40 + 2;
        }
      }
    }
  }

  private drawClouds() {
    for (const cloud of this.clouds) {
      this.ctx.save();
      this.ctx.fillStyle = `rgba(130, 173, 75, ${cloud.opacity})`;
      
      // Draw cloud as multiple overlapping circles
      const numPuffs = 3;
      for (let i = 0; i < numPuffs; i++) {
        const puffX = cloud.x + (i * cloud.width) / (numPuffs + 1);
        const puffRadius = cloud.height / 2 + (i === 1 ? 5 : 0);
        
        this.ctx.beginPath();
        this.ctx.arc(puffX, cloud.y, puffRadius, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.restore();
    }
  }
  
  private drawSun() {
    this.ctx.save();
    
    // Draw sun glow
    const gradient = this.ctx.createRadialGradient(
      this.sun.x, this.sun.y, 0,
      this.sun.x, this.sun.y, this.sun.radius * 1.5
    );
    gradient.addColorStop(0, 'rgba(255, 220, 100, 0.4)');
    gradient.addColorStop(0.5, 'rgba(255, 200, 80, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 180, 60, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(this.sun.x, this.sun.y, this.sun.radius * 1.5, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw sun body
    this.ctx.fillStyle = '#FFD966';
    this.ctx.beginPath();
    this.ctx.arc(this.sun.x, this.sun.y, this.sun.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Add highlight
    const highlightGradient = this.ctx.createRadialGradient(
      this.sun.x - 10, this.sun.y - 10, 0,
      this.sun.x, this.sun.y, this.sun.radius
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 200, 0.6)');
    highlightGradient.addColorStop(1, 'rgba(255, 220, 100, 0)');
    
    this.ctx.fillStyle = highlightGradient;
    this.ctx.beginPath();
    this.ctx.arc(this.sun.x, this.sun.y, this.sun.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
  }
  
  private drawTrees() {
    for (const tree of this.trees) {
      this.ctx.save();
      
      // Tree trunk (darker brown)
      const trunkWidth = tree.width * 0.25;
      const trunkHeight = tree.height * 0.4;
      
      this.ctx.fillStyle = '#5D3A1A';
      this.ctx.fillRect(
        tree.x + tree.width / 2 - trunkWidth / 2,
        tree.y + tree.height - trunkHeight,
        trunkWidth,
        trunkHeight
      );
      
      // Tree foliage (darker forest green/teal - very different from bright cacti)
      const foliageRadius = tree.width / 2;
      
      // Draw 3 overlapping circles for tree top
      this.ctx.fillStyle = '#2D5940'; // Dark forest green
      
      // Left circle
      this.ctx.beginPath();
      this.ctx.arc(
        tree.x + foliageRadius * 0.6,
        tree.y + tree.height - trunkHeight - foliageRadius * 0.5,
        foliageRadius * 0.8,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
      
      // Right circle
      this.ctx.beginPath();
      this.ctx.arc(
        tree.x + tree.width - foliageRadius * 0.6,
        tree.y + tree.height - trunkHeight - foliageRadius * 0.5,
        foliageRadius * 0.8,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
      
      // Top circle (main)
      this.ctx.beginPath();
      this.ctx.arc(
        tree.x + tree.width / 2,
        tree.y + tree.height - trunkHeight - foliageRadius * 0.7,
        foliageRadius,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
      
      // Add even darker shade for depth
      this.ctx.fillStyle = '#1F4030';
      this.ctx.beginPath();
      this.ctx.arc(
        tree.x + tree.width / 2,
        tree.y + tree.height - trunkHeight - foliageRadius * 0.5,
        foliageRadius * 0.6,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
      
      this.ctx.restore();
    }
  }

  private drawUndergroundElements() {
    const groundY = this.dimensions.HEIGHT - 12;
    
    for (const element of this.undergroundElements) {
      this.ctx.save();
      
      if (element.type === 'root') {
        // Draw organic root-like shapes
        this.ctx.strokeStyle = `rgba(130, 173, 75, ${element.opacity})`;
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(element.x, groundY + 2);
        
        // Curvy line going down
        const segments = 3;
        for (let i = 1; i <= segments; i++) {
          const progress = i / segments;
          const offsetX = Math.sin(progress * Math.PI * 2) * 5;
          this.ctx.lineTo(
            element.x + offsetX,
            groundY + 2 + (element.size * progress)
          );
        }
        
        this.ctx.stroke();
        
      } else if (element.type === 'glow') {
        // Draw glowing particles
        const gradient = this.ctx.createRadialGradient(
          element.x, element.y, 0,
          element.x, element.y, element.size
        );
        gradient.addColorStop(0, `rgba(130, 173, 75, ${element.opacity})`);
        gradient.addColorStop(1, `rgba(130, 173, 75, 0)`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(element.x, element.y, element.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.restore();
    }
  }

  private updateParticles() {
    const groundY = this.dimensions.HEIGHT - 12;
    
    for (const particle of this.particles) {
      // Skip updates for static white dots
      if (particle.type === 'white-dot') {
        continue; // White dots are static, no position updates needed
      }
      
      // Update position
      particle.y += particle.speedY;
      particle.x += particle.speedX;
      
      // Reset particles that go off screen
      if (particle.type === 'cloud-bubble') {
        // Keep cloud-bubbles in play area
        if (particle.y < -particle.size) {
          particle.y = groundY + particle.size;
          particle.x = Math.random() * this.dimensions.WIDTH;
        }
        if (particle.y > groundY) {
          particle.y = -particle.size;
          particle.x = Math.random() * this.dimensions.WIDTH;
        }
        // Horizontal wrapping
        if (particle.x < -particle.size) particle.x = this.dimensions.WIDTH + particle.size;
        if (particle.x > this.dimensions.WIDTH + particle.size) particle.x = -particle.size;
      } else {
        // Wrap around for small particles (entire screen)
        if (particle.y < -particle.size) particle.y = this.dimensions.HEIGHT + particle.size;
        if (particle.y > this.dimensions.HEIGHT + particle.size) particle.y = -particle.size;
        if (particle.x < -particle.size) particle.x = this.dimensions.WIDTH + particle.size;
        if (particle.x > this.dimensions.WIDTH + particle.size) particle.x = -particle.size;
      }
    }
  }

  private drawParticles() {
    for (const particle of this.particles) {
      this.ctx.save();
      
      if (particle.type === 'cloud-bubble') {
        // Draw cloud-like shape (multiple overlapping circles)
        this.ctx.fillStyle = `rgba(150, 180, 150, ${particle.opacity})`;
        
        const numPuffs = 3;
        for (let i = 0; i < numPuffs; i++) {
          const puffX = particle.x + (i * particle.size * 0.8) / numPuffs - particle.size * 0.4;
          const puffRadius = particle.size / 3 + (i === 1 ? 5 : 0);
          
          this.ctx.beginPath();
          this.ctx.arc(puffX, particle.y, puffRadius, 0, Math.PI * 2);
          this.ctx.fill();
        }
      } else if (particle.type === 'white-dot') {
        // Draw small white dots (stars/sparkles)
        this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // Draw simple small bubbles with subtle gradient
        const gradient = this.ctx.createRadialGradient(
          particle.x - particle.size * 0.3,
          particle.y - particle.size * 0.3,
          0,
          particle.x,
          particle.y,
          particle.size
        );
        gradient.addColorStop(0, `rgba(200, 220, 255, ${particle.opacity * 0.8})`);
        gradient.addColorStop(0.5, `rgba(180, 200, 240, ${particle.opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(160, 180, 220, ${particle.opacity * 0.2})`);
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
      
      this.ctx.restore();
    }
  }

  private createBeepSound(frequency: number, duration: number, volume: number): HTMLAudioElement {
    // Create a simple beep tone using Web Audio API and convert to Audio element
    const audio = new Audio();
    
    try {
      // Create an audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const numSamples = sampleRate * duration;
      const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      // Generate sine wave
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        // Apply fade out to avoid clicks
        const fadeOut = Math.max(0, 1 - (i / numSamples) * 2);
        channelData[i] = Math.sin(2 * Math.PI * frequency * t) * fadeOut * volume;
      }
      
      // Convert to WAV and create blob URL
      const wav = this.audioBufferToWav(audioBuffer);
      const blob = new Blob([wav], { type: 'audio/wav' });
      audio.src = URL.createObjectURL(blob);
      audio.volume = volume;
    } catch (e) {
      // Fallback: use silent audio if Web Audio API fails
      console.warn('Web Audio API not available, sounds disabled');
    }
    
    return audio;
  }

  private audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const length = buffer.length * buffer.numberOfChannels * 2 + 44;
    const arrayBuffer = new ArrayBuffer(length);
    const view = new DataView(arrayBuffer);
    const channels: Float32Array[] = [];
    let offset = 0;
    let pos = 0;

    // Write WAV header
    const setUint16 = (data: number) => {
      view.setUint16(pos, data, true);
      pos += 2;
    };
    const setUint32 = (data: number) => {
      view.setUint32(pos, data, true);
      pos += 4;
    };

    // RIFF chunk descriptor
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    // FMT sub-chunk
    setUint32(0x20746d66); // "fmt "
    setUint32(16); // chunk length
    setUint16(1); // PCM
    setUint16(buffer.numberOfChannels);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * buffer.numberOfChannels); // byte rate
    setUint16(buffer.numberOfChannels * 2); // block align
    setUint16(16); // bits per sample

    // Data sub-chunk
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4); // chunk length

    // Write interleaved data
    for (let i = 0; i < buffer.numberOfChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < buffer.numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff; // scale to 16-bit
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    return arrayBuffer;
  }

  private playJumpSound() {
    try {
      this.jumpSound.currentTime = 0;
      this.jumpSound.play().catch(() => {
        // Ignore errors on mobile browsers that block autoplay
      });
    } catch (e) {
      // Silently fail if sound can't play
    }
  }

  private playScoreSound() {
    try {
      this.scoreSound.currentTime = 0;
      this.scoreSound.play().catch(() => {});
    } catch (e) {}
  }

  private playGameOverSound() {
    try {
      this.gameOverSound.currentTime = 0;
      this.gameOverSound.play().catch(() => {});
    } catch (e) {}
  }

  private init() {
    this.ctx.fillStyle = '#0b0c0e';
    this.ctx.fillRect(0, 0, this.dimensions.WIDTH, this.dimensions.HEIGHT);
    
    // Draw initial state
    this.tRex.draw();
    this.drawGround();
    
    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Click/touch to jump
    const handleInput = (e: Event) => {
      if (!this.crashed && this.activated) {
        const target = e.target as HTMLElement | null;
        // Ignore taps/clicks on navigation and obvious buttons/links
        if (target && target.closest('nav[aria-label="Bottom navigation"], button, a, [role="button"], [data-ignore-jump]')) {
          return;
        }
        // prevent scroll/tap highlights during gameplay
        if (e.cancelable) e.preventDefault();
        this.tRex.startJump();
      }
    };

    // Whole screen/toplevel interactions
    document.addEventListener('click', handleInput);
    document.addEventListener('touchstart', handleInput, { passive: false });
    this.canvas.addEventListener('click', handleInput);
    this.canvas.addEventListener('touchstart', handleInput, { passive: false });
    
    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleInput(e);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        this.tRex.endJump();
      }
    });
  }

  public start() {
    if (!this.activated) {
      this.activated = true;
      this.started = true;
      this.time = performance.now();
      this.startupElapsed = 0; // reset startup ramp
      this.update();
    }
  }

  public stop() {
    this.activated = false;
    this.paused = true;
    if (this.raqId) {
      cancelAnimationFrame(this.raqId);
      this.raqId = 0;
    }
  }

  public restart() {
    this.crashed = false;
    this.activated = true;
    this.paused = false;
    this.distanceRan = 0;
    this.currentSpeed = this.config.SPEED;
    this.time = performance.now();
    this.runningTime = 0;
    this.startupElapsed = 0; // reset startup ramp
    this.obstacles = [];
    this.lastScoreMilestone = 0; // Reset milestone tracker
    this.particles = []; // Clear particles
    this.clouds = []; // Clear clouds
    this.undergroundElements = []; // Clear underground
    this.initParticles(); // Reinitialize particles
    this.initClouds(); // Reinitialize clouds
    this.initUndergroundElements(); // Reinitialize underground
    this.tRex.reset();
    this.clearCanvas();
    this.update();
  }

  private update = () => {
    const now = performance.now();
    const rawDeltaTime = now - (this.time || now);
    this.time = now;
    
    // Clamp deltaTime to prevent large jumps
    const MAX_DELTA_TIME = 100;
    const deltaTime = Math.min(Math.max(rawDeltaTime, 16.67), MAX_DELTA_TIME);
    
    if (this.activated) {
      this.clearCanvas();
      
      this.runningTime += deltaTime;
      
      // Update and draw background particles
      this.updateParticles();
      this.drawParticles();
      
      // Update and draw clouds
      this.updateClouds();
      this.drawClouds();
      
      // Update T-Rex
      if (this.tRex.jumping) {
        this.tRex.updateJump(deltaTime);
      }
      
      // Update startup ramp timer
      this.startupElapsed += deltaTime;

      // Update distance - use effective speed with ramp and platform coefficient
      const effectiveSpeed = this.getEffectiveSpeed();
      this.distanceRan += effectiveSpeed * deltaTime / this.msPerFrame;
      
      // Increase speed gradually
      if (this.currentSpeed < this.config.MAX_SPEED) {
        this.currentSpeed += this.config.ACCELERATION;
      }
      
      // Draw everything
      this.drawGround();
      
      // Draw underground animations below ground
      this.drawUndergroundElements();
      this.updateUndergroundElements();
      
      this.tRex.draw();
      this.drawScore();
      
      // Check for score milestones and play sound
      const currentScore = Math.floor(this.distanceRan * 0.025);
      if (currentScore > 0 && currentScore % 100 === 0 && currentScore !== this.lastScoreMilestone) {
        this.lastScoreMilestone = currentScore;
        this.playScoreSound();
      }
      
      // Update obstacles
      this.updateObstacles(deltaTime);
      
      // Draw obstacles
      for (const obstacle of this.obstacles) {
        this.drawObstacle(obstacle);
      }
      
      // Max score cap: stop at 1500
      if (currentScore >= 1500) {
        this.gameOver();
        return;
      }

      // Check collision
      if (this.checkCollision()) {
        this.gameOver();
      }
      
      if (!this.crashed) {
        this.raqId = requestAnimationFrame(this.update);
      }
    }
  };

  private updateObstacles(deltaTime: number) {
    // Update existing obstacles - use effective speed with ramp
    const updatedObstacles: Obstacle[] = [];
    const effectiveSpeed = this.getEffectiveSpeed();
    for (const obstacle of this.obstacles) {
      obstacle.xPos -= Math.floor((effectiveSpeed * FPS / 1000) * deltaTime);
      
      if (obstacle.xPos + obstacle.width > 0) {
        updatedObstacles.push(obstacle);
      }
    }
    this.obstacles = updatedObstacles;
    
    // Add new obstacles
    if (this.obstacles.length === 0 || this.shouldAddObstacle()) {
      this.addObstacle();
    }
  }

  private shouldAddObstacle(): boolean {
    if (this.obstacles.length === 0) return true;
    
    const lastObstacle = this.obstacles[this.obstacles.length - 1];
    const gap = this.dimensions.WIDTH - (lastObstacle.xPos + lastObstacle.width);
    return gap > lastObstacle.gap;
  }

  private addObstacle() {
    const typeIndex = Math.floor(Math.random() * this.obstacleTypes.length);
    const type = this.obstacleTypes[typeIndex];
    const size = Math.min(Math.floor(Math.random() * 3) + 1, 3);
    
    // Calculate speed progress (0 to 1) from initial speed to max speed
    const speedProgress = Math.min((this.currentSpeed - this.config.SPEED) / (this.config.MAX_SPEED - this.config.SPEED), 1);
    
    // Scale obstacle height based on speed
    // Start at 85% of base height, grow to 100% at max speed
    const minHeightScale = 0.85;
    const heightScale = minHeightScale + (speedProgress * (1 - minHeightScale));
    const scaledHeight = Math.round(type.height * heightScale);
    
    const obstacle: Obstacle = {
      xPos: this.dimensions.WIDTH,
      yPos: this.dimensions.HEIGHT - 12 - scaledHeight, // Recalculate yPos with scaled height
      width: type.width * size,
      height: scaledHeight, // Use scaled height
      size,
      typeConfig: type,
      remove: false,
      gap: this.calculateGap(type, size),
    };
    
    this.obstacles.push(obstacle);
  }

  private calculateGap(type: any, size: number): number {
    const minGap = Math.round(type.width * size * this.currentSpeed + type.minGap * this.config.GAP_COEFFICIENT);
    const maxGap = Math.round(minGap * 1.5);
    return Math.floor(Math.random() * (maxGap - minGap + 1)) + minGap;
  }

  private drawObstacle(obstacle: Obstacle) {
    this.ctx.save();
    
    const x = obstacle.xPos;
    const y = obstacle.yPos;
    const w = obstacle.width;
    const h = obstacle.height;
    
    // Vibrant cactus colors that stand out
    const FILL = '#2D8B3C'; // Brighter, more saturated green
    const STROKE = '#1A5228'; // Dark forest green outline
    const HIGHLIGHT = '#3FA84F'; // Lighter green for highlights
    const lineW = Math.max(2, Math.round(this.dimensions.WIDTH / 400));

    // Helper to draw a filled rect with outline and highlight
    const drawBlock = (rx: number, ry: number, rw: number, rh: number) => {
      // Main fill
      this.ctx.fillStyle = FILL;
      this.ctx.fillRect(rx, ry, rw, rh);
      
      // Highlight on left side for 3D effect
      this.ctx.fillStyle = HIGHLIGHT;
      this.ctx.fillRect(rx, ry, Math.max(1, Math.floor(rw * 0.25)), rh);
      
      // Dark outline
      this.ctx.strokeStyle = STROKE;
      this.ctx.lineWidth = lineW;
      this.ctx.strokeRect(rx + 0.5, ry + 0.5, rw - 1, rh - 1);
    };

    // Compute proportions (thin body, small arms)
    const bodyRatio = obstacle.typeConfig.type === 'CACTUS_SMALL' ? 0.45 : 0.4;
    const armRatio = obstacle.typeConfig.type === 'CACTUS_SMALL' ? 0.5 : 0.55;
    const bodyW = Math.max(3, Math.floor(w * bodyRatio));
    const bodyX = x + Math.floor((w - bodyW) / 2);
    const armW = Math.max(2, Math.floor(bodyW * armRatio));
    const armH = Math.max(6, Math.floor(h * 0.28));

    // Main vertical body
    drawBlock(bodyX, y, bodyW, h);

    // Arms: left and right for large; only one set for small
    if (obstacle.typeConfig.type === 'CACTUS_SMALL') {
      const elbowY = y + Math.floor(h * 0.45);
      // Left arm
      drawBlock(bodyX - Math.floor(armW * 0.8), elbowY, armW, Math.floor(armH * 0.9));
      // Left tip
      drawBlock(bodyX - Math.floor(armW * 0.8), elbowY - Math.floor(armH * 0.6), Math.floor(armW * 0.7), Math.floor(armH * 0.6));
      // Right (short) arm
      drawBlock(bodyX + bodyW - Math.floor(armW * 0.2), elbowY + Math.floor(armH * 0.2), Math.floor(armW * 0.8), Math.floor(armH * 0.8));
    } else {
      // Larger cactus: two arms, offset heights
      const leftY = y + Math.floor(h * 0.35);
      const rightY = y + Math.floor(h * 0.55);
      // Left arm
      drawBlock(bodyX - Math.floor(armW * 0.9), leftY, armW, Math.floor(armH * 1.0));
      drawBlock(bodyX - Math.floor(armW * 0.9), leftY - Math.floor(armH * 0.6), Math.floor(armW * 0.7), Math.floor(armH * 0.6));
      // Right arm
      drawBlock(bodyX + bodyW - Math.floor(armW * 0.1), rightY, armW, Math.floor(armH * 1.0));
      drawBlock(bodyX + bodyW + Math.floor(armW * 0.2), rightY - Math.floor(armH * 0.55), Math.floor(armW * 0.7), Math.floor(armH * 0.55));
    }

    // Ground shadow at base
    this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
    this.ctx.fillRect(x, y + h - 2, w, 2);
    
    this.ctx.restore();
  }

  private checkCollision(): boolean {
    for (const obstacle of this.obstacles) {
      // Rectangle collision detection for cactus obstacles
      // Add slight tolerance to make gameplay more forgiving
      const tolerance = 4;
      
      if (
        this.tRex.xPos + tolerance < obstacle.xPos + obstacle.width &&
        this.tRex.xPos + this.tRex.width - tolerance > obstacle.xPos &&
        this.tRex.yPos + tolerance < obstacle.yPos + obstacle.height &&
        this.tRex.yPos + this.tRex.height - tolerance > obstacle.yPos
      ) {
        return true;
      }
    }
    return false;
  }

  private drawGround() {
    // Dynamic ground position based on canvas height (always 12px from bottom)
    const groundY = this.dimensions.HEIGHT - 12;
    
    // Draw grass-like ground with brighter gradient
    const groundGradient = this.ctx.createLinearGradient(0, groundY - 10, 0, this.dimensions.HEIGHT);
    groundGradient.addColorStop(0, '#8BC34A'); // Brighter lime green
    groundGradient.addColorStop(0.4, '#7CB342'); // Bright green
    groundGradient.addColorStop(1, '#689F38'); // Medium green
    
    this.ctx.fillStyle = groundGradient;
    this.ctx.fillRect(0, groundY, this.dimensions.WIDTH, this.dimensions.HEIGHT - groundY);
    
    // Draw prominent ground line with stronger glow
    this.ctx.save();
    this.ctx.shadowColor = 'rgba(139, 195, 74, 1)';
    this.ctx.shadowBlur = 12;
    this.ctx.strokeStyle = '#8BC34A'; // Brighter line
    this.ctx.lineWidth = 1; // Ultra-thin line
    this.ctx.beginPath();
    this.ctx.moveTo(0, groundY);
    this.ctx.lineTo(this.dimensions.WIDTH, groundY);
    this.ctx.stroke();
    
    // Draw secondary highlight line above for depth
    this.ctx.shadowBlur = 6;
    this.ctx.strokeStyle = '#9CCC65';
    this.ctx.lineWidth = 0.5; // Ultra-thin highlight
    this.ctx.beginPath();
    this.ctx.moveTo(0, groundY - 1);
    this.ctx.lineTo(this.dimensions.WIDTH, groundY - 1);
    this.ctx.stroke();
    this.ctx.restore();
    
    // Draw grass blades pattern (reduced density and height for cleaner look)
    this.ctx.strokeStyle = 'rgba(124, 179, 66, 0.3)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.dimensions.WIDTH; i += 32) {
      // Extra-small grass blades
      this.ctx.beginPath();
      this.ctx.moveTo(i + 6, groundY);
      this.ctx.lineTo(i + 4, groundY - 2);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(i + 16, groundY);
      this.ctx.lineTo(i + 17, groundY - 2);
      this.ctx.stroke();
    }
  }

  private drawScore() {
    const score = Math.floor(this.distanceRan * 0.025);
    
    // Adjusted font sizes - smaller current score, similar to HI score
    const fontSize = Math.max(18, Math.floor(this.dimensions.WIDTH / 20)); // Reduced size
    const hiFontSize = Math.max(16, Math.floor(this.dimensions.WIDTH / 20));
    
    // Draw score with strong shadow/outline for visibility
    this.ctx.save();
    
    // Draw HI score on LEFT side if exists
    if (this.highScore > 0) {
      // Outline
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 4;
      this.ctx.font = `900 ${hiFontSize}px monospace`; // Extra bold
      this.ctx.textAlign = 'left';
      this.ctx.strokeText(`HI ${this.highScore.toString().padStart(5, '0')}`, 20, 24);
      
      // Fill with yellow color - no shadow
      this.ctx.shadowColor = 'transparent';
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillText(`HI ${this.highScore.toString().padStart(5, '0')}`, 20, 24);
    }
    
    // Draw current score on RIGHT side - smaller, no glow
    // Black outline for contrast
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 3; // Reduced from 6
    this.ctx.font = `900 ${fontSize}px monospace`; // Extra bold
    this.ctx.textAlign = 'right';
    this.ctx.strokeText(score.toString().padStart(5, '0'), this.dimensions.WIDTH - 20, 30);
    
    // White text without glow
    this.ctx.shadowColor = 'transparent'; // No glow
    this.ctx.shadowBlur = 0; // No blur
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillText(score.toString().padStart(5, '0'), this.dimensions.WIDTH - 20, 30);
    
    this.ctx.restore();
  }

  private clearCanvas() {
    // Use dark theme background color (matching the app theme)
    this.ctx.fillStyle = '#0a0b0d';
    this.ctx.fillRect(0, 0, this.dimensions.WIDTH, this.dimensions.HEIGHT);
  }

  private gameOver() {
    this.crashed = true;
    this.stop();
    
    // Play game over sound
    this.playGameOverSound();
    
    const finalScore = Math.floor(this.distanceRan * 0.025);
    
    // Update high score
    if (finalScore > this.highScore) {
      this.highScore = finalScore;
      localStorage.setItem('dinoHighScore', this.highScore.toString());
    }
    
    console.log('🎮 Game Over! Score:', finalScore, 'High Score:', this.highScore);
    
    if (this.onGameOver) {
      this.onGameOver(finalScore);
    }
  }

  public getScore(): number {
    return Math.floor(this.distanceRan * 0.025);
  }
}
