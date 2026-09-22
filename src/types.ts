/**
 * Racing Video Factory & 3D High-End Simulator - Type Definitions
 */
export type ResolutionPreset = '1080x1920 (Full HD Dọc)' | '720x1280 (HD Dọc)' | '1440x2560 (2K Dọc)' | '2160x3840 (4K Dọc)' | '1080p (Ngang)' | '720p' | '4K';
export type AspectRatioOption = '9:16' | '16:9';
export type VideoFileFormat = 'mp4' | 'mov' | 'webm';
export type FPSOption = 30 | 60 | 120;
export type VideoDurationPreset = 30 | 60 | 70 | 120 | number;

/**
 * 7 Chế Độ Đạo Diễn Điện Ảnh Camera (AI Camera Director Profiles)
 * Phân bổ luân phiên hoặc ngẫu nhiên độc lập cho từng luồng đua
 */
export enum DirectorStyle {
  F1_LIVE_SHOW_50_50 = 'F1_LIVE_SHOW_50_50',               // 1. Chuẩn F1 Live Show 50/50 (Bao quát 50% / Cận cảnh 50%)
  HOLLYWOOD_ACTION_THRILLER = 'HOLLYWOOD_ACTION_THRILLER', // 2. Điện ảnh Bom tấn Hành động (75% Cận cảnh xé gió, cắt nhanh 2.2-4.0s)
  SKY_MASTER_AERIAL = 'SKY_MASTER_AERIAL',                 // 3. Trực thăng & Flycam Không trung (80% Trực thăng & Drone toàn cảnh)
  PURE_COCKPIT_SIM_RACER = 'PURE_COCKPIT_SIM_RACER',       // 4. Góc Lái Thứ Nhất & Buồng Lái Sim-Racer (70% POV Cockpit/Hood)
  TRACKSIDE_SPECTATOR_TV = 'TRACKSIDE_SPECTATOR_TV',       // 5. Trạm Quay Ven Đường & Khán Đài F1 (85% Telephoto 85mm & Apex)
  TIKTOK_REELS_VIRAL = 'TIKTOK_REELS_VIRAL',               // 6. Xu Hướng Video Ngắn Siêu Tốc (Khung hình dọc 9:16 & Tim đường)
  APEX_DUEL_TACTICAL = 'APEX_DUEL_TACTICAL',               // 7. Đại Chiến So Kè & Săn Đuổi Vượt Mặt (80% Bám sát đối đầu P1-P2-P3)
}

export interface DirectorStyleInfo {
  id: DirectorStyle;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  badgeColor: string;
  badge: string;
  ratioDesc: string;
  tempoDesc: string;
  modesHighlight: string;
}

