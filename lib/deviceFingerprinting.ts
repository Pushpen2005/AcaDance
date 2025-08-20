/**
 * Device Fingerprinting Utility
 * Generates unique device fingerprints for attendance security
 */

export interface DeviceInfo {
  fingerprint: string;
  browser: string;
  os: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  userAgent: string;
}

class DeviceFingerprinter {
  private fingerprint: string | null = null;

  /**
   * Generate a unique device fingerprint
   */
  async generateFingerprint(): Promise<string> {
    if (this.fingerprint) {
      return this.fingerprint;
    }

    const components = await Promise.all([
      this.getCanvasFingerprint(),
      this.getWebGLFingerprint(),
      this.getAudioFingerprint(),
      this.getScreenFingerprint(),
      this.getTimezoneFingerprint(),
      this.getFontFingerprint(),
      this.getHardwareFingerprint(),
    ]);

    const combinedData = components.join('|');
    this.fingerprint = await this.hashString(combinedData);
    
    // Store in localStorage for consistency
    localStorage.setItem('device_fingerprint', this.fingerprint);
    
    return this.fingerprint;
  }

  /**
   * Get stored fingerprint or generate new one
   */
  async getFingerprint(): Promise<string> {
    const stored = localStorage.getItem('device_fingerprint');
    if (stored) {
      this.fingerprint = stored;
      return stored;
    }
    return this.generateFingerprint();
  }

  /**
   * Get detailed device information
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    const fingerprint = await this.getFingerprint();
    
    return {
      fingerprint,
      browser: this.getBrowserInfo(),
      os: this.getOSInfo(),
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      userAgent: navigator.userAgent,
    };
  }

  /**
   * Validate if current device matches stored fingerprint
   */
  async validateDevice(storedFingerprint: string): Promise<boolean> {
    const currentFingerprint = await this.getFingerprint();
    return currentFingerprint === storedFingerprint;
  }

  /**
   * Canvas fingerprinting
   */
  private getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'no-canvas';

      canvas.width = 200;
      canvas.height = 50;

      // Draw text with different fonts and styles
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Device Fingerprint 🔒', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Attendance Security', 4, 30);

      return canvas.toDataURL();
    } catch {
      return 'canvas-error';
    }
  }

  /**
   * WebGL fingerprinting
   */
  private getWebGLFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
      if (!gl) return 'no-webgl';

      const renderer = gl.getParameter(gl.RENDERER);
      const vendor = gl.getParameter(gl.VENDOR);
      const version = gl.getParameter(gl.VERSION);
      const extensions = gl.getSupportedExtensions()?.join(',') || '';

      return `${renderer}|${vendor}|${version}|${extensions}`;
    } catch {
      return 'webgl-error';
    }
  }

  /**
   * Audio context fingerprinting
   */
  private async getAudioFingerprint(): Promise<string> {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return 'no-audio';

      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gain = context.createGain();
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(10000, context.currentTime);

      gain.gain.setValueAtTime(0, context.currentTime);
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gain);
      gain.connect(context.destination);

      oscillator.start(0);

      return new Promise((resolve) => {
        let sampleCount = 0;
        const samples: number[] = [];

        scriptProcessor.onaudioprocess = (event) => {
          const inputData = event.inputBuffer.getChannelData(0);
          for (let i = 0; i < inputData.length; i++) {
            samples.push(inputData[i]);
            if (++sampleCount >= 1000) {
              const audioHash = samples.reduce((sum, sample) => sum + Math.abs(sample), 0).toString();
              context.close();
              resolve(audioHash);
              return;
            }
          }
        };

        setTimeout(() => {
          context.close();
          resolve('audio-timeout');
        }, 1000);
      });
    } catch {
      return 'audio-error';
    }
  }

  /**
   * Screen and display fingerprinting
   */
  private getScreenFingerprint(): string {
    const screen = window.screen;
    return [
      screen.width,
      screen.height,
      screen.availWidth,
      screen.availHeight,
      screen.colorDepth,
      screen.pixelDepth,
      window.devicePixelRatio || 1,
    ].join('x');
  }

  /**
   * Timezone fingerprinting
   */
  private getTimezoneFingerprint(): string {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset();
    return `${timezone}|${offset}`;
  }

  /**
   * Font detection fingerprinting
   */
  private getFontFingerprint(): string {
    const testFonts = [
      'Arial', 'Arial Black', 'Arial Narrow', 'Arial Rounded MT Bold',
      'Comic Sans MS', 'Courier', 'Courier New', 'Georgia', 'Helvetica',
      'Impact', 'Lucida Console', 'Lucida Sans Unicode', 'Microsoft Sans Serif',
      'Palatino Linotype', 'Tahoma', 'Times', 'Times New Roman', 'Trebuchet MS',
      'Verdana', 'Wingdings'
    ];

    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) return 'no-fonts';

    // Get baseline measurements
    const baseWidths: { [key: string]: number } = {};
    for (const baseFont of baseFonts) {
      context.font = `${testSize} ${baseFont}`;
      baseWidths[baseFont] = context.measureText(testString).width;
    }

    // Test each font
    const availableFonts: string[] = [];
    for (const testFont of testFonts) {
      for (const baseFont of baseFonts) {
        context.font = `${testSize} ${testFont}, ${baseFont}`;
        const width = context.measureText(testString).width;
        if (width !== baseWidths[baseFont]) {
          availableFonts.push(testFont);
          break;
        }
      }
    }

    return availableFonts.join(',');
  }

  /**
   * Hardware fingerprinting
   */
  private getHardwareFingerprint(): string {
    const nav = navigator as any;
    return [
      nav.hardwareConcurrency || 'unknown',
      nav.deviceMemory || 'unknown',
      nav.maxTouchPoints || 0,
      typeof nav.getBattery === 'function' ? 'battery-api' : 'no-battery',
    ].join('|');
  }

  /**
   * Browser information
   */
  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Unknown';
  }

  /**
   * Operating system information
   */
  private getOSInfo(): string {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS') || platform.includes('iPhone') || platform.includes('iPad')) return 'iOS';
    
    return 'Unknown';
  }

  /**
   * Hash a string using Web Crypto API
   */
  private async hashString(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback to simple hash if Web Crypto API is not available
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash).toString(16);
    }
  }

  /**
   * Clear stored fingerprint (for testing)
   */
  clearFingerprint(): void {
    this.fingerprint = null;
    localStorage.removeItem('device_fingerprint');
  }
}

// Export singleton instance
export const deviceFingerprinter = new DeviceFingerprinter();

// Utility functions
export const getDeviceFingerprint = () => deviceFingerprinter.getFingerprint();
export const getDeviceInfo = () => deviceFingerprinter.getDeviceInfo();
export const validateDevice = (stored: string) => deviceFingerprinter.validateDevice(stored);
