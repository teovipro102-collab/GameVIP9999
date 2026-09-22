import * as THREE from 'three';
import { CameraMode, DirectorStyle } from '../types';
import { Car3DObject } from './vehiclePhysics';
import { safeGetPointAt, safeGetTangentAt } from './curveUtils';

export class CameraDirector {
  // Mặc định ban đầu luôn là góc truyền hình bao quát nhiều xe (Helicam / Multi-car pack)
  public currentMode: CameraMode = CameraMode.CHOPPER_HELI_CHASE;
  public directorStyle: DirectorStyle = DirectorStyle.F1_LIVE_SHOW_50_50;
  public camera: THREE.PerspectiveCamera;
  public isManualLocked: boolean = false;
  private currentTargetCarId: string = '';
  private dwellTimer: number = 0;
  public nextSwitchTime: number = 6.0; // 5.5 to 7.5 giây cho góc truyền hình bao quát
  private orbitAngle: number = 0;

  public setDirectorStyle(style: DirectorStyle) {
    this.directorStyle = style;
  }

  public static getInitialModeForStyle(style: DirectorStyle, instanceId: number): CameraMode {
    switch (style) {
      case DirectorStyle.HOLLYWOOD_ACTION_THRILLER:
        return [CameraMode.BUMPER_FIRST_PERSON, CameraMode.LOW_GROUND, CameraMode.OVERTAKE_ACTION][instanceId % 3];
      case DirectorStyle.SKY_MASTER_AERIAL:
        return [CameraMode.CHOPPER_HELI_CHASE, CameraMode.SKY_DRONE_BROADCAST, CameraMode.PANORAMIC][instanceId % 3];
      case DirectorStyle.PURE_COCKPIT_SIM_RACER:
        return [CameraMode.COCKPIT_FIRST_PERSON, CameraMode.HOOD, CameraMode.BUMPER_FIRST_PERSON][instanceId % 3];
      case DirectorStyle.TRACKSIDE_SPECTATOR_TV:
        return [CameraMode.TRACKSIDE_TELEPHOTO, CameraMode.TRACKSIDE_APEX, CameraMode.SPECTATOR_TRACKSIDE][instanceId % 3];
      case DirectorStyle.TIKTOK_REELS_VIRAL:
        return [CameraMode.VERTICAL_PORTRAIT_OPTIMIZED, CameraMode.LOW_GROUND, CameraMode.BEHIND][instanceId % 3];
      case DirectorStyle.APEX_DUEL_TACTICAL:
        return [CameraMode.OVERTAKE_ACTION, CameraMode.MULTI_CAR_OVERTAKE_WIDE, CameraMode.SIDE_CHASE_MULTI][instanceId % 3];
      case DirectorStyle.F1_LIVE_SHOW_50_50:
      default:
        return [CameraMode.CHOPPER_HELI_CHASE, CameraMode.MULTI_CAR_PACK_CHASE, CameraMode.MULTI_CAR_OVERTAKE_WIDE, CameraMode.TRACKSIDE_TELEPHOTO][instanceId % 4];
    }
  }

  // =========================================================================
  // 7 HỆ THỐNG ĐẠO DIỄN ĐIỆN ẢNH (7 AI CAMERA DIRECTOR PROFILES)
  // =========================================================================

  // --- 1. F1 Live Show 50/50 (Giữ nguyên chuẩn phát sóng Live Show 50% Bao quát / 50% Cận cảnh) ---
  public static readonly F1_BROADCAST_50: CameraMode[] = [
    CameraMode.CHOPPER_HELI_CHASE,
    CameraMode.MULTI_CAR_PACK_CHASE,
    CameraMode.MULTI_CAR_OVERTAKE_WIDE,
    CameraMode.MULTI_CAR_FRONT_FACING,
    CameraMode.TRACKSIDE_TELEPHOTO,
    CameraMode.PANORAMIC,
    CameraMode.SKY_DRONE_BROADCAST,
    CameraMode.SIDE_CHASE_MULTI,
    CameraMode.TRACKSIDE_APEX,
    CameraMode.SPECTATOR_TRACKSIDE,
    CameraMode.PIT_WALL_BROADCAST,
    CameraMode.VERTICAL_PORTRAIT_OPTIMIZED,
  ];
  public static readonly F1_CINEMATIC_50: CameraMode[] = [
    CameraMode.LOW_GROUND,
    CameraMode.BEHIND,
    CameraMode.HOOD,
    CameraMode.COCKPIT_FIRST_PERSON,
    CameraMode.BUMPER_FIRST_PERSON,
    CameraMode.OVERTAKE_ACTION,
    CameraMode.COLLISION_DRIFT,
  ];

  // --- 2. Hollywood Action & Thriller (75% Cận cảnh xé gió, cắt dồn dập 2.2s - 4.0s) ---
  public static readonly HOLLYWOOD_CLOSEUP: CameraMode[] = [
    CameraMode.BUMPER_FIRST_PERSON,
    CameraMode.LOW_GROUND,
    CameraMode.OVERTAKE_ACTION,
    CameraMode.COLLISION_DRIFT,
    CameraMode.WING_REAR_LOOK,
    CameraMode.COCKPIT_FIRST_PERSON,
    CameraMode.TUNNEL_CEILING_FAST,
  ];
  public static readonly HOLLYWOOD_WIDE: CameraMode[] = [
    CameraMode.MULTI_CAR_OVERTAKE_WIDE,
    CameraMode.SIDE_CHASE_MULTI,
    CameraMode.MULTI_CAR_FRONT_FACING,
  ];

  // --- 3. Sky Master Aerial & Drone Symphony (80% Trên không, giữ mượt 6.5s - 9.5s) ---
  public static readonly SKY_MASTER_AIR: CameraMode[] = [
    CameraMode.CHOPPER_HELI_CHASE,
    CameraMode.SKY_DRONE_BROADCAST,
    CameraMode.PANORAMIC,
    CameraMode.MULTI_CAR_PACK_CHASE,
    CameraMode.MULTI_CAR_OVERTAKE_WIDE,
  ];
  public static readonly SKY_MASTER_GROUND: CameraMode[] = [
    CameraMode.TRACKSIDE_TELEPHOTO,
    CameraMode.SPECTATOR_TRACKSIDE,
    CameraMode.PIT_WALL_BROADCAST,
  ];

  // --- 4. Pure Cockpit Sim-Racer POV (70% First-Person POV, giữ 4.5s - 7.0s) ---
  public static readonly COCKPIT_SIM_POV: CameraMode[] = [
    CameraMode.COCKPIT_FIRST_PERSON,
    CameraMode.HOOD,
    CameraMode.BUMPER_FIRST_PERSON,
    CameraMode.WING_REAR_LOOK,
  ];
  public static readonly COCKPIT_SIM_CHASE: CameraMode[] = [
    CameraMode.BEHIND,
    CameraMode.LOW_GROUND,
    CameraMode.OVERTAKE_ACTION,
  ];

  // --- 5. Trackside Grandstand & Spectator TV (85% Trạm quay tĩnh ven đường & Apex, 3.2s - 5.5s) ---
  public static readonly TRACKSIDE_STATION_MODES: CameraMode[] = [
    CameraMode.TRACKSIDE_TELEPHOTO,
    CameraMode.TRACKSIDE_APEX,
    CameraMode.SPECTATOR_TRACKSIDE,
    CameraMode.PASSING_STATIONARY,
    CameraMode.PIT_WALL_BROADCAST,
    CameraMode.KERB_CAM_GROUND,
  ];
  public static readonly TRACKSIDE_CHASE_MODES: CameraMode[] = [
    CameraMode.MULTI_CAR_PACK_CHASE,
    CameraMode.PANORAMIC,
  ];

  // --- 6. TikTok & Reels Vertical Viral Speed (70% 9:16 dọc & tim đường, 30% hành động viral 2.8s - 4.5s) ---
  public static readonly TIKTOK_PORTRAIT_MODES: CameraMode[] = [
    CameraMode.VERTICAL_PORTRAIT_OPTIMIZED,
    CameraMode.LOW_GROUND,
    CameraMode.BEHIND,
    CameraMode.MULTI_CAR_FRONT_FACING,
  ];
  public static readonly TIKTOK_VIRAL_ACTION: CameraMode[] = [
    CameraMode.COLLISION_DRIFT,
    CameraMode.OVERTAKE_ACTION,
    CameraMode.BUMPER_FIRST_PERSON,
  ];

  // --- 7. Apex Duel & Tactical Dogfight (80% So kè đối đầu P1-P2-P3, 20% Bám đuổi 2.8s - 5.0s) ---
  public static readonly APEX_DUEL_MODES: CameraMode[] = [
    CameraMode.OVERTAKE_ACTION,
    CameraMode.MULTI_CAR_OVERTAKE_WIDE,
    CameraMode.SIDE_CHASE_MULTI,
    CameraMode.MULTI_CAR_FRONT_FACING,
    CameraMode.TRACKSIDE_APEX,
    CameraMode.COLLISION_DRIFT,
  ];
  public static readonly APEX_DUEL_CHASE: CameraMode[] = [
    CameraMode.LOW_GROUND,
    CameraMode.BEHIND,
  ];

