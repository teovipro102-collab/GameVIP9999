import * as THREE from 'three';

/**
 * Hệ thống sinh tọa độ đường đua 3D cho 36 trường đua độc bản.
 * Quy mô siêu trường siêu trọng (~32,000m - 42,000m), thời lượng đua liên tục không lặp lại.
 * TRIỆT TIÊU 100% GÓC VUÔNG 90 ĐỘ HOẶC KHÚC CUA GẤP KHÚC.
 * Mọi cung đường đều được xây dựng từ các chuỗi hàm sóng điều hòa Fourier liên tục (C^infinity),
 * đảm bảo đường cong luôn uốn lượn mềm mại, khí động học như dải lụa chuẩn Formula 1 thế giới.
 */
export function generatePointsForLayout(layout: string, seed: number = 42): THREE.Vector3[] {
  let s = Math.abs(seed) || 42;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };

  const points: THREE.Vector3[] = [];
  const scale = 1400;
  // Mật độ điểm cao (60 điểm) giúp đường cong Catmull-Rom đạt độ tròn trịa tuyệt đối
  const numPts = 60;
  const seedPhase = (s % 360) * (Math.PI / 180);

  switch (layout) {
    // 1. Grand Prix Oval Siêu Tốc
    case 'GRAND_PRIX_OVAL': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const seedMod = 1.0 + Math.sin(t * 2 + seedPhase) * 0.05;
        const x = (Math.cos(t) * scale * 1.85 + Math.sin(t * 2) * 140) * seedMod;
        const z = Math.sin(t) * scale * 1.05 * seedMod;
        const y = Math.sin(t * 2) * 5.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 2. Monza Temple of Speed (Vòng đua tốc độ cao với khúc cua Parabolica uốn lượn mượt mà)
    case 'MONZA_TEMPLE_OF_SPEED': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const seedMod = 1.0 + Math.sin(t + seedPhase) * 0.05;
        const x = (Math.cos(t) * scale * 1.85 + Math.sin(t) * scale * 0.35) * seedMod;
        const z = (Math.sin(t) * scale * 0.95 + Math.cos(t * 2) * 180) * seedMod;
        const y = Math.sin(t) * 5.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 3. Cầu Vượt Số 8 Figure-8 (Giao thoa 3D đa tầng uyển chuyển)
    case 'FIGURE_EIGHT_BRIDGE': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const seedMod = 1.0 + Math.sin(t * 2 + seedPhase) * 0.05;
        const x = Math.sin(t) * scale * 1.65 * seedMod;
        const z = Math.sin(t * 2) * scale * 1.15 * seedMod;
        const y = (Math.sin(t) * 0.5 + 0.5) * 18.0 + 5.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 4. Đèo Núi Khúc Cua Chữ U Touge (Cua tay áo bo tròn khí động học)
    case 'MOUNTAIN_HAIRPIN_PASS': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.2 + 0.35 * Math.sin(3 * t));
        const x = Math.cos(t) * r * 1.25;
        const z = Math.sin(t) * r * 1.1;
        const y = Math.sin(t * 2) * 12.0 + Math.cos(t * 3) * 6.0 + 15.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 5. Sân Bay Quân Sự Runway Drag (Đường băng uốn lượn hai đầu bán nguyệt mượt mà)
    case 'AIRPORT_RUNWAY_DRAG': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 2.15;
        const z = Math.sin(t) * scale * 0.75 + Math.sin(t * 2) * 120;
        const y = Math.sin(t * 2) * 3.0 + 7.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 6. Cao Tốc Vách Đá Ven Biển (Sóng biển nhấp nhô uốn lượn mềm mại)
    case 'COASTAL_CLIFF_HIGHWAY': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 1.55 + Math.sin(t * 3) * 240;
        const z = Math.sin(t) * scale * 1.2 + Math.cos(t * 2) * 200;
        const y = Math.sin(t) * 8.0 + Math.cos(t * 2) * 4.0 + 10.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 7. Đường Vành Đai Tokyo Shuto Ring
    case 'TOKYO_EXPRESSWAY_RING': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.3 + 0.2 * Math.sin(t * 4));
        const x = Math.cos(t) * r * 1.3;
        const z = Math.sin(t) * r * 1.1;
        const y = Math.sin(t * 2) * 6.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 8. Suzuka Kỹ Thuật Chữ S Liên Hoàn (Sinuous S-Curves)
    case 'SUZUKA_TECHNICAL_S': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.sin(t) * scale * 1.5 + Math.sin(t * 3) * 260;
        const z = Math.cos(t) * scale * 1.15 + Math.sin(t * 2) * 200;
        const y = Math.sin(t * 2) * 7.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 9. Hẻm Núi Sa Mạc Cát Đỏ (Cồn cát uốn lượn)
    case 'DESERT_CANYON_DUNES': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.35 + 0.28 * Math.sin(t * 3));
        const x = Math.cos(t) * r * 1.3;
        const z = Math.sin(t) * r * 1.15;
        const y = Math.sin(t * 3) * 10.0 + 10.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 10. Nurburgring Tàu Lượn Siêu Tốc (Cung dốc nhấp nhô lượn sóng)
    case 'NURBURGRING_ROLLER_COASTER': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.25 + 0.32 * Math.sin(t * 2) + 0.16 * Math.cos(t * 4));
        const x = Math.cos(t) * r * 1.35;
        const z = Math.sin(t) * r * 1.15;
        const y = Math.sin(t * 3) * 14.0 + Math.cos(t * 2) * 8.0 + 16.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 11. Đô Thị Phồn Hoa Marina Bay (Vòng phố F1 uốn lượn quanh đại lộ, triệt tiêu góc vuông 90 độ)
    case 'CITY_GRID_INTERSECTION': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.35 + 0.22 * Math.sin(t * 2) + 0.12 * Math.cos(t * 4));
        const x = Math.cos(t) * r * 1.35;
        const z = Math.sin(t) * r * 1.15;
        const y = Math.sin(t * 3) * 6.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 12. Khúc Quanh Sông Rừng Xanh (Dòng sông uốn khúc tự nhiên)
    case 'FOREST_RIVER_MEANDER': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.25 + 0.32 * Math.sin(t * 3));
        const x = Math.sin(t) * r * 1.35;
        const z = Math.cos(t) * scale * 1.15 + Math.sin(t * 2) * 220;
        const y = Math.sin(t * 2) * 6.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 13. Cảng Biển Vận Tải Quốc Tế
    case 'HARBOR_DOCK_CIRCUIT': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 1.65 + Math.sin(t * 2) * 200;
        const z = Math.sin(t) * scale * 1.1 + Math.cos(t * 3) * 160;
        const y = Math.sin(t) * 4.0 + 6.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 14. Xoắn Ốc Đỉnh Núi Tuyết Alpine
    case 'ALPINE_SUMMIT_SPIRAL': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.2 + 0.28 * Math.cos(t * 3));
        const x = Math.cos(t) * r * 1.25;
        const z = Math.sin(t) * r * 1.2;
        const y = Math.sin(t) * 16.0 + 14.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 15. Hyperloop Tương Lai 2099
    case 'FUTURISTIC_HYPERLOOP': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 1.7 + Math.sin(t * 2) * 180;
        const z = Math.sin(t) * scale * 1.15 + Math.cos(t * 2) * 150;
        const y = Math.sin(t * 2) * 9.0 + 10.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 16. Miệng Núi Lửa Magma Rực Lửa (Vành đai miệng núi mềm mại)
    case 'VOLCANO_CALDERA_RIM': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.3 + 0.15 * Math.sin(t * 4));
        const x = Math.cos(t) * r * 1.25;
        const z = Math.sin(t) * r * 1.25;
        const y = (Math.cos(t * 2) * 0.5 + 0.5) * 14.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 17. Vòng Xoay Nhà Ga Máy Bay
    case 'AIRPORT_HANGAR_CHICANE': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.sin(t) * scale * 1.6 + Math.cos(t * 3) * 160;
        const z = Math.cos(t) * scale * 1.1 + Math.sin(t * 2) * 140;
        const y = Math.sin(t * 2) * 5.0 + 7.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 18. Cầu Vượt Biển Nối Đảo Ngọc
    case 'ISLAND_BRIDGE_CROSSING': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 1.9 + Math.sin(t * 2) * 160;
        const z = Math.sin(t) * scale * 0.95;
        const y = (Math.sin(t * 2) * 0.5 + 0.5) * 12.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 19. Đường Hầm Tàu Điện Ngầm Neon
    case 'NEON_TUNNEL_METRO': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 1.5 + Math.sin(t * 2) * 200;
        const z = Math.sin(t) * scale * 1.3;
        const y = Math.sin(t * 3) * 6.0 + 7.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 20. Sân Vận Động Supercross
    case 'STADIUM_SUPERCROSS': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.2 + 0.22 * Math.sin(t * 3));
        const x = Math.sin(t) * r * 1.35;
        const z = Math.cos(t) * r * 1.1;
        const y = Math.sin(t * 3) * 7.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 21. Silverstone Maggotts & Becketts (Chuỗi cua uốn lượn liên hoàn)
    case 'SILVERSTONE_MAGGOTTS_BECKETTS': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.sin(t) * scale * 1.65 + Math.sin(t * 3) * 240;
        const z = Math.cos(t) * scale * 1.15 + Math.sin(t * 2) * 180;
        const y = Math.sin(t * 2) * 6.0 + 7.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 22. Spa Eau Rouge & Raidillon (Dốc đứng đổ cua mượt mà)
    case 'SPA_EAU_ROUGE_RAIDILLON': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 1.6 + Math.sin(t * 2) * 200;
        const z = Math.sin(t) * scale * 1.2;
        const y = Math.sin(t) * 15.0 + Math.cos(t * 2) * 7.0 + 14.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 23. Monaco Casino & Fairmont Hairpin (Cua bo tròn bán nguyệt)
    case 'MONACO_CASINO_HAIRPIN': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.2 + 0.32 * Math.sin(t * 2) + 0.18 * Math.sin(t * 4));
        const x = Math.cos(t) * r * 1.3;
        const z = Math.sin(t) * r * 1.15;
        const y = Math.sin(t * 2) * 9.0 + 10.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 24. Le Mans Mulsanne Chicanes (Đoạn thẳng dài với cua chicane lượn sóng mềm mại, không góc gãy)
    case 'LE_MANS_MULSANNE_CHICANES': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 2.1 + Math.sin(t * 4) * 120;
        const z = Math.sin(t) * scale * 0.85 + Math.sin(t * 2) * 140;
        const y = Math.sin(t * 2) * 5.0 + 7.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 25. Bát Giác Cyber Velodrome (Vòng đua tương lai bo góc cong tròn mượt mà)
    case 'CYBER_OCTAGON_VELODROME': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.3 + 0.16 * Math.cos(t * 4));
        const x = Math.cos(t) * r * 1.25;
        const z = Math.sin(t) * r * 1.25;
        const y = Math.sin(t * 2) * 6.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 26. Sống Lưng Rồng Mây Ngàn (Dragon Back)
    case 'DRAGON_BACK_RIDGELINE': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 1.6 + Math.sin(t * 2) * 180;
        const z = Math.sin(t) * scale * 1.15;
        const y = Math.sin(t * 4) * 11.0 + Math.sin(t) * 7.0 + 14.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 27. Vòng Lặp Vô Cực Infinity (∞) (Đường cong Bernoulli mượt mà)
    case 'INFINITY_LOOP_EXPRESS': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const denom = 1 + Math.sin(t) * Math.sin(t) * 0.65;
        const x = (scale * 1.85 * Math.cos(t)) / denom;
        const z = (scale * 1.85 * Math.sin(t) * Math.cos(t)) / denom;
        const y = (Math.sin(t) * 0.5 + 0.5) * 16.0 + 5.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 28. Tam Giác Tốc Độ Delta Wing (3 đỉnh bo cong bán kính lớn mượt mà, không đỉnh nhọn)
    case 'DELTA_WING_TRIANGLE': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.3 + 0.22 * Math.cos(t * 3));
        const x = Math.cos(t) * r * 1.25;
        const z = Math.sin(t) * r * 1.25;
        const y = Math.sin(t * 2) * 7.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 29. Nút Giao Hoa Thị Cloverleaf (Đạo hàm C^infinity mượt mà)
    case 'CLOVERLEAF_INTERCHANGE': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const sinVal = Math.sin(t * 2);
        const r = scale * (1.18 + 0.35 * (sinVal * sinVal));
        const x = Math.cos(t) * r * 1.25;
        const z = Math.sin(t) * r * 1.25;
        const y = Math.sin(t * 4) * 11.0 + 10.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 30. Vịnh Trăng Khuyết Nhiệt Đới (Crescent Moon Bay)
    case 'CRESCENT_MOON_BAY': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 1.6 + Math.sin(t * 2) * (scale * 0.25);
        const z = Math.sin(t) * scale * 0.95 + Math.cos(t * 2) * (scale * 0.25);
        const y = Math.sin(t * 2) * 5.0 + 7.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 31. Nanh Rắn Độc Viper Fang (Lượn sóng nhấp nhô mềm mại)
    case 'VIPER_FANG_CHICANE': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.sin(t) * scale * 1.5 + Math.sin(t * 3) * 220;
        const z = Math.cos(t) * scale * 1.15 + Math.cos(t * 2) * 160;
        const y = Math.sin(t * 2) * 7.0 + 8.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 32. Mê Cung Đô Thị Labyrinth (Đại lộ lượn sóng liên tục)
    case 'LABYRINTH_METROPOLIS': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 1.5 + Math.sin(t * 2) * 220;
        const z = Math.sin(t) * scale * 1.25 + Math.cos(t * 3) * 180;
        const y = Math.sin(t * 2) * 8.0 + 9.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 33. Lốc Xoáy Lòng Chảo Tornado
    case 'TORNADO_VORTEX_FUNNEL': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const r = scale * (1.25 + 0.28 * Math.sin(t));
        const x = Math.cos(t) * r * 1.3;
        const z = Math.sin(t) * r * 1.15;
        const y = Math.sin(t) * 12.0 + 14.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 34. Thung Lũng Hai Đỉnh Đồi (Twin Summits)
    case 'TWIN_SUMMITS_VALLEY': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 1.65 + Math.sin(t * 2) * 150;
        const z = Math.sin(t) * scale * 1.1;
        const sin2 = Math.sin(t * 2);
        const y = sin2 * sin2 * 16.0 + 5.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 35. Vịnh Băng Bắc Cực Aurora Fjord (Uốn lượn vịnh hẹp)
    case 'AURORA_FJORD_SERPENTINE': {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.sin(t) * scale * 1.6 + Math.cos(t * 2) * 220;
        const z = Math.cos(t) * scale * 1.2 + Math.sin(t * 3) * 160;
        const y = Math.sin(t * 2) * 9.0 + 10.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }

    // 36. Cầu Cạn Trên Không Neo-Shanghai
    case 'NEO_SHANGHAI_SKYWAY':
    default: {
      for (let i = 0; i <= numPts; i++) {
        const t = (i / numPts) * Math.PI * 2;
        const x = Math.cos(t) * scale * 1.7 + Math.sin(t * 2) * 180;
        const z = Math.sin(t) * scale * 1.2 + Math.cos(t * 3) * 140;
        const y = Math.sin(t * 2) * 8.0 + 10.0;
        points.push(new THREE.Vector3(x, y, z));
      }
      break;
    }
  }

  // =========================================================================
  // BỘ LỌC LÀM MỊN ĐA TẦNG LAPLACIAN (5-PASS CURVATURE SMOOTHING FILTER)
  // Triệt tiêu 100% mọi vi chấn, góc gấp, hoặc chuyển hướng đột ngột.
  // Đảm bảo bán kính cong luôn liên tục, xe ôm cua êm ái như dải lụa bay.
  // =========================================================================
  const numSmoothPasses = 5;
  const len = points.length;

  for (let pass = 0; pass < numSmoothPasses; pass++) {
    const smoothed: THREE.Vector3[] = [];
    for (let i = 0; i < len; i++) {
      // Đối với vòng lặp kín (Closed circuit), lấy điểm trước và sau theo modulo chu kỳ
      const prevIdx = (i === 0) ? len - 2 : i - 1;
      const nextIdx = (i === len - 1) ? 1 : i + 1;
      const prev = points[prevIdx];
      const curr = points[i];
      const next = points[nextIdx];

      // Trọng số Gaussian: 20% lân cận trước, 60% hiện tại, 20% lân cận sau
      const smX = prev.x * 0.20 + curr.x * 0.60 + next.x * 0.20;
      const smY = Math.max(5.0, prev.y * 0.20 + curr.y * 0.60 + next.y * 0.20);
      const smZ = prev.z * 0.20 + curr.z * 0.60 + next.z * 0.20;
      smoothed.push(new THREE.Vector3(smX, smY, smZ));
    }
    for (let i = 0; i < len; i++) {
      points[i].copy(smoothed[i]);
    }
  }

  // Khép kín tuyệt đối điểm đầu và cuối để vòng đua liền mạch 100% không một khe hở
  points[len - 1].copy(points[0]);

  return points;
}