export const DIRECTOR_STYLE_LIST: DirectorStyleInfo[] = [
  {
    id: DirectorStyle.F1_LIVE_SHOW_50_50,
    name: 'F1 Live Show 50/50',
    shortName: 'F1 Live 50/50',
    tagline: 'Cân bằng 50% Bao quát & 50% Cận cảnh',
    description: 'Chuẩn phát sóng trực tiếp Grand Prix F1 với nhịp cắt 4.8s-6.8s, gyro-damping 2.4 và bắt trọn toàn bộ đoàn xe.',
    badgeColor: 'text-cyan-400 bg-cyan-950/70 border-cyan-500/40',
    badge: '🎬',
    ratioDesc: '50% Toàn cảnh / 50% Cận cảnh',
    tempoDesc: 'Nhịp cắt 4.8s - 6.8s',
    modesHighlight: 'Đoàn xe 100m, Trực thăng, Telephoto 85mm, Bám đuôi P1-P3, Mui xe'
  },
  {
    id: DirectorStyle.HOLLYWOOD_ACTION_THRILLER,
    name: 'Hollywood Action Thriller',
    shortName: 'Bom Tấn Action',
    tagline: '75% Cận cảnh xé gió & nhịp cắt 2.2s-4.0s dồn dập',
    description: 'Phong cách bom tấn Fast & Furious / Mad Max: góc gầm xe, cản trước xé gió, kẹp bánh xe và rung chấn tăng tốc.',
    badgeColor: 'text-amber-400 bg-amber-950/70 border-amber-500/40',
    badge: '🔥',
    ratioDesc: '75% Cận cảnh / 25% Toàn cảnh',
    tempoDesc: 'Nhịp cắt dồn dập 2.2s - 4.0s',
    modesHighlight: 'Sát mặt đường, Cản trước siêu tốc, Bánh xe Drift, Vượt mặt, Gầm xe'
  },
  {
    id: DirectorStyle.SKY_MASTER_AERIAL,
    name: 'Sky Master Aerial Drone',
    shortName: 'Trực Thăng & Drone',
    tagline: '80% Trực thăng & Flycam lướt êm 6.5s-9.5s',
    description: 'Bao quát toàn cảnh sa bàn trường đua, bắt trọn 15 siêu xe uốn lượn qua các khúc cua hiểm trở từ độ cao 35m-60m.',
    badgeColor: 'text-sky-400 bg-sky-950/70 border-sky-500/40',
    badge: '🚁',
    ratioDesc: '80% Không trung / 20% Mặt đất',
    tempoDesc: 'Lướt êm dịu 6.5s - 9.5s',
    modesHighlight: 'Trực thăng Live Show, Drone Flycam, Toàn cảnh trường đua, Đài cao'
  },
  {
    id: DirectorStyle.PURE_COCKPIT_SIM_RACER,
    name: 'Pure Cockpit Sim-Racer POV',
    shortName: 'Buồng Lái POV',
    tagline: '70% Góc nhìn thứ nhất sau vô lăng F1 & Hypercar',
    description: 'Trải nghiệm chân thực của tay đua: trực diện kính chắn gió, bảng đồng hồ vòng tua máy, gương chiếu hậu và lực bẻ cua.',
    badgeColor: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/40',
    badge: '🏎️',
    ratioDesc: '70% Buồng lái / 30% Đuổi sát',
    tempoDesc: 'Nhịp cắt ổn định 4.5s - 7.5s',
    modesHighlight: 'Góc lái cabin F1, Nắp mui xe Hood, Đón đầu xe, Cản trước'
  },
  {
    id: DirectorStyle.TRACKSIDE_SPECTATOR_TV,
    name: 'Trackside Grandstand TV',
    shortName: 'Ven Đường & Khán Đài',
    tagline: '85% Ống kính Tele 85mm ven rào chắn & đỉnh Apex',
    description: 'Tái hiện chân thực cảm giác đứng sát mép hàng rào bê tông nghe tiếng xé gió Doppler vút qua mặt ở vận tốc 500 km/h.',
    badgeColor: 'text-purple-400 bg-purple-950/70 border-purple-500/40',
    badge: '🏁',
    ratioDesc: '85% Ven đường / 15% Đuổi theo',
    tempoDesc: 'Nhịp cắt đón xe 3.2s - 5.5s',
    modesHighlight: 'Telephoto 85mm, Trạm quay đỉnh cua Apex, Gờ giảm tốc âm vỉa, Đài cao'
  },
  {
    id: DirectorStyle.TIKTOK_REELS_VIRAL,
    name: 'TikTok & Reels Viral Speed',
    shortName: 'TikTok 9:16 Viral',
    tagline: 'Khung hình dọc siêu tốc, bắt trọn khói drift & nitro',
    description: 'Tối ưu hóa chuyên biệt cho video ngắn 9:16 với tỷ lệ vàng 1/3, nhịp cắt 3.0s-4.8s ăn khớp beat nhạc tốc độ.',
    badgeColor: 'text-rose-400 bg-rose-950/70 border-rose-500/40',
    badge: '📱',
    ratioDesc: '70% Dọc 9:16 / 30% Action',
    tempoDesc: 'Nhịp cắt theo beat 3.0s - 4.8s',
    modesHighlight: 'Sát mặt đường tim vạch, Đón đầu đoàn xe, Khói Drift, Đuôi xe 100m'
  },
  {
    id: DirectorStyle.APEX_DUEL_TACTICAL,
    name: 'Apex Duel & Dogfight Chase',
    shortName: 'Đại Chiến So Kè P1-P3',
    tagline: '80% Bám sát đối đầu tay đôi & ép cua vượt mặt',
    description: 'AI tự động khóa chặt vào cặp kỳ phùng địch thủ đang so kè sát nút dưới 8m, bắt từng cú slipstream và vẩy đuôi vượt mặt.',
    badgeColor: 'text-red-400 bg-red-950/70 border-red-500/40',
    badge: '⚔️',
    ratioDesc: '80% So kè P1-P3 / 20% Toàn cảnh',
    tempoDesc: 'Nhịp cắt linh hoạt 3.5s - 5.8s',
    modesHighlight: 'Góc so kè vượt mặt, Bám sát xe dẫn đầu, Bên hông xe, Va chạm & Drift'
  }
];