  // Legacy compatibility aliases
  public static readonly BROADCAST_MULTI_CAR_MODES = CameraDirector.F1_BROADCAST_50;
  public static readonly CINEMATIC_ACCENT_MODES = CameraDirector.F1_CINEMATIC_50;
  public static readonly TACTICAL_ACTION_MODES = CameraDirector.APEX_DUEL_MODES;

  // Trạm quay phim ven đường tĩnh (Trackside Static Station) cho cảm giác truyền hình F1 chân thực
  private tracksideStationPos: THREE.Vector3 = new THREE.Vector3();
  private hasStationPos: boolean = false;
  private grandstandStationPos: THREE.Vector3 = new THREE.Vector3();
  private hasGrandstandPos: boolean = false;
  private spectatorStationPos: THREE.Vector3 = new THREE.Vector3();
  private hasSpectatorPos: boolean = false;
  private helipadStationPos: THREE.Vector3 = new THREE.Vector3();
  private hasHelipadPos: boolean = false;

  // Trạm quay sát mặt đường động / ven vỉa gờ kerb (Low Ground Dynamic Station)
  private lowGroundStationPos: THREE.Vector3 = new THREE.Vector3();
  private lowGroundTangent: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
  private hasLowGroundStation: boolean = false;
  private lowGroundDwellTimer: number = 0;

  // Smoothing buffers for cinematic movement (Gimbal chống rung quang học)
  private smoothedCamPos: THREE.Vector3 = new THREE.Vector3(0, 10, 20);
  private smoothedLookTarget: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private isFirstFrame: boolean = true;

  // Gyro-stabilized broadcast tracking anchor: cách ly hoàn toàn rung giật va chạm
  private stabilizedAnchorPos: THREE.Vector3 = new THREE.Vector3();
  private stabilizedAnchorForward: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
  private hasStabilizedAnchor: boolean = false;

  // Smooth heading tracking for zero-lag tight chase camera (loại bỏ hoàn toàn rung giật ở các góc cận cảnh)
  private smoothHeading: THREE.Vector3 = new THREE.Vector3(0, 0, 1);
  private hasSmoothHeading: boolean = false;

  // Thời gian mô phỏng đồng bộ tuyệt đối với delta (triệt tiêu 100% hiện tượng lệch nhịp rung chấn)
  private simulatedTime: number = 0;

  // Curve đường đua để cố định chuẩn xác vạch tim đường và độ cao mặt đường
  private trackCurve: THREE.Curve<THREE.Vector3> | null = null;
  private trackLength: number = 35000;

  setTrackCurve(curve: THREE.Curve<THREE.Vector3>, length: number) {
    this.trackCurve = curve;
    this.trackLength = Math.max(100, length);
  }

  // Tiêu cự quang học chuẩn thể thao: 68° góc rộng điện ảnh, mở rộng động lên 88° khi đạt 500 km/h
  private readonly BASE_FOV: number = 68;

