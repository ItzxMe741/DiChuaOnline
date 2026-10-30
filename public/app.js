// CHÙA AN LẠC 3D - BẢN NÂNG CẤP HOÀN THIỆN
// 1. Tay chắp sen chuẩn trước mặt, nhang đưa ra trước không đâm vào người
// 2. Trò lăn chuỗi hạt 360 độ bằng chuột/ngón tay (Đủ 1 vòng = +1 Lần Công Đức Viên Mãn)
// 3. Tượng Phật Thích Ca dát vàng bóc sạch nền, không còn viền chum
// 4. Lư hương đặt vững chãi trên bàn thờ Tam Bảo (không lơ lửng, không đè nến/quả)
// 5. Ngồi khoanh chân kiết già trên bồ đoàn đỏ dưới sàn Chánh Điện
// 6. Hai hồ sen tuyệt đẹp 2 bên hông Chánh Điện có cầu đá cong, hoa sen nở rộ, cá Koi bơi

(function() {
    'use strict';

    // ==========================================
    // 1. GLOBAL CONFIG & STATE
    // ==========================================
    const STATE = {
        playerId: null,
        playerName: 'Chú Tiểu An An',
        robeColor: 'blue',
        connected: false,
        meritRounds: 0,       // Số vòng công đức đã hoàn thành
        currentBeadIndex: 0,  // Hạt hiện tại trong vòng
        accumulatedAngle: 0,  // Góc đã xoay tích lũy
        currentAction: 'idle',
        isPraying: false,
        isOfferingIncense: false,
        isHoldingRosary: false,
        isSitting: false,
        keys: { w: false, a: false, s: false, d: false, ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false },
        camera: {
            theta: Math.PI,
            phi: 0.38,
            radius: 6.8,
            targetY: 1.25,
            isMouseDown: false,
            mouseX: 0,
            mouseY: 0
        }
    };

    const ROBE_COLORS_HEX = {
        blue: '#5b6f84',    // Màu lam xám Phật tử truyền thống
        brown: '#6d4c3d',   // Màu nâu sồng mộc mạc
        white: '#e8eaed',   // Bạch y cư sĩ
        yellow: '#d99b52'   // Áo vàng huỳnh y
    };

    let ws = null;
    let ablyClient = null;
    let ablyChannel = null;
    let ablyPlayerId = null;
    let realtimeFallbackNotified = false;
    let isLeavingPage = false;
    let scene, camera, renderer;
    let localPlayer = null;
    const remotePlayers = new Map();
    const activeIncenseSticks = [];
    const particleSystems = [];
    let haloInnerMesh = null;
    let bellMesh = null;
    let woodenFishMesh = null;
    let candleLights = [];
    let waterMeshList = [];
    let koiFishList = [];

    // Danh sách tọa độ các tấm Bồ Đoàn (cushions) trước bàn thờ
    const CUSHIONS = [];

    // Danh sách chướng ngại vật cản va chạm (Cột chùa, Cổng Tam quan, Cây cối, Lư hương, Bàn thờ, Lầu chuông)
    const OBSTACLES = [
        // 1. Cột Cổng Tam Quan nằm đúng trên tường mặt tiền (z = 32.15m)
        { type: 'circle', x: -4.8, z: 32.15, r: 0.65 },
        { type: 'circle', x: -1.8, z: 32.15, r: 0.65 },
        { type: 'circle', x:  1.8, z: 32.15, r: 0.65 },
        { type: 'circle', x:  4.8, z: 32.15, r: 0.65 },

        // 2. Đại Lư Hương Sân Chùa (z = 7.0m)
        { type: 'circle', x: 0, z: 7.0, r: 1.15 },

        // 3. Hệ Thống 10 Cột Gỗ Chánh Điện
        { type: 'circle', x: -9.5, z: -7.5, r: 0.58 },
        { type: 'circle', x:  9.5, z: -7.5, r: 0.58 },
        { type: 'circle', x: -9.5, z:  0.0, r: 0.58 },
        { type: 'circle', x:  9.5, z:  0.0, r: 0.58 },
        { type: 'circle', x: -9.5, z:  7.5, r: 0.58 },
        { type: 'circle', x:  9.5, z:  7.5, r: 0.58 },
        { type: 'circle', x: -4.2, z:  7.5, r: 0.58 },
        { type: 'circle', x:  4.2, z:  7.5, r: 0.58 },
        { type: 'circle', x: -5.0, z: -7.5, r: 0.58 },
        { type: 'circle', x:  5.0, z: -7.5, r: 0.58 },

        // 4. Lầu Chuông Đại Hồng Chung & Giá Mõ Gỗ
        { type: 'box', minX: -7.8, maxX: -5.6, minZ: -7.2, maxZ: -4.8 },
        { type: 'box', minX:  5.6, maxX:  7.8, minZ: -7.2, maxZ: -4.8 },

        // 5. ĐẠI ĐỒNG LƯ HƯƠNG GIỮA CHÁNH ĐIỆN (z = -4.5m)
        { type: 'circle', x: 0, z: -4.5, r: 1.1 },

        // 6. Bàn Thờ Tam Bảo & Đôi Hạc Quy
        { type: 'box', minX: -3.8, maxX: 3.8, minZ: -10.6, maxZ: -8.0 },
        { type: 'circle', x: -3.8, z: -8.2, r: 0.65 },
        { type: 'circle', x:  3.8, z: -8.2, r: 0.65 },

        // 7. Cây Bồ Đề Cổ Thụ (2 cây lớn ngoài sân)
        { type: 'circle', x: -14.0, z: 14.0, r: 1.35 },
        { type: 'circle', x:  14.0, z: 14.0, r: 1.35 },

        // 8. Cây Hoa Sứ / Hoa Đại (2 cây trước thềm)
        { type: 'circle', x: -8.8, z: 5.0, r: 0.95 },
        { type: 'circle', x:  8.8, z: 5.0, r: 0.95 },

        // 9. Các Chậu Kiểng Bonsai Cổ Thụ
        { type: 'circle', x: -6.2, z: 8.8, r: 0.65 },
        { type: 'circle', x:  6.2, z: 8.8, r: 0.65 },
        { type: 'circle', x: -10.2, z: 0.0, r: 0.65 },
        { type: 'circle', x:  10.2, z: 0.0, r: 0.65 }
    ];

    // Vị trí tương tác nghi lễ trong chùa
    const INTERACTION_ZONES = {
        mainUrn: new THREE.Vector3(0, 1.58, -4.5), // Đại Đồng Lư Hương Giữa Chánh Điện
        yardUrn: new THREE.Vector3(0, 1.05, 7.0),   // Lư Hương Sân Chùa
        bell: new THREE.Vector3(-6.8, 2.2, -6.0),    // Đại Hồng Chung
        woodenFish: new THREE.Vector3(6.8, 1.2, -6.0)// Mõ Gỗ
    };

    // ==========================================
    // 2. INITIALIZATION
    // ==========================================
    window.addEventListener('DOMContentLoaded', () => {
        window.addEventListener('pagehide', () => {
            isLeavingPage = true;
            if (ws && ws.readyState < WebSocket.CLOSING) ws.close(1000, 'Leaving temple');
            if (ablyClient) ablyClient.close();
        });
        window.addEventListener('pageshow', (event) => {
            if (!event.persisted || !isLeavingPage) return;
            isLeavingPage = false;
            if (!ws || ws.readyState >= WebSocket.CLOSING) connectWebSocket();
        });

        setupWelcomeModal();
        initThree();
        buildDistantMountainsAndSky();
        buildTempleWorld();
        setupInputHandlers();
        setupMobileControls();
        setupUIEventListeners();
        setupInteractiveRosary();
        animate();
    });

    function setupWelcomeModal() {
        const welcomeModal = document.getElementById('welcome-modal');
        const nameInput = document.getElementById('player-name');
        const robeOptions = document.querySelectorAll('.robe-option');
        const enterBtn = document.getElementById('btn-enter-temple');

        if (nameInput.value === 'Phật tử Tâm An') {
            nameInput.value = 'Chú Tiểu Thích An Nhiên';
        }

        robeOptions.forEach(opt => {
            opt.addEventListener('click', () => {
                robeOptions.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                STATE.robeColor = opt.getAttribute('data-robe');
            });
        });

        enterBtn.addEventListener('click', () => {
            const name = nameInput.value.trim();
            if (name) STATE.playerName = name;
            // Start just inside the front gate so the player's own avatar is
            // clearly visible in the first camera view.
            STATE.camera.theta = Math.PI;
            STATE.camera.phi = 0.38;
            STATE.camera.radius = 7.8;
            STATE.camera.targetY = 1.25;
            if (window.matchMedia('(pointer: coarse)').matches && screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(() => {});
            }
            welcomeModal.style.opacity = '0';
            setTimeout(() => { welcomeModal.style.display = 'none'; }, 300);

            window.templeAudio.init();
            createLocalPlayer();
            connectWebSocket();
            showToast(`Chào mừng ${STATE.playerName} bước vào chùa! 🙏✨`);
        });
    }

    function initThree() {
        const container = document.getElementById('canvas-container');

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x6e7881);
        scene.fog = new THREE.FogExp2(0x74685f, 0.008);

        camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 300);
        updateCameraPosition();

        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.18;
        container.appendChild(renderer.domElement);

        setupLighting();
        window.addEventListener('resize', onWindowResize);
    }

    function setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xdbe5e8, 0.58);
        scene.add(ambientLight);

        const skyBounce = new THREE.HemisphereLight(0xc4d8e7, 0x564239, 0.62);
        scene.add(skyBounce);

        const sunLight = new THREE.DirectionalLight(0xffdfb4, 1.35);
        sunLight.position.set(-28, 48, 22);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.bias = -0.0004;
        scene.add(sunLight);

        // Ánh quang minh vàng rực rỡ soi rọi Tôn Tượng Phật
        const buddhaLight = new THREE.PointLight(0xffd700, 2.8, 25);
        buddhaLight.position.set(0, 6.2, -9.5);
        scene.add(buddhaLight);

        // Đôi chân đèn cầy trên bàn thờ
        [-1.5, 1.5].forEach(x => {
            const candle = new THREE.PointLight(0xff7718, 1.2, 8);
            candle.position.set(x, 2.5, -9.2);
            scene.add(candle);
            candleLights.push(candle);
        });

        [-5.5, 5.5].forEach(x => {
            const lanternLight = new THREE.PointLight(0xff9922, 0.9, 14);
            lanternLight.position.set(x, 4.0, 0);
            scene.add(lanternLight);
        });
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // ==========================================
    // 3. SKYBOX & MOUNTAINS
    // ==========================================
    function buildDistantMountainsAndSky() {
        const skyGeo = new THREE.SphereGeometry(150, 32, 16);
        const skyCanvas = document.createElement('canvas');
        skyCanvas.width = 1024;
        skyCanvas.height = 512;
        const sCtx = skyCanvas.getContext('2d');
        const skyGrad = sCtx.createLinearGradient(0, 0, 0, 512);
        skyGrad.addColorStop(0, '#30435f');
        skyGrad.addColorStop(0.28, '#627d91');
        skyGrad.addColorStop(0.49, '#d3a27e');
        skyGrad.addColorStop(0.58, '#f3c58f');
        skyGrad.addColorStop(0.72, '#a17c70');
        skyGrad.addColorStop(1, '#374453');
        sCtx.fillStyle = skyGrad;
        sCtx.fillRect(0, 0, 1024, 512);

        // Wispy, soft-edged dusk clouds across the horizon.
        for (let i = 0; i < 30; i++) {
            const x = (i * 173 + 71) % 1024;
            const y = 205 + ((i * 47) % 105);
            const rx = 55 + ((i * 29) % 95);
            const ry = 8 + ((i * 13) % 15);
            sCtx.save();
            sCtx.translate(x, y);
            sCtx.scale(1, ry / rx);
            const cloud = sCtx.createRadialGradient(0, 0, 2, 0, 0, rx);
            cloud.addColorStop(0, 'rgba(255, 231, 205, 0.22)');
            cloud.addColorStop(0.55, 'rgba(235, 196, 172, 0.10)');
            cloud.addColorStop(1, 'rgba(235, 196, 172, 0)');
            sCtx.fillStyle = cloud;
            sCtx.beginPath();
            sCtx.arc(0, 0, rx, 0, Math.PI * 2);
            sCtx.fill();
            sCtx.restore();
        }

        // A low sun glow warms the horizon without flattening the temple silhouette.
        const sunGlow = sCtx.createRadialGradient(690, 260, 8, 690, 260, 150);
        sunGlow.addColorStop(0, 'rgba(255, 226, 165, 0.78)');
        sunGlow.addColorStop(0.22, 'rgba(255, 205, 143, 0.34)');
        sunGlow.addColorStop(1, 'rgba(255, 190, 130, 0)');
        sCtx.fillStyle = sunGlow;
        sCtx.fillRect(530, 100, 320, 320);

        const skyTex = new THREE.CanvasTexture(skyCanvas);
        const skyMesh = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide }));
        scene.add(skyMesh);

        const mtnMat = new THREE.MeshStandardMaterial({ color: 0x221517, roughness: 0.95 });
        for (let i = 0; i < 14; i++) {
            const angle = (i / 14) * Math.PI * 2;
            const dist = 75 + Math.random() * 20;
            const mtn = new THREE.Mesh(new THREE.ConeGeometry(18 + Math.random() * 12, 28 + Math.random() * 20, 6), mtnMat);
            mtn.position.set(Math.cos(angle) * dist, 10, Math.sin(angle) * dist);
            mtn.rotation.y = Math.random() * Math.PI;
            scene.add(mtn);
        }
    }

    // ==========================================
    // 4. TEMPLE ARCHITECTURE & SCENIC SIDE PONDS
    // ==========================================
    function buildTempleWorld() {
        const brickTex = ProceduralTextures.createBrickFloor();
        const stoneTex = ProceduralTextures.createCourtyardStone();
        const roofTex = ProceduralTextures.createRoofTiles();
        const woodTex = ProceduralTextures.createWoodgrain('#451a10');
        const goldTex = ProceduralTextures.createGoldLeaf();
        const bronzeTex = ProceduralTextures.createAntiqueBronze();

        // Courtyard paving stops at the wall line; natural ground continues outside.
        const outerGroundTex = ProceduralTextures.createOuterGardenGround();
        const outerGround = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshStandardMaterial({ map: outerGroundTex, bumpMap: outerGroundTex, bumpScale: 0.018, roughness: 1.0 })
        );
        outerGround.rotation.x = -Math.PI / 2;
        outerGround.position.y = -0.035;
        outerGround.receiveShadow = true;
        scene.add(outerGround);

        // 1. Sân chùa gạch Bát Tràng, fitted inside the perimeter walls.
        const floorGeo = new THREE.PlaneGeometry(50.8, 63.8);
        const floorMat = new THREE.MeshStandardMaterial({
            map: brickTex,
            bumpMap: brickTex,
            bumpScale: 0.035,
            roughness: 0.92,
            metalness: 0.01
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);

        // Tường bao khuôn viên
        const plasterCanvas = document.createElement('canvas');
        plasterCanvas.width = 512;
        plasterCanvas.height = 512;
        const plasterCtx = plasterCanvas.getContext('2d');
        plasterCtx.fillStyle = '#705346';
        plasterCtx.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 9000; i++) {
            const light = Math.random() > 0.52;
            plasterCtx.fillStyle = light ? 'rgba(231, 207, 177, 0.10)' : 'rgba(28, 18, 15, 0.10)';
            plasterCtx.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 4, 1 + Math.random() * 3);
        }
        for (let y = 18; y < 512; y += 64) {
            plasterCtx.fillStyle = 'rgba(38, 23, 18, 0.10)';
            plasterCtx.fillRect(0, y, 512, 2);
            plasterCtx.fillStyle = 'rgba(238, 216, 186, 0.08)';
            plasterCtx.fillRect(0, y + 3, 512, 2);
        }
        const plasterTex = new THREE.CanvasTexture(plasterCanvas);
        plasterTex.wrapS = THREE.RepeatWrapping;
        plasterTex.wrapT = THREE.RepeatWrapping;
        plasterTex.repeat.set(2, 2);
        const wallMat = new THREE.MeshStandardMaterial({ map: plasterTex, bumpMap: plasterTex, bumpScale: 0.045, roughness: 0.96 });
        const wallHeight = 4.2;
        const wallY = wallHeight / 2;
        const copingMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.92 });
        const wallBaseMat = new THREE.MeshStandardMaterial({ color: 0x60372c, roughness: 0.93 });
        [-26, 26].forEach(x => {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(1.2, wallHeight, 65), wallMat);
            wall.position.set(x, wallY, 0);
            wall.castShadow = true;
            wall.receiveShadow = true;
            scene.add(wall);
            const baseBand = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.58, 65.2), wallBaseMat);
            baseBand.position.set(x, 0.29, 0);
            scene.add(baseBand);
            const coping = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 65.2), copingMat);
            coping.position.set(x, wallHeight - 0.05, 0);
            coping.castShadow = true;
            scene.add(coping);

            for (let z = -28; z <= 28; z += 8) {
                const pier = new THREE.Mesh(new THREE.BoxGeometry(1.42, wallHeight + 0.08, 0.42), copingMat);
                pier.position.set(x, wallY, z);
                pier.castShadow = true;
                scene.add(pier);
            }
        });
        const backWall = new THREE.Mesh(new THREE.BoxGeometry(52, wallHeight, 1.2), wallMat);
        backWall.position.set(0, wallY, -32.5);
        backWall.castShadow = true;
        scene.add(backWall);
        const backBase = new THREE.Mesh(new THREE.BoxGeometry(52.2, 0.58, 1.32), wallBaseMat);
        backBase.position.set(0, 0.29, -32.5);
        scene.add(backBase);
        const backCoping = new THREE.Mesh(new THREE.BoxGeometry(52.5, 0.22, 1.5), copingMat);
        backCoping.position.set(0, wallHeight - 0.05, -32.5);
        scene.add(backCoping);

        // Front wall sections leave one centered opening for the Tam Quan gate.
        const frontWallZ = 32.5;
        const wingWidth = 20.5;
        [-1, 1].forEach(side => {
            const wing = new THREE.Mesh(new THREE.BoxGeometry(wingWidth, wallHeight, 1.2), wallMat);
            wing.position.set(side * (5.5 + wingWidth / 2), wallY, frontWallZ);
            wing.castShadow = true;
            wing.receiveShadow = true;
            scene.add(wing);

            const wingBase = new THREE.Mesh(new THREE.BoxGeometry(wingWidth + 0.2, 0.58, 1.32), wallBaseMat);
            wingBase.position.set(side * (5.5 + wingWidth / 2), 0.29, frontWallZ);
            scene.add(wingBase);

            const wingCoping = new THREE.Mesh(new THREE.BoxGeometry(wingWidth + 0.3, 0.22, 1.5), copingMat);
            wingCoping.position.set(side * (5.5 + wingWidth / 2), wallHeight - 0.05, frontWallZ);
            wingCoping.castShadow = true;
            scene.add(wingCoping);

            for (let x = 8; x <= 24; x += 8) {
                const pier = new THREE.Mesh(new THREE.BoxGeometry(0.42, wallHeight + 0.08, 1.42), copingMat);
                pier.position.set(side * x, wallY, frontWallZ);
                pier.castShadow = true;
                scene.add(pier);
            }
        });

        // 2. Cổng Tam Quan
        buildTamQuanGate(new THREE.Vector3(0, 0, 31.9), woodTex, roofTex);

        // 3. Chánh Điện (Nâng cao 0.65m với bậc tam cấp)
        buildMainSanctuary(woodTex, roofTex);

        // 4. Bàn Thờ Tam Bảo Chuẩn Chùa Việt & Tượng Phật Thích Ca (Bóc sạch nền, không có viền chum)
        buildAuthenticAltar(goldTex, woodTex, bronzeTex);

        // 4b. ĐẠI ĐỒNG LƯ HƯƠNG GIỮA CHÁNH ĐIỆN (Phục hồi sừng sững tại trung tâm sảnh)
        buildCentralSanctuaryUrn(bronzeTex);

        // 5. Chuông & Mõ Chánh Điện
        buildBellAndWoodenFish(bronzeTex, woodTex);

        // 6. Đại Lư Hương Ngoài Sân Chùa
        buildYardIncenseUrn(bronzeTex);

        // 7. Bồ Đoàn Quỳ Lạy & Ngồi Thiền Trên Sàn Chánh Điện (Tách rộng 2 bên cánh, chừa lối đi giữa)
        buildPrayerCushions();

        // 8. CÂY CẢNH VÀ THỰC VẬT CHÙA CHIỀN TRUYỀN THỐNG VIỆT NAM
        buildBodhiTree(new THREE.Vector3(-14, 0, 14)); // Cây Bồ Đề cổ thụ sân trái
        buildBodhiTree(new THREE.Vector3(14, 0, 14));  // Cây Bồ Đề cổ thụ sân phải
        buildFrangipaniTree(new THREE.Vector3(-8.8, 0, 5.0)); // Cây Hoa Sứ cổ thụ bên trái thềm
        buildFrangipaniTree(new THREE.Vector3(8.8, 0, 5.0));  // Cây Hoa Sứ cổ thụ bên phải thềm
        // Ghe da duoi bong cay hoa su cho phat tu ngoi tinh tam
        buildStoneBench(new THREE.Vector3(-9.2, 0, 7.5), Math.PI / 10);
        buildStoneBench(new THREE.Vector3(9.2, 0, 7.5), -Math.PI / 10);

        // Chau kieng don su dat vung vang tren them Chanh dien (z = 3.0m, y = 0.65m - khong bay lo lung)
        buildBonsaiPot(new THREE.Vector3(-6.2, 0.65, 3.0));   
        buildBonsaiPot(new THREE.Vector3(6.2, 0.65, 3.0));
        buildBonsaiPot(new THREE.Vector3(-10.2, 0.65, 0.0));  // Chậu kiểng hành lang Chánh điện
        buildBonsaiPot(new THREE.Vector3(10.2, 0.65, 0.0));
        buildBambooGrove(new THREE.Vector3(-23.0, 0, 14));    // Rặng trúc thanh nhã ven tường
        buildBambooGrove(new THREE.Vector3(23.0, 0, 14));
        buildCourtyardShrubs();

        // 9. HAI HỒ SEN TOÀN PHẦN 2 BÊN HÔNG CHÁNH ĐIỆN VỚI LỐI ĐI LÁT ĐÁ VÀ CẦU ĐÁ BẮC NGANG
        buildFullScenicSideLakes(stoneTex);
        buildRearGarden(stoneTex);

        setupTempleParticles();
    }

    function createTraditionalHipRoof(halfWidth, halfDepth, ridgeY, eaveY, ridgeHalfLength, cornerLift, roofMat, detailMat) {
        const roof = new THREE.Group();

        function addPanel(rows, columns, vertexAt) {
            const positions = [];
            const uvs = [];
            const indices = [];
            for (let row = 0; row <= rows; row++) {
                const u = row / rows;
                for (let col = 0; col <= columns; col++) {
                    const v = col / columns;
                    const point = vertexAt(u, v);
                    positions.push(point[0], point[1], point[2]);
                    uvs.push(v, 1 - u);
                }
            }
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < columns; col++) {
                    const a = row * (columns + 1) + col;
                    const b = a + columns + 1;
                    indices.push(a, b, a + 1, b, b + 1, a + 1);
                }
            }
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
            geometry.setIndex(indices);
            geometry.computeVertexNormals();
            const panel = new THREE.Mesh(geometry, roofMat);
            panel.castShadow = true;
            panel.receiveShadow = true;
            roof.add(panel);
        }

        function addBeam(start, end, radius, material) {
            const direction = new THREE.Vector3().subVectors(end, start);
            const beam = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 8), material);
            beam.position.copy(start).add(end).multiplyScalar(0.5);
            beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
            beam.castShadow = true;
            roof.add(beam);
        }

        // Two long roof planes and two hip ends, with the eaves lifted at each corner.
        [-1, 1].forEach(sideX => {
            addPanel(12, 20, (u, v) => {
                const across = v * 2 - 1;
                const zSpan = ridgeHalfLength + u * (halfDepth - ridgeHalfLength);
                const x = sideX * halfWidth * u;
                const z = across * zSpan;
                const y = eaveY + (ridgeY - eaveY) * (1 - u) + cornerLift * u * Math.pow(Math.abs(across), 3);
                return [x, y, z];
            });
        });

        [-1, 1].forEach(sideZ => {
            addPanel(20, 8, (u, v) => {
                const across = u * 2 - 1;
                const x = across * halfWidth;
                const widthRatio = Math.abs(across);
                const transitionZ = ridgeHalfLength + widthRatio * (halfDepth - ridgeHalfLength);
                const z = sideZ * (transitionZ + v * (halfDepth - transitionZ));
                const boundaryY = eaveY + (ridgeY - eaveY) * (1 - widthRatio) + cornerLift * widthRatio;
                const outerY = eaveY + cornerLift * widthRatio;
                return [x, boundaryY * (1 - v) + outerY * v, z];
            });
        });

        const ridgeStart = new THREE.Vector3(0, ridgeY + 0.04, -ridgeHalfLength);
        const ridgeEnd = new THREE.Vector3(0, ridgeY + 0.04, ridgeHalfLength);
        addBeam(ridgeStart, ridgeEnd, Math.max(0.09, halfWidth * 0.012), detailMat);

        [-1, 1].forEach(sideX => [-1, 1].forEach(sideZ => {
            addBeam(
                new THREE.Vector3(0, ridgeY, sideZ * ridgeHalfLength),
                new THREE.Vector3(sideX * halfWidth, eaveY + cornerLift, sideZ * halfDepth),
                Math.max(0.055, halfWidth * 0.006),
                detailMat
            );
        }));

        // Carved fascia follows the upturned edges of all four eaves.
        [-1, 1].forEach(sideX => {
            for (let i = 0; i < 12; i++) {
                const z0 = -halfDepth + (2 * halfDepth * i) / 12;
                const z1 = -halfDepth + (2 * halfDepth * (i + 1)) / 12;
                const y0 = eaveY + cornerLift * Math.pow(Math.abs(z0) / halfDepth, 3);
                const y1 = eaveY + cornerLift * Math.pow(Math.abs(z1) / halfDepth, 3);
                addBeam(new THREE.Vector3(sideX * halfWidth, y0, z0), new THREE.Vector3(sideX * halfWidth, y1, z1), 0.065, detailMat);
            }
        });
        [-1, 1].forEach(sideZ => {
            for (let i = 0; i < 12; i++) {
                const x0 = -halfWidth + (2 * halfWidth * i) / 12;
                const x1 = -halfWidth + (2 * halfWidth * (i + 1)) / 12;
                const y0 = eaveY + cornerLift * Math.pow(Math.abs(x0) / halfWidth, 3);
                const y1 = eaveY + cornerLift * Math.pow(Math.abs(x1) / halfWidth, 3);
                addBeam(new THREE.Vector3(x0, y0, sideZ * halfDepth), new THREE.Vector3(x1, y1, sideZ * halfDepth), 0.065, detailMat);
            }
        });

        const finialMat = new THREE.MeshStandardMaterial({ color: 0xc69b42, roughness: 0.52, metalness: 0.42 });
        [-1, 1].forEach(sideX => [-1, 1].forEach(sideZ => {
            const finial = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.12, halfWidth * 0.014), 10, 8), finialMat);
            finial.position.set(sideX * halfWidth, eaveY + cornerLift + 0.08, sideZ * halfDepth);
            roof.add(finial);
        }));

        return roof;
    }

    function buildTamQuanGate(pos, woodTex, roofTex) {
        const gateGroup = new THREE.Group();
        gateGroup.position.copy(pos);

        const pillarMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.72 });
        const roofMat = new THREE.MeshStandardMaterial({ map: roofTex, bumpMap: roofTex, bumpScale: 0.06, roughness: 0.88, side: THREE.DoubleSide });
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x756d61, roughness: 0.88 });
        const pillarGeo = new THREE.CylinderGeometry(0.32, 0.40, 6.1, 20);
        [-4.8, -1.8, 1.8, 4.8].forEach(x => {
            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.58, 0.42, 12), stoneMat);
            base.position.set(x, 0.25, 0);
            gateGroup.add(base);

            const pillar = new THREE.Mesh(pillarGeo, pillarMat);
            pillar.position.set(x, 3.6, 0);
            pillar.castShadow = true;
            gateGroup.add(pillar);

            const capital = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.38, 0.28, 12), pillarMat);
            capital.position.set(x, 6.72, 0);
            gateGroup.add(capital);
        });

        const gateBeam = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.38, 0.48), pillarMat);
        gateBeam.position.set(0, 6.65, 0);
        gateBeam.castShadow = true;
        gateGroup.add(gateBeam);

        const gateRoof = createTraditionalHipRoof(5.9, 3.25, 8.45, 6.75, 1.65, 0.55, roofMat, pillarMat);
        gateGroup.add(gateRoof);

        const board = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.85, 0.15), new THREE.MeshStandardMaterial({ color: 0x1f0805 }));
        board.position.set(0, 5.3, 0.1);
        gateGroup.add(board);

        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1c0604';
        ctx.fillRect(0, 0, 512, 128);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 6;
        ctx.strokeRect(6, 6, 500, 116);
        ctx.font = 'bold 52px "Cinzel", "Playfair Display", serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CHÙA AN LẠC', 256, 64);

        const textPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(3.2, 0.8),
            new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true })
        );
        textPlane.position.set(0, 5.3, 0.2);
        gateGroup.add(textPlane);

        scene.add(gateGroup);
    }

    function buildMainSanctuary(woodTex, roofTex) {
        const temple = new THREE.Group();
        temple.position.set(0, 0, -6);

        const woodMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.6 });
        const roofMat = new THREE.MeshStandardMaterial({ map: roofTex, bumpMap: roofTex, bumpScale: 0.07, roughness: 0.88, side: THREE.DoubleSide });
        const platformMat = new THREE.MeshStandardMaterial({ color: 0x6e635b, roughness: 0.8 });

        const platform = new THREE.Mesh(new THREE.BoxGeometry(23, 0.65, 19), platformMat);
        platform.position.set(0, 0.32, 0);
        platform.receiveShadow = true;
        temple.add(platform);

        for (let i = 0; i < 4; i++) {
            const step = new THREE.Mesh(new THREE.BoxGeometry(11, 0.16, 0.85), platformMat);
            step.position.set(0, 0.08 + i * 0.15, 9.8 - i * 0.4);
            step.receiveShadow = true;
            temple.add(step);
        }

        const colGeo = new THREE.CylinderGeometry(0.30, 0.37, 6.2, 20);
        const columnBaseMat = new THREE.MeshStandardMaterial({ color: 0x756b5c, roughness: 0.86 });
        const collarGeo = new THREE.TorusGeometry(0.35, 0.045, 8, 20);
        collarGeo.rotateX(Math.PI / 2);
        const colPositions = [
            [-9.5, 3.9, -7.5], [9.5, 3.9, -7.5],
            [-9.5, 3.9, 0], [9.5, 3.9, 0],
            [-9.5, 3.9, 7.5], [9.5, 3.9, 7.5],
            [-4.2, 3.9, 7.5], [4.2, 3.9, 7.5],
            [-5.0, 3.9, -7.5], [5.0, 3.9, -7.5]
        ];
        colPositions.forEach(p => {
            const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.54, 0.38, 12), columnBaseMat);
            plinth.position.set(p[0], 0.84, p[2]);
            plinth.castShadow = true;
            plinth.receiveShadow = true;
            temple.add(plinth);

            const col = new THREE.Mesh(colGeo, woodMat);
            col.position.set(p[0], 4.1, p[2]);
            col.castShadow = true;
            col.receiveShadow = true;
            temple.add(col);

            const footCollar = new THREE.Mesh(collarGeo, woodMat);
            footCollar.position.set(p[0], 1.12, p[2]);
            temple.add(footCollar);

            const capital = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.22, 0.72), woodMat);
            capital.position.set(p[0], 7.22, p[2]);
            temple.add(capital);
            const bracketAcross = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.17, 0.24), woodMat);
            bracketAcross.position.set(p[0], 7.41, p[2]);
            temple.add(bracketAcross);
            const bracketAlong = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.17, 1.16), woodMat);
            bracketAlong.position.set(p[0], 7.58, p[2]);
            temple.add(bracketAlong);
        });

        // Continuous timber beams tie the column rows together like a real post-and-beam frame.
        [-7.5, 0, 7.5].forEach(z => {
            const beam = new THREE.Mesh(new THREE.BoxGeometry(19.6, 0.38, 0.42), woodMat);
            beam.position.set(0, 7.28, z);
            beam.castShadow = true;
            temple.add(beam);
        });
        [-9.5, 9.5].forEach(x => {
            const beam = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 15.4), woodMat);
            beam.position.set(x, 7.28, 0);
            beam.castShadow = true;
            temple.add(beam);
        });

        // 1. Hoành Phi "ĐẠI HÙNG BẢO ĐIỆN" treo trang nghiêm trên xà chính cửa Chánh Điện (z = 7.7m)
        const hoanhPhiGroup = new THREE.Group();
        hoanhPhiGroup.position.set(0, 6.3, 7.7);

        const hoanhPhiFrame = new THREE.Mesh(
            new THREE.BoxGeometry(5.4, 1.4, 0.14),
            new THREE.MeshStandardMaterial({ color: 0x220502, roughness: 0.4 })
        );
        hoanhPhiGroup.add(hoanhPhiFrame);

        const hoanhPhiTex = ProceduralTextures.createHoanhPhiTexture('大 雄 寶 殿', 'ĐẠI HÙNG BẢO ĐIỆN');
        const hoanhPhi = new THREE.Mesh(
            new THREE.PlaneGeometry(5.2, 1.25),
            new THREE.MeshStandardMaterial({ map: hoanhPhiTex, roughness: 0.35 })
        );
        hoanhPhi.position.z = 0.08;
        hoanhPhiGroup.add(hoanhPhi);
        temple.add(hoanhPhiGroup);

        // 2. Câu Đối Cột Chùa Dát Vàng (gắn vững chắc trên bảng gỗ ôm thân cột, không bị đè hay z-fighting)
        function createPillarCouplet(xPos, coupletText) {
            const cGroup = new THREE.Group();
            cGroup.position.set(xPos, 4.0, 7.98);

            const boardBacking = new THREE.Mesh(
                new THREE.BoxGeometry(0.72, 4.2, 0.08),
                new THREE.MeshStandardMaterial({ color: 0x1f0603, roughness: 0.4 })
            );
            cGroup.add(boardBacking);

            const coupletTex = ProceduralTextures.createCauDoiTexture(coupletText);
            const coupletPlane = new THREE.Mesh(
                new THREE.PlaneGeometry(0.66, 4.1),
                new THREE.MeshStandardMaterial({ map: coupletTex, roughness: 0.35 })
            );
            coupletPlane.position.z = 0.045;
            cGroup.add(coupletPlane);

            return cGroup;
        }

        const cauDoi1 = createPillarCouplet(-4.2, 'PHẬT\nQUANG\nPHỔ\nCHIẾU\nMUÔN\nPHƯƠNG\nTỊNH');
        temple.add(cauDoi1);

        const cauDoi2 = createPillarCouplet(4.2, 'TỪ\nBI\nHỶ\nXẢ\nVẠN\nSỰ\nAN');
        temple.add(cauDoi2);

        // 3. Hoành Phi Bên Trong Chánh Điện "VẠN ĐỨC TRANG NGHIÊM" phía trên bàn thờ Tam Bảo
        const innerHoanhPhiGroup = new THREE.Group();
        innerHoanhPhiGroup.position.set(0, 6.2, -7.2);

        const innerHoanhPhiFrame = new THREE.Mesh(
            new THREE.BoxGeometry(4.8, 1.2, 0.12),
            new THREE.MeshStandardMaterial({ color: 0x220502, roughness: 0.4 })
        );
        innerHoanhPhiGroup.add(innerHoanhPhiFrame);

        const innerHoanhPhiTex = ProceduralTextures.createHoanhPhiTexture('萬 德 莊 嚴', 'VẠN ĐỨC TRANG NGHIÊM');
        const innerHoanhPhi = new THREE.Mesh(
            new THREE.PlaneGeometry(4.6, 1.05),
            new THREE.MeshStandardMaterial({ map: innerHoanhPhiTex, roughness: 0.35 })
        );
        innerHoanhPhi.position.z = 0.07;
        innerHoanhPhiGroup.add(innerHoanhPhi);
        temple.add(innerHoanhPhiGroup);

        const eaveDetailMat = new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.72 });
        const mainRoof = createTraditionalHipRoof(13.1, 11.0, 10.85, 7.78, 4.6, 0.88, roofMat, eaveDetailMat);
        temple.add(mainRoof);

        const ridgeFinial = new THREE.Mesh(
            new THREE.CylinderGeometry(0.10, 0.24, 0.52, 8),
            new THREE.MeshStandardMaterial({ color: 0xc59a3b, roughness: 0.48, metalness: 0.38 })
        );
        ridgeFinial.position.set(0, 11.12, 0);
        temple.add(ridgeFinial);

        const interiorFloor = new THREE.Mesh(
            new THREE.PlaneGeometry(19, 15),
            new THREE.MeshStandardMaterial({ color: 0x4d160e, roughness: 0.25, metalness: 0.15 })
        );
        interiorFloor.rotation.x = -Math.PI / 2;
        interiorFloor.position.set(0, 0.66, -0.5);
        interiorFloor.receiveShadow = true;
        temple.add(interiorFloor);

        scene.add(temple);
    }

    // ==========================================
    // 🪷 BÀN THỜ TAM BẢO CHUẨN MỰC
    // ==========================================
    function buildAuthenticAltar(goldTex, woodTex, bronzeTex) {
        const altarGroup = new THREE.Group();
        altarGroup.position.set(0, 0.65, -9.4);

        const altarWoodTex = ProceduralTextures.createAltarWoodTexture();
        const altarWoodMat = new THREE.MeshStandardMaterial({ map: altarWoodTex, roughness: 0.38 });
        const bronzeMat = new THREE.MeshStandardMaterial({ map: bronzeTex, roughness: 0.32, metalness: 0.88 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4aa00, roughness: 0.25, metalness: 0.92, envMapIntensity: 1.2 });
        const darkGoldMat = new THREE.MeshStandardMaterial({ color: 0xb8860b, roughness: 0.32, metalness: 0.82 });

        // 1. BAN CUNG CHINH PHIA TRUOC (TO VA RONG HON, KHONG BI DE DO)
        // Kich thuoc rong 7.8m x cao 1.15m x sau 2.2m (vi tri z = 0.5m)
        const frontTable = new THREE.Mesh(new THREE.BoxGeometry(7.8, 1.15, 2.2), altarWoodMat);
        frontTable.position.set(0, 0.575, 0.5);
        frontTable.castShadow = true;
        frontTable.receiveShadow = true;
        altarGroup.add(frontTable);

        // Vien go son son thep vang quanh mat ban
        const tableRim = new THREE.Mesh(
            new THREE.BoxGeometry(7.9, 0.08, 2.3),
            new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.8 })
        );
        tableRim.position.set(0, 1.15, 0.5);
        altarGroup.add(tableRim);

        // Da yem ban tho cham rong chau mat nguyet thep vang long lay
        const apron = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.32, 0.06), goldMat);
        apron.position.set(0, 0.98, 1.62);
        altarGroup.add(apron);

        // 2. TANG THUONG PHIA SAU KE TOA SEN TUONG PHAT (SAT VACH z = -1.6m)
        const highShelf = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.75, 2.0), altarWoodMat);
        highShelf.position.set(0, 1.525, -1.6);
        highShelf.castShadow = true;
        highShelf.receiveShadow = true;
        altarGroup.add(highShelf);

        const highShelfRim = new THREE.Mesh(
            new THREE.BoxGeometry(5.7, 0.06, 2.1),
            new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.8 })
        );
        highShelfRim.position.set(0, 1.90, -1.6);
        altarGroup.add(highShelfRim);

        // 3. TOA SEN VANG KIM 2 TANG (LOTUS THRONE)
        const lotusGroup = new THREE.Group();
        lotusGroup.position.set(0, 1.90, -1.6);

        // De toa sen hinh bat giac thep vang
        const lotusPlinth = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.85, 0.25, 8), goldMat);
        lotusPlinth.position.y = 0.125;
        lotusPlinth.castShadow = true;
        lotusGroup.add(lotusPlinth);

        // Dai sen 2 tang canh sen no ro (32 canh sen)
        const petalMat = new THREE.MeshStandardMaterial({ color: 0xe6a119, roughness: 0.28, metalness: 0.85 });
        // Tang canh duoi
        for (let p = 0; p < 16; p++) {
            const ang = (p / 16) * Math.PI * 2;
            const petal = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 6), petalMat);
            petal.position.set(Math.cos(ang) * 1.65, 0.22, Math.sin(ang) * 1.65);
            petal.rotation.y = -ang;
            petal.rotation.z = 0.42;
            lotusGroup.add(petal);
        }
        // Tang canh tren
        for (let p = 0; p < 16; p++) {
            const ang = ((p + 0.5) / 16) * Math.PI * 2;
            const petal = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 6), goldMat);
            petal.position.set(Math.cos(ang) * 1.45, 0.35, Math.sin(ang) * 1.45);
            petal.rotation.y = -ang;
            petal.rotation.z = 0.30;
            lotusGroup.add(petal);
        }

        // Mat guong sen phang vung chai de Duc Phat toa lac
        const lotusSeat = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.42, 0.15, 24), goldMat);
        lotusSeat.position.y = 0.42;
        lotusGroup.add(lotusSeat);
        altarGroup.add(lotusGroup);

        // 4. TUONG PHAT - DUNG ANH BUDDHA.JPG CUTOUT CHINH XAC
        ProceduralTextures.loadBuddhaCutoutTexture('/buddha.jpg', (cutoutTex, aspect) => {
            const statueHeight = 4.4;
            const statueWidth = statueHeight * aspect;
            const statueGeo = new THREE.PlaneGeometry(statueWidth, statueHeight);
            const statueMat = new THREE.MeshBasicMaterial({
                map: cutoutTex,
                transparent: true,
                alphaTest: 0.1,
                side: THREE.FrontSide
            });
            const statueMesh = new THREE.Mesh(statueGeo, statueMat);
            statueMesh.position.set(0, 4.05, -1.55);
            altarGroup.add(statueMesh);
        });

                // VANG HAO QUANG PHAT TOA SANG DANG SAU DAU
        const haloCanvas = document.createElement('canvas');
        haloCanvas.width = 512;
        haloCanvas.height = 512;
        const hCtx = haloCanvas.getContext('2d');
        const grad = hCtx.createRadialGradient(256, 256, 30, 256, 256, 256);
        grad.addColorStop(0, 'rgba(255, 255, 230, 0.95)');
        grad.addColorStop(0.35, 'rgba(255, 215, 0, 0.75)');
        grad.addColorStop(0.75, 'rgba(255, 140, 0, 0.35)');
        grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
        hCtx.fillStyle = grad;
        hCtx.beginPath();
        hCtx.arc(256, 256, 256, 0, Math.PI * 2);
        hCtx.fill();

        const haloInnerMesh = new THREE.Mesh(
            new THREE.CircleGeometry(2.3, 36),
            new THREE.MeshBasicMaterial({
                map: new THREE.CanvasTexture(haloCanvas),
                transparent: true,
                opacity: 0.92,
                side: THREE.DoubleSide
            })
        );
        haloInnerMesh.position.set(0, 4.3, -2.1);
        altarGroup.add(haloInnerMesh);

        // 5. BAI TRI DO CUNG TRREN BAN TRUOC (TOAN BO THONG THOANG, CACH XA TOA SEN 1.2M)
        // A. DAI LU HUONG TAM BAO (Dat chinh giua ban truoc: z = 0.5m, y = 1.15m)
        const altarUrn = new THREE.Group();
        altarUrn.position.set(0, 1.15, 0.5);

        const urnBody = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.40, 0.58, 24), bronzeMat);
        urnBody.position.y = 0.29;
        urnBody.castShadow = true;
        altarUrn.add(urnBody);

        const urnSand = new THREE.Mesh(
            new THREE.CylinderGeometry(0.48, 0.48, 0.05, 24),
            new THREE.MeshStandardMaterial({ color: 0xdfcead, roughness: 0.95 })
        );
        urnSand.position.y = 0.56;
        altarUrn.add(urnSand);

        [-0.58, 0.58].forEach(x => {
            const handle = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.038, 8, 16), bronzeMat);
            handle.position.set(x, 0.32, 0);
            handle.rotation.y = Math.PI / 2;
            altarUrn.add(handle);
        });

        for (let i = 0; i < 3; i++) {
            const legAngle = (i / 3) * Math.PI * 2;
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.2, 8), bronzeMat);
            leg.position.set(Math.cos(legAngle) * 0.32, 0.08, Math.sin(legAngle) * 0.32);
            altarUrn.add(leg);
        }
        altarGroup.add(altarUrn);

        // B. DOI CHAN DEN CAY DONG (x = -1.8m va x = 1.8m, z = 0.5m)
        [-1.8, 1.8].forEach(x => {
            const candleGroup = new THREE.Group();
            candleGroup.position.set(x, 1.15, 0.5);

            const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.24, 0.55, 16), bronzeMat);
            stand.position.y = 0.28;
            candleGroup.add(stand);

            const candle = new THREE.Mesh(
                new THREE.CylinderGeometry(0.065, 0.065, 0.6, 12),
                new THREE.MeshStandardMaterial({ color: 0xb51a1a, roughness: 0.5 })
            );
            candle.position.y = 0.75;
            candleGroup.add(candle);

            const flame = new THREE.Mesh(
                new THREE.ConeGeometry(0.055, 0.18, 8),
                new THREE.MeshBasicMaterial({ color: 0xffb703 })
            );
            flame.position.set(0, 1.12, 0);
            candleGroup.add(flame);

            altarGroup.add(candleGroup);
        });

        // C. MAM BONG NGU QUA TRANG NGHIEM (z = 1.1m, tien ve mep ban truoc)
        const fruitGroup = new THREE.Group();
        fruitGroup.position.set(0, 1.15, 1.1);

        const plate = new THREE.Mesh(
            new THREE.CylinderGeometry(0.55, 0.36, 0.12, 20),
            new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.85 })
        );
        plate.position.y = 0.06;
        fruitGroup.add(plate);

        const pomelo = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 14, 12),
            new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.6 })
        );
        pomelo.position.set(0, 0.24, 0);
        fruitGroup.add(pomelo);

        [-0.16, 0.16].forEach((fx, idx) => {
            const fruit = new THREE.Mesh(
                new THREE.SphereGeometry(0.10, 10, 10),
                new THREE.MeshStandardMaterial({ color: idx === 0 ? 0xdc2626 : 0xf97316, roughness: 0.5 })
            );
            fruit.position.set(fx, 0.18, 0.14);
            fruitGroup.add(fruit);
        });
        altarGroup.add(fruitGroup);

        // D. DOI LO HOA SEN HONG (x = -2.8m va x = 2.8m, z = 0.5m)
        [-2.8, 2.8].forEach(x => {
            const vaseGroup = new THREE.Group();
            vaseGroup.position.set(x, 1.15, 0.5);

            const vase = new THREE.Mesh(
                new THREE.CylinderGeometry(0.20, 0.15, 0.85, 16),
                new THREE.MeshStandardMaterial({ color: 0x1e3a2f, roughness: 0.3 })
            );
            vase.position.y = 0.42;
            vaseGroup.add(vase);

            const lotus = new THREE.Mesh(
                new THREE.SphereGeometry(0.18, 10, 10),
                new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.4 })
            );
            lotus.position.set(0, 0.95, 0);
            vaseGroup.add(lotus);

            altarGroup.add(vaseGroup);
        });

        // E. DOI HAC NGU LUNG RUA DONG DUNG SAN CHAU
        function createCraneTurtle(xPos) {
            const group = new THREE.Group();
            group.position.set(xPos, 0, 0.2);

            const turtle = new THREE.Mesh(new THREE.SphereGeometry(0.42, 14, 12), bronzeMat);
            turtle.scale.set(1.4, 0.45, 1.2);
            turtle.position.y = 0.19;
            turtle.castShadow = true;
            group.add(turtle);

            [-0.09, 0.09].forEach(lx => {
                const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.35, 8), bronzeMat);
                leg.position.set(lx, 0.90, 0);
                group.add(leg);
            });

            const body = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.65, 12), bronzeMat);
            body.rotation.x = Math.PI / 2.3;
            body.position.set(0, 1.62, 0);
            group.add(body);

            const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.048, 0.85, 8), bronzeMat);
            neck.position.set(0, 2.15, 0.1);
            neck.rotation.x = -0.2;
            group.add(neck);

            const head = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.24, 6), bronzeMat);
            head.rotation.x = -Math.PI / 2;
            head.position.set(0, 2.58, 0.24);
            group.add(head);

            const lotusFlower = new THREE.Mesh(
                new THREE.SphereGeometry(0.12, 10, 8),
                new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3, metalness: 0.8 })
            );
            lotusFlower.position.set(0, 2.60, 0.38);
            group.add(lotusFlower);

            return group;
        }

        altarGroup.add(createCraneTurtle(-3.9));
        altarGroup.add(createCraneTurtle(3.9));

        scene.add(altarGroup);
    }function buildPrayerCushions() {
        const cushionMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.65 });
        const rimMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.35, metalness: 0.7 });
        const centerMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });

        // Tách ra 2 bên cánh Chánh Điện, chừa lối đi chính giữa rộng 4m hướng thẳng tới Đại Lư Hương và Bàn Thờ
        const rows = [-6.8, -5.2, -3.6];
        const leftCols = [-3.4, -2.0];
        const rightCols = [2.0, 3.4];
        const allCols = [...leftCols, ...rightCols];

        rows.forEach(z => {
            allCols.forEach(x => {
                const cGroup = new THREE.Group();
                cGroup.position.set(x, 0.66, z);

                // Thân đệm nhung đỏ
                const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.50, 0.12, 24), cushionMat);
                cushion.position.y = 0.06;
                cushion.castShadow = true;
                cGroup.add(cushion);

                // Viền gấm thêu chỉ vàng sang trọng
                const rim = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.028, 8, 24), rimMat);
                rim.rotation.x = Math.PI / 2;
                rim.position.y = 0.06;
                cGroup.add(rim);

                // Tâm hoa sen thêu ở giữa bồ đoàn
                const centerLotus = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.01, 16), centerMat);
                centerLotus.position.y = 0.125;
                cGroup.add(centerLotus);

                scene.add(cGroup);
                CUSHIONS.push(new THREE.Vector3(x, 0.66, z));
            });
        });
    }

    // ==========================================
    // 🪷 HAI HỒ SEN TOÀN PHẦN 2 BÊN HÔNG CHÁNH ĐIỆN VỚI CẦU ĐÁ BẮC NGANG CÓ THỂ ĐI QUA
    // ==========================================
    function buildRearGarden(stoneTex) {
        const pondGroup = new THREE.Group();
        const pondX = 0;
        const pondZ = -24.2;
        pondGroup.position.set(pondX, 0, pondZ);

        const pondStoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, bumpMap: stoneTex, bumpScale: 0.035, roughness: 0.9 });
        const waterTex = ProceduralTextures.createWaterRipple();
        waterTex.repeat.set(2, 2);
        const waterMat = new THREE.MeshStandardMaterial({
            map: waterTex,
            color: 0xb6d4c5,
            roughness: 0.16,
            metalness: 0.28
        });

        const pondBed = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshStandardMaterial({ color: 0x34483a, roughness: 1 }));
        pondBed.rotation.x = -Math.PI / 2;
        pondBed.scale.set(7.1, 4.5, 1);
        pondBed.position.y = 0.03;
        pondGroup.add(pondBed);

        const water = new THREE.Mesh(new THREE.CircleGeometry(1, 64), waterMat);
        water.rotation.x = -Math.PI / 2;
        water.scale.set(6.65, 4.02, 1);
        water.position.y = 0.18;
        pondGroup.add(water);
        waterMeshList.push(water);

        const stoneRim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.105, 8, 64), pondStoneMat);
        stoneRim.rotation.x = -Math.PI / 2;
        stoneRim.scale.set(6.85, 4.2, 1);
        stoneRim.position.y = 0.16;
        stoneRim.castShadow = true;
        pondGroup.add(stoneRim);

        const shoreRockGeo = new THREE.IcosahedronGeometry(0.32, 0);
        for (let i = 0; i < 34; i++) {
            const angle = (i / 34) * Math.PI * 2;
            const rock = new THREE.Mesh(shoreRockGeo, pondStoneMat);
            rock.position.set(Math.cos(angle) * (6.9 + Math.random() * 0.22), 0.17, Math.sin(angle) * (4.25 + Math.random() * 0.18));
            rock.scale.set(0.8 + Math.random() * 0.65, 0.45 + Math.random() * 0.35, 0.75 + Math.random() * 0.5);
            rock.rotation.set(Math.random() * 0.35, Math.random() * Math.PI, Math.random() * 0.3);
            rock.castShadow = true;
            pondGroup.add(rock);
        }

        // A short stepping-stone path leads from the rear hall to the water garden.
        for (let i = 0; i < 6; i++) {
            const stone = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.14, 0.72), pondStoneMat);
            stone.position.set((Math.random() - 0.5) * 0.35, 0.08, -16.6 - i * 0.62);
            stone.rotation.y = (Math.random() - 0.5) * 0.16;
            stone.receiveShadow = true;
            scene.add(stone);
        }

        const lilyLeafMat = new THREE.MeshStandardMaterial({ color: 0x39734a, roughness: 0.74, side: THREE.DoubleSide });
        const lilyVeinMat = new THREE.MeshStandardMaterial({ color: 0x86a96b, roughness: 0.8 });
        const petalMats = [
            new THREE.MeshStandardMaterial({ color: 0xf2c6d1, roughness: 0.62, side: THREE.DoubleSide }),
            new THREE.MeshStandardMaterial({ color: 0xffe9d5, roughness: 0.62, side: THREE.DoubleSide })
        ];
        const leafGeo = new THREE.CircleGeometry(0.55, 24);
        const flowerPetalGeo = new THREE.SphereGeometry(0.16, 10, 7);
        const flowerCoreGeo = new THREE.SphereGeometry(0.10, 10, 7);
        const flowerCoreMat = new THREE.MeshStandardMaterial({ color: 0xf3be4d, roughness: 0.58 });

        for (let i = 0; i < 22; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.35 + Math.random() * 0.68;
            const x = Math.cos(angle) * 5.7 * radius;
            const z = Math.sin(angle) * 3.2 * radius;
            const leaf = new THREE.Mesh(leafGeo, lilyLeafMat);
            leaf.rotation.x = -Math.PI / 2;
            leaf.rotation.z = Math.random() * Math.PI;
            leaf.scale.set(0.72 + Math.random() * 0.55, 0.72 + Math.random() * 0.55, 1);
            leaf.position.set(x, 0.205, z);
            pondGroup.add(leaf);

            const vein = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.012, 0.43), lilyVeinMat);
            vein.position.set(x, 0.211, z);
            vein.rotation.y = angle;
            pondGroup.add(vein);
        }

        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + 0.35;
            const flower = new THREE.Group();
            flower.position.set(Math.cos(angle) * (2.6 + (i % 2) * 1.4), 0.29, Math.sin(angle) * (1.5 + (i % 2) * 0.8));
            for (let p = 0; p < 8; p++) {
                const petalAngle = (p / 8) * Math.PI * 2;
                const petal = new THREE.Mesh(flowerPetalGeo, petalMats[i % 2]);
                petal.position.set(Math.cos(petalAngle) * 0.19, 0.025 + (p % 2) * 0.045, Math.sin(petalAngle) * 0.19);
                petal.scale.set(0.65, 1.25, 0.5);
                flower.add(petal);
            }
            flower.add(new THREE.Mesh(flowerCoreGeo, flowerCoreMat));
            pondGroup.add(flower);
        }

        scene.add(pondGroup);

        // Koi are independent scene objects so their swim paths stay in world coordinates.
        const koiBodyMat = new THREE.MeshStandardMaterial({ color: 0xf4ead7, roughness: 0.42 });
        const koiRedMat = new THREE.MeshStandardMaterial({ color: 0xc84b32, roughness: 0.48 });
        const koiBlackMat = new THREE.MeshStandardMaterial({ color: 0x292a28, roughness: 0.5 });
        const koiEyeMat = new THREE.MeshBasicMaterial({ color: 0x17120f });
        for (let i = 0; i < 7; i++) {
            const koi = new THREE.Group();
            const body = new THREE.Mesh(new THREE.SphereGeometry(0.27, 12, 9), koiBodyMat);
            body.scale.set(1.55, 0.58, 0.72);
            koi.add(body);
            const patch = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 7), i % 3 === 0 ? koiBlackMat : koiRedMat);
            patch.position.set(0.12, 0.12, 0);
            patch.scale.set(1.05, 0.55, 0.85);
            koi.add(patch);
            const tail = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), koiBodyMat);
            tail.position.x = -0.43;
            tail.scale.set(0.45, 0.18, 0.9);
            koi.add(tail);
            const tailFin = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.28, 5), koiRedMat);
            tailFin.position.x = -0.56;
            tailFin.rotation.z = Math.PI / 2;
            koi.add(tailFin);
            [-1, 1].forEach(side => {
                const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 5), koiEyeMat);
                eye.position.set(0.27, 0.045, side * 0.13);
                koi.add(eye);
            });
            const baseX = pondX + (Math.random() - 0.5) * 3.6;
            const baseZ = pondZ + (Math.random() - 0.5) * 1.8;
            koi.position.set(baseX, 0.25, baseZ);
            scene.add(koi);
            koiFishList.push({ mesh: koi, baseX, baseZ, speed: 0.2 + Math.random() * 0.18, angle: Math.random() * Math.PI * 2 });
        }

        const gardenLeafMats = [
            new THREE.MeshStandardMaterial({ color: 0x34593b, roughness: 0.93 }),
            new THREE.MeshStandardMaterial({ color: 0x507449, roughness: 0.92 }),
            new THREE.MeshStandardMaterial({ color: 0x6f8050, roughness: 0.9 })
        ];
        const gardenFlowerMats = [
            new THREE.MeshStandardMaterial({ color: 0xffd9c6, roughness: 0.7 }),
            new THREE.MeshStandardMaterial({ color: 0xe8bdcf, roughness: 0.7 }),
            new THREE.MeshStandardMaterial({ color: 0xf2e6bf, roughness: 0.7 })
        ];
        const bushGeo = new THREE.IcosahedronGeometry(0.54, 1);
        const gardenFlowerGeo = new THREE.SphereGeometry(0.08, 8, 6);
        [-1, 1].forEach(side => {
            for (let bedIndex = 0; bedIndex < 4; bedIndex++) {
                const bed = new THREE.Group();
                bed.position.set(side * (8.8 + (bedIndex % 2) * 1.1), 0, -19.2 - Math.floor(bedIndex / 2) * 7.0);
                for (let b = 0; b < 4; b++) {
                    const bush = new THREE.Mesh(bushGeo, gardenLeafMats[(b + bedIndex) % gardenLeafMats.length]);
                    bush.position.set((Math.random() - 0.5) * 1.4, 0.45 + Math.random() * 0.18, (Math.random() - 0.5) * 1.4);
                    bush.scale.set(1.2, 0.72 + Math.random() * 0.24, 1.0);
                    bush.castShadow = true;
                    bed.add(bush);
                }
                for (let f = 0; f < 7; f++) {
                    const bloom = new THREE.Mesh(gardenFlowerGeo, gardenFlowerMats[(f + bedIndex) % gardenFlowerMats.length]);
                    bloom.position.set((Math.random() - 0.5) * 1.6, 0.75, (Math.random() - 0.5) * 1.6);
                    bloom.scale.set(1, 0.65, 1);
                    bed.add(bloom);
                }
                scene.add(bed);
            }
        });

        // Two carved stone lanterns frame the garden and cast a gentle amber pool of light.
        const lanternStoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.92 });
        const lanternGlowMat = new THREE.MeshStandardMaterial({ color: 0xffdfa0, emissive: 0xd27a26, emissiveIntensity: 0.65, roughness: 0.35 });
        [-1, 1].forEach(side => {
            const lantern = new THREE.Group();
            lantern.position.set(side * 9.8, 0, -24.0);
            const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.3, 8), lanternStoneMat);
            base.position.y = 0.15;
            lantern.add(base);
            const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 1.1, 8), lanternStoneMat);
            shaft.position.y = 0.82;
            lantern.add(shaft);
            const chamber = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.58, 0.72), lanternGlowMat);
            chamber.position.y = 1.62;
            lantern.add(chamber);
            const roof = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.38, 4), lanternStoneMat);
            roof.position.y = 2.1;
            roof.rotation.y = Math.PI / 4;
            lantern.add(roof);
            scene.add(lantern);
            const glow = new THREE.PointLight(0xffbd69, 0.48, 7);
            glow.position.set(side * 9.8, 1.65, -24.0);
            scene.add(glow);
        });
    }

    function buildFullScenicSideLakes(stoneTex) {
        const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, bumpMap: stoneTex, bumpScale: 0.025, roughness: 0.9 });
        const redWoodMat = new THREE.MeshStandardMaterial({ color: 0x8b1e0f, roughness: 0.5 });
        const waterTex = ProceduralTextures.createWaterRipple();
        const waterMat = new THREE.MeshStandardMaterial({
            map: waterTex,
            roughness: 0.08,
            metalness: 0.25,
            transparent: true,
            opacity: 0.92
        });

        // Chiều rộng: 10.5m (từ x = ±12.0 đến ±22.5)
        // Chiều dài: 21m (từ z = -13.5 đến 7.5)
        [-1, 1].forEach(side => {
            const lakeGroup = new THREE.Group();
            const lakeCenterX = side * 17.25;
            const lakeCenterZ = -3.0;
            const lakeWidth = 10.5;
            const lakeLength = 21.0;

            lakeGroup.position.set(lakeCenterX, 0, lakeCenterZ);

            // 1. Mặt Nước Biếc Hồ Sen
            const water = new THREE.Mesh(
                new THREE.PlaneGeometry(lakeWidth - 0.4, lakeLength - 0.4),
                waterMat
            );
            water.rotation.x = -Math.PI / 2;
            water.position.y = 0.18;
            lakeGroup.add(water);
            waterMeshList.push(water);

            // 2. Bờ Kè Đá Bao Quanh Hồ
            const curbHeight = 0.55;
            const curbThick = 0.5;

            [-lakeLength / 2, lakeLength / 2].forEach(lz => {
                const curb = new THREE.Mesh(new THREE.BoxGeometry(lakeWidth, curbHeight, curbThick), stoneMat);
                curb.position.set(0, curbHeight / 2, lz);
                lakeGroup.add(curb);
            });
            [-lakeWidth / 2, lakeWidth / 2].forEach(lx => {
                const curb = new THREE.Mesh(new THREE.BoxGeometry(curbThick, curbHeight, lakeLength), stoneMat);
                curb.position.set(lx, curbHeight / 2, 0);
                lakeGroup.add(curb);
            });

            // 3. Trụ Đá Búp Sen Lan Can Hồ
            const pillarGeo = new THREE.CylinderGeometry(0.10, 0.12, 0.85, 12);
            const budGeo = new THREE.SphereGeometry(0.12, 8, 8);
            const railPillarMat = new THREE.MeshStandardMaterial({ color: 0x5a534c, roughness: 0.8 });

            for (let rz = -lakeLength / 2; rz <= lakeLength / 2; rz += 3.5) {
                // Chừa lối đi cầu bắc ngang tại giữa hồ (|rz| < 1.4)
                if (Math.abs(rz) < 1.4) continue;

                // Dọc bờ trong
                const pilIn = new THREE.Mesh(pillarGeo, stoneMat);
                pilIn.position.set(-side * (lakeWidth / 2), 0.45, rz);
                lakeGroup.add(pilIn);

                const budIn = new THREE.Mesh(budGeo, railPillarMat);
                budIn.position.set(-side * (lakeWidth / 2), 0.90, rz);
                lakeGroup.add(budIn);

                // Dọc bờ ngoài
                const pilOut = new THREE.Mesh(pillarGeo, stoneMat);
                pilOut.position.set(side * (lakeWidth / 2), 0.45, rz);
                lakeGroup.add(pilOut);

                const budOut = new THREE.Mesh(budGeo, railPillarMat);
                budOut.position.set(side * (lakeWidth / 2), 0.90, rz);
                lakeGroup.add(budOut);
            }

            // 4. LỐI ĐI LÁT ĐÁ (STONE PAVED PROMENADES)
            // Lối đi ven bờ trong (giữa Chánh Điện và Hồ Sen)
            const innerWalkway = new THREE.Mesh(
                new THREE.BoxGeometry(1.6, 0.12, lakeLength + 2.0),
                stoneMat
            );
            innerWalkway.position.set(-side * (lakeWidth / 2 + 0.9), 0.06, 0);
            innerWalkway.receiveShadow = true;
            lakeGroup.add(innerWalkway);

            // Lối đi ven bờ ngoài (sát tường bao)
            const outerWalkway = new THREE.Mesh(
                new THREE.BoxGeometry(1.4, 0.12, lakeLength + 2.0),
                stoneMat
            );
            outerWalkway.position.set(side * (lakeWidth / 2 + 0.8), 0.06, 0);
            outerWalkway.receiveShadow = true;
            lakeGroup.add(outerWalkway);

            // 5. CẦU ĐÁ VÒM CONG BẮC NGANG HỒ (CÓ THỂ ĐI QUA ĐƯỢC)
            const bridgeGroup = new THREE.Group();
            bridgeGroup.position.set(0, 0, 0);

            const bridgeSegments = 16;
            const bridgeWidth = lakeWidth;
            const bridgeWalkBreadth = 2.4; // Bề rộng lối đi trên cầu

            for (let b = 0; b < bridgeSegments; b++) {
                const u1 = (b / bridgeSegments) * 2 - 1;
                const u2 = ((b + 1) / bridgeSegments) * 2 - 1;
                const bx = (u1 + u2) / 2 * (bridgeWidth / 2);
                const segW = (bridgeWidth / bridgeSegments) * 1.05;

                const archH1 = Math.max(0, 1 - u1 * u1) * 0.50;
                const archH2 = Math.max(0, 1 - u2 * u2) * 0.50;
                const by = 0.65 + (archH1 + archH2) / 2;

                const plank = new THREE.Mesh(
                    new THREE.BoxGeometry(segW, 0.16, bridgeWalkBreadth),
                    stoneMat
                );
                plank.position.set(bx, by, 0);
                plank.rotation.z = Math.atan2(archH2 - archH1, segW);
                plank.castShadow = true;
                plank.receiveShadow = true;
                bridgeGroup.add(plank);
            }

            // Tay vịn lan can cầu sơn son đỏ thắm
            [-bridgeWalkBreadth / 2, bridgeWalkBreadth / 2].forEach(rz => {
                for (let b = 0; b <= bridgeSegments; b += 2) {
                    const u = (b / bridgeSegments) * 2 - 1;
                    const px = u * (bridgeWidth / 2);
                    const py = 0.65 + Math.max(0, 1 - u * u) * 0.50;

                    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.75, 0.12), redWoodMat);
                    post.position.set(px, py + 0.38, rz);
                    bridgeGroup.add(post);

                    const postCap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), stoneMat);
                    postCap.position.set(px, py + 0.78, rz);
                    bridgeGroup.add(postCap);
                }

                const handrail = new THREE.Mesh(new THREE.BoxGeometry(bridgeWidth, 0.1, 0.1), redWoodMat);
                handrail.position.set(0, 1.25, rz);
                bridgeGroup.add(handrail);
            });

            lakeGroup.add(bridgeGroup);

            // 6. ĐÈN ĐÁ NON BỘ SOI BÓNG NƯỚC
            [[-3.2, -6.5], [3.2, -6.5], [-3.2, 6.5], [3.2, 6.5]].forEach(([lx, lz]) => {
                const lanternGroup = new THREE.Group();
                lanternGroup.position.set(lx, 0.55, lz);

                const base = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.3, 8), stoneMat);
                lanternGroup.add(base);

                const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.6, 8), stoneMat);
                shaft.position.y = 0.42;
                lanternGroup.add(shaft);

                const chamber = new THREE.Mesh(
                    new THREE.BoxGeometry(0.35, 0.35, 0.35),
                    new THREE.MeshStandardMaterial({ color: 0xffe6a3, roughness: 0.3, emissive: 0x443311 })
                );
                chamber.position.y = 0.85;
                lanternGroup.add(chamber);

                const lRoof = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.25, 4), stoneMat);
                lRoof.position.y = 1.15;
                lRoof.rotation.y = Math.PI / 4;
                lanternGroup.add(lRoof);

                lakeGroup.add(lanternGroup);
            });

            // 7. HOA SEN & LÁ SEN BẬP BỀNH TRÊN MẶT HỒ
            const leafMat = new THREE.MeshStandardMaterial({ color: 0x1f7a28, roughness: 0.6 });
            const pinkLotusMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.35 });
            const whiteLotusMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });

            for (let i = 0; i < 48; i++) {
                const lx = (Math.random() - 0.5) * (lakeWidth - 1.8);
                const lz = (Math.random() - 0.5) * (lakeLength - 1.8);

                if (Math.abs(lz) > 1.5) {
                    const leaf = new THREE.Mesh(new THREE.CircleGeometry(0.38 + Math.random() * 0.28, 14), leafMat);
                    leaf.rotation.x = -Math.PI / 2;
                    leaf.position.set(lx, 0.2, lz);
                    lakeGroup.add(leaf);

                    if (i % 3 === 0) {
                        const fl = new THREE.Mesh(
                            new THREE.SphereGeometry(0.15, 8, 8),
                            i % 2 === 0 ? pinkLotusMat : whiteLotusMat
                        );
                        fl.position.set(lx, 0.33, lz);
                        lakeGroup.add(fl);
                    }
                }
            }

            // 8. ĐÀN CÁ KOI BƠI LỘI TRONG LÀN NƯỚC
            for (let k = 0; k < 10; k++) {
                const fishColor = k % 3 === 0 ? 0xdc2626 : (k % 3 === 1 ? 0xf97316 : 0xfacc15);
                const fish = new THREE.Mesh(
                    new THREE.ConeGeometry(0.09, 0.52, 8),
                    new THREE.MeshStandardMaterial({ color: fishColor, roughness: 0.3 })
                );
                fish.rotation.x = Math.PI / 2;
                const fx = (Math.random() - 0.5) * (lakeWidth - 2.5);
                const fz = (Math.random() - 0.5) * (lakeLength - 2.5);
                fish.position.set(fx, 0.12, fz);
                lakeGroup.add(fish);

                koiFishList.push({
                    mesh: fish,
                    baseX: lakeCenterX + fx,
                    baseZ: lakeCenterZ + fz,
                    speed: 0.7 + Math.random() * 0.6,
                    angle: Math.random() * Math.PI * 2
                });
            }

            scene.add(lakeGroup);
        });
    }

    function buildBellAndWoodenFish(bronzeTex, woodTex) {
        const bronzeMat = new THREE.MeshStandardMaterial({ map: bronzeTex, roughness: 0.35, metalness: 0.85 });
        const templeWoodMat = new THREE.MeshStandardMaterial({
            color: 0x5a2d0c, // Go mit son son danh bong
            roughness: 0.38,
            metalness: 0.15
        });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.85 });

        // A. DAI HONG CHUNG (BEN TRAI CHANH DIEN)
        const bellGroup = new THREE.Group();
        bellGroup.position.set(-6.8, 0.65, -6.0);

        [-1.05, 1.05].forEach(x => {
            const p = new THREE.Mesh(new THREE.BoxGeometry(0.28, 4.4, 0.28), templeWoodMat);
            p.position.set(x, 2.2, 0);
            p.castShadow = true;
            bellGroup.add(p);
        });
        const beam = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.28, 0.28), templeWoodMat);
        beam.position.set(0, 4.25, 0);
        bellGroup.add(beam);

        bellMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.88, 1.7, 24, 1, true), bronzeMat);
        bellMesh.position.set(0, 2.9, 0);
        bellMesh.castShadow = true;
        bellGroup.add(bellMesh);

        const bellTop = new THREE.Mesh(new THREE.SphereGeometry(0.44, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), bronzeMat);
        bellTop.position.set(0, 3.75, 0);
        bellGroup.add(bellTop);
        scene.add(bellGroup);

        // B. CHIEC MO GO (MOC NGU - HINH CA CHEP HOA RONG CHAU NGOC CO RANH MIENG CA)
        const fishGroup = new THREE.Group();
        fishGroup.position.set(6.8, 0.65, -6.0);

        // Don go bat giac do mo
        const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.92, 0.18, 8), templeWoodMat);
        plinth.position.y = 0.09;
        plinth.receiveShadow = true;
        fishGroup.add(plinth);

        // Dem gam tron theu hoa sen co vien thep vang
        const cushionMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.55 });
        const cushion = new THREE.Mesh(new THREE.CylinderGeometry(0.80, 0.82, 0.26, 24), cushionMat);
        cushion.position.y = 0.31;
        cushion.castShadow = true;
        fishGroup.add(cushion);

        // 4 Tua rua vang (tassels) buong ru 4 goc dem gam
        for (let t = 0; t < 4; t++) {
            const ang = (t / 4) * Math.PI * 2 + Math.PI / 4;
            const tassel = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.24, 8), goldMat);
            tassel.position.set(Math.cos(ang) * 0.82, 0.22, Math.sin(ang) * 0.82);
            tassel.rotation.z = Math.cos(ang) * 0.3;
            fishGroup.add(tassel);
        }

        // Than Mo go (Moc Ngu) - hinh bau duc ca chep hoa rong, khong phai trai banh
        const fishMocNgu = new THREE.Group();
        fishMocNgu.position.y = 0.72;

        // Khoi than mo go bau duc
        const bodyGeo = new THREE.SphereGeometry(0.55, 24, 20);
        bodyGeo.scale(1.35, 0.85, 1.1);
        const mocNguBody = new THREE.Mesh(bodyGeo, templeWoodMat);
        mocNguBody.castShadow = true;
        fishMocNgu.add(mocNguBody);

        // Ranh mieng ca xe ngang phia truoc (khe am thanh phat ra tieng Coc Coc)
        const mouthSlot = new THREE.Mesh(
            new THREE.BoxGeometry(0.85, 0.06, 0.38),
            new THREE.MeshBasicMaterial({ color: 0x1a0500 })
        );
        mouthSlot.position.set(0, 0.02, 0.48);
        fishMocNgu.add(mouthSlot);

        // Mep son son do tham quanh ranh mieng ca
        const mouthLip = new THREE.Mesh(
            new THREE.TorusGeometry(0.42, 0.025, 8, 20, Math.PI),
            new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4 })
        );
        mouthLip.position.set(0, 0.02, 0.50);
        mouthLip.rotation.x = Math.PI / 2;
        fishMocNgu.add(mouthLip);

        // Quai cam hinh 2 dau rong chau ngoc phia sau mo
        const dragonHandle = new THREE.Mesh(
            new THREE.TorusGeometry(0.32, 0.065, 10, 24, Math.PI * 1.2),
            templeWoodMat
        );
        dragonHandle.position.set(0, 0.08, -0.42);
        dragonHandle.rotation.x = Math.PI / 1.8;
        fishMocNgu.add(dragonHandle);

        // Vien vang thep hoa van may va vay ca tren lung mo
        [-0.32, 0.32].forEach(x => {
            const scaleRidge = new THREE.Mesh(
                new THREE.TorusGeometry(0.22, 0.02, 6, 16, Math.PI),
                goldMat
            );
            scaleRidge.position.set(x, 0.22, 0);
            scaleRidge.rotation.x = Math.PI / 2;
            scaleRidge.rotation.y = (x > 0 ? 1 : -1) * 0.4;
            fishMocNgu.add(scaleRidge);
        });

        woodenFishMesh = fishMocNgu;
        fishGroup.add(fishMocNgu);

        // Chiec dui go mo (Striker/Mallet) can dai dau boc ni do gac ben dem
        const mallet = new THREE.Group();
        mallet.position.set(0.65, 0.46, 0.35);
        mallet.rotation.z = -0.55;
        mallet.rotation.y = 0.4;

        const malletHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.65, 8), templeWoodMat);
        mallet.add(malletHandle);

        const malletHead = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 12, 10),
            new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.6 })
        );
        malletHead.position.y = 0.32;
        mallet.add(malletHead);
        fishGroup.add(mallet);

        scene.add(fishGroup);
    }

    function buildYardIncenseUrn(bronzeTex) {
        const bronzeMat = new THREE.MeshStandardMaterial({ map: bronzeTex, roughness: 0.4, metalness: 0.85 });
        const sandMat = new THREE.MeshStandardMaterial({ color: 0xdfcead, roughness: 0.95 });

        const yardUrn = new THREE.Group();
        yardUrn.position.copy(INTERACTION_ZONES.yardUrn);

        const bigUrn = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 0.95, 1.25, 28), bronzeMat);
        bigUrn.castShadow = true;
        yardUrn.add(bigUrn);

        const bigSand = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.08, 28), sandMat);
        bigSand.position.y = 0.6;
        yardUrn.add(bigSand);

        for (let i = 0; i < 3; i++) {
            const legAngle = (i / 3) * Math.PI * 2;
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.14, 0.85, 12), bronzeMat);
            leg.position.set(Math.cos(legAngle) * 0.85, -0.72, Math.sin(legAngle) * 0.85);
            yardUrn.add(leg);
        }
        scene.add(yardUrn);
    }

    // ==========================================
    // 🪷 ĐẠI ĐỒNG LƯ HƯƠNG GIỮA CHÁNH ĐIỆN (PHỤC HỒI UY NGHI SỪNG SỮNG GIỮA SẢNH)
    // ==========================================
    function buildCentralSanctuaryUrn(bronzeTex) {
        const urnGroup = new THREE.Group();
        urnGroup.position.set(0, 0.65, -4.5); // Tọa lạc trang nghiêm ngay chính giữa Chánh Điện

        const bronzeMat = new THREE.MeshStandardMaterial({ map: bronzeTex, roughness: 0.32, metalness: 0.88 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.85 });
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5a534c, roughness: 0.85 });

        // 1. Đế đá bát giác chạm hoa sen vững chãi
        const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.15, 0.22, 8), stoneMat);
        plinth.position.y = 0.11;
        plinth.receiveShadow = true;
        urnGroup.add(plinth);

        const lotusTier = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.98, 0.15, 16), goldMat);
        lotusTier.position.y = 0.28;
        urnGroup.add(lotusTier);

        // 2. Ba chân quỳ tam cước sư tử đúc đồng
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const legGroup = new THREE.Group();
            legGroup.position.set(Math.cos(angle) * 0.52, 0.35, Math.sin(angle) * 0.52);
            legGroup.rotation.y = -angle + Math.PI / 2;

            const paw = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), bronzeMat);
            paw.scale.set(1.0, 1.4, 0.8);
            legGroup.add(paw);

            const knee = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 0.35, 12), bronzeMat);
            knee.position.y = 0.18;
            legGroup.add(knee);

            urnGroup.add(legGroup);
        }

        // 3. Thân vạc lư đồng bầu tròn chạm song long chầu nguyệt
        const urnCauldron = new THREE.Mesh(new THREE.SphereGeometry(0.72, 28, 20), bronzeMat);
        urnCauldron.scale.set(1.0, 0.75, 1.0);
        urnCauldron.position.y = 0.78;
        urnCauldron.castShadow = true;
        urnGroup.add(urnCauldron);

        // Vành miệng lư hương dày dặn đúc hạt cườm
        const urnRim = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.08, 12, 32), bronzeMat);
        urnRim.rotation.x = Math.PI / 2;
        urnRim.position.y = 1.05;
        urnGroup.add(urnRim);

        // Lòng bát cát vàng mịn để cắm nhang
        const urnSand = new THREE.Mesh(
            new THREE.CylinderGeometry(0.62, 0.62, 0.1, 24),
            new THREE.MeshStandardMaterial({ color: 0xdfcead, roughness: 0.95 })
        );
        urnSand.position.y = 1.02;
        urnGroup.add(urnSand);

        // 4. Đôi quai rồng uốn lượn hai bên
        [-0.78, 0.78].forEach(x => {
            const handle = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.055, 10, 20), bronzeMat);
            handle.position.set(x, 0.88, 0);
            handle.rotation.y = Math.PI / 2;
            handle.rotation.z = (Math.PI / 6) * (x > 0 ? 1 : -1);
            urnGroup.add(handle);
        });

        // 5. Nén tâm hương thắp sẵn nghi ngút khói thơm
        const incenseSticksGroup = new THREE.Group();
        incenseSticksGroup.position.set(0, 1.05, 0);

        for (let i = -2; i <= 2; i++) {
            const stick = new THREE.Mesh(
                new THREE.CylinderGeometry(0.009, 0.009, 0.65, 6),
                new THREE.MeshStandardMaterial({ color: 0x8b3a12 })
            );
            stick.position.set(i * 0.08 + (Math.random() - 0.5) * 0.04, 0.32, (Math.random() - 0.5) * 0.12);
            stick.rotation.z = i * 0.04;
            incenseSticksGroup.add(stick);

            const ember = new THREE.Mesh(
                new THREE.SphereGeometry(0.018, 6, 6),
                new THREE.MeshBasicMaterial({ color: 0xff3300 })
            );
            ember.position.set(stick.position.x, 0.64, stick.position.z);
            incenseSticksGroup.add(ember);
        }
        urnGroup.add(incenseSticksGroup);

        scene.add(urnGroup);
    }

    // ==========================================
    // 🌳 CÂY BỒ ĐỀ CỔ THỤ CHI TIẾT VỚI RỄ BẠNH & DẢI LỤA CÁT TƯỜNG
    // ==========================================
    function buildBodhiTree(pos) {
        const tree = new THREE.Group();
        tree.position.copy(pos);

        const barkMat = new THREE.MeshStandardMaterial({ color: 0x3d2516, roughness: 0.95 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x227038, roughness: 0.7 });
        const budMat = new THREE.MeshStandardMaterial({ color: 0x52b788, roughness: 0.6 });
        const goldRibbonMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4, metalness: 0.5 });

        // Gốc cây cổ thụ sần sùi với rễ bạnh bò ra sân gạch
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 1.35, 5.8, 16), barkMat);
        trunk.position.y = 2.9;
        trunk.castShadow = true;
        tree.add(trunk);

        // 5 rễ bạnh cổ thụ lan ra đất
        for (let r = 0; r < 5; r++) {
            const angle = (r / 5) * Math.PI * 2 + 0.3;
            const root = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.45, 1.8, 8), barkMat);
            root.position.set(Math.cos(angle) * 1.1, 0.6, Math.sin(angle) * 1.1);
            root.rotation.z = Math.cos(angle) * 0.45;
            root.rotation.x = Math.sin(angle) * 0.45;
            tree.add(root);
        }

        // Dải lụa cát tường vàng óng quấn quanh thân cây
        const ribbon = new THREE.Mesh(new THREE.CylinderGeometry(0.92, 0.96, 0.5, 16), goldRibbonMat);
        ribbon.position.y = 1.8;
        tree.add(ribbon);

        // Các cành cây lớn vươn rộng
        const branchAngles = [0, 1.3, 2.6, 3.9, 5.1];
        branchAngles.forEach((ang, idx) => {
            const bLen = 2.8 + (idx % 2) * 0.8;
            const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, bLen, 10), barkMat);
            branch.position.set(Math.cos(ang) * 1.4, 4.6 + idx * 0.3, Math.sin(ang) * 1.4);
            branch.rotation.z = Math.cos(ang) * 0.65;
            branch.rotation.x = -Math.sin(ang) * 0.65;
            tree.add(branch);

            // Tán lá Bồ Đề hình trái tim nhiều tầng
            const fSize = 2.2 + (idx % 2) * 0.5;
            const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(fSize, 1), leafMat);
            foliage.position.set(Math.cos(ang) * 2.8, 5.8 + idx * 0.4, Math.sin(ang) * 2.8);
            foliage.castShadow = true;
            tree.add(foliage);

            // Chồi búp non xanh mướt điểm xuyết phía trên
            const topBud = new THREE.Mesh(new THREE.DodecahedronGeometry(fSize * 0.55, 1), budMat);
            topBud.position.set(foliage.position.x, foliage.position.y + fSize * 0.5, foliage.position.z);
            tree.add(topBud);
        });

        // Tán ngọn chính giữa
        const crownFoliage = new THREE.Mesh(new THREE.DodecahedronGeometry(2.8, 1), leafMat);
        crownFoliage.position.set(0, 7.8, 0);
        tree.add(crownFoliage);

        scene.add(tree);
    }

    // ==========================================
    // 🌸 CÂY HOA SỨ / HOA ĐẠI CHÙA CHIỀN TRUYỀN THỐNG (FRANGIPANI)
    // ==========================================
    function buildFrangipaniTree(pos) {
        const tree = new THREE.Group();
        tree.position.copy(pos);

        // Chat lieu vo cay hoa dai san sui reu phong co kinh
        const barkMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.95 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.55 });
        const petalMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        const centerMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 }); // Nhuy vang ruc ro

        // 1. Goc cay co thu cuon cuon re truyen an sau vao dat
        const base = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.85, 0.8, 14), barkMat);
        base.position.y = 0.4;
        base.receiveShadow = true;
        tree.add(base);

        for (let r = 0; r < 5; r++) {
            const rAng = (r / 5) * Math.PI * 2;
            const root = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 1.2, 8), barkMat);
            root.position.set(Math.cos(rAng) * 0.75, 0.18, Math.sin(rAng) * 0.75);
            root.rotation.z = Math.cos(rAng) * 0.55;
            root.rotation.x = Math.sin(rAng) * 0.55;
            tree.add(root);
        }

        // 2. Than cay hoa su uon luon khuc khuyu phong tran
        const trunkLower = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.48, 1.8, 12), barkMat);
        trunkLower.position.set(0.08, 1.4, 0);
        trunkLower.rotation.z = -0.12;
        trunkLower.castShadow = true;
        tree.add(trunkLower);

        const trunkUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.38, 1.6, 12), barkMat);
        trunkUpper.position.set(-0.06, 2.8, 0.05);
        trunkUpper.rotation.z = 0.16;
        trunkUpper.castShadow = true;
        tree.add(trunkUpper);

        // 3. 5 Nhanh cay chinh vuon rong toa bong mat
        const branchConfigs = [
            { x: 1.1, y: 3.5, z: 0.4, rx: 0.3, rz: -0.65, len: 1.9, rBranch: 0.18 },
            { x: -1.2, y: 3.6, z: 0.2, rx: -0.2, rz: 0.72, len: 2.1, rBranch: 0.18 },
            { x: 0.2, y: 3.8, z: 1.3, rx: 0.68, rz: 0.15, len: 1.8, rBranch: 0.16 },
            { x: -0.3, y: 3.9, z: -1.2, rx: -0.72, rz: -0.2, len: 1.8, rBranch: 0.16 },
            { x: 0.1, y: 4.2, z: 0.1, rx: 0.1, rz: 0.1, len: 1.6, rBranch: 0.15 }
        ];

        branchConfigs.forEach(b => {
            const branch = new THREE.Mesh(new THREE.CylinderGeometry(b.rBranch * 0.7, b.rBranch, b.len, 8), barkMat);
            branch.position.set(b.x, b.y, b.z);
            branch.rotation.x = b.rx;
            branch.rotation.z = b.rz;
            branch.castShadow = true;
            tree.add(branch);

            // Cum la hoa su thuon dai xanh muot o dau moi nhanh cay
            const tipX = b.x + Math.sin(-b.rz) * b.len * 0.55;
            const tipY = b.y + Math.cos(b.rz) * b.len * 0.55;
            const tipZ = b.z + Math.sin(b.rx) * b.len * 0.55;

            // Vong la xanh tuoi
            for (let l = 0; l < 14; l++) {
                const lAng = (l / 14) * Math.PI * 2;
                const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.85, 5), leafMat);
                leaf.position.set(tipX + Math.cos(lAng) * 0.52, tipY + 0.15, tipZ + Math.sin(lAng) * 0.52);
                leaf.rotation.z = Math.cos(lAng) * 0.75;
                leaf.rotation.x = Math.sin(lAng) * 0.75;
                leaf.castShadow = true;
                tree.add(leaf);
            }

            // Chum hoa su 5 canh trang tinh khoi nhuy vang ngao ngat huong thom
            for (let fl = 0; fl < 4; fl++) {
                const flAng = (fl / 4) * Math.PI * 2;
                const flowerGroup = new THREE.Group();
                flowerGroup.position.set(tipX + Math.cos(flAng) * 0.35, tipY + 0.42, tipZ + Math.sin(flAng) * 0.35);

                const center = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), centerMat);
                flowerGroup.add(center);

                for (let p = 0; p < 5; p++) {
                    const pAng = (p / 5) * Math.PI * 2;
                    const petal = new THREE.Mesh(new THREE.CircleGeometry(0.075, 8), petalMat);
                    petal.position.set(Math.cos(pAng) * 0.08, Math.sin(pAng) * 0.08, 0);
                    petal.rotation.z = pAng;
                    flowerGroup.add(petal);
                }
                flowerGroup.rotation.x = -Math.PI / 3;
                tree.add(flowerGroup);
            }
        });

        scene.add(tree);
    }

    // ==========================================
    // GHE DA CHUA TRANG NHA DANG NHO DUOI BONG CAY
    // ==========================================
    function buildStoneBench(pos, rotY = 0) {
        const bench = new THREE.Group();
        bench.position.copy(pos);
        bench.rotation.y = rotY;

        const stoneMat = new THREE.MeshStandardMaterial({
            color: 0xdfddd8, // Da hoa cuong trang mai bong
            roughness: 0.35,
            metalness: 0.1
        });
        const darkStoneMat = new THREE.MeshStandardMaterial({
            color: 0x78716c,
            roughness: 0.7
        });

        // 2 Chan ghe da cham khac hoa sen vung chai
        [-0.75, 0.75].forEach(x => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.46, 0.48), darkStoneMat);
            leg.position.set(x, 0.23, 0);
            leg.castShadow = true;
            leg.receiveShadow = true;
            bench.add(leg);
        });

        // Mat ghe da nguyen khoi mai nhan
        const seat = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 0.58), stoneMat);
        seat.position.set(0, 0.50, 0);
        seat.castShadow = true;
        seat.receiveShadow = true;
        bench.add(seat);

        // Tua lung ghe da cham hoa sen thanh thoat
        const backRest = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.42, 0.07), stoneMat);
        backRest.position.set(0, 0.75, -0.25);
        backRest.rotation.x = -0.12;
        backRest.castShadow = true;
        bench.add(backRest);

        // Canh sen thep vang trang tri giua tua lung
        const lotusEmblem = new THREE.Mesh(
            new THREE.CircleGeometry(0.10, 8),
            new THREE.MeshBasicMaterial({ color: 0xd4af37 })
        );
        lotusEmblem.position.set(0, 0.76, -0.21);
        lotusEmblem.rotation.x = -0.12;
        bench.add(lotusEmblem);

        scene.add(bench);
    }

    function buildBonsaiPot(pos) {
        const potGroup = new THREE.Group();
        potGroup.position.copy(pos);

        const ceramicMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.25, metalness: 0.3 }); // Gốm sứ Bát Tràng men lam
        const soilMat = new THREE.MeshStandardMaterial({ color: 0x2e1a0e, roughness: 0.95 });
        const pineBarkMat = new THREE.MeshStandardMaterial({ color: 0x422817, roughness: 0.9 });
        const pineNeedleMat = new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.7 });

        // Đôn sứ / Chậu kiểng hình bát giác
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.40, 0.38, 8), ceramicMat);
        pot.position.y = 0.19;
        pot.castShadow = true;
        potGroup.add(pot);

        const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.05, 8), soilMat);
        soil.position.y = 0.37;
        potGroup.add(soil);

        // Cây tùng / bách bonsai cổ kính uốn dáng huyền
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 0.85, 8), pineBarkMat);
        stem.position.set(0.1, 0.75, 0);
        stem.rotation.z = -0.35;
        potGroup.add(stem);

        // Tán lá tùng cắt tỉa tròn thành nhiều tầng
        const tiers = [
            [0.22, 1.15, 0, 0.38],
            [-0.12, 1.0, 0.15, 0.32],
            [0.38, 0.85, -0.15, 0.28]
        ];
        tiers.forEach(([tx, ty, tz, tr]) => {
            const cloud = new THREE.Mesh(new THREE.CylinderGeometry(tr, tr * 1.1, 0.12, 12), pineNeedleMat);
            cloud.position.set(tx, ty, tz);
            potGroup.add(cloud);
        });

        scene.add(potGroup);
    }

    // ==========================================
    // 🎋 RẶNG TRÚC XANH THANH NHÃ VEN TƯỜNG CHÙA
    // ==========================================
    function buildBambooGrove(pos) {
        const grove = new THREE.Group();
        grove.position.copy(pos);

        const bambooMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.5 });
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.6 });

        for (let i = 0; i < 9; i++) {
            const bx = (Math.random() - 0.5) * 1.8;
            const bz = (Math.random() - 0.5) * 1.8;
            const bH = 5.2 + Math.random() * 2.0;

            const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, bH, 8), bambooMat);
            stalk.position.set(bx, bH / 2, bz);
            stalk.rotation.z = (Math.random() - 0.5) * 0.08;
            grove.add(stalk);

            const leaves = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 1), leafMat);
            leaves.position.set(bx, bH - 0.2, bz);
            grove.add(leaves);
        }

        scene.add(grove);
    }

    function buildCourtyardShrubs() {
        const leafMaterials = [
            new THREE.MeshStandardMaterial({ color: 0x31583d, roughness: 0.92 }),
            new THREE.MeshStandardMaterial({ color: 0x416b49, roughness: 0.9 }),
            new THREE.MeshStandardMaterial({ color: 0x58764b, roughness: 0.92 })
        ];
        const flowerPetalMat = new THREE.MeshStandardMaterial({ color: 0xf1e5ca, roughness: 0.72 });
        const flowerCenterMat = new THREE.MeshStandardMaterial({ color: 0xd6a83e, roughness: 0.7 });
        const leafGeo = new THREE.IcosahedronGeometry(0.48, 1);
        const petalGeo = new THREE.SphereGeometry(0.07, 8, 6);
        const centerGeo = new THREE.SphereGeometry(0.045, 8, 6);
        const positions = [-11, -6, 0, 8, 20];

        [-1, 1].forEach(side => {
            positions.forEach((z, groupIndex) => {
                const bed = new THREE.Group();
                bed.position.set(side * 24.8, 0, z);
                for (let i = 0; i < 5; i++) {
                    const leaf = new THREE.Mesh(leafGeo, leafMaterials[(i + groupIndex) % leafMaterials.length]);
                    leaf.position.set((Math.random() - 0.5) * 0.9, 0.38 + Math.random() * 0.24, (Math.random() - 0.5) * 1.35);
                    leaf.scale.set(1.15 + Math.random() * 0.35, 0.75 + Math.random() * 0.3, 1.0 + Math.random() * 0.35);
                    leaf.castShadow = true;
                    bed.add(leaf);
                }

                for (let f = 0; f < 2; f++) {
                    const flower = new THREE.Group();
                    flower.position.set((Math.random() - 0.5) * 0.75, 0.62, (Math.random() - 0.5) * 1.1);
                    for (let p = 0; p < 5; p++) {
                        const angle = (p / 5) * Math.PI * 2;
                        const petal = new THREE.Mesh(petalGeo, flowerPetalMat);
                        petal.position.set(Math.cos(angle) * 0.075, 0, Math.sin(angle) * 0.075);
                        petal.scale.set(1.0, 0.45, 1.5);
                        flower.add(petal);
                    }
                    flower.add(new THREE.Mesh(centerGeo, flowerCenterMat));
                    bed.add(flower);
                }
                scene.add(bed);
            });
        });
    }

    function setupTempleParticles() {
        const dustCount = 250;
        const dustGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(dustCount * 3);

        for (let i = 0; i < dustCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 24;
            positions[i + 1] = 0.5 + Math.random() * 7.5;
            positions[i + 2] = (Math.random() - 0.5) * 26;
        }
        dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const dustParticles = new THREE.Points(
            dustGeo,
            new THREE.PointsMaterial({
                color: 0xffe066,
                size: 0.09,
                transparent: true,
                opacity: 0.65,
                blending: THREE.AdditiveBlending
            })
        );
        scene.add(dustParticles);

        particleSystems.push({
            update: (delta) => {
                const pos = dustGeo.attributes.position.array;
                for (let i = 1; i < dustCount * 3; i += 3) {
                    pos[i] += delta * 0.18;
                    if (pos[i] > 7.5) pos[i] = 0.5;
                }
                dustGeo.attributes.position.needsUpdate = true;
            }
        });
    }

    function createIncenseStick(x, y, z, stickId) {
        const stickGroup = new THREE.Group();
        stickGroup.position.set(x, y, z);

        const stick = new THREE.Mesh(
            new THREE.CylinderGeometry(0.012, 0.012, 0.48, 6),
            new THREE.MeshStandardMaterial({ color: 0x8b3a12 })
        );
        stick.position.y = 0.24;
        stickGroup.add(stick);

        const tip = new THREE.Mesh(
            new THREE.SphereGeometry(0.018, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0xff3300 })
        );
        tip.position.y = 0.48;
        stickGroup.add(tip);

        const smokeCount = 22;
        const smokeGeo = new THREE.BufferGeometry();
        const smokePos = new Float32Array(smokeCount * 3);
        const smokeAges = new Float32Array(smokeCount);

        for (let i = 0; i < smokeCount; i++) {
            smokePos[i * 3] = 0;
            smokePos[i * 3 + 1] = 0.48 + (i / smokeCount) * 0.9;
            smokePos[i * 3 + 2] = 0;
            smokeAges[i] = i / smokeCount;
        }
        smokeGeo.setAttribute('position', new THREE.BufferAttribute(smokePos, 3));

        const smokePoints = new THREE.Points(
            smokeGeo,
            new THREE.PointsMaterial({ color: 0xe0e0e0, size: 0.14, transparent: true, opacity: 0.38 })
        );
        stickGroup.add(smokePoints);
        scene.add(stickGroup);

        const incenseObj = {
            id: stickId,
            group: stickGroup,
            update: (delta) => {
                const pos = smokeGeo.attributes.position.array;
                for (let i = 0; i < smokeCount; i++) {
                    smokeAges[i] += delta * 0.35;
                    if (smokeAges[i] > 1.0) smokeAges[i] = 0;

                    const age = smokeAges[i];
                    pos[i * 3] = Math.sin(age * Math.PI * 3 + i) * 0.1 * age;
                    pos[i * 3 + 1] = 0.48 + age * 1.35;
                    pos[i * 3 + 2] = Math.cos(age * Math.PI * 2 + i) * 0.1 * age;
                }
                smokeGeo.attributes.position.needsUpdate = true;
            }
        };

        activeIncenseSticks.push(incenseObj);
        return incenseObj;
    }

    // ==========================================
    // 5. CUTE CHIBI AVATAR (TAY CHẮP CHUẨN, NHANG KHÔNG TRÙNG NGƯỜI)
    // ==========================================
    function createChibiAvatarMesh(name, robeKey) {
        const rootGroup = new THREE.Group();

        const robeColorHex = ROBE_COLORS_HEX[robeKey] || ROBE_COLORS_HEX.blue;
        const fabricTex = ProceduralTextures.createFabricWeave(robeColorHex);

        const robeMat = new THREE.MeshStandardMaterial({
            map: fabricTex,
            roughness: 0.65,
            metalness: 0.04
        });

        const skinMat = new THREE.MeshStandardMaterial({
            color: 0xfcebe1,
            roughness: 0.42,
            metalness: 0.02
        });

        const shoeMat = new THREE.MeshStandardMaterial({ color: 0x33221b, roughness: 0.8 });

        // === 1. ROOT HIPS ===
        const hips = new THREE.Group();
        hips.position.y = 0.55;
        rootGroup.add(hips);

        // === 2. LEGS & SHOES ===
        function createChibiLeg(isLeft) {
            const side = isLeft ? -1 : 1;
            const legRoot = new THREE.Group();
            legRoot.position.set(side * 0.17, 0, 0);

            const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.32, 12), robeMat);
            thigh.position.y = -0.16;
            thigh.castShadow = true;
            legRoot.add(thigh);

            const foot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), shoeMat);
            foot.scale.set(1.0, 0.7, 1.4);
            foot.position.set(0, -0.32, 0.05);
            foot.castShadow = true;
            legRoot.add(foot);

            return { legRoot, foot };
        }

        const leftLeg = createChibiLeg(true);
        const rightLeg = createChibiLeg(false);
        hips.add(leftLeg.legRoot);
        hips.add(rightLeg.legRoot);

        // === 3. TORSO (ÁO LAM PHẬT TỬ TRUYỀN THỐNG VIỆT NAM) ===
        const spine = new THREE.Group();
        spine.position.y = 0.05;
        hips.add(spine);

        // Thân áo tràng lam
        const bodyGeo = new THREE.CylinderGeometry(0.32, 0.39, 0.68, 20);
        const body = new THREE.Mesh(bodyGeo, robeMat);
        body.position.y = 0.32;
        body.castShadow = true;
        spine.add(body);

        // Vạt áo dưới xòe phủ đùi (Robe Skirt) có xẻ tà 2 bên hông đặc trưng
        const skirtGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.38, 20);
        const skirt = new THREE.Mesh(skirtGeo, robeMat);
        skirt.position.y = 0.02;
        skirt.castShadow = true;
        spine.add(skirt);

        // Cổ áo lót màu trắng thanh tịnh (White inner collar trim)
        const innerCollar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.19, 0.12, 16),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
        );
        innerCollar.position.set(0, 0.65, 0.05);
        spine.add(innerCollar);

        // Vạt áo chéo gài nút truyền thống (Asymmetric crossover lapel)
        const lapelMat = new THREE.MeshStandardMaterial({ color: 0x3e4d5c, roughness: 0.5 });
        const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.46, 0.02), lapelMat);
        lapel.position.set(0.06, 0.46, 0.31);
        lapel.rotation.z = -0.38;
        spine.add(lapel);

        // 3 Khuy nút thắt hoa sen thủ công (Frog knot buttons)
        const buttonMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3, metalness: 0.7 });
        [
            [0.10, 0.56, 0.31],
            [0.16, 0.46, 0.31],
            [0.21, 0.36, 0.31]
        ].forEach(([bx, by, bz]) => {
            const btn = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), buttonMat);
            btn.position.set(bx, by, bz);
            spine.add(btn);
        });

        // Túi áo Phật tử bên ngực trái thêu hoa sen
        const pocket = new THREE.Mesh(
            new THREE.BoxGeometry(0.11, 0.12, 0.015),
            new THREE.MeshStandardMaterial({ color: 0x475869, roughness: 0.6 })
        );
        pocket.position.set(-0.16, 0.42, 0.30);
        spine.add(pocket);

        const pocketEmblem = new THREE.Mesh(
            new THREE.CircleGeometry(0.028, 8),
            new THREE.MeshBasicMaterial({ color: 0xffd700 })
        );
        pocketEmblem.position.set(-0.16, 0.42, 0.31);
        spine.add(pocketEmblem);

        // Dải thắt lưng vải dệt
        const sash = new THREE.Mesh(
            new THREE.CylinderGeometry(0.34, 0.36, 0.09, 20),
            new THREE.MeshStandardMaterial({ color: 0x2d3742, roughness: 0.5 })
        );
        sash.position.y = 0.20;
        spine.add(sash);

        // Dải nơ thắt lưng buông dài thả trước tà áo
        const ribbonMat = new THREE.MeshStandardMaterial({ color: 0x364350, roughness: 0.5 });
        const ribbon1 = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.32, 0.01), ribbonMat);
        ribbon1.position.set(-0.03, 0.05, 0.35);
        ribbon1.rotation.z = 0.06;
        spine.add(ribbon1);

        const ribbon2 = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.28, 0.01), ribbonMat);
        ribbon2.position.set(0.03, 0.07, 0.35);
        ribbon2.rotation.z = -0.06;
        spine.add(ribbon2);

        // Nẹp cổ áo lam viền ngoài
        const collar = new THREE.Mesh(
            new THREE.TorusGeometry(0.18, 0.025, 8, 16, Math.PI),
            new THREE.MeshStandardMaterial({ color: 0x455667, roughness: 0.5 })
        );
        collar.position.set(0, 0.63, 0.12);
        collar.rotation.x = Math.PI / 2.2;
        spine.add(collar);

        // === 4. CHIBI HEAD & SYMMETRIC FACE ===
        const headGroup = new THREE.Group();
        headGroup.position.y = 0.95;
        spine.add(headGroup);

        const headSkull = new THREE.Mesh(new THREE.SphereGeometry(0.42, 24, 24), skinMat);
        headSkull.castShadow = true;
        headGroup.add(headSkull);

        const faceTex = ProceduralTextures.createChibiFace();
        // SphereGeometry phi=PI/2 points toward local +Z; center the face arc there.
        const faceArc = (140 / 180) * Math.PI;
        const faceStart = Math.PI / 2 - faceArc / 2;
        const faceCap = new THREE.Mesh(
            new THREE.SphereGeometry(0.425, 32, 24, faceStart, faceArc, Math.PI * 0.18, Math.PI * 0.60),
            new THREE.MeshStandardMaterial({ 
                map: faceTex, 
                roughness: 0.42,
                metalness: 0.02,
                depthWrite: false,
                polygonOffset: true,
                polygonOffsetFactor: -1,
                polygonOffsetUnits: -1
            })
        );
        faceCap.position.set(0, 0.02, 0);
        headGroup.add(faceCap);
        const facePlane = faceCap;

        [-0.43, 0.43].forEach(x => {
            const ear = new THREE.Mesh(new THREE.SphereGeometry(0.085, 10, 8), skinMat);
            ear.scale.set(0.6, 1.1, 0.8);
            ear.position.set(x, 0, 0);
            headGroup.add(ear);
        });

        // === 5. CUTE CHIBI ARMS (TAY ÁO LAM RỘNG RỦ NỐI CHẮP BÚP SEN) ===
        function createChibiArm(isLeft) {
            const side = isLeft ? -1 : 1;
            const shoulder = new THREE.Group();
            shoulder.position.set(side * 0.28, 0.46, 0.20);            spine.add(shoulder);

            // Phan vai ao - sphere ket noi canh tay vao than ao khong bi ro
            const shoulderCap = new THREE.Mesh(
                new THREE.SphereGeometry(0.155, 12, 10),
                robeMat
            );
            shoulderCap.scale.set(1.0, 0.85, 0.9);
            shoulderCap.position.y = 0;
            shoulder.add(shoulderCap);

            // Ống tay áo lam rộng rủ thanh thoát
            const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.16, 0.38, 14), robeMat);
            sleeve.position.y = -0.19;
            sleeve.castShadow = true;
            shoulder.add(sleeve);

            // Viền lót tay áo màu trắng tinh khiết
            const innerCuff = new THREE.Mesh(
                new THREE.CylinderGeometry(0.095, 0.095, 0.06, 12),
                new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
            );
            innerCuff.position.y = -0.34;
            shoulder.add(innerCuff);

            // Cổ tay áo viền vải trang nghiêm nối vào cổ tay
            const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.016, 8, 16), robeMat);
            cuff.position.y = -0.36;
            cuff.rotation.x = Math.PI / 2;
            shoulder.add(cuff);

            return { shoulder, sleeve };
        }

        const leftArm = createChibiArm(true);
        const rightArm = createChibiArm(false);

        // Pho dáng chắp tay búp sen (Anjali Mudra) đưa hai cánh tay hướng về trước ngực
        leftArm.shoulder.rotation.set(-0.4, 0, 1.22);
        rightArm.shoulder.rotation.set(-0.4, 0, -1.22);

        // ĐÔI BÀN TAY CHẮP HOA SEN (LÒNG BÀN TAY ÁP VÀO NHAU TRƯỚC NGỰC)
        const prayerHands = new THREE.Group();
        prayerHands.position.set(0, 0.40, 0.35); // Ngay ngắn, trang nghiêm trước luân xa tim

        // Lòng bàn tay trái
        const leftPalm = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.13, 0.08), skinMat);
        leftPalm.position.set(-0.018, 0, 0);
        leftPalm.rotation.z = 0.08;
        leftPalm.rotation.y = 0.04;
        prayerHands.add(leftPalm);

        // Các ngón tay trái chụm lại như cánh sen
        const leftFingers = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.08, 8), skinMat);
        leftFingers.position.set(-0.012, 0.09, 0);
        leftFingers.rotation.z = 0.06;
        prayerHands.add(leftFingers);

        // Lòng bàn tay phải
        const rightPalm = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.13, 0.08), skinMat);
        rightPalm.position.set(0.018, 0, 0);
        rightPalm.rotation.z = -0.08;
        rightPalm.rotation.y = -0.04;
        prayerHands.add(rightPalm);

        // Các ngón tay phải chụm lại đối xứng
        const rightFingers = new THREE.Mesh(new THREE.ConeGeometry(0.036, 0.08, 8), skinMat);
        rightFingers.position.set(0.012, 0.09, 0);
        rightFingers.rotation.z = -0.06;
        prayerHands.add(rightFingers);

        spine.add(prayerHands);

        // === 6. NHANG THẮP (ĐƯỢC CẦM TRỰC TIẾP TRONG ĐÔI BÀN TAY CHẮP SEN) ===
        // Là con của prayerHands -> Nhang luôn di chuyển chính xác theo đôi bàn tay, không bao giờ lệch hay đâm vào người
        const handIncenseGroup = new THREE.Group();
        handIncenseGroup.position.set(0, 0.05, 0.03); // Nằm giữa đôi bàn tay chắp
        handIncenseGroup.rotation.x = -0.15;         // Nghiêng nhẹ 8.5 độ về phía trước, cách xa mặt và ngực
        handIncenseGroup.visible = false;

        for (let i = -1; i <= 1; i++) {
            const stick = new THREE.Mesh(
                new THREE.CylinderGeometry(0.007, 0.007, 0.42, 6),
                new THREE.MeshStandardMaterial({ color: 0x8b3a12 })
            );
            stick.position.set(i * 0.025, 0.21, 0);
            stick.rotation.z = i * 0.06;
            handIncenseGroup.add(stick);

            const redEmber = new THREE.Mesh(
                new THREE.SphereGeometry(0.015, 6, 6),
                new THREE.MeshBasicMaterial({ color: 0xff3300 })
            );
            redEmber.position.set(i * 0.025, 0.42, 0);
            handIncenseGroup.add(redEmber);
        }
        prayerHands.add(handIncenseGroup);

        // === 7. CHUỖI HẠT 3D TRÊN TAY (ĐEO VÒNG QUA ĐÔI BÀN TAY CHẮP) ===
        const handRosaryGroup = new THREE.Group();
        handRosaryGroup.position.set(0, -0.02, 0.06);
        handRosaryGroup.visible = false;

        const beadCount = 24;
        const beadRadius = 0.15;
        const woodBeadMat = new THREE.MeshStandardMaterial({ color: 0x5c2e14, roughness: 0.3, metalness: 0.1 });

        for (let i = 0; i < beadCount; i++) {
            const angle = (i / beadCount) * Math.PI * 2;
            const bead = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), woodBeadMat);
            bead.position.set(Math.cos(angle) * beadRadius, Math.sin(angle) * beadRadius, 0);
            handRosaryGroup.add(bead);
        }

        const tassel = new THREE.Mesh(
            new THREE.ConeGeometry(0.028, 0.12, 8),
            new THREE.MeshStandardMaterial({ color: 0xcc2222, roughness: 0.6 })
        );
        tassel.position.set(0, -beadRadius - 0.06, 0);
        handRosaryGroup.add(tassel);

        prayerHands.add(handRosaryGroup);

        // === 8. BILLBOARD ===
        const billboardGroup = new THREE.Group();
        billboardGroup.position.set(0, 2.28, 0);

        const nameCanvas = document.createElement('canvas');
        nameCanvas.width = 256;
        nameCanvas.height = 64;
        const nCtx = nameCanvas.getContext('2d');
        nCtx.fillStyle = 'rgba(25, 8, 6, 0.85)';
        nCtx.roundRect(10, 10, 236, 44, 12);
        nCtx.fill();
        nCtx.strokeStyle = '#ffd700';
        nCtx.lineWidth = 3;
        nCtx.roundRect(10, 10, 236, 44, 12);
        nCtx.stroke();
        nCtx.fillStyle = '#ffffff';
        nCtx.font = 'bold 24px "Quicksand", sans-serif';
        nCtx.textAlign = 'center';
        nCtx.textBaseline = 'middle';
        nCtx.fillText(name, 128, 32);

        const namePlane = new THREE.Mesh(
            new THREE.PlaneGeometry(1.4, 0.35),
            new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(nameCanvas), transparent: true, side: THREE.DoubleSide })
        );
        billboardGroup.add(namePlane);

        const chatCanvas = document.createElement('canvas');
        chatCanvas.width = 512;
        chatCanvas.height = 160;
        const chatTex = new THREE.CanvasTexture(chatCanvas);
        const chatPlane = new THREE.Mesh(
            new THREE.PlaneGeometry(2.4, 0.75),
            new THREE.MeshBasicMaterial({ map: chatTex, transparent: true, side: THREE.DoubleSide })
        );
        chatPlane.position.y = 0.65;
        chatPlane.visible = false;
        billboardGroup.add(chatPlane);

        rootGroup.add(billboardGroup);

        return {
            group: rootGroup,
            hips,
            spine,
            headGroup,
            leftLeg,
            rightLeg,
            leftArm,
            rightArm,
            prayerHands,
            handIncenseGroup,
            handRosaryGroup,
            rosaryRotation: 0,
            billboardGroup,
            chatPlane,
            chatCanvas,
            chatTex,
            chatTimer: null,
            animTime: 0
        };
    }

    function createLocalPlayer() {
        localPlayer = createChibiAvatarMesh(STATE.playerName, STATE.robeColor);
        localPlayer.group.position.set(0, 0, 25.5);
        localPlayer.group.rotation.y = Math.PI;
        localPlayer.group.visible = true;
        scene.add(localPlayer.group);
        updateCameraPosition();
    }

    function showChatBubble(avatar, text) {
        if (!avatar || !avatar.chatCanvas) return;
        const ctx = avatar.chatCanvas.getContext('2d');
        ctx.clearRect(0, 0, 512, 160);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.roundRect(16, 16, 480, 100, 20);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(240, 116);
        ctx.lineTo(256, 140);
        ctx.lineTo(272, 116);
        ctx.fill();

        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#220805';
        ctx.font = 'bold 28px "Quicksand", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const displayText = text.length > 30 ? text.substring(0, 28) + '...' : text;
        ctx.fillText(displayText, 256, 66);

        avatar.chatTex.needsUpdate = true;
        avatar.chatPlane.visible = true;

        if (avatar.chatTimer) clearTimeout(avatar.chatTimer);
        avatar.chatTimer = setTimeout(() => {
            avatar.chatPlane.visible = false;
        }, 5500);
    }

    // ==========================================
    // 6. RITUALS (LẠY PHẬT CHẮP TAY, CẮM NHANG ĐƯA RA TRƯỚC)
    // ==========================================

    // 1. 🙏 LẠY PHẬT (Hai tay chắp búp sen nâng lên ngang ngực, lạy chạm đất)
    function performPrayAction() {
        if (!localPlayer || STATE.isPraying || STATE.isOfferingIncense) return;
        if (STATE.isSitting) toggleSitAction();

        STATE.isPraying = true;
        STATE.currentAction = 'pray';

        window.templeAudio.playSmallBell();
        showToast('Hai tay chắp búp sen đảnh lễ Đức Phật Tam Bái... 🙏');
        sendAction('pray', { count: 3 });

        let bowCycle = 0;
        let bowCount = 0;
        const totalBows = 3;

        const prayInterval = setInterval(() => {
            bowCycle += 0.08;
            const t = (Math.sin(bowCycle * Math.PI) + 1) / 2;

            localPlayer.hips.position.y = 0.55 - 0.32 * t;
            localPlayer.leftLeg.legRoot.rotation.x = -1.25 * t;
            localPlayer.rightLeg.legRoot.rotation.x = -1.25 * t;

            // Lưng cúi gập
            localPlayer.spine.rotation.x = 1.35 * t;
            localPlayer.headGroup.rotation.x = 0.35 * t;

            // Đôi tay chắp sen đưa về phía trước hạ xuống sát sàn/bồ đoàn (ngũ thể đầu địa)
            localPlayer.prayerHands.position.set(0, 0.40 - 0.46 * t, 0.35 + 0.32 * t);
            localPlayer.prayerHands.rotation.x = -0.75 * t;

            // Cánh tay áo lam gập cúi theo thân mình
            localPlayer.leftArm.shoulder.rotation.x = -0.85 - 0.25 * t;
            localPlayer.rightArm.shoulder.rotation.x = -0.85 - 0.25 * t;

            if (bowCycle >= 2) {
                bowCycle = 0;
                bowCount++;
                window.templeAudio.playSmallBell();
                if (bowCount >= totalBows) {
                    clearInterval(prayInterval);
                    localPlayer.hips.position.y = 0.55;
                    localPlayer.leftLeg.legRoot.rotation.x = 0;
                    localPlayer.rightLeg.legRoot.rotation.x = 0;
                    localPlayer.spine.rotation.x = 0;
                    localPlayer.headGroup.rotation.x = 0;
                    localPlayer.prayerHands.position.set(0, 0.40, 0.35);
                    localPlayer.prayerHands.rotation.set(0, 0, 0);
                    localPlayer.leftArm.shoulder.rotation.set(-0.4, 0, 1.22);
                    localPlayer.rightArm.shoulder.rotation.set(-0.4, 0, -1.22);

                    STATE.isPraying = false;
                    STATE.currentAction = 'idle';
                    showToast('Đảnh lễ Tam Bảo viên mãn! Thân tâm an lạc. ✨🙏');
                }
            }
        }, 40);
    }

    // 2. 🕯️ THẮP NHANG & CẮM VÀO LƯ (HAI TAY NÂNG HƯƠNG TRƯỚC MẶT, KHÔNG TRÙNG NGƯỜI)
    function performIncenseAction() {
        if (!localPlayer || STATE.isOfferingIncense || STATE.isPraying) return;
        if (STATE.isSitting) toggleSitAction();

        STATE.isOfferingIncense = true;
        STATE.currentAction = 'incense';

        window.templeAudio.playSmallBell();
        showToast('Hai tay nâng 3 nén tâm hương dâng Phật... 🕯️');

        localPlayer.handIncenseGroup.visible = true;

        const pPos = localPlayer.group.position;
        const distToMain = pPos.distanceTo(INTERACTION_ZONES.mainUrn);
        const distToYard = pPos.distanceTo(INTERACTION_ZONES.yardUrn);
        let targetUrn = 'main_altar';
        let urnPos = INTERACTION_ZONES.mainUrn;

        if (distToYard < distToMain) {
            targetUrn = 'yard_urn';
            urnPos = INTERACTION_ZONES.yardUrn;
        }

        let stage = 0;
        let bowCounter = 0;
        let animProgress = 0;

        const incenseAnim = setInterval(() => {
            animProgress += 0.08;

            if (stage === 0) {
                // Dâng 3 nén tâm hương lên ngang trán (cả hai bàn tay và nén hương cùng nâng lên thanh thoát)
                const t = Math.min(1.0, animProgress);
                localPlayer.prayerHands.position.set(0, 0.40 + 0.28 * t, 0.35 + 0.08 * t);
                localPlayer.prayerHands.rotation.x = -0.10 * t;
                localPlayer.leftArm.shoulder.rotation.x = -0.85 - 0.30 * t;
                localPlayer.rightArm.shoulder.rotation.x = -0.85 - 0.30 * t;

                if (animProgress >= 1.0) {
                    stage = 1;
                    animProgress = 0;
                    showToast('Cung kính vái 3 vái trước Tam Bảo... 🙏');
                }
            } else if (stage === 1) {
                // Vái 3 vái (tay và nhang hướng ra phía trước, cách xa mặt và ngực, không chạm vào người)
                const bow = (Math.sin(animProgress * Math.PI) + 1) / 2;
                localPlayer.spine.rotation.x = 0.35 * bow;
                localPlayer.headGroup.rotation.x = 0.18 * bow;
                localPlayer.prayerHands.position.set(0, 0.68, 0.43 + 0.12 * bow);
                localPlayer.prayerHands.rotation.x = -0.10 - 0.18 * bow;
                localPlayer.leftArm.shoulder.rotation.x = -1.15 - 0.15 * bow;
                localPlayer.rightArm.shoulder.rotation.x = -1.15 - 0.15 * bow;

                if (animProgress >= 2) {
                    animProgress = 0;
                    bowCounter++;
                    window.templeAudio.playSmallBell();
                    if (bowCounter >= 3) {
                        stage = 2;
                        animProgress = 0;
                        localPlayer.spine.rotation.x = 0;
                        localPlayer.headGroup.rotation.x = 0;
                        showToast('Đang tiến tới cắm nhang vào lư hương... 🕯️');
                    }
                }
            } else if (stage === 2) {
                // Rướn hai tay hạ xuống cắm nhang vào lòng lư hương
                const t = Math.min(1.0, animProgress);
                localPlayer.spine.rotation.x = 0.30 * t;
                localPlayer.prayerHands.position.set(0, 0.68 - 0.30 * t, 0.43 + 0.38 * t);
                localPlayer.prayerHands.rotation.x = -0.10 + 0.35 * t;
                localPlayer.leftArm.shoulder.rotation.x = -1.15 + 0.30 * t;
                localPlayer.rightArm.shoulder.rotation.x = -1.15 + 0.30 * t;

                if (animProgress >= 1.0) {
                    localPlayer.handIncenseGroup.visible = false;

                    const stickX = urnPos.x + (Math.random() - 0.5) * 0.28;
                    const stickY = targetUrn === 'main_altar' ? 1.67 : 1.65;
                    const stickZ = urnPos.z + (Math.random() - 0.5) * 0.28;

                    createIncenseStick(stickX, stickY, stickZ, 'local_' + Date.now());

                    sendAction('incense', {
                        urn: targetUrn,
                        x: stickX,
                        y: stickY,
                        z: stickZ
                    });

                    stage = 3;
                    animProgress = 0;
                    window.templeAudio.playSmallBell();
                }
            } else if (stage === 3) {
                // Rút tay về chắp búp sen trang nghiêm trước ngực
                const t = Math.min(1.0, animProgress);
                localPlayer.spine.rotation.x = 0.30 * (1 - t);
                localPlayer.prayerHands.position.set(0, 0.38 + 0.02 * t, 0.81 - 0.46 * t);
                localPlayer.prayerHands.rotation.x = 0.25 * (1 - t);
                localPlayer.leftArm.shoulder.rotation.set(-0.4, 0, 1.22);
                localPlayer.rightArm.shoulder.rotation.set(-0.4, 0, -1.22);

                if (animProgress >= 1.0) {
                    clearInterval(incenseAnim);
                    localPlayer.prayerHands.position.set(0, 0.40, 0.35);
                    localPlayer.prayerHands.rotation.set(0, 0, 0);

                    STATE.isOfferingIncense = false;
                    STATE.currentAction = 'idle';
                    showToast('Đã cắm nén hương thơm cúng Phật! Thân tâm an lạc. 🕯️🪷');
                }
            }
        }, 40);
    }

    // ==========================================
    // 📿 TRÒ LĂN XOAY CHUỖI HẠT TRƯỚC MẶT (360 ĐỘ = +1 LẦN CÔNG ĐỨC VIÊN MÃN)
    // ==========================================
    function setupInteractiveRosary() {
        const modal = document.getElementById('rosary-modal');
        const dragArea = document.getElementById('rosary-drag-area');
        const canvas = document.getElementById('rosary-canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const totalBeads = 24;
        const centerX = 140;
        const centerY = 140;
        const radius = 105;

        let isDragging = false;
        let lastAngle = null;
        let beadStepAngle = (Math.PI * 2) / totalBeads;
        let progressInRound = 0; // Tiến độ góc xoay từ 0 đến 2*PI

        function drawRosaryRing(rotationOffset) {
            ctx.clearRect(0, 0, 280, 280);

            // 1. Vòng dây tràng hạt mạ vàng mờ
            ctx.strokeStyle = 'rgba(218, 165, 32, 0.4)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();

            // 2. Vòng tròn tiến độ công đức (Vàng sáng rực rỡ)
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + progressInRound, false);
            ctx.stroke();

            // 3. Vẽ 24 hạt gỗ bóng tròn
            for (let i = 0; i < totalBeads; i++) {
                const angle = rotationOffset + (i / totalBeads) * Math.PI * 2;
                const bx = centerX + Math.cos(angle) * radius;
                const by = centerY + Math.sin(angle) * radius;

                // Hạt gỗ đổ bóng gradient 3D
                const beadGrad = ctx.createRadialGradient(bx - 3, by - 3, 2, bx, by, 12);
                if (i === 0) {
                    // Hạt Mẹ (Guru Bead) màu vàng hoàng kim
                    beadGrad.addColorStop(0, '#fff4a3');
                    beadGrad.addColorStop(0.4, '#ffd700');
                    beadGrad.addColorStop(1, '#946f00');
                } else {
                    // Hạt gỗ trắc/gỗ mun bóng bẩy
                    beadGrad.addColorStop(0, '#a56336');
                    beadGrad.addColorStop(0.4, '#5c2e14');
                    beadGrad.addColorStop(1, '#2c1206');
                }

                ctx.fillStyle = beadGrad;
                ctx.beginPath();
                ctx.arc(bx, by, i === 0 ? 14 : 11, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            // 4. Dây tua rua đỏ thắm gắn hạt Mẹ
            const tasselAngle = rotationOffset;
            const tx = centerX + Math.cos(tasselAngle) * (radius + 18);
            const ty = centerY + Math.sin(tasselAngle) * (radius + 18);

            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.arc(tx, ty, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        drawRosaryRing(0);

        function handleAngleMovement(newAngle) {
            if (lastAngle === null) {
                lastAngle = newAngle;
                return;
            }

            let delta = newAngle - lastAngle;

            // Xử lý góc nhảy qua ranh giới -PI / +PI
            if (delta > Math.PI) delta -= Math.PI * 2;
            if (delta < -Math.PI) delta += Math.PI * 2;

            // Chỉ tính khi xoay theo chiều kim đồng hồ (hoặc cho phép cả 2 chiều)
            if (Math.abs(delta) > 0.01) {
                lastAngle = newAngle;
                STATE.accumulatedAngle += Math.abs(delta);
                progressInRound += Math.abs(delta);

                // Khi tiến được 1 hạt: phát tiếng lách cách & xoay hạt trên tay 3D
                if (STATE.accumulatedAngle >= beadStepAngle) {
                    STATE.accumulatedAngle -= beadStepAngle;
                    STATE.currentBeadIndex = (STATE.currentBeadIndex + 1) % totalBeads;

                    window.templeAudio.playBeadClick();

                    const stepLabel = document.getElementById('bead-step-label');
                    if (stepLabel) stepLabel.textContent = `Hạt: ${STATE.currentBeadIndex} / ${totalBeads}`;

                    // Xoay chuỗi hạt trên tay chú tiểu 3D
                    if (localPlayer) {
                        localPlayer.handRosaryGroup.visible = true;
                        localPlayer.rosaryRotation += beadStepAngle;
                        localPlayer.handRosaryGroup.rotation.z = localPlayer.rosaryRotation;
                    }
                }

                // KHI XOAY ĐỦ 1 VÒNG TRÒN (2 * PI) = +1 LẦN CÔNG ĐỨC VIÊN MÃN!
                if (progressInRound >= Math.PI * 2) {
                    progressInRound = 0;
                    STATE.meritRounds += 1;

                    const countEl = document.getElementById('merit-rounds-count');
                    if (countEl) countEl.textContent = STATE.meritRounds;

                    window.templeAudio.playSmallBell();
                    showToast(`🎉 HOÀN THÀNH 1 VÒNG NIỆM PHẬT! +1 CÔNG ĐỨC VIÊN MÃN 🙏✨`);

                    sendAction('rosary_round', { rounds: STATE.meritRounds });

                    // Bụi vàng công đức bay lên quanh nhân vật 3D
                    if (localPlayer) {
                        localPlayer.group.position.y += 0.08;
                        setTimeout(() => { if (localPlayer) localPlayer.group.position.y -= 0.08; }, 180);
                    }
                }

                drawRosaryRing(progressInRound);
            }
        }

        // Bắt sự kiện chuột lăn chuỗi hạt
        dragArea.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left - centerX;
            const y = e.clientY - rect.top - centerY;
            lastAngle = Math.atan2(y, x);
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left - centerX;
            const y = e.clientY - rect.top - centerY;
            const currentAngle = Math.atan2(y, x);
            handleAngleMovement(currentAngle);
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
            lastAngle = null;
        });

        // Bắt sự kiện cảm ứng trên màn hình cảm ứng / điện thoại
        dragArea.addEventListener('touchstart', (e) => {
            isDragging = true;
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left - centerX;
            const y = touch.clientY - rect.top - centerY;
            lastAngle = Math.atan2(y, x);
        }, { passive: true });

        dragArea.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const touch = e.touches[0];
            const rect = canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left - centerX;
            const y = touch.clientY - rect.top - centerY;
            const currentAngle = Math.atan2(y, x);
            handleAngleMovement(currentAngle);
        }, { passive: true });

        dragArea.addEventListener('touchend', () => {
            isDragging = false;
            lastAngle = null;
        });

        // Hỗ trợ cuộn chuột lăn hạt
        dragArea.addEventListener('wheel', (e) => {
            e.preventDefault();
            const fakeAngle = (lastAngle || 0) + (e.deltaY > 0 ? 0.35 : -0.35);
            handleAngleMovement(fakeAngle);
        }, { passive: false });
    }

    function toggleRosaryModal() {
        const modal = document.getElementById('rosary-modal');
        const isHidden = modal.style.display === 'none' || modal.style.display === '';
        const compactMobile = window.matchMedia('(pointer: coarse) and (orientation: landscape)').matches;
        modal.style.display = isHidden ? (compactMobile ? 'grid' : 'block') : 'none';

        STATE.isHoldingRosary = isHidden;
        if (localPlayer) {
            localPlayer.handRosaryGroup.visible = isHidden;
        }

        if (isHidden) {
            window.templeAudio.playBeadClick();
            showToast('👉 Dùng chuột hoặc ngón tay lăn xoay chuỗi hạt theo vòng tròn để tích công đức! 📿');
        }
    }

    // 4. 🔔 THỈNH ĐẠI HỒNG CHUNG
    function performStrikeBell() {
        window.templeAudio.playGreatBell();
        if (bellMesh) {
            let shake = 0;
            const shakeInterval = setInterval(() => {
                shake += 0.2;
                bellMesh.rotation.z = Math.sin(shake * 16) * 0.09 * Math.exp(-shake);
                if (shake > 3) {
                    clearInterval(shakeInterval);
                    bellMesh.rotation.z = 0;
                }
            }, 30);
        }
        sendAction('bell', {});
        showToast('🔔 Chuông Đại Hồng ngân vang khắp cõi... Nguyện muôn loài an lành!');
    }

    // 5. 🪵 GÕ MÕ GỖ
    function performStrikeWoodenFish() {
        window.templeAudio.playWoodenFish();
        if (woodenFishMesh) {
            woodenFishMesh.scale.set(1.3, 0.76, 1.1);
            setTimeout(() => { woodenFishMesh.scale.set(1.25, 0.82, 1.05); }, 100);
        }
        sendAction('wooden_fish', {});
        showToast('🪵 Tiếng mõ trầm ngâm... cốc cốc thanh tịnh!');
    }

    // 6. 📜 XIN XĂM QUÁN ÂM
    function performDrawFortune() {
        const modal = document.getElementById('fortune-modal');
        const titleEl = document.getElementById('fortune-title');
        const poemEl = document.getElementById('fortune-poem');
        const meanEl = document.getElementById('fortune-meaning');
        const advEl = document.getElementById('fortune-advice');

        modal.style.display = 'block';
        titleEl.textContent = 'Đang thành tâm lắc ống xăm...';
        poemEl.textContent = '🎋 Lắc đều ống xăm...\nCầu Quán Thế Âm Bồ Tát chỉ điểm duyên lành';
        meanEl.textContent = '';
        advEl.textContent = '';

        window.templeAudio.playStickRattle();

        setTimeout(() => {
            const fortune = window.drawFortune();
            window.templeAudio.playSmallBell();

            titleEl.textContent = fortune.title;
            poemEl.textContent = fortune.poem;
            meanEl.innerHTML = `<strong>Ý nghĩa:</strong> ${fortune.meaning}`;
            advEl.innerHTML = `<strong>Lời khuyên tu dưỡng:</strong> ${fortune.advice}`;

            sendAction('fortune', { title: fortune.title });
        }, 1200);
    }

    // 7. 🧘 NGỒI KHOANH CHÂN TRÊN BỒ ĐOÀN DƯỚI SÀN
    function toggleSitAction() {
        if (!localPlayer || STATE.isPraying || STATE.isOfferingIncense) return;

        STATE.isSitting = !STATE.isSitting;

        if (STATE.isSitting) {
            STATE.currentAction = 'sit';
            window.templeAudio.playSmallBell();

            let nearestCushion = null;
            let minDist = 2.5;

            CUSHIONS.forEach(c => {
                const dist = localPlayer.group.position.distanceTo(c);
                if (dist < minDist) {
                    minDist = dist;
                    nearestCushion = c;
                }
            });

            if (nearestCushion) {
                localPlayer.group.position.x = nearestCushion.x;
                localPlayer.group.position.z = nearestCushion.z;
                localPlayer.group.position.y = nearestCushion.y + 0.1;
                localPlayer.group.rotation.y = Math.PI;
                showToast('Đã an tọa khoanh chân trên bồ đoàn tịnh tâm ngồi thiền... 🧘✨');
            } else {
                showToast('Tọa thiền kiết già, lắng đọng thân tâm... 🧘✨');
            }

            localPlayer.hips.position.y = 0.28;
            localPlayer.leftLeg.legRoot.rotation.x = -1.45;
            localPlayer.leftLeg.legRoot.rotation.z = 0.6;
            localPlayer.rightLeg.legRoot.rotation.x = -1.45;
            localPlayer.rightLeg.legRoot.rotation.z = -0.6;

            localPlayer.leftArm.shoulder.rotation.set(-0.65, 0.25, -0.20);
            localPlayer.rightArm.shoulder.rotation.set(-0.65, -0.25, 0.20);
            localPlayer.prayerHands.position.set(0, 0.12, 0.28);
            localPlayer.prayerHands.rotation.set(1.1, 0, 0); // Hai tay hạ xuống đùi kết ấn Thiền Định thanh tịnh

            sendAction('sit', { isSitting: true });
        } else {
            STATE.currentAction = 'idle';
            localPlayer.hips.position.y = 0.55;
            localPlayer.leftLeg.legRoot.rotation.set(0, 0, 0);
            localPlayer.rightLeg.legRoot.rotation.set(0, 0, 0);
            localPlayer.leftArm.shoulder.rotation.set(-0.4, 0, 1.22);
            localPlayer.rightArm.shoulder.rotation.set(-0.4, 0, -1.22);
            localPlayer.prayerHands.position.set(0, 0.40, 0.35);
            localPlayer.prayerHands.rotation.set(0, 0, 0);

            showToast('Đã xả thiền đứng dậy khoan thai. 🙏');
            sendAction('sit', { isSitting: false });
        }
    }

    // ==========================================
    // 7. INPUT HANDLING & CAMERA
    // ==========================================
    function setupInputHandlers() {
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                if (e.key === 'Enter') sendChatMessage();
                return;
            }

            if (STATE.isSitting && (e.key === 'w' || e.key === 'a' || e.key === 's' || e.key === 'd' || e.key.startsWith('Arrow'))) {
                toggleSitAction();
            }

            if (e.key in STATE.keys) STATE.keys[e.key] = true;

            if (e.key === '1') performPrayAction();
            if (e.key === '2') performIncenseAction();
            if (e.key === '3') toggleRosaryModal();
            if (e.key === '4') performStrikeBell();
            if (e.key === '5') performStrikeWoodenFish();
            if (e.key === '6') performDrawFortune();
            if (e.key === '7') toggleSitAction();

            if (e.key === 'Enter') {
                document.getElementById('chat-input').focus();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key in STATE.keys) STATE.keys[e.key] = false;
        });

        const container = document.getElementById('canvas-container');
        let cameraPointerId = null;

        container.addEventListener('pointerdown', (e) => {
            if (e.button === 0 && cameraPointerId === null && !e.target.closest('.interactive')) {
                cameraPointerId = e.pointerId;
                STATE.camera.isMouseDown = true;
                STATE.camera.mouseX = e.clientX;
                STATE.camera.mouseY = e.clientY;
                if (container.setPointerCapture) container.setPointerCapture(e.pointerId);
            }
        });

        window.addEventListener('pointermove', (e) => {
            if (!STATE.camera.isMouseDown || e.pointerId !== cameraPointerId) return;
            const dx = e.clientX - STATE.camera.mouseX;
            const dy = e.clientY - STATE.camera.mouseY;

            STATE.camera.mouseX = e.clientX;
            STATE.camera.mouseY = e.clientY;

            STATE.camera.theta -= dx * 0.006;
            STATE.camera.phi = Math.max(0.08, Math.min(Math.PI / 2.3, STATE.camera.phi + dy * 0.005));
            updateCameraPosition();
        });

        const stopCameraDrag = (e) => {
            if (cameraPointerId === null || (e.pointerId !== undefined && e.pointerId !== cameraPointerId)) return;
            cameraPointerId = null;
            STATE.camera.isMouseDown = false;
        };
        window.addEventListener('pointerup', stopCameraDrag);
        window.addEventListener('pointercancel', stopCameraDrag);
        container.addEventListener('lostpointercapture', stopCameraDrag);
        window.addEventListener('blur', stopCameraDrag);

        window.addEventListener('wheel', (e) => {
            STATE.camera.radius = Math.max(3.2, Math.min(16.0, STATE.camera.radius + e.deltaY * 0.01));
            updateCameraPosition();
        }, { passive: true });
    }

    function setupMobileControls() {
        const joystick = document.getElementById('mobile-joystick');
        const base = joystick.querySelector('.joystick-base');
        const thumb = joystick.querySelector('.joystick-thumb');
        let activePointerId = null;

        const clearJoystick = () => {
            activePointerId = null;
            for (const key of ['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
                STATE.keys[key] = false;
            }
            thumb.style.transform = 'translate(0, 0)';
        };

        const updateJoystick = (event) => {
            if (event.pointerId !== activePointerId) return;
            const rect = base.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const maxTravel = rect.width * 0.32;
            let dx = event.clientX - centerX;
            let dy = event.clientY - centerY;
            const distance = Math.hypot(dx, dy);
            if (distance > maxTravel) {
                dx = dx / distance * maxTravel;
                dy = dy / distance * maxTravel;
            }

            thumb.style.transform = `translate(${dx}px, ${dy}px)`;
            const threshold = maxTravel * 0.22;
            STATE.keys.a = dx < -threshold;
            STATE.keys.d = dx > threshold;
            STATE.keys.w = dy < -threshold;
            STATE.keys.s = dy > threshold;
            STATE.keys.ArrowLeft = STATE.keys.a;
            STATE.keys.ArrowRight = STATE.keys.d;
            STATE.keys.ArrowUp = STATE.keys.w;
            STATE.keys.ArrowDown = STATE.keys.s;
        };

        joystick.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            event.stopPropagation();
            activePointerId = event.pointerId;
            joystick.setPointerCapture(event.pointerId);
            updateJoystick(event);
        });
        joystick.addEventListener('pointermove', updateJoystick);
        joystick.addEventListener('pointerup', clearJoystick);
        joystick.addEventListener('pointercancel', clearJoystick);
        joystick.addEventListener('lostpointercapture', clearJoystick);

        window.addEventListener('blur', clearJoystick);
        window.addEventListener('orientationchange', clearJoystick);
    }

    function updateCameraPosition() {
        if (!camera) return;
        const target = localPlayer ? localPlayer.group.position : new THREE.Vector3(0, 0, 14);

        const x = target.x + STATE.camera.radius * Math.sin(STATE.camera.phi) * Math.sin(STATE.camera.theta);
        const y = target.y + STATE.camera.targetY + STATE.camera.radius * Math.cos(STATE.camera.phi);
        const z = target.z + STATE.camera.radius * Math.sin(STATE.camera.phi) * Math.cos(STATE.camera.theta);

        camera.position.set(x, Math.max(0.65, y), z);
        camera.lookAt(target.x, target.y + STATE.camera.targetY, target.z);
    }

    function setupUIEventListeners() {
        const fullscreenBtn = document.getElementById('btn-fullscreen');
        const isFullscreen = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement);
        const updateFullscreenButton = () => {
            const active = isFullscreen();
            fullscreenBtn.textContent = active ? '⤢' : '⛶';
            fullscreenBtn.setAttribute('aria-pressed', String(active));
            fullscreenBtn.setAttribute('aria-label', active ? 'Thoát toàn màn hình' : 'Bật toàn màn hình');
            fullscreenBtn.title = active ? 'Thoát toàn màn hình' : 'Bật toàn màn hình';
        };

        fullscreenBtn.addEventListener('click', () => {
            let request;
            let supported = true;
            try {
                if (isFullscreen()) {
                    if (document.exitFullscreen) request = document.exitFullscreen();
                    else if (document.webkitExitFullscreen) {
                        document.webkitExitFullscreen();
                        request = Promise.resolve();
                    } else supported = false;
                } else {
                    const root = document.documentElement;
                    if (root.requestFullscreen) request = root.requestFullscreen();
                    else if (root.webkitRequestFullscreen) {
                        root.webkitRequestFullscreen();
                        request = Promise.resolve();
                    } else supported = false;
                }
            } catch (error) {
                request = Promise.reject(error);
            }

            if (!supported) {
                showToast('Trình duyệt này chưa hỗ trợ toàn màn hình cho trang web.');
                return;
            }
            Promise.resolve(request).then(updateFullscreenButton).catch(() => {
                showToast('Không thể bật toàn màn hình trong trình duyệt này.');
            });
        });
        document.addEventListener('fullscreenchange', updateFullscreenButton);
        document.addEventListener('webkitfullscreenchange', updateFullscreenButton);

        const chatToggle = document.getElementById('btn-chat-toggle');
        chatToggle.addEventListener('click', () => {
            const isOpen = document.body.classList.toggle('mobile-chat-open');
            chatToggle.setAttribute('aria-expanded', String(isOpen));
            chatToggle.setAttribute('aria-label', isOpen ? 'Đóng trò chuyện' : 'Mở trò chuyện');
            chatToggle.title = isOpen ? 'Đóng trò chuyện' : 'Mở trò chuyện';
            if (isOpen) chatToggle.classList.remove('has-unread');
        });

        document.getElementById('btn-pray').addEventListener('click', performPrayAction);
        document.getElementById('btn-incense').addEventListener('click', performIncenseAction);
        document.getElementById('btn-rosary').addEventListener('click', toggleRosaryModal);
        document.getElementById('btn-bell').addEventListener('click', performStrikeBell);
        document.getElementById('btn-wooden-fish').addEventListener('click', performStrikeWoodenFish);
        document.getElementById('btn-fortune').addEventListener('click', performDrawFortune);
        document.getElementById('btn-sit').addEventListener('click', toggleSitAction);

        document.getElementById('btn-close-rosary').addEventListener('click', () => {
            document.getElementById('rosary-modal').style.display = 'none';
            if (localPlayer) localPlayer.handRosaryGroup.visible = false;
        });

        document.getElementById('btn-close-fortune').addEventListener('click', () => {
            document.getElementById('fortune-modal').style.display = 'none';
        });

        const musicBtn = document.getElementById('btn-music');
        const musicIcon = document.getElementById('music-icon');
        const musicPlayer = document.getElementById('background-music');
        musicPlayer.addEventListener('play', () => {
            musicIcon.textContent = '🔊';
            musicBtn.title = 'Tắt nhạc nền';
            musicBtn.setAttribute('aria-label', 'Tắt nhạc nền');
            musicBtn.setAttribute('aria-pressed', 'true');
        });
        musicPlayer.addEventListener('pause', () => {
            musicIcon.textContent = '🔇';
            musicBtn.title = 'Bật nhạc nền';
            musicBtn.setAttribute('aria-label', 'Bật nhạc nền');
            musicBtn.setAttribute('aria-pressed', 'false');
        });
        musicBtn.addEventListener('click', () => {
            if (!musicPlayer.paused) {
                musicPlayer.pause();
                window.templeAudio.toggleAmbientMusic(false);
                return;
            }

            window.templeAudio.toggleAmbientMusic(false);
            musicPlayer.play().then(() => {
                // Button state is updated by the audio play event.
            }).catch(() => {
                musicBtn.setAttribute('aria-pressed', 'false');
                musicBtn.title = 'Bật nhạc nền';
                musicBtn.setAttribute('aria-label', 'Bật nhạc nền');
                showToast('Không phát được file nhạc.');
            });
        });

        document.getElementById('btn-help').addEventListener('click', () => {
            if (window.matchMedia('(pointer: coarse)').matches) {
                showToast('Joystick bên trái để di chuyển • Kéo cảnh để xoay • Vuốt thanh dưới để chọn nghi lễ.');
                return;
            }
            const help = document.getElementById('help-card');
            help.style.display = help.style.display === 'none' ? 'block' : 'none';
        });

        document.getElementById('btn-send-chat').addEventListener('click', sendChatMessage);
    }

    function sendChatMessage() {
        const input = document.getElementById('chat-input');
        const text = input.value.trim();
        if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;

        ws.send(JSON.stringify({ type: 'chat', text }));
        input.value = '';
        input.blur();
    }

    function showToast(msg) {
        const existing = document.querySelector('.temple-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'temple-toast';
        toast.textContent = msg;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ==========================================
    // 8. MULTIPLAYER WEBSOCKET
    // ==========================================
    function connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            STATE.connected = true;
            ws.send(JSON.stringify({
                type: 'init_player',
                name: STATE.playerName,
                robe: STATE.robeColor,
                x: localPlayer ? localPlayer.group.position.x : 0,
                y: localPlayer ? localPlayer.group.position.y : 0,
                z: localPlayer ? localPlayer.group.position.z : 25.5,
                rotY: localPlayer ? localPlayer.group.rotation.y : Math.PI
            }));
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleServerMessage(data);
            } catch (e) {
                console.error('WS Error:', e);
            }
        };

        ws.onclose = () => {
            STATE.connected = false;
            if (isLeavingPage) return;
            setTimeout(() => {
                if (!isLeavingPage) connectWebSocket();
            }, 3000);
        };
    }

    function handleServerMessage(data) {
        switch (data.type) {
            case 'welcome':
                STATE.playerId = data.playerId;
                if (data.players) data.players.forEach(p => addOrUpdateRemotePlayer(p));
                if (data.incense) data.incense.forEach(inc => createIncenseStick(inc.x, inc.y, inc.z, inc.id));
                if (data.chatHistory) data.chatHistory.forEach(msg => appendChatMessage(msg));
                updateOnlineCount();
                connectAblyRealtime();
                break;

            case 'player_joined':
            case 'player_updated':
                addOrUpdateRemotePlayer(data.player);
                updateOnlineCount();
                break;

            case 'player_moved':
                // A client should never render its own server echo as a remote avatar.
                if (data.id === STATE.playerId) break;
                if (data.realtime && isAblyConnected() && data.source !== 'ably') break;
                if (!remotePlayers.has(data.id) && data.name) {
                    addOrUpdateRemotePlayer({
                        id: data.id,
                        name: data.name,
                        robe: data.robe || 'blue',
                        x: data.x,
                        y: data.y,
                        z: data.z,
                        rotY: data.rotY
                    });
                    updateOnlineCount();
                }
                if (remotePlayers.has(data.id)) {
                    const rp = remotePlayers.get(data.id);
                    rp.targetPos.set(data.x, data.y, data.z);
                    rp.targetRotY = data.rotY;
                    rp.action = data.action;
                }
                break;

            case 'player_left':
                if (remotePlayers.has(data.id)) {
                    const rp = remotePlayers.get(data.id);
                    scene.remove(rp.avatar.group);
                    remotePlayers.delete(data.id);
                }
                updateOnlineCount();
                break;

            case 'player_action':
                handleRemoteAction(data);
                break;

            case 'chat_message':
                appendChatMessage(data.message);
                if (!document.body.classList.contains('mobile-chat-open')) {
                    document.getElementById('btn-chat-toggle').classList.add('has-unread');
                }
                if (data.message.playerId) {
                    if (data.message.playerId === STATE.playerId && localPlayer) {
                        showChatBubble(localPlayer, data.message.text);
                    } else if (remotePlayers.has(data.message.playerId)) {
                        const rp = remotePlayers.get(data.message.playerId);
                        showChatBubble(rp.avatar, data.message.text);
                    }
                }
                break;
        }
    }

    function isAblyConnected() {
        return Boolean(ablyClient && ablyChannel && ablyClient.connection.state === 'connected');
    }

    async function connectAblyRealtime() {
        if (!window.Ably || !STATE.playerId) return;
        if (ablyClient && ablyPlayerId === STATE.playerId) return;
        if (ablyClient) ablyClient.close();
        ablyClient = null;
        ablyChannel = null;
        ablyPlayerId = null;

        const clientId = STATE.playerId;
        const client = new window.Ably.Realtime({
            clientId,
            authCallback: async (_tokenParams, callback) => {
                try {
                    const response = await fetch(`/realtime-token?client_id=${encodeURIComponent(clientId)}`, { cache: 'no-store' });
                    if (!response.ok) throw new Error(`Realtime token request failed (${response.status})`);
                    callback(null, await response.json());
                } catch (error) {
                    callback(error, null);
                }
            }
        });

        const channel = client.channels.get('chua-an-lac:default:game');
        try {
            await channel.subscribe('player_moved', (message) => {
                const movement = message.data;
                if (!movement || movement.id === STATE.playerId) return;
                handleServerMessage({ type: 'player_moved', ...movement, realtime: true, source: 'ably' });
            });
            ablyClient = client;
            ablyChannel = channel;
            ablyPlayerId = clientId;
            realtimeFallbackNotified = false;
            showToast('Đã kết nối chuyển động trực tiếp.');
        } catch (error) {
            console.error('Không kết nối được kênh chuyển động trực tiếp:', error);
            if (!realtimeFallbackNotified) {
                showToast('Chưa kết nối được kênh realtime; đang dùng đường dự phòng.');
                realtimeFallbackNotified = true;
            }
            client.close();
        }
    }

    function addOrUpdateRemotePlayer(pData) {
        if (!pData || pData.id === STATE.playerId) return;

        if (remotePlayers.has(pData.id)) {
            const existing = remotePlayers.get(pData.id);
            const previousAvatar = existing.avatar;
            if (existing.data.name !== pData.name || existing.data.robe !== pData.robe) {
                const replacement = createChibiAvatarMesh(pData.name, pData.robe);
                replacement.group.position.copy(previousAvatar.group.position);
                replacement.group.rotation.copy(previousAvatar.group.rotation);
                replacement.animTime = previousAvatar.animTime;
                scene.remove(previousAvatar.group);
                scene.add(replacement.group);
                existing.avatar = replacement;
            }
            existing.data = pData;
            existing.targetPos.set(pData.x, pData.y, pData.z);
            existing.targetRotY = pData.rotY;
        } else {
            const avatar = createChibiAvatarMesh(pData.name, pData.robe);
            avatar.group.position.set(pData.x, pData.y, pData.z);
            avatar.group.rotation.y = pData.rotY;
            scene.add(avatar.group);

            remotePlayers.set(pData.id, {
                data: pData,
                avatar: avatar,
                targetPos: new THREE.Vector3(pData.x, pData.y, pData.z),
                targetRotY: pData.rotY,
                action: 'idle'
            });
        }
    }

    function handleRemoteAction(data) {
        if (data.id === STATE.playerId) return;

        if (data.action === 'bell') {
            window.templeAudio.playGreatBell();
            showToast(`Đạo hữu ${data.name} vừa thỉnh Đại Hồng Chung 🔔`);
        } else if (data.action === 'wooden_fish') {
            window.templeAudio.playWoodenFish();
        } else if (data.action === 'incense' && data.incenseItem) {
            const inc = data.incenseItem;
            createIncenseStick(inc.x, inc.y, inc.z, inc.id);
            showToast(`Đạo hữu ${data.name} vừa thắp nén hương thơm cúng Phật 🕯️`);
        } else if (data.action === 'pray') {
            showToast(`Đạo hữu ${data.name} đang thành kính đảnh lễ Tam Bảo 🙏`);
        } else if (data.action === 'sit') {
            showToast(`Đạo hữu ${data.name} đang tĩnh tâm ngồi thiền trên bồ đoàn 🧘`);
        } else if (data.action === 'rosary_round') {
            window.templeAudio.playSmallBell();
            showToast(`Đạo hữu ${data.name} vừa hoàn thành 1 vòng niệm Phật công đức viên mãn! 📿✨`);
        }
    }

    function sendAction(actionName, actionData) {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ type: 'action', action: actionName, data: actionData }));
    }

    function appendChatMessage(msg) {
        const chatBox = document.getElementById('chat-messages');
        const div = document.createElement('div');
        div.className = 'chat-msg' + (msg.isSystem ? ' system' : '');

        if (msg.isSystem) {
            div.textContent = msg.text;
        } else {
            div.innerHTML = `<span class="author">${escapeHtml(msg.sender)}:</span> ${escapeHtml(msg.text)}`;
        }

        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function updateOnlineCount() {
        const count = 1 + remotePlayers.size;
        document.getElementById('online-count').textContent = `${count} Phật tử viếng chùa`;
    }

    // ==========================================
    // 9. ELEVATION & OBSTACLE COLLISION PHYSICS
    // ==========================================
    function getGroundElevation(x, z) {
        // Cầu Đá Vòm Cong Bắc Ngang Hồ Sen (tại z = -3.0m, nối từ x = ±11.2m đến ±22.8m)
        if (Math.abs(z - (-3.0)) <= 1.15 && Math.abs(x) >= 11.2 && Math.abs(x) <= 22.8) {
            const u = (Math.abs(x) - 17.25) / 5.5;
            const archRise = Math.max(0, 1.0 - u * u) * 0.50;
            return 0.65 + archRise;
        }

        // Thềm & Sàn Chánh Điện (cao 0.65m)
        if (z <= 2.2 && z >= -15.5 && Math.abs(x) <= 10.5) {
            return 0.65;
        }

        // Bậc Tam Cấp Đi Lên Chánh Điện
        if (z > 2.2 && z <= 3.8 && Math.abs(x) <= 5.5) {
            const stepT = (3.8 - z) / (3.8 - 2.2);
            return stepT * 0.65;
        }

        if (Math.abs(x) > 25.4 || Math.abs(z) > 31.9) return -0.035;
        return 0.0;
    }

    function checkCollision(targetX, targetZ) {
        // 1. Hồ Sen Trái (x từ -22.5 đến -12.0, z từ -13.5 đến 7.5)
        if (targetX <= -12.0 && targetX >= -22.5 && targetZ >= -13.5 && targetZ <= 7.5) {
            // Cho phép đi ngang qua cầu đá bắc ngang tại z = -3.0 (lối đi cầu rộng 2.2m)
            if (Math.abs(targetZ - (-3.0)) > 1.1) return true;
        }

        // 2. Hồ Sen Phải (x từ 12.0 đến 22.5, z từ -13.5 đến 7.5)
        if (targetX >= 12.0 && targetX <= 22.5 && targetZ >= -13.5 && targetZ <= 7.5) {
            // Cho phép đi ngang qua cầu đá bắc ngang tại z = -3.0
            if (Math.abs(targetZ - (-3.0)) > 1.1) return true;
        }

        // 3. Perimeter walls: side and rear edges are closed; the front opening is the gate.
        if (Math.abs(targetX) > 49 || targetZ < -49 || targetZ > 49) return true;
        if (Math.abs(targetX) >= 25.4 && Math.abs(targetX) <= 26.6 && Math.abs(targetZ) <= 32.5) return true;
        if (targetZ >= -33.1 && targetZ <= -31.9 && Math.abs(targetX) <= 26) return true;
        if (targetZ >= 31.9 && targetZ <= 33.1 && Math.abs(targetX) > 5.5) return true;

        // 4. Kiểm Tra Va Chạm Với Toàn Bộ Cây Cối, Cột Chùa, Lư Hương, Bàn Thờ, Lầu Chuông
        for (let i = 0; i < OBSTACLES.length; i++) {
            const obs = OBSTACLES[i];
            if (obs.type === 'circle') {
                const dx = targetX - obs.x;
                const dz = targetZ - obs.z;
                if (dx * dx + dz * dz < obs.r * obs.r) return true;
            } else if (obs.type === 'box') {
                if (targetX >= obs.minX && targetX <= obs.maxX && targetZ >= obs.minZ && targetZ <= obs.maxZ) {
                    return true;
                }
            }
        }

        return false;
    }

    // ==========================================
    // 10. ANIMATION LOOP
    // ==========================================
    let lastTime = performance.now();
    let moveSendTimer = 0;
    let lastMovePacketAt = 0;
    let lastMovePacket = null;

    function animate() {
        requestAnimationFrame(animate);

        const now = performance.now();
        const delta = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        updateLocalPlayerMovement(delta);
        updateRemotePlayers(delta);

        particleSystems.forEach(ps => ps.update(delta));
        activeIncenseSticks.forEach(inc => inc.update(delta));

        if (haloInnerMesh) haloInnerMesh.rotation.z += delta * 0.08;

        candleLights.forEach((cl, i) => {
            cl.intensity = 1.1 + Math.sin(now * 0.01 + i * 2) * 0.22;
        });

        waterMeshList.forEach((w) => {
            w.material.map.offset.x += delta * 0.015;
            w.material.map.offset.y += delta * 0.01;
        });

        koiFishList.forEach(k => {
            k.angle += delta * k.speed * 0.5;
            k.mesh.position.x = k.baseX + Math.cos(k.angle) * 0.8;
            k.mesh.position.z = k.baseZ + Math.sin(k.angle) * 1.4;
            k.mesh.rotation.y = -k.angle + Math.PI / 2;
        });

        const orientBillboard = avatar => {
            avatar.billboardGroup.quaternion.copy(avatar.group.quaternion).invert().multiply(camera.quaternion);
        };
        if (localPlayer) orientBillboard(localPlayer);
        remotePlayers.forEach(rp => orientBillboard(rp.avatar));

        updateCameraPosition();
        renderer.render(scene, camera);
    }

    function updateLocalPlayerMovement(delta) {
        if (!localPlayer || STATE.isPraying || STATE.isOfferingIncense || STATE.isSitting) return;

        const moveSpeed = 5.0;
        let moveX = 0;
        let moveZ = 0;

        if (STATE.keys.w || STATE.keys.ArrowUp) moveZ -= 1;
        if (STATE.keys.s || STATE.keys.ArrowDown) moveZ += 1;
        if (STATE.keys.a || STATE.keys.ArrowLeft) moveX -= 1;
        if (STATE.keys.d || STATE.keys.ArrowRight) moveX += 1;

        const isMoving = (moveX !== 0 || moveZ !== 0);

        if (isMoving) {
            const len = Math.hypot(moveX, moveZ);
            moveX /= len;
            moveZ /= len;

            const sin = Math.sin(STATE.camera.theta);
            const cos = Math.cos(STATE.camera.theta);

            const worldMoveX = moveX * cos + moveZ * sin;
            const worldMoveZ = -moveX * sin + moveZ * cos;

            const newX = localPlayer.group.position.x + worldMoveX * moveSpeed * delta;
            const newZ = localPlayer.group.position.z + worldMoveZ * moveSpeed * delta;

            if (!checkCollision(newX, newZ)) {
                localPlayer.group.position.x = newX;
                localPlayer.group.position.z = newZ;
            } else {
                if (!checkCollision(newX, localPlayer.group.position.z)) {
                    localPlayer.group.position.x = newX;
                } else if (!checkCollision(localPlayer.group.position.x, newZ)) {
                    localPlayer.group.position.z = newZ;
                }
            }

            const groundY = getGroundElevation(localPlayer.group.position.x, localPlayer.group.position.z);
            localPlayer.group.position.y = THREE.MathUtils.lerp(localPlayer.group.position.y, groundY, 0.2);

            const targetRot = Math.atan2(worldMoveX, worldMoveZ);
            localPlayer.group.rotation.y = targetRot;

            localPlayer.animTime += delta * 11;
            const t = localPlayer.animTime;
            const legSwing = Math.sin(t) * 0.6;

            localPlayer.leftLeg.legRoot.rotation.x = legSwing;
            localPlayer.rightLeg.legRoot.rotation.x = -legSwing;

            localPlayer.spine.rotation.z = Math.sin(t) * 0.06;
            localPlayer.hips.position.y = 0.55 + Math.abs(Math.sin(t)) * 0.05;

            STATE.currentAction = 'walk';
        } else {
            const groundY = getGroundElevation(localPlayer.group.position.x, localPlayer.group.position.z);
            localPlayer.group.position.y = THREE.MathUtils.lerp(localPlayer.group.position.y, groundY, 0.2);

            localPlayer.animTime += delta * 2.2;
            const breathe = Math.sin(localPlayer.animTime) * 0.02;
            localPlayer.spine.position.y = 0.05 + breathe;
            localPlayer.spine.rotation.z = 0;
            localPlayer.hips.position.y = 0.55;

            localPlayer.leftLeg.legRoot.rotation.x = 0;
            localPlayer.rightLeg.legRoot.rotation.x = 0;

            STATE.currentAction = 'idle';
        }

        moveSendTimer += delta;
        if (moveSendTimer >= 0.05 && ws && ws.readyState === WebSocket.OPEN) {
            moveSendTimer = 0;
            const movement = {
                id: STATE.playerId,
                name: STATE.playerName,
                robe: STATE.robeColor,
                x: localPlayer.group.position.x,
                y: localPlayer.group.position.y,
                z: localPlayer.group.position.z,
                rotY: localPlayer.group.rotation.y,
                action: STATE.currentAction
            };
            const changed = !lastMovePacket ||
                Math.hypot(movement.x - lastMovePacket.x, movement.y - lastMovePacket.y, movement.z - lastMovePacket.z) > 0.01 ||
                Math.abs(movement.rotY - lastMovePacket.rotY) > 0.02 ||
                movement.action !== lastMovePacket.action;
            const heartbeatDue = performance.now() - lastMovePacketAt >= 1000;

            if (changed || heartbeatDue) {
                const realtime = isAblyConnected();
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'move', ...movement, realtime }));
                }
                if (realtime) {
                    ablyChannel.publish('player_moved', movement).catch(error => {
                        console.warn('Ably movement publish failed:', error);
                    });
                }
                lastMovePacket = movement;
                lastMovePacketAt = performance.now();
            }
        }
    }

    function updateRemotePlayers(delta) {
        remotePlayers.forEach(rp => {
            rp.avatar.group.position.lerp(rp.targetPos, 0.18);

            let diff = rp.targetRotY - rp.avatar.group.rotation.y;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            rp.avatar.group.rotation.y += diff * 0.18;

            const isMoving = rp.avatar.group.position.distanceTo(rp.targetPos) > 0.05;
            if (isMoving) {
                rp.avatar.animTime += delta * 11;
                const t = rp.avatar.animTime;
                const legSwing = Math.sin(t) * 0.6;
                rp.avatar.leftLeg.legRoot.rotation.x = legSwing;
                rp.avatar.rightLeg.legRoot.rotation.x = -legSwing;
                rp.avatar.spine.rotation.z = Math.sin(t) * 0.06;
                rp.avatar.hips.position.y = 0.55 + Math.abs(Math.sin(t)) * 0.05;
            } else {
                rp.avatar.leftLeg.legRoot.rotation.x = 0;
                rp.avatar.rightLeg.legRoot.rotation.x = 0;
                rp.avatar.spine.rotation.z = 0;
                rp.avatar.hips.position.y = 0.55;
            }
        });
    }

})();