export enum CameraMode {
  // === CÁC GÓC QUAY TRUYỀN HÌNH TẬP TRUNG VÀO XE & NHIỀU XE ĐUA ===
  TRACKSIDE_TELEPHOTO = 'TRACKSIDE_TELEPHOTO', // 1. Telephoto ven đường lia theo đoàn xe (85mm F1)
  PANORAMIC = 'PANORAMIC', // 2. Toàn Cảnh Trường Đua (Đài cao bao quát toàn cảnh khúc cua & nhiều xe đua)
  CHOPPER_HELI_CHASE = 'CHOPPER_HELI_CHASE', // 3. Trực Thăng Truyền Hình (Helicam trên không quay Live show)
  SKY_DRONE_BROADCAST = 'SKY_DRONE_BROADCAST', // 4. Racing Drone / Flycam (Flycam bám sát xé gió)
  MULTI_CAR_FRONT_FACING = 'MULTI_CAR_FRONT_FACING', // 5. Đón đầu nhiều xe đua (Góc phía trước quay trực diện xe đang lao tới)
  MULTI_CAR_OVERTAKE_WIDE = 'MULTI_CAR_OVERTAKE_WIDE', // 6. Toàn cảnh so kè nhiều xe (Bao quát pha vượt mặt của các xe)
  TRACKSIDE_APEX = 'TRACKSIDE_APEX', // 7. Trạm quay đỉnh góc cua Apex đón xe
  MULTI_CAR_PACK_CHASE = 'MULTI_CAR_PACK_CHASE', // 8. Bám đuôi đoàn xe 100m (Bao quát toàn bộ dàn xe đua phía trước)
  PIT_WALL_BROADCAST = 'PIT_WALL_BROADCAST', // 9. Vách kỹ thuật Pit Wall lia theo xe
  PASSING_STATIONARY = 'PASSING_STATIONARY', // 10. Trạm quay tĩnh ven rào chắn xé gió
  VERTICAL_PORTRAIT_OPTIMIZED = 'VERTICAL_PORTRAIT_OPTIMIZED', // 11. Khung hình dọc 9:16 truyền hình
  SPECTATOR_TRACKSIDE = 'SPECTATOR_TRACKSIDE', // 12. Góc quay người đứng ven đường (Đứng yên lia theo xe)
  SIDE_CHASE_MULTI = 'SIDE_CHASE_MULTI', // 13. Hông xa so kè nhiều xe đua
  TUNNEL_CEILING_FAST = 'TUNNEL_CEILING_FAST', // 14. Camera trần hầm hắt xuống siêu tốc
  FENDER_WHEEL_LOOK = 'FENDER_WHEEL_LOOK', // 15. Camera chắn bùn nhìn lốp và hông xe
  WING_REAR_LOOK = 'WING_REAR_LOOK', // 16. Đuôi gió nhìn ngược về trước qua nóc xe
  KERB_CAM_GROUND = 'KERB_CAM_GROUND', // 17. Camera âm vỉa gờ giảm tốc hất lên gầm xe

  // === CÁC GÓC QUAY CINEMATIC TẬP TRUNG VÀO XE ===
  BEHIND = 'BEHIND', // 1. Phía Sau Xe Xa 100m (Bao quát xe đua và các đối thủ phía trước)
  HOOD = 'HOOD', // 2. Mui Xe / Cockpit (Góc nhìn thấp từ nắp capo nhìn thẳng đường đua)
  LOW_GROUND = 'LOW_GROUND', // 3. Sát Mặt Đường (Góc siêu thấp sát lốp và hệ thống giảm xóc)
  SIDE_PROFILE = 'SIDE_PROFILE', // 4. Bên Hông Xe (Quay ngang hông xe và các pha so kè bánh xe)
  LEADER_TRACKING = 'LEADER_TRACKING', // 5. Bám Xe Dẫn Đầu & Đoàn Đua
  OVERTAKE_ACTION = 'OVERTAKE_ACTION', // 6. Góc Vượt Mặt (Cận cảnh hành động khi xe lách qua đối thủ)
  COLLISION_DRIFT = 'COLLISION_DRIFT', // 7. Va Chạm & Drift (Bắt khoảnh khắc trượt bánh, bốc khói và va chạm)
  CINEMATIC_ORBIT = 'CINEMATIC_ORBIT', // 8. Xoay 360 Vòng quanh xe
  COCKPIT_FIRST_PERSON = 'COCKPIT_FIRST_PERSON', // 9. Góc Lái Thứ Nhất (Trực tiếp trong cabin lái, tốc độ cực cao)
  BUMPER_FIRST_PERSON = 'BUMPER_FIRST_PERSON', // 10. Góc Cản Trước Siêu Tốc (Gần sát đường, FOV xé gió)