  constructor(fov: number = 68, aspect: number = 16 / 9) {
    // Near plane 0.15m để camera góc sát mặt đường không bao giờ bị cắt rách hay khuyết mặt đường dưới đáy màn hình
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.15, 30000);
  }

  setCameraMode(mode: CameraMode, manualLock: boolean = true) {
    // Loại bỏ góc quay 360 độ và góc chắn bùn theo yêu cầu người dùng
    if (mode === CameraMode.CINEMATIC_ORBIT || (mode as any) === 'CINEMATIC_ORBIT') {
      mode = CameraMode.BEHIND;
    }
    if (mode === CameraMode.FENDER_WHEEL_LOOK || (mode as any) === 'FENDER_WHEEL_LOOK') {
      mode = CameraMode.HOOD;
    }
    this.currentMode = mode;
    this.isManualLocked = manualLock;
    this.dwellTimer = 0;
    this.hasLowGroundStation = false;
    this.lowGroundDwellTimer = 0;
    this.hasStationPos = false;
    this.hasGrandstandPos = false;
    this.hasSpectatorPos = false;
    this.hasHelipadPos = false;
    this.hasSmoothHeading = false;
    this.isFirstFrame = true; // Bắt tức thì vào vị trí góc quay mới, triệt tiêu việc bị cách xa hàng trăm mét
  }

  unlockAutoDirector() {
    this.isManualLocked = false;
    this.dwellTimer = 0;
    this.nextSwitchTime = 4.5 + Math.random() * 1.5;
  }

  resetFirstFrame() {
    this.isFirstFrame = true;
    this.hasLowGroundStation = false;
    this.lowGroundDwellTimer = 0;
    this.hasStationPos = false;
    this.hasGrandstandPos = false;
    this.hasSpectatorPos = false;
    this.hasHelipadPos = false;
    this.hasStabilizedAnchor = false;
    this.hasSmoothHeading = false;
  }

  update(
    cars: Car3DObject[],
    delta: number,
    activeOvertakeCarId: string | null,
    collisionCarId: string | null,
    autoDirectorEnabled: boolean = true
  ): CameraMode {
    if (cars.length === 0) return this.currentMode;

    this.dwellTimer += delta;
    this.simulatedTime += delta;
    this.orbitAngle += delta * (this.currentMode === CameraMode.CINEMATIC_ORBIT ? 0.95 : 0.35);

    // Determine Leader (P1)
    const leaderCar = cars.find(c => c.state.rank === 1) || cars[0];

    // Priority event-driven director switches theo từng phong cách Đạo Diễn Điện Ảnh
    if (autoDirectorEnabled && !this.isManualLocked) {
      if (collisionCarId && this.dwellTimer >= 4.0) {
        let chosenMode: CameraMode;
        let switchDuration = 4.5;

        switch (this.directorStyle) {
          case DirectorStyle.HOLLYWOOD_ACTION_THRILLER:
            // Cận cảnh cháy nổ khói lốp kịch tính
            chosenMode = Math.random() < 0.7 ? CameraMode.COLLISION_DRIFT : CameraMode.LOW_GROUND;
            switchDuration = 2.8 + Math.random() * 1.0;
            break;
          case DirectorStyle.SKY_MASTER_AERIAL:
            // Bao quát từ trên không
            chosenMode = Math.random() < 0.6 ? CameraMode.CHOPPER_HELI_CHASE : CameraMode.SKY_DRONE_BROADCAST;
            switchDuration = 6.0 + Math.random() * 2.0;
            break;
          case DirectorStyle.PURE_COCKPIT_SIM_RACER:
            chosenMode = Math.random() < 0.6 ? CameraMode.COCKPIT_FIRST_PERSON : CameraMode.BUMPER_FIRST_PERSON;
            switchDuration = 4.0 + Math.random() * 1.5;
            break;
          case DirectorStyle.TRACKSIDE_SPECTATOR_TV:
            chosenMode = Math.random() < 0.6 ? CameraMode.TRACKSIDE_APEX : CameraMode.TRACKSIDE_TELEPHOTO;
            switchDuration = 3.5 + Math.random() * 1.5;
            break;
          case DirectorStyle.TIKTOK_REELS_VIRAL:
            chosenMode = Math.random() < 0.6 ? CameraMode.COLLISION_DRIFT : CameraMode.VERTICAL_PORTRAIT_OPTIMIZED;
            switchDuration = 3.0 + Math.random() * 1.2;
            break;
          case DirectorStyle.APEX_DUEL_TACTICAL:
            chosenMode = Math.random() < 0.6 ? CameraMode.TRACKSIDE_APEX : CameraMode.COLLISION_DRIFT;
            switchDuration = 3.5 + Math.random() * 1.5;
            break;
          case DirectorStyle.F1_LIVE_SHOW_50_50:
          default: {
            // Chuẩn Live Show 50/50: Đỉnh cua Apex hoặc cận cảnh Drift
            const isApex = Math.random() < 0.50;
            chosenMode = isApex ? CameraMode.TRACKSIDE_APEX : CameraMode.COLLISION_DRIFT;
            switchDuration = isApex ? (5.0 + Math.random() * 1.5) : (3.5 + Math.random() * 1.2);
            break;
          }
        }

        this.currentMode = chosenMode;
        this.currentTargetCarId = collisionCarId;
        this.dwellTimer = 0;
        this.nextSwitchTime = switchDuration;
        this.hasStationPos = false;
        this.hasSpectatorPos = false;
        this.isFirstFrame = true; // Cắt góc chuẩn truyền hình F1 Live Show tức thì, không lia giật
      } else if (activeOvertakeCarId && this.dwellTimer >= 4.0) {
        let chosenMode: CameraMode;
        let switchDuration = 4.5;

        switch (this.directorStyle) {
          case DirectorStyle.HOLLYWOOD_ACTION_THRILLER:
            chosenMode = Math.random() < 0.6 ? CameraMode.OVERTAKE_ACTION : CameraMode.BUMPER_FIRST_PERSON;
            switchDuration = 2.5 + Math.random() * 1.2;
            break;
          case DirectorStyle.SKY_MASTER_AERIAL:
            chosenMode = Math.random() < 0.6 ? CameraMode.MULTI_CAR_OVERTAKE_WIDE : CameraMode.CHOPPER_HELI_CHASE;
            switchDuration = 6.5 + Math.random() * 2.0;
            break;
          case DirectorStyle.PURE_COCKPIT_SIM_RACER:
            chosenMode = Math.random() < 0.6 ? CameraMode.COCKPIT_FIRST_PERSON : CameraMode.HOOD;
            switchDuration = 4.5 + Math.random() * 1.5;
            break;
          case DirectorStyle.TRACKSIDE_SPECTATOR_TV:
            chosenMode = Math.random() < 0.6 ? CameraMode.TRACKSIDE_TELEPHOTO : CameraMode.PIT_WALL_BROADCAST;
            switchDuration = 3.5 + Math.random() * 1.5;
            break;
          case DirectorStyle.TIKTOK_REELS_VIRAL:
            chosenMode = Math.random() < 0.6 ? CameraMode.VERTICAL_PORTRAIT_OPTIMIZED : CameraMode.OVERTAKE_ACTION;
            switchDuration = 3.0 + Math.random() * 1.2;
            break;
          case DirectorStyle.APEX_DUEL_TACTICAL:
            chosenMode = Math.random() < 0.5 ? CameraMode.OVERTAKE_ACTION : CameraMode.SIDE_CHASE_MULTI;
            switchDuration = 3.0 + Math.random() * 1.5;
            break;
          case DirectorStyle.F1_LIVE_SHOW_50_50:
          default: {
            // Chuẩn Live Show 50/50: Toàn cảnh so kè hoặc cận cảnh vượt mặt
            const isWide = Math.random() < 0.50;
            chosenMode = isWide ? CameraMode.MULTI_CAR_OVERTAKE_WIDE : CameraMode.OVERTAKE_ACTION;
            switchDuration = isWide ? (5.0 + Math.random() * 1.8) : (3.5 + Math.random() * 1.2);
            break;
          }
        }

        this.currentMode = chosenMode;
        this.currentTargetCarId = activeOvertakeCarId;
        this.dwellTimer = 0;
        this.nextSwitchTime = switchDuration;
        this.hasStationPos = false;
        this.hasSpectatorPos = false;
        this.isFirstFrame = true; // Cắt góc chuẩn truyền hình F1 Live Show tức thì
      } else if (this.dwellTimer >= this.nextSwitchTime) {
        // Chuyển góc quay tự động theo phong cách đạo diễn đang chọn
        this.cycleNextCinematicMode();
        this.dwellTimer = 0;
        this.hasStationPos = false;
        this.hasGrandstandPos = false;
        this.isFirstFrame = true; // Cắt góc tức thì
      }
    }

    // Select target car based on mode
    let targetCar = cars.find(c => c.state.id === this.currentTargetCarId);
    if (!targetCar || this.currentMode === CameraMode.LEADER_TRACKING) {
      targetCar = leaderCar;
      this.currentTargetCarId = targetCar.state.id;
    }

    const idealPos = new THREE.Vector3();
    const lookTarget = new THREE.Vector3();

    const carPos = targetCar.group.position;
    const carQuat = targetCar.group.quaternion;
    const rawForward = new THREE.Vector3(0, 0, 1).applyQuaternion(carQuat).normalize();
    const up = new THREE.Vector3(0, 1, 0);

    // =========================================================================
    // XÁC ĐỊNH BỐI CẢNH SO KÈ / VƯỢT MẶT (ACTIVE DUEL & RACE BATTLE CONTEXT)
    // Tìm cặp xe đang so kè sát nút nhất trên đường đua để bắt trọn bối cảnh cuộc đua
    // =========================================================================
    let duelCarA: Car3DObject = leaderCar;
    let duelCarB: Car3DObject = cars.length > 1 ? (cars.find(c => c.state.rank === 2) || cars[1]) : leaderCar;
    let minDuelDistance = Infinity;

    // 1. Ưu tiên xe đang có sự kiện vượt mặt (activeOvertakeCarId)
    if (activeOvertakeCarId) {
      const activeCar = cars.find(c => c.state.id === activeOvertakeCarId);
      if (activeCar) {
        duelCarA = activeCar;
        for (const c of cars) {
          if (c.state.id === activeCar.state.id) continue;
          const d = activeCar.group.position.distanceTo(c.group.position);
          if (d < minDuelDistance) {
            minDuelDistance = d;
            duelCarB = c;
          }
        }
      }
    }

    // 2. Nếu chưa có sự kiện vượt mặt hoặc khoảng cách quá lớn, quét tìm cặp xe gần nhau nhất trong Top 8
    if (minDuelDistance > 65.0 && cars.length >= 2) {
      const topRacers = [...cars].sort((a, b) => a.state.rank - b.state.rank).slice(0, 8);
      for (let i = 0; i < topRacers.length; i++) {
        for (let j = i + 1; j < topRacers.length; j++) {
          const d = topRacers[i].group.position.distanceTo(topRacers[j].group.position);
          if (d < minDuelDistance) {
            minDuelDistance = d;
            duelCarA = topRacers[i];
            duelCarB = topRacers[j];
          }
        }
      }
    }

    // Xác định xe đi trước và xe đang bám đuổi/tấn công
    const progressA = duelCarA.state.lapProgress || 0;
    const progressB = duelCarB.state.lapProgress || 0;
    let duelDiff = progressA - progressB;
    if (duelDiff < -0.5) duelDiff += 1.0;
    if (duelDiff > 0.5) duelDiff -= 1.0;
    const leadDuelCar = duelDiff >= 0 ? duelCarA : duelCarB;
    const chaseDuelCar = duelDiff >= 0 ? duelCarB : duelCarA;

    // Tâm điểm của cuộc so kè (Battle Midpoint)
    const duelMidpoint = leadDuelCar.group.position.clone().lerp(chaseDuelCar.group.position, 0.5);
    const forwardLead = new THREE.Vector3(0, 0, 1).applyQuaternion(leadDuelCar.group.quaternion);
    const forwardChase = new THREE.Vector3(0, 0, 1).applyQuaternion(chaseDuelCar.group.quaternion);
    let duelForward = forwardLead.clone().add(forwardChase);
    if (duelForward.lengthSq() < 0.001) {
      duelForward.set(0, 0, 1);
    } else {
      duelForward.normalize();
    }
    const duelRight = new THREE.Vector3().crossVectors(duelForward, up).normalize();

    // Phân loại các góc quay gắn liền trên xe (Mounted Cameras) - Tuyệt đối không có độ trễ tịnh tiến
    const isRigidMounted = (
      this.currentMode === CameraMode.HOOD ||
      this.currentMode === CameraMode.COCKPIT_FIRST_PERSON ||
      this.currentMode === CameraMode.BUMPER_FIRST_PERSON ||
      this.currentMode === CameraMode.WING_REAR_LOOK
    );

    // Phân loại các góc quay bám sát xe (Tight Chase Cameras) - Khoảng cách tới xe cố định tuyệt đối, không co giãn giật cục
    // Lưu ý: LOW_GROUND và OVERTAKE_ACTION đã được giải phóng để gắn vào trạm mặt đường và bối cảnh so kè 2 xe
    const isTightChase = (
      this.currentMode === CameraMode.BEHIND ||
      this.currentMode === CameraMode.SIDE_PROFILE ||
      this.currentMode === CameraMode.COLLISION_DRIFT ||
      this.currentMode === CameraMode.VERTICAL_PORTRAIT_OPTIMIZED
    );

    // Hướng xoay mượt mà khóa đường chân trời cho góc quay bám đuôi (Gimbal Horizon-Locked Yaw)
    let carForwardFlat = new THREE.Vector3(rawForward.x, 0, rawForward.z);
    if (carForwardFlat.lengthSq() < 0.0001) {
      carForwardFlat.set(0, 0, 1);
    } else {
      carForwardFlat.normalize();
    }

    // Tham chiếu hướng đường đua tiến về phía trước để đảm bảo camera KHÔNG BAO GIỜ bị xoay về sau
    let trackForwardFlat = carForwardFlat.clone();
    if (this.trackCurve && targetCar.state && typeof targetCar.state.lapProgress === 'number') {
      const tan = safeGetTangentAt(this.trackCurve, targetCar.state.lapProgress);
      const flatTan = new THREE.Vector3(tan.x, 0, tan.z);
      if (flatTan.lengthSq() > 0.0001) {
        trackForwardFlat.copy(flatTan).normalize();
      }
    }

    // Nếu xe bị quay ngang quá gắt hoặc lật xoay ngược chiều đua do drift/va chạm, hướng camera vẫn giữ chuẩn tiến
    let effectiveForward = carForwardFlat;
    if (carForwardFlat.dot(trackForwardFlat) < 0.2) {
      effectiveForward = trackForwardFlat;
    }

    // Bộ lọc chuyển hướng xoay êm ái tự nhiên chuẩn Live Show truyền hình thực tế:
    const turnDampingSpeed = 3.2;
    const headingBlend = 1.0 - Math.exp(-turnDampingSpeed * delta);
    if (!this.hasSmoothHeading || this.isFirstFrame) {
      this.smoothHeading.copy(effectiveForward);
      this.hasSmoothHeading = true;
    } else {
      // Bảo đảm smoothHeading không bao giờ bị quay ngược về phía sau
      if (this.smoothHeading.dot(trackForwardFlat) < 0.25) {
        this.smoothHeading.copy(trackForwardFlat);
      } else {
        this.smoothHeading.lerp(effectiveForward, headingBlend).normalize();
      }
    }
    const smoothRight = new THREE.Vector3().crossVectors(this.smoothHeading, up).normalize();

    // Hệ thống neo giảm chấn cho các góc quay từ xa trên không (Chopper / Sky Drone / Panoramic)
    if (!this.hasStabilizedAnchor || this.isFirstFrame) {
      this.stabilizedAnchorPos.copy(carPos);
      this.stabilizedAnchorForward.copy(rawForward);
      this.hasStabilizedAnchor = true;
    } else {
      const anchorSmoothSpeed = Math.min(1.0, delta * 20.0);
      this.stabilizedAnchorPos.lerp(carPos, anchorSmoothSpeed);
      this.stabilizedAnchorForward.lerp(rawForward, Math.min(1.0, delta * 14.0)).normalize();
    }

    const trackedPos = this.stabilizedAnchorPos;
    const forward = this.stabilizedAnchorForward;
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();
    const currentSpeed = targetCar.state.speed || 0;

    // Tốc độ lerp máy quay (Smooth Damping factor)
    let camSmoothSpeed = 4.5;

    switch (this.currentMode) {
      // =========================================================================
      // GÓC QUAY TRỰC THĂNG TRUYỀN HÌNH TỪ XA (CHOPPER HELI CHASE)
      // Helicam bay lượn đầm chắc trên không chuẩn gyro-gimbal F1 Live Show
      // =========================================================================
      case CameraMode.CHOPPER_HELI_CHASE: {
        camSmoothSpeed = 16.0;
        idealPos.copy(trackedPos)
          .addScaledVector(forward, -24.0)
          .addScaledVector(right, 12.0)
          .addScaledVector(up, 16.0);
        lookTarget.copy(trackedPos).addScaledVector(forward, 10.0).addScaledVector(up, 1.0);
        break;
      }

      // =========================================================================
      // GÓC QUAY DRONE BAY BÁM ĐUỔI TỪ XA (SKY DRONE BROADCAST / FLYCAM)
      // Drone FPV bay lướt đầm chắc, bắt trọn từng pha so kè
      // =========================================================================
      case CameraMode.SKY_DRONE_BROADCAST: {
        camSmoothSpeed = 20.0;
        idealPos.copy(trackedPos)
          .addScaledVector(forward, -14.0)
          .addScaledVector(right, 3.0)
          .addScaledVector(up, 5.8);
        lookTarget.copy(trackedPos).addScaledVector(forward, 12.0).addScaledVector(up, 1.0);
        break;
      }

      // =========================================================================
      // GÓC QUAY TOÀN CẢNH TỪ TRÊN CAO (PANORAMIC / GRANDSTAND)
      // =========================================================================
      case CameraMode.PANORAMIC: {
        camSmoothSpeed = 16.0;
        idealPos.copy(trackedPos)
          .addScaledVector(forward, -20.0)
          .addScaledVector(right, 16.0)
          .addScaledVector(up, 20.0);
        lookTarget.copy(trackedPos).addScaledVector(forward, 10.0).addScaledVector(up, 1.0);
        break;
      }

      // =========================================================================
      // 1. MÁY QUAY TELEPHOTO VEN ĐƯỜNG LIA THEO XE (TRACKSIDE TELEPHOTO 85mm)
      // Máy quay ĐỨNG YÊN 100% Ở VEN ĐƯỜNG KHÔNG DI CHUYỂN, chỉ xoay ống kính lia theo đoàn xe đi qua
      // =========================================================================
      case CameraMode.TRACKSIDE_TELEPHOTO: {
        const distToStation = trackedPos.distanceTo(this.tracksideStationPos);
        if (!this.hasStationPos || distToStation > 160.0) {
          this.tracksideStationPos.copy(trackedPos)
            .addScaledVector(right, 14.5)
            .addScaledVector(forward, 55.0);
          this.tracksideStationPos.y = trackedPos.y + 2.8;
          this.hasStationPos = true;
        }
        idealPos.copy(this.tracksideStationPos); // Đứng yên tuyệt đối ở ven đường!
        lookTarget.copy(trackedPos).addScaledVector(up, 0.85); // Chỉ lia ống kính theo xe
        break;
      }

      // =========================================================================
      // 2. TOÀN CẢNH SO KÈ NHIỀU XE (MULTI_CAR_OVERTAKE_WIDE)
      // Góc quay chéo từ trên cao vừa phải, bắt trọn từng pha đảo làn và so kè tay đôi
      // =========================================================================
      case CameraMode.MULTI_CAR_OVERTAKE_WIDE: {
        camSmoothSpeed = 12.0;
        idealPos.copy(duelMidpoint)
          .addScaledVector(duelRight, 22.0)
          .addScaledVector(duelForward, -24.0)
          .addScaledVector(up, 12.5);
        lookTarget.copy(duelMidpoint).addScaledVector(duelForward, 12.0).addScaledVector(up, 1.1);
        break;
      }

      // =========================================================================
      // 3. GÓC ĐÓN ĐẦU NHIỀU XE ĐUA (MULTI_CAR_FRONT_FACING)
      // Đón đầu đoàn xe, quay trực diện vào xe và nhóm xe phía sau đang lao tới
      // =========================================================================
      case CameraMode.MULTI_CAR_FRONT_FACING: {
        camSmoothSpeed = 16.0;
        idealPos.copy(trackedPos)
          .addScaledVector(forward, 38.0)
          .addScaledVector(up, 5.5)
          .addScaledVector(right, -3.0);
        lookTarget.copy(trackedPos).addScaledVector(forward, -4.0).addScaledVector(up, 1.0);
        break;
      }

      // =========================================================================
      // 4. TRẠM QUAY ĐỈNH GÓC CUA APEX (TRACKSIDE APEX)
      // Đặt ngay mép vỉa cua (apex curb), đón xe ôm cua rõ nét với độ ổn định cao
      // =========================================================================
      case CameraMode.TRACKSIDE_APEX: {
        camSmoothSpeed = 25.0;
        idealPos.copy(trackedPos)
          .addScaledVector(forward, 6.0)
          .addScaledVector(right, -4.5)
          .addScaledVector(up, 1.2);
        idealPos.y = Math.max(idealPos.y, trackedPos.y + 0.5);
        lookTarget.copy(trackedPos).addScaledVector(forward, 0.0).addScaledVector(up, 0.85);
        break;
      }

      // =========================================================================
      // 5. BÁM ĐUÔI ĐOÀN XE NGHẸT THỞ (MULTI_CAR_PACK_CHASE)
      // Cách sau xe 35m, trên cao 9.5m bao quát cận cảnh các xe so kè và đảo làn bứt tốc
      // =========================================================================
      case CameraMode.MULTI_CAR_PACK_CHASE: {
        camSmoothSpeed = 16.0;
        idealPos.copy(trackedPos)
          .addScaledVector(forward, -35.0)
          .addScaledVector(up, 9.5)
          .addScaledVector(right, 3.2);
        lookTarget.copy(trackedPos).addScaledVector(forward, 25.0).addScaledVector(up, 1.2);
        break;
      }

      // =========================================================================
      // 6. VÁCH KỸ THUẬT PIT WALL (PIT WALL BROADCAST)
      // Góc nhìn từ tường chỉ đạo pit stop nhìn đoàn xe xé gió đoạn thẳng
      // =========================================================================
      case CameraMode.PIT_WALL_BROADCAST: {
        camSmoothSpeed = 7.5;
        idealPos.copy(trackedPos)
          .addScaledVector(right, -16.0)
          .addScaledVector(forward, 16.0)
          .addScaledVector(up, 3.2);
        lookTarget.copy(trackedPos).addScaledVector(up, 1.0);
        break;
      }

      // =========================================================================
      // 7. TRẠM QUAY TĨNH SÁT RÀO CHẮN XÉ GIÓ (PASSING STATIONARY)
      // Máy quay gắn sát rào chắn xé gió (Armco Barrier Rush), rào chắn và vạch sơn vút qua cực mượt mà
      // =========================================================================
      case CameraMode.PASSING_STATIONARY: {
        camSmoothSpeed = 10.0;
        idealPos.copy(trackedPos)
          .addScaledVector(right, 6.2)
          .addScaledVector(forward, -1.8)
          .addScaledVector(up, 1.25);
        lookTarget.copy(trackedPos)
          .addScaledVector(forward, 2.5)
          .addScaledVector(up, 0.75);
        break;
      }

      // =========================================================================
      // 9. KHUNG HÌNH DỌC 9:16 TRUYỀN HÌNH (VERTICAL PORTRAIT OPTIMIZED)
      // Cố định xe ở CHÍNH GIỮA MÀN HÌNH, tuyệt đối KHÔNG xoay lắc hay trôi dạt (TikTok / Shorts / Reels)
      // =========================================================================
      case CameraMode.VERTICAL_PORTRAIT_OPTIMIZED: {
        camSmoothSpeed = 0;
        const vertDist = 13.0; // Cự ly lùi sau tối ưu cho khung hình dọc 9:16
        const vertHeight = 4.5; // Độ cao chuẩn để xe nằm vững vàng ở 1/3 dưới đến tâm màn hình

        // Dùng hướng tiến trực tiếp của xe (hoặc hướng đường đua nếu xe drift mạnh)
        let vertHeading = effectiveForward;
        if (vertHeading.dot(trackForwardFlat) < 0.25) {
          vertHeading = trackForwardFlat;
        }

        idealPos.copy(carPos).addScaledVector(vertHeading, -vertDist).addScaledVector(up, vertHeight);
        idealPos.y = Math.max(idealPos.y, carPos.y + 2.5);
        // Nhìn thẳng vào thân xe (carPos), khóa xe cố định ở chính giữa màn hình theo phương ngang
        lookTarget.copy(carPos).addScaledVector(up, 1.15).addScaledVector(vertHeading, 2.5);
        break;
      }

      // =========================================================================
      // 10. GÓC QUAY NGƯỜI ĐỨNG VEN ĐƯỜNG (SPECTATOR TRACKSIDE)
      // Camera ĐỨNG YÊN 100% Ở VEN ĐƯỜNG KHÔNG DI CHUYỂN, chỉ xoay hướng lia nhìn theo xe tốc độ cao đi qua
      // =========================================================================
      case CameraMode.SPECTATOR_TRACKSIDE: {
        const distToSpectator = trackedPos.distanceTo(this.spectatorStationPos);
        if (!this.hasSpectatorPos || distToSpectator > 160.0) {
          this.spectatorStationPos.copy(trackedPos)
            .addScaledVector(right, 14.0)
            .addScaledVector(forward, 50.0);
          this.spectatorStationPos.y = trackedPos.y + 1.65; // Tầm mắt khán giả đứng ven đường
          this.hasSpectatorPos = true;
        }
        idealPos.copy(this.spectatorStationPos); // Tuyệt đối đứng yên!
        lookTarget.copy(trackedPos).addScaledVector(up, 0.85); // Chỉ lia ống kính theo thân xe
        break;
      }

      // =========================================================================
      // 10. HÔNG XA SO KÈ NHIỀU XE ĐUA (SIDE_CHASE_MULTI)
      // Chạy song song cạnh đoàn xe cách 32m, bao quát các xe đua đang so kè bánh xe
      // =========================================================================
      case CameraMode.SIDE_CHASE_MULTI: {
        camSmoothSpeed = 14.0;
        idealPos.copy(trackedPos)
          .addScaledVector(right, -30.0)
          .addScaledVector(forward, 6.0)
          .addScaledVector(up, 6.5);
        lookTarget.copy(trackedPos).addScaledVector(forward, 8.0).addScaledVector(up, 1.2);
        break;
      }

      // =========================================================================
      // 13. CAMERA TRẦN HẦM HẤT XUỐNG SIÊU TỐC (TUNNEL_CEILING_FAST)
      // Gắn dọc trần hầm nhìn từ trên xuống cực kỳ kịch tính khi xe vút qua bên dưới
      // =========================================================================
      case CameraMode.TUNNEL_CEILING_FAST: {
        camSmoothSpeed = 16.0;
        idealPos.copy(trackedPos).addScaledVector(forward, 15.0).addScaledVector(up, 6.2);
        lookTarget.copy(trackedPos).addScaledVector(forward, -2.0).addScaledVector(up, 0.5);
        break;
      }

      // =========================================================================
      // 14. CAMERA CHẮN BÙN (ĐÃ LOẠI BỎ THEO YÊU CẦU -> CHUYỂN HOOD)
      // =========================================================================
      case CameraMode.FENDER_WHEEL_LOOK: {
        camSmoothSpeed = 0;
        idealPos.copy(carPos).add(new THREE.Vector3(0, 0.95, 1.1).applyQuaternion(carQuat));
        lookTarget.copy(carPos).add(new THREE.Vector3(0, 0.90, 40.0).applyQuaternion(carQuat));
        break;
      }

      // =========================================================================
      // 15. ĐUÔI GIÓ NHÌN NGƯỢC VỀ TRƯỚC (WING_REAR_LOOK)
      // Gắn trên cánh gió sau nhìn vượt qua nóc xe về phía trước, cảm nhận tốc độ cực hạn
      // =========================================================================
      case CameraMode.WING_REAR_LOOK: {
        camSmoothSpeed = 0;
        idealPos.copy(carPos).add(new THREE.Vector3(0, 1.6, -1.75).applyQuaternion(carQuat));
        lookTarget.copy(carPos).add(new THREE.Vector3(0, 0.95, 15.0).applyQuaternion(carQuat));
        break;
      }

      // =========================================================================
      // 16. CAMERA ÂM VỈA GỜ GIẢM TỐC (KERB_CAM_GROUND)
      // Nâng cao góc quay lên 1 mét so với mặt đường
      // =========================================================================
      case CameraMode.KERB_CAM_GROUND: {
        camSmoothSpeed = 20.0;
        idealPos.copy(trackedPos).addScaledVector(right, 3.2).addScaledVector(forward, 4.0).addScaledVector(up, 1.45);
        idealPos.y = Math.max(idealPos.y, trackedPos.y + 1.35);
        lookTarget.copy(trackedPos).addScaledVector(up, 1.55);
        break;
      }

      // =========================================================================
      // 17. GÓC LÁI THỨ NHẤT TRONG CABIN (COCKPIT_FIRST_PERSON)
      // Trải nghiệm trực tiếp bên trong buồng lái xe đua tốc độ cực cao - Gắn cứng thân xe không rung giật
      // =========================================================================
      case CameraMode.COCKPIT_FIRST_PERSON: {
        camSmoothSpeed = 0;
        idealPos.copy(carPos).add(new THREE.Vector3(0, 1.05, 0.15).applyQuaternion(carQuat));
        lookTarget.copy(carPos).add(new THREE.Vector3(0, 0.95, 35.0).applyQuaternion(carQuat));
        break;
      }

      // =========================================================================
      // 18. GÓC CẢN TRƯỚC SIÊU TỐC (BUMPER_FIRST_PERSON)
      // Góc cản trước xé gió siêu tốc - Gắn cứng thân xe không rung giật
      // =========================================================================
      case CameraMode.BUMPER_FIRST_PERSON: {
        camSmoothSpeed = 0;
        idealPos.copy(carPos).add(new THREE.Vector3(0, 0.55, 1.85).applyQuaternion(carQuat));
        lookTarget.copy(carPos).add(new THREE.Vector3(0, 0.55, 40.0).applyQuaternion(carQuat));
        break;
      }

      // =========================================================================
      // === 10 GÓC QUAY CINEMATIC KINH ĐIỂN (CLASSIC CAMERAS) ===
      // =========================================================================

      // 1. Phía Sau Xe: Nâng lên 5m (7.8m), lùi sau 5m (18.0m), tuyệt đối KHÔNG xoay về sau
      case CameraMode.BEHIND: {
        camSmoothSpeed = 0;
        const dist = 18.0; // Lùi về sau 18.0m (+5m theo yêu cầu)
        const height = 7.8; // Nâng lên 7.8m (+5m theo yêu cầu)

        // Hướng bám chắc chắn khóa theo chiều tiến trường đua, tuyệt đối không bao giờ xoay ngược về sau
        let safeBehindHeading = this.smoothHeading;
        if (safeBehindHeading.dot(trackForwardFlat) < 0.3) {
          safeBehindHeading = trackForwardFlat;
        }

        idealPos.copy(carPos).addScaledVector(safeBehindHeading, -dist).addScaledVector(up, height);
        idealPos.y = Math.max(idealPos.y, carPos.y + 6.2);
        lookTarget.copy(carPos).addScaledVector(safeBehindHeading, 26.0).addScaledVector(up, 1.2);
        break;
      }

      // 2. Mui Xe / Cockpit: Gắn trực tiếp nắp capo, nhìn thẳng đường đua siêu nét
      case CameraMode.HOOD: {
        camSmoothSpeed = 0;
        idealPos.copy(carPos).add(new THREE.Vector3(0, 0.95, 1.1).applyQuaternion(carQuat));
        lookTarget.copy(carPos).add(new THREE.Vector3(0, 0.90, 40.0).applyQuaternion(carQuat));
        break;
      }

      // =========================================================================
      // 3. SÁT MẶT ĐƯỜNG (LOW_GROUND) - BÁM THEO BỐI CẢNH CUỘC ĐUA & CẢM NHẬN TỐC ĐỘ XE
      // KHÔNG bám vào 1 xe cố định! Đặt camera sát sạt mặt đường (0.55m) tại vỉa cua/mép vạch sơn,
      // đón trọn đoàn xe rượt đuổi tốc độ cao lao vút qua trước ống kính với cảm giác xé gió cực hạn!
      // =========================================================================
      case CameraMode.LOW_GROUND: {
        this.lowGroundDwellTimer += delta;
        // Điểm tham chiếu: đoàn xe dẫn đầu hoặc xe đang so kè
        const refCar = duelCarA || leaderCar;
        const refPos = refCar.group.position;
        const refProgress = (refCar.state && typeof refCar.state.lapProgress === 'number') ? refCar.state.lapProgress : 0;

        // Kiểm tra xem đoàn xe đã chạy qua trạm quay sát mặt đường chưa
        let needNewStation = !this.hasLowGroundStation;
        if (this.hasLowGroundStation) {
          const toCar = refPos.clone().sub(this.lowGroundStationPos);
          const distToCam = toCar.length();
          const dotWithTangent = toCar.dot(this.lowGroundTangent);
          // Đoàn xe đã lướt qua trạm quay và đi xa hơn 35m, hoặc xe ở quá xa > 140m, hoặc trạm đã đứng quá 4.5s
          if (dotWithTangent > 35.0 || distToCam > 140.0 || this.lowGroundDwellTimer > 4.5) {
            needNewStation = true;
          }
        }

        if (needNewStation) {
          this.lowGroundDwellTimer = 0;
          // Chọn vị trí đón đầu đoàn xe phía trước 50m - 75m
          const aheadDist = 55.0 + ((Math.abs(refCar.state.id.charCodeAt(0) || 42) * 7) % 25.0);
          if (this.trackCurve) {
            let aheadProgress = refProgress + (aheadDist / this.trackLength);
            if (aheadProgress >= 1.0) aheadProgress -= 1.0;
            if (aheadProgress < 0) aheadProgress += 1.0;

            const roadPt = new THREE.Vector3();
            safeGetPointAt(this.trackCurve, aheadProgress, roadPt);
            const tan = safeGetTangentAt(this.trackCurve, aheadProgress);
            const flatTan = new THREE.Vector3(tan.x, 0, tan.z).normalize();
            this.lowGroundTangent.copy(flatTan);

            const roadRight = new THREE.Vector3(-flatTan.z, 0, flatTan.x).normalize();
            // Đặt sát mép vạch sơn / vỉa kerb (4.8m so với tim đường)
            const sideSign = (Math.sin(aheadProgress * 300) > 0 ? 1 : -1);
            const sideDist = sideSign * 4.8;

            // Độ cao cực thấp (0.55m) sát sạt mặt đường, lốp xe và vạch sơn
            this.lowGroundStationPos.copy(roadPt)
              .addScaledVector(roadRight, sideDist)
              .addScaledVector(up, 0.55);
          } else {
            const fwd = new THREE.Vector3(rawForward.x, 0, rawForward.z).normalize();
            const rgt = new THREE.Vector3(-fwd.z, 0, fwd.x).normalize();
            this.lowGroundTangent.copy(fwd);
            this.lowGroundStationPos.copy(refPos)
              .addScaledVector(fwd, aheadDist)
              .addScaledVector(rgt, 5.0)
              .addScaledVector(up, 0.55);
          }
          this.hasLowGroundStation = true;
        }

        // Camera đứng yên tại trạm mặt đường
        idealPos.copy(this.lowGroundStationPos);

        // Ống kính lia theo đoàn xe đang lao tới (Race Context: thấy cả đoàn xe và cảnh quan lao vút)
        lookTarget.copy(refPos).addScaledVector(up, 0.65);
        break;
      }

      // 4. Bên Hông Xe: Quay ngang hông xe và các pha so kè bánh xe
      case CameraMode.SIDE_PROFILE: {
        camSmoothSpeed = 0;
        idealPos.copy(carPos).addScaledVector(smoothRight, -4.8).addScaledVector(this.smoothHeading, 0.2).addScaledVector(up, 1.4);
        lookTarget.copy(carPos).addScaledVector(this.smoothHeading, 5.0).addScaledVector(up, 0.85);
        break;
      }

      // 5. Bám Xe Dẫn Đầu & Đoàn Đua: Tự động bám theo xe dẫn đầu với cự ly 28m bao quát đoàn xe
      case CameraMode.LEADER_TRACKING: {
        camSmoothSpeed = 16.0;
        idealPos.copy(trackedPos).addScaledVector(forward, -28.0).addScaledVector(up, 7.5);
        lookTarget.copy(trackedPos).addScaledVector(forward, 18.0).addScaledVector(up, 1.1);
        break;
      }

      // =========================================================================
      // 8. GÓC VƯỢT MẶT (OVERTAKE_ACTION) - BÁM TRỌN BỐI CẢNH SO KÈ & CẢM NHẬN TỐC ĐỘ XE
      // KHÔNG bám vào 1 xe cố định! Khung hình bao quát cả 2 xe đang so kè quyết liệt (kẻ bám đuổi & kẻ dẫn đầu).
      // Vị trí camera linh hoạt theo trục so kè, bắt trọn từng pha lách gió (slipstream dive) và bứt tốc!
      // =========================================================================
      case CameraMode.OVERTAKE_ACTION: {
        camSmoothSpeed = 12.0; // Quán tính mượt mà chuẩn F1 Live Show, tạo cảm giác hai xe lao vun vút so với camera
        const separation = leadDuelCar.group.position.distanceTo(chaseDuelCar.group.position);
        // Khoảng lùi tỉ lệ theo độ tách rời giữa 2 xe, đảm bảo luôn thấy trọn vẹn cả 2 xe và khoảng trống vượt mặt
        const backDist = Math.max(13.0, Math.min(28.0, separation * 0.85 + 11.0));
        // Đặt camera hơi lệch sang phía bên hông (7.2m) và cao hơn mặt đường (2.85m)
        const sideOffset = (Math.sin(this.simulatedTime * 0.45) > 0 ? 1 : -1) * 7.2;
        
        idealPos.copy(duelMidpoint)
          .addScaledVector(duelForward, -backDist)
          .addScaledVector(duelRight, sideOffset)
          .addScaledVector(up, 2.85);

        // Đảm bảo không bị lún xuống dưới dốc hoặc mặt đường
        idealPos.y = Math.max(idealPos.y, duelMidpoint.y + 1.85);

        // Nhìn thẳng vào tâm điểm giữa hai xe, hơi hướng về phía trước xe dẫn đầu 6.5m
        lookTarget.copy(duelMidpoint)
          .addScaledVector(duelForward, 6.5)
          .addScaledVector(up, 0.95);
        break;
      }

      // 9. Va Chạm & Drift: Góc truyền hình cận cảnh theo dõi pha so kè, tuyệt đối không rung lắc
      case CameraMode.COLLISION_DRIFT: {
        camSmoothSpeed = 0;
        const driftOffset = (targetCar.state.isDrifting ? -1 : 1) * 3.5;
        idealPos.copy(carPos).addScaledVector(smoothRight, driftOffset).addScaledVector(this.smoothHeading, -6.5).addScaledVector(up, 2.0);
        lookTarget.copy(carPos).addScaledVector(this.smoothHeading, 6.0).addScaledVector(up, 0.9);
        break;
      }

      // 10. Xoay 360 Vòng (ĐÃ LOẠI BỎ THEO YÊU CẦU -> CHUYỂN VỀ BEHIND CỐ ĐỊNH)
      case CameraMode.CINEMATIC_ORBIT: {
        camSmoothSpeed = 0;
        const dist = 13.0; 
        const height = 2.8; 
        idealPos.copy(carPos).addScaledVector(this.smoothHeading, -dist).addScaledVector(up, height);
        idealPos.y = Math.max(idealPos.y, carPos.y + 1.4);
        lookTarget.copy(carPos).addScaledVector(this.smoothHeading, 22.0).addScaledVector(up, 1.1);
        break;
      }

      // Fallback: Mặc định chuyển về máy quay Telephoto ven đường
      default: {
        camSmoothSpeed = 7.0;
        idealPos.copy(trackedPos).addScaledVector(forward, -10.0).addScaledVector(up, 3.0);
        lookTarget.copy(trackedPos).addScaledVector(forward, 7.0).addScaledVector(up, 0.95);
        break;
      }
    }

    // Camera Smoothing Damping (Quán tính quang học mượt mà)
    if (this.isFirstFrame) {
      this.smoothedCamPos.copy(idealPos);
      this.smoothedLookTarget.copy(lookTarget);
      this.isFirstFrame = false;
    } else {
      const isStationaryTrackside = (
        this.currentMode === CameraMode.TRACKSIDE_TELEPHOTO ||
        this.currentMode === CameraMode.SPECTATOR_TRACKSIDE ||
        this.currentMode === CameraMode.TRACKSIDE_APEX ||
        this.currentMode === CameraMode.PASSING_STATIONARY ||
        this.currentMode === CameraMode.LOW_GROUND ||
        this.currentMode === CameraMode.KERB_CAM_GROUND
      );

      if (isRigidMounted) {
        // CÁC GÓC GẮN TRỰC TIẾP TRÊN XE (HOOD, COCKPIT, BUMPER, FENDER, WING):
        // Khóa trực tiếp 100% vào thân xe theo tọa độ và góc nghiêng cục bộ
        this.smoothedCamPos.copy(idealPos);
        this.smoothedLookTarget.copy(lookTarget);
      } else if (isStationaryTrackside) {
        // Máy quay ven đường & sát mặt đường: Đứng yên hoàn toàn 100% tại trạm, xoay ống kính lia theo đoàn xe chuẩn xác
        this.smoothedCamPos.copy(idealPos);
        this.smoothedLookTarget.lerp(lookTarget, 1.0 - Math.exp(-24.0 * delta));
      } else if (isTightChase) {
        // CÁC GÓC BÁM ĐUÔI VÀ CẬN CẢNH (BEHIND, SIDE_PROFILE, COLLISION_DRIFT, VERTICAL_PORTRAIT):
        // Đồng bộ hóa 100% vị trí máy quay và tâm nhìn để triệt tiêu vĩnh viễn rung giật/co giãn góc nhìn
        this.smoothedCamPos.copy(idealPos);
        this.smoothedLookTarget.copy(lookTarget);
      } else {
        // GÓC XA TRÊN KHÔNG VÀ GÓC SO KÈ VƯỢT MẶT (CHOPPER, DRONE, PANORAMIC, MULTI_CAR_PACK_CHASE, OVERTAKE_ACTION, MULTI_CAR_OVERTAKE):
        // Bay lượn tự do đầm chắc trên cao, góc máy khóa chặt tâm so kè chuẩn truyền hình thực tế F1
        const posSmooth = 1.0 - Math.exp(-12.0 * delta);
        const lookSmooth = 1.0 - Math.exp(-18.0 * delta);
        this.smoothedCamPos.lerp(idealPos, posSmooth);
        this.smoothedLookTarget.lerp(lookTarget, lookSmooth);
      }
    }

    // =========================================================================
    // DYNAMIC FOV & SPEED SENSATION:
    // Tiêu cự chuẩn từng thể loại: 85mm cho Telephoto ven đường, mở rộng xé gió cho Chase
    // =========================================================================
    const speedRatio = Math.min(1.0, currentSpeed / 610);
    let modeBaseFov = this.BASE_FOV;
    let speedFovBoost = Math.pow(speedRatio, 1.1) * 22.0;

    if (this.currentMode === CameraMode.CHOPPER_HELI_CHASE) {
      modeBaseFov = 52.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 10.0;
    } else if (this.currentMode === CameraMode.SKY_DRONE_BROADCAST) {
      modeBaseFov = 68.0; // Góc Drone FPV lướt sát
      speedFovBoost = Math.pow(speedRatio, 1.1) * 16.0;
    } else if (this.currentMode === CameraMode.PANORAMIC) {
      modeBaseFov = 48.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 8.0;
    } else if (this.currentMode === CameraMode.VERTICAL_PORTRAIT_OPTIMIZED) {
      modeBaseFov = 64.0; // Khung hình dọc 9:16 cảm nhận tốc độ lướt
      speedFovBoost = Math.pow(speedRatio, 1.1) * 18.0;
    } else if (this.currentMode === CameraMode.LOW_GROUND || this.currentMode === CameraMode.KERB_CAM_GROUND) {
      modeBaseFov = 66.0; // Sát mặt đường xé gió nhưng bao quát trọn con đường, hai bên lề đường và đoàn xe
      speedFovBoost = Math.pow(speedRatio, 1.1) * 16.0;
    } else if (this.currentMode === CameraMode.MULTI_CAR_OVERTAKE_WIDE) {
      modeBaseFov = 58.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 12.0;
    } else if (this.currentMode === CameraMode.MULTI_CAR_FRONT_FACING) {
      modeBaseFov = 66.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 14.0;
    } else if (this.currentMode === CameraMode.MULTI_CAR_PACK_CHASE) {
      modeBaseFov = 62.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 15.0;
    } else if (this.currentMode === CameraMode.SIDE_CHASE_MULTI) {
      modeBaseFov = 58.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 14.0;
    } else if (this.currentMode === CameraMode.SPECTATOR_TRACKSIDE) {
      const distToCam = this.smoothedCamPos.distanceTo(trackedPos);
      const zoomFactor = THREE.MathUtils.clamp((distToCam - 15.0) / 100.0, 0.0, 1.0);
      modeBaseFov = THREE.MathUtils.lerp(58.0, 22.0, zoomFactor);
      speedFovBoost = Math.pow(speedRatio, 1.2) * 6.0;
    } else if (this.currentMode === CameraMode.BEHIND) {
      // Góc phía sau xe: FOV 65 độ + tăng tới 24 độ khi 600km/h (tổng FOV gần 90 độ), tạo cảm giác warp-speed siêu xe
      modeBaseFov = 65.0; 
      speedFovBoost = Math.pow(speedRatio, 1.1) * 24.0;
    } else if (this.currentMode === CameraMode.COCKPIT_FIRST_PERSON) {
      modeBaseFov = 82.0; // Khoang lái góc rộng
      speedFovBoost = Math.pow(speedRatio, 1.1) * 25.0;
    } else if (this.currentMode === CameraMode.BUMPER_FIRST_PERSON) {
      modeBaseFov = 90.0; // Góc cản trước xé gió siêu tốc
      speedFovBoost = Math.pow(speedRatio, 1.1) * 28.0;
    } else if (this.currentMode === CameraMode.TRACKSIDE_TELEPHOTO) {
      modeBaseFov = 32.0; 
      speedFovBoost = Math.pow(speedRatio, 1.2) * 6.0;
    } else if (this.currentMode === CameraMode.TRACKSIDE_APEX) {
      modeBaseFov = 68.0; 
      speedFovBoost = Math.pow(speedRatio, 1.1) * 18.0;
    } else if (this.currentMode === CameraMode.CINEMATIC_ORBIT) {
      modeBaseFov = 68.0; 
      speedFovBoost = Math.pow(speedRatio, 1.1) * 14.0;
    } else if (this.currentMode === CameraMode.PASSING_STATIONARY) {
      modeBaseFov = 78.0; 
      speedFovBoost = Math.pow(speedRatio, 1.1) * 22.0;
    } else if (this.currentMode === CameraMode.TUNNEL_CEILING_FAST) {
      modeBaseFov = 78.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 18.0;
    } else if (this.currentMode === CameraMode.WING_REAR_LOOK) {
      modeBaseFov = 76.0;
      speedFovBoost = Math.pow(speedRatio, 1.1) * 18.0;
    }

    const targetFov = modeBaseFov + speedFovBoost;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, Math.min(1.0, delta * 6.0));
    this.camera.updateProjectionMatrix();

    // VI CHẤN KHÍ ĐỘNG HỌC TỐC ĐỘ CAO (High-Speed Aerodynamic Vibration & Buffeting)
    // Tăng các thông số khí động học lên 5 lần theo yêu cầu F1 Live Show:
    let finalCamPos = this.smoothedCamPos.clone();

    if (isRigidMounted || isTightChase) {
      // 1. VI CHẤN CẬN CẢNH XE (Buồng lái Cockpit, Nắp Capo, Cản trước Bumper, Sát mặt đường Low Ground, Phía sau Behind)
      // Tần số vi chấn cao (48 - 85Hz), biên độ 5x tái hiện sức ép luồng khí xé gió và rung động cơ V10/V12 gầm rú
      if (currentSpeed > 260) {
        const speedRatio = Math.min(1.0, (currentSpeed - 260) / 360);
        // Tăng thông số biên độ rung lên 5 lần (0.015 - 0.045m)
        const aeroBuffetIntensity = Math.pow(speedRatio, 1.25) * 0.048;
        const aeroFreq1 = this.simulatedTime * 68.0;  // 68 Hz vi chấn khí động
        const aeroFreq2 = this.simulatedTime * 124.0; // 124 Hz rung động cơ cao tần
        // Riêng góc VERTICAL_PORTRAIT_OPTIMIZED: Khóa xe 100% chính giữa màn hình dọc, triệt tiêu rung lắc ngang
        const microBuffetX = (this.currentMode === CameraMode.VERTICAL_PORTRAIT_OPTIMIZED)
          ? 0
          : (Math.sin(aeroFreq1) * 0.65 + Math.sin(aeroFreq2) * 0.35) * aeroBuffetIntensity;
        const microBuffetY = (Math.cos(aeroFreq1 * 1.15) * 0.6 + Math.cos(aeroFreq2 * 0.85) * 0.4) * (aeroBuffetIntensity * 0.6);
        
        // Rung vi chấn dọc theo trục ngang và trục đứng cục bộ của thân xe
        finalCamPos.addScaledVector(right, microBuffetX).addScaledVector(up, microBuffetY);
      }
    } else {
      // 2. RUNG CUỘN GIÓ TRÊN KHÔNG & VEN ĐƯỜNG (Trực thăng Helicam, Flycam Drone, Telephoto ven đường)
      // Tăng thông số chấn động lên 5 lần (từ 0.035 lên 0.175)
      if (currentSpeed > 320) {
        const shakeIntensity = Math.pow((currentSpeed - 320) / 300, 1.4) * 0.165;
        const shakeTime = this.simulatedTime * 38.0;
        const shakeX = (Math.sin(shakeTime * 1.3) + Math.sin(shakeTime * 2.1)) * shakeIntensity;
        const shakeY = (Math.cos(shakeTime * 1.7) + Math.cos(shakeTime * 2.7)) * shakeIntensity * 0.65;
        finalCamPos.addScaledVector(right, shakeX).addScaledVector(up, shakeY);
      }
    }

    // Ổn định đường chân trời Gimbal F1 tuyệt đối:
    // Với góc gắn cứng trên thân xe (Cockpit, Hood, Bumper, Fender, Wing), camera.up nghiêng đồng bộ cùng thân xe
    // Với tất cả các góc quay khác (Chase, Helicopter, Drone, Trackside), camera.up luôn là [0, 1, 0] thẳng đứng
    if (isRigidMounted) {
      const carLocalUp = new THREE.Vector3(0, 1, 0).applyQuaternion(carQuat);
      this.camera.up.copy(carLocalUp);
    } else {
      this.camera.up.set(0, 1, 0);
    }
    this.camera.position.copy(finalCamPos);
    this.camera.lookAt(this.smoothedLookTarget);

    return this.currentMode;
  }

  /**
   * Chuyển đổi góc quay tự động chuẩn xác theo 7 Phong Cách Đạo Diễn Điện Ảnh (DirectorStyle):
   * 1. F1_LIVE_SHOW_50_50: 50% Bao quát (5.0s-7.0s) / 50% Cận cảnh (3.5s-5.0s)
   * 2. HOLLYWOOD_ACTION_THRILLER: 75% Cận cảnh xé gió (2.2s-3.8s) / 25% Toàn cảnh (3.0s-4.2s)
   * 3. SKY_MASTER_AERIAL: 80% Trên không (6.5s-9.5s) / 20% Ven đường (4.5s-6.0s)
   * 4. PURE_COCKPIT_SIM_RACER: 70% POV Buồng lái/Mui/Cản (4.8s-7.5s) / 30% Đuổi sát (4.0s-5.5s)
   * 5. TRACKSIDE_SPECTATOR_TV: 85% Trạm quay tĩnh ven đường & Apex (3.2s-5.5s) / 15% Pack Chase (4.5s-6.0s)
   * 6. TIKTOK_REELS_VIRAL: 70% 9:16 Dọc & Tim đường (2.8s-4.5s) / 30% Hành động viral (2.5s-4.0s)
   * 7. APEX_DUEL_TACTICAL: 80% So kè đối đầu P1-P3 (2.8s-5.0s) / 20% Đuổi sát (3.5s-5.0s)
   */
  private cycleNextCinematicMode() {
    let chosenPool: CameraMode[];
    let nextDuration: number;

    switch (this.directorStyle) {
      case DirectorStyle.HOLLYWOOD_ACTION_THRILLER: {
        // 75% Cận cảnh xé gió & 25% Toàn cảnh chớp nhoáng
        if (Math.random() < 0.75) {
          chosenPool = CameraDirector.HOLLYWOOD_CLOSEUP;
          nextDuration = 2.2 + Math.random() * 1.6;
        } else {
          chosenPool = CameraDirector.HOLLYWOOD_WIDE;
          nextDuration = 3.0 + Math.random() * 1.2;
        }
        break;
      }

      case DirectorStyle.SKY_MASTER_AERIAL: {
        // 80% Trực thăng & Drone toàn cảnh trên không & 20% Ven đường
        if (Math.random() < 0.80) {
          chosenPool = CameraDirector.SKY_MASTER_AIR;
          nextDuration = 6.5 + Math.random() * 3.0;
        } else {
          chosenPool = CameraDirector.SKY_MASTER_GROUND;
          nextDuration = 4.5 + Math.random() * 1.5;
        }
        break;
      }

      case DirectorStyle.PURE_COCKPIT_SIM_RACER: {
        // 70% POV Buồng lái & 30% Bám đuổi
        if (Math.random() < 0.70) {
          chosenPool = CameraDirector.COCKPIT_SIM_POV;
          nextDuration = 4.8 + Math.random() * 2.7;
        } else {
          chosenPool = CameraDirector.COCKPIT_SIM_CHASE;
          nextDuration = 4.0 + Math.random() * 1.5;
        }
        break;
      }

      case DirectorStyle.TRACKSIDE_SPECTATOR_TV: {
        // 85% Trạm quay tĩnh ven đường & 15% Pack Chase
        if (Math.random() < 0.85) {
          chosenPool = CameraDirector.TRACKSIDE_STATION_MODES;
          nextDuration = 3.2 + Math.random() * 2.3;
        } else {
          chosenPool = CameraDirector.TRACKSIDE_CHASE_MODES;
          nextDuration = 4.5 + Math.random() * 1.5;
        }
        break;
      }

      case DirectorStyle.TIKTOK_REELS_VIRAL: {
        // 70% 9:16 Dọc & Tim đường & 30% Hành động viral
        if (Math.random() < 0.70) {
          chosenPool = CameraDirector.TIKTOK_PORTRAIT_MODES;
          nextDuration = 2.8 + Math.random() * 1.7;
        } else {
          chosenPool = CameraDirector.TIKTOK_VIRAL_ACTION;
          nextDuration = 2.5 + Math.random() * 1.5;
        }
        break;
      }

      case DirectorStyle.APEX_DUEL_TACTICAL: {
        // 80% So kè đối đầu P1-P3 & 20% Đuổi sát
        if (Math.random() < 0.80) {
          chosenPool = CameraDirector.APEX_DUEL_MODES;
          nextDuration = 2.8 + Math.random() * 2.2;
        } else {
          chosenPool = CameraDirector.APEX_DUEL_CHASE;
          nextDuration = 3.5 + Math.random() * 1.5;
        }
        break;
      }

      case DirectorStyle.F1_LIVE_SHOW_50_50:
      default: {
        // Chuẩn phát sóng Live Show F1 50/50:
        // 50% Góc truyền hình bao quát nhiều xe (5.0s - 7.0s)
        // 50% Góc điện ảnh điểm xuyết (3.5s - 5.0s)
        if (Math.random() < 0.50) {
          chosenPool = CameraDirector.F1_BROADCAST_50;
          nextDuration = 5.0 + Math.random() * 2.0;
        } else {
          chosenPool = CameraDirector.F1_CINEMATIC_50;
          nextDuration = 3.5 + Math.random() * 1.5;
        }
        break;
      }
    }

    // Triệt tiêu hoàn toàn góc quay 360 độ và góc chắn bùn theo yêu cầu người dùng
    const sanitizedPool = chosenPool.filter(m => m !== CameraMode.CINEMATIC_ORBIT && m !== CameraMode.FENDER_WHEEL_LOOK);
    const available = sanitizedPool.filter(m => m !== this.currentMode);
    if (available.length > 0) {
      this.currentMode = available[Math.floor(Math.random() * available.length)];
    } else {
      this.currentMode = sanitizedPool[Math.floor(Math.random() * sanitizedPool.length)] || CameraMode.BEHIND;
    }
    this.nextSwitchTime = nextDuration;
    this.isFirstFrame = true; // Cắt góc chuẩn truyền hình F1 Live Show tức thì, không lia giật
  }
}
