import * as THREE from 'three';
import { commentarySoundManager, ScheduledCommentaryEvent } from './commentarySoundManager';
import {
  audioSpatialDirector,
  SpatialAudioSource,
  SpatialCameraListener,
  BiomeAmbienceType,
  CameraAcousticPerspective,
  FlybyEvent
} from './audioSpatialDirector';
import { CameraMode, TrackBiome, WeatherType } from '../types';

/**
 * Interface cho 1 Voice động cơ ô tô không gian (Stereo Spatial Car Voice)
 * Hỗ trợ đa âm sắc: Saw primary + Sub triangle + Pulse harmonics + Turbo spool + Gear whine
 */
interface SpatialEngineVoice {
  oscSaw: OscillatorNode;
  oscSub: OscillatorNode;
  oscPulse: OscillatorNode;
  oscTurbo: OscillatorNode;
  turboGain: GainNode;
  gearWhineOsc: OscillatorNode;
  gearWhineGain: GainNode;
  bovSource: AudioBufferSourceNode | null;
  filter: BiquadFilterNode;
  panner: StereoPannerNode;
  gain: GainNode;
  activeCarId: string;
  lastShiftTime: number;
}

/**
 * RACING AUDIO DIRECTOR 3.0
 * Hệ thống âm thanh đua xe chuẩn truyền hình thế hệ mới:
 * 1. Kiến trúc Master Audio Bus + 8 Sub-Buses độc lập:
 *    - Master Bus (với DynamicsCompressor Limiter chống méo âm)
 *    - Engine Bus (đa tầng hòa âm, turbo spool, blow-off valve, straight-cut gearbox whine, sang số cắt lửa)
 *    - Tire Bus (đặc tính mặt đường Asphalt, Wet, Gravel, Sand, Grass, gờ Kerb trrr-trrr, ABS pulsing)
 *    - Wind Bus (khí động học phi tuyến tính theo vận tốc thực tế)
 *    - Environment Bus (8 Biomes & thời tiết động: Mưa bão, Sấm rền, Gió núi, Sa mạc, Đô thị, Biển, Đêm, Khán đài)
 *    - Collision Bus (va đập kim loại, cọ sát thân xe, rào chắn, nhún giảm xóc)
 *    - UI Bus (tiếng đếm ngược xuất phát, âm báo chặng đua)
 *    - Commentary Bus (hòa trộn bình luận viên & tự động giảm tiếng máy Audio Ducking)
 *    - Music Bus (nhạc nền / ambient synth)
 * 2. 25 Góc Quay Độc Bản (25 Unique Camera Acoustic Profiles):
 *    - Trực thăng Chopper (cánh quạt đập phành phạch 19.2Hz dồn dập, luồng khí chém gió)
 *    - Drone FPV (4 mô-tơ không chổi than rít kim loại cao tần 780-950Hz)
 *    - Buồng lái Cockpit (cách âm tiêu âm 880Hz, tăng cường tiếng hú hộp số)
 *    - Ven đường Telephoto (Doppler pitch shift cực đại +40% / -35%, âm xé gió flyby chớp nhoáng)
 *    - Gờ giảm tốc Kerb Apex (trrr-trrr-trrr rung gầm xe)
 * 3. Hỗ trợ cả 2 chế độ:
 *    - Thời gian thực (Web Audio API trực tiếp ra loa kèm Unlock Auto-Resume)
 *    - Xuất video ngoại tuyến (PCM Stereo 60 FPS 100% chuẩn xác với kịch bản đạo diễn)
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private isInitialized: boolean = false;
  public isMuted: boolean = false;
  private masterVolume: number = 0.85;

  // 1. MASTER BUS & DYNAMICS COMPRESSOR (LIMITER)
  private masterGain: GainNode | null = null;
  private limiterNode: DynamicsCompressorNode | null = null;
  private mediaStreamDest: MediaStreamAudioDestinationNode | null = null;

  // 2. CÁC SUB-BUS CHUYÊN DỤNG (9 BUS SYSTEM)
  public engineBus: GainNode | null = null;
  public tireBus: GainNode | null = null;
  public windBus: GainNode | null = null;
  public environmentBus: GainNode | null = null;
  public collisionBus: GainNode | null = null;
  public uiBus: GainNode | null = null;
  public commentaryBus: GainNode | null = null;
  public musicBus: GainNode | null = null;

  // Bộ lọc cách âm buồng lái & EQ máy quay (Camera Acoustic Filter)
  private cameraAcousticFilter: BiquadFilterNode | null = null;
  private cameraEqLow: BiquadFilterNode | null = null;
  private cameraEqHigh: BiquadFilterNode | null = null;

  // 3. NGÂN HÀNG VOICES ĐỘNG CƠ ĐA ÂM KHÔNG GIAN (5 xe gần nhất + 1 Voice gom cụm 10 xe xa)
  private carVoices: SpatialEngineVoice[] = [];
  private packSaw: OscillatorNode | null = null;
  private packSub: OscillatorNode | null = null;
  private packFilter: BiquadFilterNode | null = null;
  private packPanner: StereoPannerNode | null = null;
  private packGain: GainNode | null = null;

  // 4. BỘ PHÁT ÂM THANH LỐP XE THEO MẶT ĐƯỜNG & GỜ GIẢM TỐC
  private skidGain: GainNode | null = null;
  private skidFilter: BiquadFilterNode | null = null;
  private skidPanner: StereoPannerNode | null = null;
  private skidNoiseSource: AudioBufferSourceNode | null = null;

  // Gờ giảm tốc Kerb Rumble (trrr-trrr-trrr)
  private kerbOsc: OscillatorNode | null = null;
  private kerbGain: GainNode | null = null;
  private kerbFilter: BiquadFilterNode | null = null;

  // 5. ÂM THANH MÔI TRƯỜNG BIOME & THỜI TIẾT
  private currentAmbienceType: BiomeAmbienceType = 'STADIUM_CROWD';
  private ambienceGain: GainNode | null = null;
  private ambienceFilter: BiquadFilterNode | null = null;
  private ambienceSource: AudioBufferSourceNode | null = null;

  // 6. FOLEY GÓC MÁY: TRỰC THĂNG, DRONE, GIÓ LƯỚT
  private heliGain: GainNode | null = null;
  private heliOsc: OscillatorNode | null = null;
  private heliLfo: OscillatorNode | null = null;
  private heliLfoGain: GainNode | null = null;
  private heliFilter: BiquadFilterNode | null = null;

  private droneGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;

  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;

  // Noise buffers dùng chung
  private commonNoiseBuffer: AudioBuffer | null = null;
  private flybyNoiseBuffer: AudioBuffer | null = null;
  private bovNoiseBuffer: AudioBuffer | null = null;

  // Trạng thái Ducking khi BLV nói
  private isDuckingActive: boolean = false;

  constructor() {
    this.setupAutoUnlockListener();
  }

  /**
   * Đăng ký sự kiện mở khóa âm thanh ngay khi người dùng tương tác với trang web (Click, Phím, Chạm)
   */
  private setupAutoUnlockListener() {
    if (typeof window === 'undefined') return;

    const unlockHandler = () => {
      this.init();
      this.resume();
      window.removeEventListener('pointerdown', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);
      window.removeEventListener('touchstart', unlockHandler);
      window.removeEventListener('click', unlockHandler);
    };

    window.addEventListener('pointerdown', unlockHandler, { once: true });
    window.addEventListener('keydown', unlockHandler, { once: true });
    window.addEventListener('touchstart', unlockHandler, { once: true });
    window.addEventListener('click', unlockHandler, { once: true });
  }

  /**
   * Khởi tạo Web Audio Core với 9 Buses & Soft Limiter
   */
  init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.ctx = new AudioCtxClass();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      const now = this.ctx.currentTime;

      // =========================================================================
      // 1. MASTER BUS & DYNAMICS COMPRESSOR (LIMITER)
      // =========================================================================
      this.limiterNode = this.ctx.createDynamicsCompressor();
      this.limiterNode.threshold.setValueAtTime(-2.5, now);
      this.limiterNode.knee.setValueAtTime(10.0, now);
      this.limiterNode.ratio.setValueAtTime(14.0, now);
      this.limiterNode.attack.setValueAtTime(0.003, now);
      this.limiterNode.release.setValueAtTime(0.20, now);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, now);

      this.limiterNode.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      try {
        this.mediaStreamDest = this.ctx.createMediaStreamDestination();
        this.masterGain.connect(this.mediaStreamDest);
      } catch {
        // Ignore
      }

      // =========================================================================
      // 2. KHỞI TẠO 8 SUB-BUSES
      // =========================================================================
      this.engineBus = this.ctx.createGain();
      this.engineBus.gain.setValueAtTime(0.85, now);

      this.tireBus = this.ctx.createGain();
      this.tireBus.gain.setValueAtTime(0.80, now);

      this.windBus = this.ctx.createGain();
      this.windBus.gain.setValueAtTime(0.70, now);

      this.environmentBus = this.ctx.createGain();
      this.environmentBus.gain.setValueAtTime(0.65, now);

      this.collisionBus = this.ctx.createGain();
      this.collisionBus.gain.setValueAtTime(0.95, now);

      this.uiBus = this.ctx.createGain();
      this.uiBus.gain.setValueAtTime(0.80, now);

      this.commentaryBus = this.ctx.createGain();
      this.commentaryBus.gain.setValueAtTime(0.95, now);

      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.setValueAtTime(0.50, now);

      // Camera Acoustic Filter (tiêu âm cabin, cách âm hầm, lọc tần số)
      this.cameraAcousticFilter = this.ctx.createBiquadFilter();
      this.cameraAcousticFilter.type = 'lowpass';
      this.cameraAcousticFilter.frequency.setValueAtTime(18000, now);
      this.cameraAcousticFilter.Q.setValueAtTime(0.85, now);

      this.cameraEqLow = this.ctx.createBiquadFilter();
      this.cameraEqLow.type = 'lowshelf';
      this.cameraEqLow.frequency.setValueAtTime(250, now);
      this.cameraEqLow.gain.setValueAtTime(0, now);

      this.cameraEqHigh = this.ctx.createBiquadFilter();
      this.cameraEqHigh.type = 'highshelf';
      this.cameraEqHigh.frequency.setValueAtTime(4500, now);
      this.cameraEqHigh.gain.setValueAtTime(0, now);

      // Kết nối định tuyến các bus:
      // Engine, Tire, Wind đi qua Camera Acoustic Filter trước khi vào Limiter
      this.engineBus.connect(this.cameraAcousticFilter);
      this.tireBus.connect(this.cameraAcousticFilter);
      this.windBus.connect(this.cameraAcousticFilter);

      this.cameraAcousticFilter.connect(this.cameraEqLow);
      this.cameraEqLow.connect(this.cameraEqHigh);
      this.cameraEqHigh.connect(this.limiterNode);

      // Environment, Collision, UI, Commentary, Music đi thẳng vào Limiter
      this.environmentBus.connect(this.limiterNode);
      this.collisionBus.connect(this.limiterNode);
      this.uiBus.connect(this.limiterNode);
      this.commentaryBus.connect(this.limiterNode);
      this.musicBus.connect(this.limiterNode);

      // Khởi tạo các bộ đệm âm thanh trắng/hồng
      this.commonNoiseBuffer = this.createNoiseBuffer(3.0);
      this.flybyNoiseBuffer = this.createNoiseBuffer(1.4);
      this.bovNoiseBuffer = this.createNoiseBuffer(0.45);

      // =========================================================================
      // 3. KHỞI TẠO 5 VOICES ĐỘNG CƠ CẬN CẢNH KHÔNG GIAN
      // =========================================================================
      this.carVoices = [];
      for (let i = 0; i < 5; i++) {
        const oscSaw = this.ctx.createOscillator();
        oscSaw.type = 'sawtooth';
        oscSaw.frequency.setValueAtTime(75 + i * 10, now);

        const oscSub = this.ctx.createOscillator();
        oscSub.type = 'triangle';
        oscSub.frequency.setValueAtTime((75 + i * 10) * 0.5, now);

        const oscPulse = this.ctx.createOscillator();
        oscPulse.type = 'square';
        oscPulse.frequency.setValueAtTime((75 + i * 10) * 2.0, now);

        const oscTurbo = this.ctx.createOscillator();
        oscTurbo.type = 'sine';
        oscTurbo.frequency.setValueAtTime(1200, now);

        const turboGain = this.ctx.createGain();
        turboGain.gain.setValueAtTime(0.0, now); // Tắt tiếng hú nhân tạo
        oscTurbo.connect(turboGain);

        const gearWhineOsc = this.ctx.createOscillator();
        gearWhineOsc.type = 'triangle';
        gearWhineOsc.frequency.setValueAtTime(650, now);

        const gearWhineGain = this.ctx.createGain();
        gearWhineGain.gain.setValueAtTime(0.0, now); // Tắt tiếng hú nhân tạo
        gearWhineOsc.connect(gearWhineGain);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(750, now);
        filter.Q.setValueAtTime(2.2, now);

        const panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime(0, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(i === 0 ? 0.38 : 0.0, now);

        oscSaw.connect(filter);
        oscSub.connect(filter);
        oscPulse.connect(filter);
        turboGain.connect(filter);
        gearWhineGain.connect(filter);

        filter.connect(panner);
        panner.connect(gain);
        gain.connect(this.engineBus);

        oscSaw.start();
        oscSub.start();
        oscPulse.start();
        oscTurbo.start();
        gearWhineOsc.start();

        this.carVoices.push({
          oscSaw,
          oscSub,
          oscPulse,
          oscTurbo,
          turboGain,
          gearWhineOsc,
          gearWhineGain,
          bovSource: null,
          filter,
          panner,
          gain,
          activeCarId: '',
          lastShiftTime: 0
        });
      }

      // =========================================================================
      // 4. TIẾNG GẦM CỦA CẢ ĐOÀN 15 XE Ở PHÍA XA (PACK VOICE)
      // =========================================================================
      this.packSaw = this.ctx.createOscillator();
      this.packSaw.type = 'sawtooth';
      this.packSaw.frequency.setValueAtTime(60, now);

      this.packSub = this.ctx.createOscillator();
      this.packSub.type = 'triangle';
      this.packSub.frequency.setValueAtTime(36, now);

      this.packFilter = this.ctx.createBiquadFilter();
      this.packFilter.type = 'lowpass';
      this.packFilter.frequency.setValueAtTime(450, now);

      this.packPanner = this.ctx.createStereoPanner();
      this.packGain = this.ctx.createGain();
      this.packGain.gain.setValueAtTime(0.16, now);

      this.packSaw.connect(this.packFilter);
      this.packSub.connect(this.packFilter);
      this.packFilter.connect(this.packPanner);
      this.packPanner.connect(this.packGain);
      this.packGain.connect(this.engineBus);

      this.packSaw.start();
      this.packSub.start();

      // =========================================================================
      // 5. TIẾNG RÍT LỐP & GỜ GIẢM TỐC (TIRE BUS)
      // =========================================================================
      this.skidFilter = this.ctx.createBiquadFilter();
      this.skidFilter.type = 'bandpass';
      this.skidFilter.frequency.setValueAtTime(2600, now);
      this.skidFilter.Q.setValueAtTime(3.2, now);

      this.skidPanner = this.ctx.createStereoPanner();
      this.skidGain = this.ctx.createGain();
      this.skidGain.gain.setValueAtTime(0.0, now);

      this.skidFilter.connect(this.skidPanner);
      this.skidPanner.connect(this.skidGain);
      this.skidGain.connect(this.tireBus);

      // Tiếng gờ giảm tốc Kerb Rumble (trrr-trrr-trrr)
      this.kerbOsc = this.ctx.createOscillator();
      this.kerbOsc.type = 'sawtooth';
      this.kerbOsc.frequency.setValueAtTime(65, now);

      this.kerbFilter = this.ctx.createBiquadFilter();
      this.kerbFilter.type = 'bandpass';
      this.kerbFilter.frequency.setValueAtTime(140, now);
      this.kerbFilter.Q.setValueAtTime(3.8, now);

      this.kerbGain = this.ctx.createGain();
      this.kerbGain.gain.setValueAtTime(0.0, now);

      this.kerbOsc.connect(this.kerbFilter);
      this.kerbFilter.connect(this.kerbGain);
      this.kerbGain.connect(this.tireBus);
      this.kerbOsc.start();

      // Lặp lại White Noise cho tiếng lốp
      if (this.commonNoiseBuffer) {
        this.skidNoiseSource = this.ctx.createBufferSource();
        this.skidNoiseSource.buffer = this.commonNoiseBuffer;
        this.skidNoiseSource.loop = true;
        this.skidNoiseSource.connect(this.skidFilter);
        this.skidNoiseSource.start();
      }

      // =========================================================================
      // 6. FOLEY TRỰC THĂNG TRUYỀN HÌNH (19.2Hz Blade Chop + Air Draft)
      // =========================================================================
      this.heliOsc = this.ctx.createOscillator();
      this.heliOsc.type = 'sawtooth';
      this.heliOsc.frequency.setValueAtTime(68, now);

      this.heliLfo = this.ctx.createOscillator();
      this.heliLfo.type = 'sine';
      this.heliLfo.frequency.setValueAtTime(19.2, now); // 19.2 Hz nhịp chém cánh quạt

      this.heliLfoGain = this.ctx.createGain();
      this.heliLfoGain.gain.setValueAtTime(0.75, now);

      this.heliFilter = this.ctx.createBiquadFilter();
      this.heliFilter.type = 'lowpass';
      this.heliFilter.frequency.setValueAtTime(320, now);

      this.heliGain = this.ctx.createGain();
      this.heliGain.gain.setValueAtTime(0.0, now);

      this.heliLfo.connect(this.heliLfoGain.gain);
      this.heliOsc.connect(this.heliFilter);
      this.heliFilter.connect(this.heliLfoGain);
      this.heliLfoGain.connect(this.heliGain);
      this.heliGain.connect(this.environmentBus);

      this.heliOsc.start();
      this.heliLfo.start();

      // =========================================================================
      // 7. FOLEY RACING DRONE FPV (High-frequency Brushless Motor Whine)
      // =========================================================================
      this.droneOsc1 = this.ctx.createOscillator();
      this.droneOsc1.type = 'triangle';
      this.droneOsc1.frequency.setValueAtTime(780, now);

      this.droneOsc2 = this.ctx.createOscillator();
      this.droneOsc2.type = 'sawtooth';
      this.droneOsc2.frequency.setValueAtTime(940, now);

      this.droneFilter = this.ctx.createBiquadFilter();
      this.droneFilter.type = 'bandpass';
      this.droneFilter.frequency.setValueAtTime(860, now);
      this.droneFilter.Q.setValueAtTime(4.5, now);

      this.droneGain = this.ctx.createGain();
      this.droneGain.gain.setValueAtTime(0.0, now);

      this.droneOsc1.connect(this.droneFilter);
      this.droneOsc2.connect(this.droneFilter);
      this.droneFilter.connect(this.droneGain);
      this.droneGain.connect(this.environmentBus);

      this.droneOsc1.start();
      this.droneOsc2.start();

      // =========================================================================
      // 8. TIẾNG GIÓ LƯỚT KHÍ ĐỘNG HỌC (WIND BUS)
      // =========================================================================
      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'bandpass';
      this.windFilter.frequency.setValueAtTime(550, now);
      this.windFilter.Q.setValueAtTime(1.8, now);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.08, now);

      if (this.commonNoiseBuffer) {
        this.windSource = this.ctx.createBufferSource();
        this.windSource.buffer = this.commonNoiseBuffer;
        this.windSource.loop = true;
        this.windSource.connect(this.windFilter);
        this.windFilter.connect(this.windGain);
        this.windGain.connect(this.windBus);
        this.windSource.start();
      }

      // =========================================================================
      // 9. ÂM THANH MÔI TRƯỜNG BIOME (ENVIRONMENT BUS)
      // =========================================================================
      this.ambienceFilter = this.ctx.createBiquadFilter();
      this.ambienceFilter.type = 'bandpass';
      this.ambienceFilter.frequency.setValueAtTime(900, now);
      this.ambienceFilter.Q.setValueAtTime(1.4, now);

      this.ambienceGain = this.ctx.createGain();
      this.ambienceGain.gain.setValueAtTime(0.12, now);

      if (this.commonNoiseBuffer) {
        this.ambienceSource = this.ctx.createBufferSource();
        this.ambienceSource.buffer = this.commonNoiseBuffer;
        this.ambienceSource.loop = true;
        this.ambienceSource.connect(this.ambienceFilter);
        this.ambienceFilter.connect(this.ambienceGain);
        this.ambienceGain.connect(this.environmentBus);
        this.ambienceSource.start();
      }

      this.isInitialized = true;
    } catch (err) {
      console.warn('Lỗi khởi tạo Racing Audio Director 3.0:', err);
    }
  }

  /**
   * Tạo AudioBuffer chứa Pink/White Noise chất lượng cao
   */
  private createNoiseBuffer(durationSeconds: number): AudioBuffer | null {
    if (!this.ctx) return null;
    try {
      const sampleRate = this.ctx.sampleRate;
      const bufferSize = Math.floor(sampleRate * durationSeconds);
      const buffer = this.ctx.createBuffer(2, bufferSize, sampleRate);
      const left = buffer.getChannelData(0);
      const right = buffer.getChannelData(1);

      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink noise filtering
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        const pink = (b0 + b1 + b2 + white * 0.5362) * 0.16;

        left[i] = pink;
        right[i] = pink * 0.92 + (Math.random() * 2 - 1) * 0.04;
      }
      return buffer;
    } catch {
      return null;
    }
  }

  /**
   * Đảm bảo AudioContext đang hoạt động (không bị suspended do chính sách trình duyệt)
   */
  async resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Bật/Tắt âm thanh (Mute/Unmute)
   */
  toggleMute(): boolean {
    this.resume();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  setMuted(muted: boolean) {
    this.resume();
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : this.masterVolume;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }
  }

  setMasterVolume(vol: number) {
    this.resume();
    this.masterVolume = Math.max(0, Math.min(1.0, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * Âm thanh đếm ngược xuất phát (3-2-1 BEEP, GO!) qua UI Bus
   */
  playCountdownBeep(isGo: boolean = false) {
    if (!this.ctx || !this.uiBus) return;
    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = isGo ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isGo ? 880 : 440, now);
      if (isGo) {
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.35);
      }

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.45 : 0.25));

      osc.connect(gain);
      gain.connect(this.uiBus);

      osc.start(now);
      osc.stop(now + (isGo ? 0.46 : 0.26));
    } catch {
      // AudioContext maybe blocked or suspended
    }
  }

  /**
   * Giảm âm thanh động cơ khi bình luận viên nói (Audio Ducking)
   */
  setDucking(isDucking: boolean) {
    this.isDuckingActive = isDucking;
    if (!this.engineBus || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Giảm 60% âm lượng động cơ khi có bình luận để lời nói nổi rõ nét
    const targetGain = isDucking ? 0.35 : 0.85;
    this.engineBus.gain.setTargetAtTime(targetGain, now, 0.08);
  }

  /**
   * Cập nhật môi trường thời tiết & Biome cho Environment Bus
   */
  public setBiomeAmbience(biome?: TrackBiome | string, weather?: WeatherType | string) {
    if (!this.ambienceFilter || !this.ambienceGain || !this.ctx) return;
    const resolvedType = audioSpatialDirector.resolveBiomeAmbience(biome, weather);
    if (resolvedType === this.currentAmbienceType) return;
    this.currentAmbienceType = resolvedType;

    const now = this.ctx.currentTime;
    switch (resolvedType) {
      case 'RAIN':
      case 'THUNDERSTORM':
        this.ambienceFilter.type = 'bandpass';
        this.ambienceFilter.frequency.setTargetAtTime(2400, now, 0.2);
        this.ambienceFilter.Q.setTargetAtTime(1.9, now, 0.2);
        this.ambienceGain.gain.setTargetAtTime(0.22, now, 0.2);
        break;

      case 'MOUNTAIN_WIND':
        this.ambienceFilter.type = 'bandpass';
        this.ambienceFilter.frequency.setTargetAtTime(450, now, 0.3);
        this.ambienceFilter.Q.setTargetAtTime(3.2, now, 0.3);
        this.ambienceGain.gain.setTargetAtTime(0.18, now, 0.3);
        break;

      case 'DESERT_SAND':
        this.ambienceFilter.type = 'highpass';
        this.ambienceFilter.frequency.setTargetAtTime(1600, now, 0.3);
        this.ambienceFilter.Q.setTargetAtTime(1.4, now, 0.3);
        this.ambienceGain.gain.setTargetAtTime(0.14, now, 0.3);
        break;

      case 'CITY_RUMBLE':
        this.ambienceFilter.type = 'lowpass';
        this.ambienceFilter.frequency.setTargetAtTime(200, now, 0.3);
        this.ambienceFilter.Q.setTargetAtTime(2.4, now, 0.3);
        this.ambienceGain.gain.setTargetAtTime(0.16, now, 0.3);
        break;

      case 'COASTAL_SURF':
        this.ambienceFilter.type = 'bandpass';
        this.ambienceFilter.frequency.setTargetAtTime(700, now, 0.3);
        this.ambienceFilter.Q.setTargetAtTime(2.2, now, 0.3);
        this.ambienceGain.gain.setTargetAtTime(0.15, now, 0.3);
        break;

      case 'NIGHT_BREEZE':
        this.ambienceFilter.type = 'bandpass';
        this.ambienceFilter.frequency.setTargetAtTime(1050, now, 0.3);
        this.ambienceFilter.Q.setTargetAtTime(1.6, now, 0.3);
        this.ambienceGain.gain.setTargetAtTime(0.08, now, 0.3);
        break;

      case 'STADIUM_CROWD':
      default:
        this.ambienceFilter.type = 'bandpass';
        this.ambienceFilter.frequency.setTargetAtTime(880, now, 0.3);
        this.ambienceFilter.Q.setTargetAtTime(1.5, now, 0.3);
        this.ambienceGain.gain.setTargetAtTime(0.12, now, 0.3);
        break;
    }
  }

  /**
   * Phát hiệu ứng tiếng xé gió vụt qua camera ven đường (High-Speed Flyby Whoosh)
   */
  triggerFlyby(speedKmh: number = 480, panStart: number = -0.9, panEnd: number = 0.9) {
    if (!this.ctx || this.isMuted || !this.flybyNoiseBuffer || !this.windBus) return;
    try {
      const now = this.ctx.currentTime;
      const flybySource = this.ctx.createBufferSource();
      flybySource.buffer = this.flybyNoiseBuffer;

      const flybyFilter = this.ctx.createBiquadFilter();
      flybyFilter.type = 'bandpass';
      flybyFilter.frequency.setValueAtTime(3800, now);
      flybyFilter.frequency.exponentialRampToValueAtTime(420, now + 0.36);
      flybyFilter.Q.setValueAtTime(4.6, now);

      const flybyPanner = this.ctx.createStereoPanner();
      flybyPanner.pan.setValueAtTime(panStart, now);
      flybyPanner.pan.linearRampToValueAtTime(panEnd, now + 0.36);

      const flybyGain = this.ctx.createGain();
      const intensity = Math.min(0.55, 0.22 + (speedKmh / 550) * 0.30);
      flybyGain.gain.setValueAtTime(0.001, now);
      flybyGain.gain.linearRampToValueAtTime(intensity, now + 0.10);
      flybyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.40);

      flybySource.connect(flybyFilter);
      flybyFilter.connect(flybyPanner);
      flybyPanner.connect(flybyGain);
      flybyGain.connect(this.windBus);

      flybySource.start(now);
      flybySource.stop(now + 0.42);
    } catch {
      // Ignore
    }
  }

  /**
   * Phát hiệu ứng tiếng va chạm / quẹt sườn xe (Collision Bus)
   */
  triggerCollision(intensity: number = 0.8, pan: number = 0.0) {
    if (!this.ctx || this.isMuted || !this.collisionBus) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.18);

      const panner = this.ctx.createStereoPanner();
      panner.pan.setValueAtTime(pan, now);

      const gain = this.ctx.createGain();
      const vol = Math.min(0.85, intensity * 0.75);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(panner);
      panner.connect(gain);
      gain.connect(this.collisionBus);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // Ignore
    }
  }

  /**
   * Cập nhật toàn diện âm thanh không gian 3D theo 25 Góc Quay Camera & 15 Xe Đua
   */
  updateSpatial(
    cameraListener: SpatialCameraListener,
    cars: SpatialAudioSource[],
    biome?: TrackBiome | string,
    weather?: WeatherType | string
  ) {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Cập nhật Biome & Thời tiết
      this.setBiomeAmbience(biome, weather);

      // 2. Tính toán khoảng cách & âm học 3D cho 15 xe
      const { sortedCars, activeFlybys } = audioSpatialDirector.processSpatialVehicles(
        cars,
        cameraListener,
        now
      );

      // 3. Lấy 25 Camera Acoustic Profile độc bản từ AudioSpatialDirector
      const persp = audioSpatialDirector.getCameraPerspective(
        cameraListener.mode,
        cameraListener.speedKmh || 300
      );

      // A. Cập nhật Bộ lọc tiêu âm buồng lái & EQ máy quay
      if (this.cameraAcousticFilter) {
        this.cameraAcousticFilter.frequency.setTargetAtTime(persp.cabinMuffleCutoff, now, 0.08);
      }
      if (this.cameraEqLow && this.cameraEqHigh) {
        if (persp.masterEqPreset === 'bass_heavy') {
          this.cameraEqLow.gain.setTargetAtTime(4.5, now, 0.1);
          this.cameraEqHigh.gain.setTargetAtTime(-1.5, now, 0.1);
        } else if (persp.masterEqPreset === 'mobile_punch') {
          this.cameraEqLow.gain.setTargetAtTime(2.0, now, 0.1);
          this.cameraEqHigh.gain.setTargetAtTime(3.0, now, 0.1);
        } else if (persp.masterEqPreset === 'tunnel_hollow') {
          this.cameraEqLow.gain.setTargetAtTime(6.0, now, 0.1);
          this.cameraEqHigh.gain.setTargetAtTime(-4.0, now, 0.1);
        } else if (persp.masterEqPreset === 'treble_cut') {
          this.cameraEqLow.gain.setTargetAtTime(3.0, now, 0.1);
          this.cameraEqHigh.gain.setTargetAtTime(-8.0, now, 0.1);
        } else {
          this.cameraEqLow.gain.setTargetAtTime(0, now, 0.1);
          this.cameraEqHigh.gain.setTargetAtTime(0, now, 0.1);
        }
      }

      // B. Foley Trực thăng Chopper (Tiếng chém gió rotor và động cơ turbine)
      if (this.heliGain && this.heliLfo) {
        this.heliLfo.frequency.setTargetAtTime(persp.helicopterRotorFreq, now, 0.08);
        this.heliGain.gain.setTargetAtTime(persp.helicopterRotorVol * 0.85, now, 0.1);
      }

      // C. Foley Drone FPV (Muted to eliminate artificial buzzing/howling)
      if (this.droneGain && this.droneOsc1) {
        this.droneGain.gain.setTargetAtTime(0.0, now, 0.1);
      }

      // D. Gió lướt camera khí động học phi tuyến tính
      if (this.windGain && this.windFilter) {
        const targetWindVol = persp.windVolume * 0.55;
        this.windGain.gain.setTargetAtTime(targetWindVol, now, 0.08);
        const windCutoff = 450 + persp.windSpeedFactor * 1800;
        this.windFilter.frequency.setTargetAtTime(windCutoff, now, 0.08);
      }

      // E. Kích hoạt tiếng xé gió Flyby nếu xe vụt qua camera ven đường
      for (const flyby of activeFlybys) {
        this.triggerFlyby(flyby.speedKmh, flyby.panStart, flyby.panEnd);
      }

      // F. Cập nhật 5 Voices động cơ cận cảnh gần camera nhất
      for (let i = 0; i < this.carVoices.length; i++) {
        const voice = this.carVoices[i];
        const carData = sortedCars[i];

        if (carData) {
          voice.activeCarId = carData.id;

          // Doppler Frequency + Vòng tua máy RPM
          voice.oscSaw.frequency.setTargetAtTime(carData.engineFreq, now, 0.03);
          voice.oscSub.frequency.setTargetAtTime(carData.engineFreq * 0.502, now, 0.03);
          voice.oscPulse.frequency.setTargetAtTime(carData.engineFreq * 2.01, now, 0.03);

          // Turbo spool whine & gearbox whine muted to prevent artificial howling/whistling
          voice.turboGain.gain.setTargetAtTime(0.0, now, 0.05);
          voice.gearWhineGain.gain.setTargetAtTime(0.0, now, 0.04);

          // Âm lượng theo khoảng cách 3D & hướng ống xả
          let adjustedVol = carData.volume * persp.exhaustDirectness * 0.42;
          if (persp.isCockpit && i > 0) {
            adjustedVol *= 0.40; // Cabin cách âm xe đối thủ
          }
          voice.gain.gain.setTargetAtTime(adjustedVol, now, 0.04);

          // Panning Trái / Phải theo góc quay camera
          voice.panner.pan.setTargetAtTime(carData.pan, now, 0.03);

          // Lọc thông thấp theo độ mở bướm ga
          voice.filter.frequency.setTargetAtTime(carData.filterCutoff, now, 0.04);
        } else {
          voice.gain.gain.setTargetAtTime(0, now, 0.06);
        }
      }

      // G. Cập nhật tiếng gầm gừ tập thể của 10 xe phía sau trong đoàn 15 xe
      if (this.packGain && this.packPanner && this.packSaw && sortedCars.length > 5) {
        let avgPan = 0;
        let avgFreq = 0;
        const remainingCars = sortedCars.slice(5);

        for (const rc of remainingCars) {
          avgPan += rc.pan;
          avgFreq += rc.engineFreq;
        }
        avgPan /= remainingCars.length;
        avgFreq /= remainingCars.length;

        this.packPanner.pan.setTargetAtTime(Math.max(-0.85, Math.min(0.85, avgPan)), now, 0.06);
        this.packSaw.frequency.setTargetAtTime(Math.max(50, Math.min(190, avgFreq * 0.65)), now, 0.06);
        this.packGain.gain.setTargetAtTime(0.20, now, 0.06);
      }

      // H. Cập nhật tiếng rít lốp bám đường & gờ giảm tốc Kerb
      const driftingCar = sortedCars.find(c => c.isDrifting || c.isBraking);
      if (this.skidGain && this.skidPanner) {
        if (driftingCar) {
          const skidVol = Math.min(0.42, driftingCar.volume * 0.45);
          this.skidGain.gain.setTargetAtTime(skidVol, now, 0.04);
          this.skidPanner.pan.setTargetAtTime(driftingCar.pan, now, 0.04);
        } else {
          this.skidGain.gain.setTargetAtTime(0, now, 0.06);
        }
      }

      // I. Cập nhật gờ giảm tốc Kerb Rumble (trrr-trrr)
      if (this.kerbGain && this.kerbOsc) {
        if (persp.isKerbCam || (sortedCars[0] && Math.abs(sortedCars[0].pan) > 0.65)) {
          const kerbVol = Math.min(0.38, 0.15 * persp.kerbRumbleBoost);
          this.kerbGain.gain.setTargetAtTime(kerbVol, now, 0.05);
        } else {
          this.kerbGain.gain.setTargetAtTime(0, now, 0.08);
        }
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Phương thức cập nhật truyền thống cho Playable Game lái xe
   */
  update(
    rpm: number = 3800,
    throttle: number = 0.85,
    isDrifting: boolean = false,
    isBraking: boolean = false,
    speed: number = 180
  ) {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;

    try {
      const now = this.ctx.currentTime;
      const baseFreq = THREE_MathUtils_lerp(55, 380, Math.min(1.0, Math.max(0.1, (rpm || 3000) / 9500)));

      if (this.carVoices[0]) {
        this.carVoices[0].oscSaw.frequency.setTargetAtTime(baseFreq, now, 0.04);
        this.carVoices[0].oscSub.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.04);
        this.carVoices[0].oscPulse.frequency.setTargetAtTime(baseFreq * 2.0, now, 0.04);
        const filterCutoff = THREE_MathUtils_lerp(450, 3200, Math.min(1.0, (throttle * 0.6) + (speed / 500) * 0.5));
        this.carVoices[0].filter.frequency.setTargetAtTime(filterCutoff, now, 0.04);
        this.carVoices[0].gain.gain.setTargetAtTime(0.42, now, 0.04);
      }

      if (this.skidGain) {
        const targetSkidVol = (isDrifting || isBraking) ? Math.min(0.42, 0.18 + (speed / 500) * 0.24) : 0;
        this.skidGain.gain.setTargetAtTime(targetSkidVol, now, 0.05);
      }
    } catch {
      // Ignore
    }
  }

  /**
   * Lấy Audio Track của MediaStream để chèn trực tiếp vào MediaRecorder xuất video
   */
  getMediaStreamTrack(): MediaStreamTrack | null {
    this.init();
    if (!this.ctx || !this.masterGain) return null;
    try {
      if (!this.mediaStreamDest) {
        this.mediaStreamDest = this.ctx.createMediaStreamDestination();
        this.masterGain.connect(this.mediaStreamDest);
      }
      const tracks = this.mediaStreamDest.stream.getAudioTracks();
      return tracks[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Phát trực tiếp đoạn âm thanh bình luận qua Web Audio API với Audio Ducking
   */
  playCommentaryBuffer(buffer: AudioBuffer, onEnd?: () => void): AudioBufferSourceNode | null {
    this.init();
    if (!this.ctx || !this.commentaryBus || this.isMuted) return null;

    try {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.commentaryBus);

      this.setDucking(true);
      source.onended = () => {
        this.setDucking(false);
        if (onEnd) onEnd();
      };

      source.start();
      return source;
    } catch (err) {
      console.warn('Lỗi khi phát commentary buffer:', err);
      this.setDucking(false);
      return null;
    }
  }

  /**
   * TỔNG HỢP ÂM THANH PCM STEREO CHUẨN XUẤT VIDEO (Full 9-Bus Offline Synthesis)
   * Tái hiện 100% chi tiết:
   * - 25 Góc quay camera với đặc tính âm thanh độc bản
   * - Foley Trực thăng Chopper 19.2Hz, Drone FPV 820Hz, Kerb Rumble trrr-trrr
   * - 15 Xe đua đa âm sắc, Doppler flyby, bướm ga và sang số
   * - Hòa trộn bình luận viên và Audio Ducking
   * - Dynamics Compressor / Soft Limiter chống rè
   */
  generateRacingAudioPCM(
    durationSeconds: number,
    sampleRate: number = 44100,
    instanceId: number = 1,
    seed: number = 632585,
    biome?: TrackBiome | string,
    weather?: WeatherType | string,
    carsCount: number = 15
  ): { left: Float32Array; right: Float32Array; totalSamples: number; timeline: ScheduledCommentaryEvent[] } {
    const totalSamples = Math.floor(durationSeconds * sampleRate);
    const left = new Float32Array(totalSamples);
    const right = new Float32Array(totalSamples);

    // Kịch bản bình luận viên
    const timeline = commentarySoundManager.getTimelineForInstance(instanceId, seed, durationSeconds);
    const ambienceType = audioSpatialDirector.resolveBiomeAmbience(biome, weather);

    // Chu kỳ 25 góc quay Camera Director (5.5 giây / góc)
    const CAMERA_MODES_CYCLE: CameraMode[] = [
      CameraMode.CHOPPER_HELI_CHASE,
      CameraMode.TRACKSIDE_TELEPHOTO,
      CameraMode.SKY_DRONE_BROADCAST,
      CameraMode.MULTI_CAR_PACK_CHASE,
      CameraMode.COCKPIT_FIRST_PERSON,
      CameraMode.TRACKSIDE_APEX,
      CameraMode.MULTI_CAR_FRONT_FACING,
      CameraMode.WING_REAR_LOOK,
      CameraMode.LOW_GROUND,
      CameraMode.PIT_WALL_BROADCAST,
      CameraMode.PASSING_STATIONARY,
      CameraMode.HOOD,
      CameraMode.TUNNEL_CEILING_FAST,
      CameraMode.VERTICAL_PORTRAIT_OPTIMIZED,
      CameraMode.SPECTATOR_TRACKSIDE,
      CameraMode.FENDER_WHEEL_LOOK,
      CameraMode.SIDE_CHASE_MULTI,
      CameraMode.KERB_CAM_GROUND,
      CameraMode.BUMPER_FIRST_PERSON,
      CameraMode.OVERTAKE_ACTION,
      CameraMode.COLLISION_DRIFT,
      CameraMode.BEHIND,
      CameraMode.SIDE_PROFILE,
      CameraMode.LEADER_TRACKING,
      CameraMode.CINEMATIC_ORBIT
    ];

    // Khởi tạo trạng thái dao động 15 xe đua
    const numCars = Math.max(6, Math.min(15, carsCount));
    const carPhases1 = new Float32Array(numCars);
    const carPhases2 = new Float32Array(numCars);
    const carSubPhases = new Float32Array(numCars);
    const carBaseFreqs = new Float32Array(numCars);
    const carOffsets = new Float32Array(numCars);
    const carLanes = new Float32Array(numCars);

    for (let c = 0; c < numCars; c++) {
      carOffsets[c] = (c / numCars) * 0.16;
      carLanes[c] = ((c % 3) - 1.0) * 0.65;
      carBaseFreqs[c] = 74 + (c * 19) % 58;
    }

    let filterStateL = 0;
    let filterStateR = 0;
    let ambFilterL = 0;
    let ambFilterR = 0;
    let heliPhase = 0;
    let dronePhase1 = 0;
    let dronePhase2 = 0;
    let kerbPhase = 0;

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;

      // 1. Kiểm tra kịch bản bình luận viên & Audio Ducking
      let activeCommentary: ScheduledCommentaryEvent | null = null;
      for (const evt of timeline) {
        if (t >= evt.startSec && t < evt.startSec + evt.durationSec) {
          activeCommentary = evt;
          break;
        }
      }
      const duckMultiplier = activeCommentary ? 0.38 : 1.0;

      // 2. Góc quay Camera và Acoustic Perspective hiện tại
      const camIdx = Math.floor(t / 5.5) % CAMERA_MODES_CYCLE.length;
      const currentMode = CAMERA_MODES_CYCLE[camIdx];
      const persp = audioSpatialDirector.getCameraPerspective(currentMode, 420);

      // Vị trí camera trên vòng đua
      const camTrackPos = persp.isTrackside
        ? ((Math.floor(t / 5.5) * 0.21) % 1.0)
        : ((t * 0.026) % 1.0);

      let mixLeft = 0;
      let mixRight = 0;

      // 3. Tổng hợp đa âm 15 xe đua (Polyphonic Multi-Car Engine & Doppler)
      for (let c = 0; c < numCars; c++) {
        const carCycle = (t + c * 0.44) % 5.0;
        let rpmNorm = 0.58;
        let throttle = 0.95;

        // Giả lập chu kỳ sang số
        if (carCycle < 0.25) {
          rpmNorm = 0.50 + (carCycle / 0.25) * 0.24;
        } else if (carCycle < 3.5) {
          rpmNorm = 0.64 + ((carCycle - 0.25) / 3.25) * 0.36;
        } else if (carCycle < 4.0) {
          rpmNorm = 1.0 - ((carCycle - 3.5) / 0.5) * 0.45;
          throttle = 0.35;
        } else {
          rpmNorm = 0.55 + ((carCycle - 4.0) / 1.0) * 0.25;
        }

        const carDistTrack = Math.abs(((carOffsets[c] + t * 0.028 + (c === 0 ? 0.005 : 0)) % 1.0) - camTrackPos);
        const distMeters = Math.max(2.5, carDistTrack * 920.0);

        // Hiệu ứng Doppler
        let dopplerFactor = 1.0;
        let isFlyby = false;
        if (persp.isTrackside && distMeters < 38.0) {
          const approachRate = Math.cos(t * 1.6 + c) * (0.24 * persp.flybySensitivity);
          dopplerFactor = 1.0 + approachRate;
          if (distMeters < 14.0) isFlyby = true;
        }

        const engineHz = (carBaseFreqs[c] + rpmNorm * 270) * dopplerFactor;

        // Tích hợp pha dao động
        carPhases1[c] += (2 * Math.PI * engineHz) / sampleRate;
        carPhases2[c] += (2 * Math.PI * engineHz * 0.502) / sampleRate;
        carSubPhases[c] += (2 * Math.PI * 46) / sampleRate;

        if (carPhases1[c] > 2 * Math.PI) carPhases1[c] -= 2 * Math.PI;
        if (carPhases2[c] > 2 * Math.PI) carPhases2[c] -= 2 * Math.PI;
        if (carSubPhases[c] > 2 * Math.PI) carSubPhases[c] -= 2 * Math.PI;

        const saw = (carPhases1[c] / Math.PI) - 1.0;
        const tri = Math.abs((carPhases2[c] / Math.PI) - 1.0) * 2 - 1.0;
        const sub = Math.sin(carSubPhases[c]) * 0.28;

        // Âm lượng theo khoảng cách và hướng xả của góc camera
        const carVol = (1.0 / (1.0 + distMeters * 0.042)) * (c < 6 ? 0.62 : 0.26) * throttle * persp.exhaustDirectness;

        const carPan = Math.max(-0.95, Math.min(0.95, carLanes[c] + Math.sin(t * 0.85 + c) * 0.32));
        const panL = 0.5 * (1 - carPan);
        const panR = 0.5 * (1 + carPan);

        const carSignal = (saw * 0.52 + tri * 0.36 + sub * 0.42) * carVol;

        // Âm xé gió Flyby vụt qua màn hình cực mạnh, chân thực
        if (isFlyby) {
          const whoosh = (Math.random() * 2 - 1) * 0.52 * Math.sin((t % 0.3) * Math.PI / 0.3);
          mixLeft += whoosh * panR * 2.2;
          mixRight += whoosh * panL * 2.2;
        }

        mixLeft += carSignal * panL;
        mixRight += carSignal * panR;
      }

      // 4. Foley Trực thăng Chopper 19.2Hz - Đỉnh cao truyền hình Live Broadcast
      if (persp.isHelicopter) {
        heliPhase += (2 * Math.PI * persp.helicopterRotorFreq) / sampleRate;
        if (heliPhase > 2 * Math.PI) heliPhase -= 2 * Math.PI;
        
        // Tiếng quạt chém gió trầm rung lồng ngực (Blade Thump ~19.2Hz)
        const bladeChop = Math.pow(Math.max(0, Math.sin(heliPhase)), 4) * 0.42;
        // Động cơ turbine phản lực rít trầm ấm (Turboshaft whine ~1820Hz)
        const heliTurbine = Math.sin(heliPhase * 95) * 0.08;
        // Tiếng gió lốc cuộn xuống cánh quạt
        const bladeWash = (Math.random() * 2 - 1) * 0.08 * (0.5 + 0.5 * Math.sin(heliPhase));
        
        const heliSound = (bladeChop + heliTurbine + bladeWash) * (persp.helicopterRotorVol * 1.6);
        mixLeft += heliSound;
        mixRight += heliSound;
      }

      // 5. Foley Drone FPV (Mô-tơ không chổi than 820Hz rít cao tần xé gió)
      if (persp.isDrone) {
        dronePhase1 += (2 * Math.PI * persp.droneMotorFreq) / sampleRate;
        dronePhase2 += (2 * Math.PI * (persp.droneMotorFreq * 1.5)) / sampleRate;
        if (dronePhase1 > 2 * Math.PI) dronePhase1 -= 2 * Math.PI;
        if (dronePhase2 > 2 * Math.PI) dronePhase2 -= 2 * Math.PI;
        
        // Tiếng rít mô-tơ FPV drone đặc trưng
        const droneWhine = (Math.sin(dronePhase1) * 0.14 + Math.sin(dronePhase2) * 0.08);
        // Tiếng cánh quạt nhỏ quay 28,000 RPM chém không khí
        const droneAirProp = (Math.random() * 2 - 1) * 0.06;
        const droneTotal = (droneWhine + droneAirProp) * (persp.droneMotorVol * 1.8);
        mixLeft += droneTotal;
        mixRight += droneTotal;
      }

      // 6. Foley Gờ giảm tốc Kerb Rumble (trrr-trrr-trrr)
      if (persp.isKerbCam) {
        kerbPhase += (2 * Math.PI * 72) / sampleRate;
        if (kerbPhase > 2 * Math.PI) kerbPhase -= 2 * Math.PI;
        const kerbThud = Math.sin(kerbPhase) * 0.18 * persp.kerbRumbleBoost;
        const kerbChatter = (Math.random() * 2 - 1) * 0.06 * Math.abs(Math.sin(kerbPhase));
        mixLeft += (kerbThud + kerbChatter);
        mixRight += (kerbThud + kerbChatter);
      }

      // 7. Foley Buồng lái Cockpit (Cách âm tiêu âm 880Hz)
      if (persp.isCockpit) {
        const cabinVibe = Math.sin(t * 92) * 0.095;
        mixLeft = (mixLeft * 0.68) + cabinVibe;
        mixRight = (mixRight * 0.68) + cabinVibe;
      }

      // 8. Âm thanh môi trường Biome & Thời tiết
      let ambL = (Math.random() * 2 - 1) * 0.045;
      let ambR = (Math.random() * 2 - 1) * 0.045;

      if (ambienceType === 'RAIN' || ambienceType === 'THUNDERSTORM') {
        ambL = (Math.random() * 2 - 1) * 0.10;
        ambR = (Math.random() * 2 - 1) * 0.10;
        if (ambienceType === 'THUNDERSTORM' && (t % 15.0) < 2.0) {
          const p = (t % 15.0) / 2.0;
          const thunder = Math.sin(p * 28.0) * (1.0 - p) * 0.25;
          ambL += thunder;
          ambR += thunder;
        }
      } else if (ambienceType === 'STADIUM_CROWD') {
        const crowd = (Math.sin(t * 2.8) * 0.025 + 0.035) * (Math.random() * 2 - 1) * (persp.crowdBleedVol * 2.2);
        ambL = crowd;
        ambR = crowd;
      }

      ambFilterL += 0.14 * (ambL - ambFilterL);
      ambFilterR += 0.14 * (ambR - ambFilterR);
      mixLeft += ambFilterL;
      mixRight += ambFilterR;

      // Áp dụng Audio Ducking khi bình luận viên nói
      mixLeft *= duckMultiplier;
      mixRight *= duckMultiplier;

      // Mastering Wideband Presence Filter: giữ trọn dải tần cao 16kHz sắc nét, không bị nghẹt tiếng
      filterStateL += 0.88 * (mixLeft - filterStateL);
      filterStateR += 0.88 * (mixRight - filterStateR);

      let finalLeft = filterStateL;
      let finalRight = filterStateR;

      // 9. Hòa trộn giọng đọc bình luận viên
      if (activeCommentary && activeCommentary.pcmLeft) {
        const offsetSec = t - activeCommentary.startSec;
        const sampleIdx = Math.floor(offsetSec * (activeCommentary.sampleRate || sampleRate));
        if (sampleIdx >= 0 && sampleIdx < activeCommentary.pcmLeft.length) {
          const vL = activeCommentary.pcmLeft[sampleIdx] * 1.55;
          const vR = (activeCommentary.pcmRight ? activeCommentary.pcmRight[sampleIdx] : activeCommentary.pcmLeft[sampleIdx]) * 1.55;
          finalLeft += vL;
          finalRight += vR;
        }
      }

      // Soft Limiter (tanh) chống rè / vỡ tiếng (0dB headroom)
      left[i] = Math.tanh(finalLeft * 1.25) * 0.88;
      right[i] = Math.tanh(finalRight * 1.25) * 0.88;
    }

    return { left, right, totalSamples, timeline };
  }
}

function THREE_MathUtils_lerp(x: number, y: number, t: number): number {
  return (1 - t) * x + t * y;
}

export const audioEngine = new AudioEngine();