  // Legacy compatibility aliases
  GRANDSTAND_PANORAMIC = 'PANORAMIC',
  FLYCAM = 'SKY_DRONE_BROADCAST',
  HELIPAD_ZOOM = 'CHOPPER_HELI_CHASE',
  SATELLITE_ORBIT = 'PANORAMIC',
}

export type WeatherType =
  | 'Sunny'
  | 'Sunset'
  | 'HeavyRain'
  | 'NeonNight'
  | 'DenseFog'
  | 'Thunderstorm'
  | 'SnowBlizzard'
  | 'Sandstorm'
  | 'MidnightFullMoon'
  | 'AuroraBorealis'
  | 'VolcanicAsh'
  | 'BloodMoon'
  | 'ToxicHaze'
  | 'HeatwaveMirage'
  | 'SunriseDawn'
  | 'AutumnDrizzle'
  | 'TropicalMonsoon'
  | 'SolarEclipse'
  | 'StarlightGalaxy'
  | 'VaporwaveDusk'
  | 'CrystalRain'
  | 'OvercastGloom'
  | 'DustDevil'
  | 'PolarTwilight'
  | 'OceanBreeze'
  // Legacy support
  | 'Overcast'
  | 'Night'
  | 'Neon';

export type RoadLayoutType =
  | 'GRAND_PRIX_OVAL'
  | 'FIGURE_EIGHT_BRIDGE'
  | 'MOUNTAIN_HAIRPIN_PASS'
  | 'AIRPORT_RUNWAY_DRAG'
  | 'COASTAL_CLIFF_HIGHWAY'
  | 'CITY_GRID_INTERSECTION'
  | 'SUZUKA_TECHNICAL_S'
  | 'MONZA_TEMPLE_OF_SPEED'
  | 'DESERT_CANYON_DUNES'
  | 'NURBURGRING_ROLLER_COASTER'
  | 'TOKYO_EXPRESSWAY_RING'
  | 'FOREST_RIVER_MEANDER'
  | 'HARBOR_DOCK_CIRCUIT'
  | 'ALPINE_SUMMIT_SPIRAL'
  | 'FUTURISTIC_HYPERLOOP'
  | 'VOLCANO_CALDERA_RIM'
  | 'AIRPORT_HANGAR_CHICANE'
  | 'ISLAND_BRIDGE_CROSSING'
  | 'NEON_TUNNEL_METRO'
  | 'STADIUM_SUPERCROSS'
  | 'SILVERSTONE_MAGGOTTS_BECKETTS'
  | 'SPA_EAU_ROUGE_RAIDILLON'
  | 'MONACO_CASINO_HAIRPIN'
  | 'LE_MANS_MULSANNE_CHICANES'
  | 'CYBER_OCTAGON_VELODROME'
  | 'DRAGON_BACK_RIDGELINE'
  | 'INFINITY_LOOP_EXPRESS'
  | 'DELTA_WING_TRIANGLE'
  | 'CLOVERLEAF_INTERCHANGE'
  | 'CRESCENT_MOON_BAY'
  | 'VIPER_FANG_CHICANE'
  | 'LABYRINTH_METROPOLIS'
  | 'TORNADO_VORTEX_FUNNEL'
  | 'TWIN_SUMMITS_VALLEY'
  | 'AURORA_FJORD_SERPENTINE'
  | 'NEO_SHANGHAI_SKYWAY'
  | string;

export interface TrackBiome {
  id: string;
  name: string;
  skyColor: number;
  groundColor: number;
  trackColor: number;
  kerbColor1: number;
  kerbColor2: number;
  fogColor: number;
  fogDensity: number;
  lightIntensity: number;
  ambientColor: number;
  theme: string;
  roadLayoutType?: RoadLayoutType;
  // 100 Kiểu vạch đường, mặt đường và chi tiết độc nhất
  centerLineColor?: number;
  centerLineWidth?: number;
  centerLineLength?: number;
  centerLinePattern?: 'single' | 'double' | 'strobe' | 'pulse' | 'arrows' | 'triple' | 'dashed_yellow' | 'neon_glow';
  edgeLineColor?: number;
  edgeLinePattern?: 'solid_white' | 'hazard_yellow' | 'neon_cyan' | 'double_edge';
  roadTextureType?: 'asphalt_dark' | 'tarmac_grey' | 'wet_reflection' | 'red_f1' | 'desert_clay' | 'cyber_midnight' | 'alpine_ice';
  lampColor?: number;
  lampPoleType?: 'curved_arch' | 'double_cantilever' | 'stadium_floodlight' | 'minimalist_l' | 'industrial_truss' | 'cyber_disc';
  poleColor?: number;
  bollardReflectorColor?: number;
  bollardBodyColor?: number;
  archColor?: number;
  curbFrequency?: number;
  highlightDecorations?: string[];
}

