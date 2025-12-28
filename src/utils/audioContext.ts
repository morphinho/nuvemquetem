class AudioManager {
  private audioContext: AudioContext | null = null;
  private isUnlocked: boolean = false;
  private unlockListeners: (() => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioContext();
      this.setupUnlockListeners();
    }
  }

  private initAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    } catch (error) {
      console.warn('AudioContext not supported:', error);
    }
  }

  private setupUnlockListeners() {
    const unlockEvents = ['touchstart', 'touchend', 'mousedown', 'keydown', 'click'];

    const unlock = () => {
      if (this.isUnlocked) return;

      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const tempAudio = new Audio();
      tempAudio.volume = 0;
      const playPromise = tempAudio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            tempAudio.pause();
            tempAudio.remove();
            this.isUnlocked = true;
            this.notifyUnlock();
            this.removeUnlockListeners(unlockEvents, unlock);
          })
          .catch(() => {
            // Ainda não desbloqueado, aguardar próxima interação
          });
      }
    };

    unlockEvents.forEach(event => {
      document.addEventListener(event, unlock, { once: false, passive: true });
    });
  }

  private removeUnlockListeners(events: string[], handler: () => void) {
    events.forEach(event => {
      document.removeEventListener(event, handler);
    });
  }

  private notifyUnlock() {
    this.unlockListeners.forEach(listener => listener());
    this.unlockListeners = [];
  }

  public onUnlock(callback: () => void) {
    if (this.isUnlocked) {
      callback();
    } else {
      this.unlockListeners.push(callback);
    }
  }

  public getIsUnlocked(): boolean {
    return this.isUnlocked;
  }

  public async tryPlay(audio: HTMLAudioElement, retries = 3): Promise<boolean> {
    for (let i = 0; i < retries; i++) {
      try {
        if (this.audioContext && this.audioContext.state === 'suspended') {
          await this.audioContext.resume();
        }

        await audio.play();
        return true;
      } catch (error) {
        if (i === retries - 1) {
          console.log('Autoplay blocked after retries:', error);
          return false;
        }
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
      }
    }
    return false;
  }
}

export const audioManager = new AudioManager();