export interface AICarState {
  id: string;
  name: string;
  driverName?: string; // Tên nhân vật / tài xế lái xe
  color: string;
  hexColor: number;
  type: 'hypercar' | 'muscle' | 'formula' | 'gt_racer' | 'cyber_coupe';
  speed: number;
  targetSpeed: number;
  maxSpeed: number;
  acceleration: number;
  lap: number;
  lapProgress: number; // 0 to 1 along track
  lateralOffset: number; // offset from track center line (-1.0 to 1.0)
  targetLateralOffset: number;
  steerAngle: number;
  rank: number;
  aggression: number;
  isDrifting: boolean;
  driftAngle: number;
  collisionCooldown: number;
  meshIndex: number;
  inTunnel?: boolean;
  laneChangeTimer?: number;
  nitroBoostTimer?: number;
  nitroCooldown?: number;
  attackPhaseTimer?: number;
  isHyperBoosting?: boolean;
  overtakePullAwayDist?: number; // Quãng đường bứt phá vượt mặt lên phía trước (đạt cự ly bứt xa 300 - 500m)
  targetPullAwayGoal?: number; // Mục tiêu bứt xa 300 - 500 mét trước khi hạ nhiệt
  cooldownTimer?: number; // Giai đoạn hạ nhiệt/giảm tốc độ xuống 400-450 km/h để xe sau vượt
  baseCruiseSpeed?: number; // Tốc độ hành trình riêng biệt từng xe quanh mốc 500 km/h
  assignedLaneIndex?: number;
  rpm?: number;
  throttle?: number;
  isBraking?: boolean;
}

export interface InstanceSeedData {
  seed: number;
  instanceId: number;
  biome: TrackBiome;
  weather: WeatherType;
  roadLayout: RoadLayoutType;
  carCount: number;
  cars: AICarState[];
  aiAggressionBase: number;
  directorStyle?: DirectorStyle;
  createdAt: string;
}

export interface InstanceRuntime {
  id: number;
  name: string;
  active: boolean;
  seedData: InstanceSeedData;
  currentCameraMode: CameraMode;
  directorStyle: DirectorStyle;
  directorStyleName: string;
  cameraDwellTimer: number;
  cameraNextSwitchDuration: number;
  targetCarId: string;
  cars: AICarState[];
  lapLeaderId: string;
  isRecording: boolean;
  currentVideoChunkIndex: number;
  chunkTimeElapsed: number; // seconds into current 2-minute cycle
  totalChunkDuration: number; // 120 seconds default
  fps: number;
  status: 'idle' | 'rendering' | 'exporting' | 'recovering';
  isCameraLocked?: boolean;
  errorMessage?: string;
  inTunnel?: boolean;
  lastViewport?: { x: number; y: number; w: number; h: number };
}

export interface VideoRecordJob {
  id: string;
  instanceId: number;
  videoNumber: number;
  fileName: string;
  url: string;
  blob?: Blob;
  sizeMB: number;
  durationSeconds: number;
  timestamp: string;
  seed: number;
  biomeName: string;
  winnerCar: string;
  topSpeedKmh: number;
  resolution: ResolutionPreset;
  fps: number;
  status?: 'processing' | 'ready' | 'failed';
  progressPercent?: number;
}

export interface SystemConfig {
  instanceCount: 1 | 2 | 4 | 6 | 8 | 10;
  resolution: ResolutionPreset;
  aspectRatio: AspectRatioOption;
  fileFormat: VideoFileFormat;
  fps: FPSOption;
  carsPerRace?: 0 | 6 | 15 | 60 | number; // Số lượng xe đua: 0 = Random ngẫu nhiên, hoặc 6, 15, 60 tay đua
  durationSeconds: number; // 120 for 2 mins
  saveDirectory: string;
  autoExportToDisk: boolean;
  autoDownloadToDevice?: boolean; // Tự động tải video xuống máy tính ngay khi hoàn thành
  codec: 'video/webm;codecs=vp9' | 'video/mp4;codecs=avc1' | 'video/webm';
  aiAggressionGlobal: number; // 0.2 - 1.0
  cinematicAutoDirector: boolean;
}

export interface SystemHardwareStats {
  engineFPS: number;
  cpuUsagePct: number;
  gpuUsagePct: number;
  ramUsageMB: number;
  ramTotalMB: number;
  diskFreeGB: number;
  totalVideosCreated: number;
  systemUptimeSeconds: number;
}

export interface LogMessage {
  id: string;
  timestamp: string;
  instanceId?: number;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}
