// Thư viện Texture Chùa An Lạc 3D Cải Tiến: Chibi Face, Hoành Phi Câu Đối, Tượng Phật & Vàng Thếp

class ProceduralTextures {
    // 🧱 1. Gạch Bát Tràng Đỏ Sân Chùa
    static createBrickFloor() {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#8f3b2c';
        ctx.fillRect(0, 0, 1024, 1024);

        const rows = 16;
        const cols = 8;
        const brickW = 1024 / cols;
        const brickH = 1024 / rows;
        const mortar = 6;

        for (let r = 0; r < rows; r++) {
            const offsetX = (r % 2 === 0) ? 0 : brickW / 2;
            for (let c = -1; c <= cols; c++) {
                const x = c * brickW + offsetX;
                const y = r * brickH;

                const hueShift = (Math.random() - 0.5) * 16;
                const lumShift = (Math.random() - 0.5) * 20;
                ctx.fillStyle = `rgb(${155 + hueShift + lumShift}, ${65 + lumShift}, ${48 + lumShift})`;
                ctx.fillRect(x + mortar, y + mortar, brickW - mortar * 2, brickH - mortar * 2);

                for (let i = 0; i < 35; i++) {
                    const sx = x + mortar + Math.random() * (brickW - mortar * 2);
                    const sy = y + mortar + Math.random() * (brickH - mortar * 2);
                    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(60,20,10,0.18)' : 'rgba(230,180,140,0.15)';
                    ctx.beginPath();
                    ctx.arc(sx, sy, Math.random() * 3 + 1, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        ctx.fillStyle = 'rgba(70, 50, 45, 0.4)';
        for (let r = 0; r <= rows; r++) {
            ctx.fillRect(0, r * brickH - 2, 1024, 4);
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(8, 8);
        return tex;
    }

    // Weathered courtyard flagstones with shallow grout joints and mineral variation.
    static createCourtyardStone() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#343b3b';
        ctx.fillRect(0, 0, 512, 512);

        const tileW = 128;
        const tileH = 85;
        for (let row = 0; row < 6; row++) {
            const offset = row % 2 ? tileW / 2 : 0;
            for (let col = -1; col < 5; col++) {
                const x = col * tileW + offset;
                const y = row * tileH;
                const tone = 82 + Math.random() * 28;
                const shade = Math.round(tone);
                ctx.fillStyle = `rgb(${shade - 5}, ${shade}, ${shade - 1})`;
                ctx.fillRect(x + 3, y + 3, tileW - 6, tileH - 6);
                ctx.strokeStyle = 'rgba(225, 218, 198, 0.12)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + 5, y + tileH - 5);
                ctx.lineTo(x + 5, y + 5);
                ctx.lineTo(x + tileW - 5, y + 5);
                ctx.stroke();
                for (let i = 0; i < 65; i++) {
                    const px = x + 8 + Math.random() * (tileW - 16);
                    const py = y + 8 + Math.random() * (tileH - 16);
                    const alpha = 0.025 + Math.random() * 0.055;
                    ctx.fillStyle = Math.random() > 0.5
                        ? `rgba(230, 224, 207, ${alpha})`
                        : `rgba(18, 24, 24, ${alpha})`;
                    ctx.fillRect(px, py, 2 + Math.random() * 5, 1 + Math.random() * 3);
                }
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 5);
        return tex;
    }

    static createOuterGardenGround() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#4c5544';
        ctx.fillRect(0, 0, 512, 512);

        for (let i = 0; i < 18000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const shade = Math.random();
            ctx.fillStyle = shade > 0.68
                ? 'rgba(133, 128, 91, 0.20)'
                : shade > 0.34 ? 'rgba(81, 112, 64, 0.22)' : 'rgba(35, 47, 38, 0.18)';
            ctx.fillRect(x, y, 1 + Math.random() * 3, 1 + Math.random() * 7);
        }

        for (let i = 0; i < 700; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(166, 157, 119, 0.22)' : 'rgba(28, 40, 31, 0.2)';
            ctx.lineWidth = 1 + Math.random() * 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + (Math.random() - 0.5) * 5, y - 3 - Math.random() * 8);
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(14, 14);
        return tex;
    }

    // 🏮 2. Ngói Vảy Cá Cổ Truyền
    static createRoofTiles() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#6a2113';
        ctx.fillRect(0, 0, 512, 512);

        const tileCols = 16;
        const tileRows = 32;
        const w = 512 / tileCols;
        const h = 512 / tileRows;

        for (let r = 0; r < tileRows; r++) {
            const shift = (r % 2) * (w / 2);
            for (let c = -1; c <= tileCols; c++) {
                const x = c * w + shift;
                const y = r * h;

                const grad = ctx.createLinearGradient(x, y, x, y + h);
                grad.addColorStop(0, '#a93b22');
                grad.addColorStop(0.7, '#882915');
                grad.addColorStop(1, '#481308');
                ctx.fillStyle = grad;

                ctx.beginPath();
                ctx.arc(x + w / 2, y + h * 0.8, w * 0.48, Math.PI, 0, true);
                ctx.lineTo(x + w, y);
                ctx.lineTo(x, y);
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = '#c54e32';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(6, 6);
        return tex;
    }

    // 🪵 3. Gỗ Lim Cổ Kính
    static createWoodgrain(baseHex = '#4a1d12') {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = baseHex;
        ctx.fillRect(0, 0, 512, 512);

        for (let i = 0; i < 300; i++) {
            const y = Math.random() * 512;
            const dark = Math.random() > 0.4;
            ctx.strokeStyle = dark ? 'rgba(30, 8, 4, 0.35)' : 'rgba(120, 50, 30, 0.25)';
            ctx.lineWidth = Math.random() * 3 + 1;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.bezierCurveTo(150, y + (Math.random() - 0.5) * 30, 350, y + (Math.random() - 0.5) * 30, 512, y);
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 4);
        return tex;
    }

    // ✨ 4. Vàng Thếp Tượng Phật (Gilded Gold Leaf with Fine Hammered Glow)
    static createGoldLeaf() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 360);
        grad.addColorStop(0, '#fff4a8');
        grad.addColorStop(0.35, '#ffd700');
        grad.addColorStop(0.75, '#d4af37');
        grad.addColorStop(1, '#946f00');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 512, 512);

        for (let i = 0; i < 400; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const r = Math.random() * 10 + 3;
            ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 255, 230, 0.25)' : 'rgba(130, 90, 0, 0.2)';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        return new THREE.CanvasTexture(canvas);
    }

    // 🔔 5. Đồng Cổ Lư Hương & Chuông
    static createAntiqueBronze() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#5c4524';
        ctx.fillRect(0, 0, 512, 512);

        for (let i = 0; i < 250; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const r = Math.random() * 20 + 5;
            ctx.fillStyle = Math.random() > 0.7 ? 'rgba(45, 95, 75, 0.25)' : 'rgba(30, 20, 10, 0.35)';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
        ctx.lineWidth = 4;
        ctx.strokeRect(20, 20, 472, 472);

        return new THREE.CanvasTexture(canvas);
    }

    // 👘 6. Vải Dệt Áo Lam / Áo Nâu Chibi Cao Cấp (Fine Linen Weave with Dharma Motif)
    static createFabricWeave(baseColorHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Màu nền cơ bản
        ctx.fillStyle = baseColorHex;
        ctx.fillRect(0, 0, 512, 512);

        // Hiệu ứng sợi vải đũi dệt ngang dọc tự nhiên
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        for (let x = 0; x < 512; x += 4) {
            ctx.fillRect(x, 0, 2, 512);
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.09)';
        for (let y = 0; y < 512; y += 4) {
            ctx.fillRect(0, y, 512, 2);
        }

        // Vân gấm chìm hoa văn cát tường chữ Vạn
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1.5;
        for (let gx = 32; gx < 512; gx += 64) {
            for (let gy = 32; gy < 512; gy += 64) {
                ctx.beginPath();
                ctx.arc(gx, gy, 12, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 2);
        return tex;
    }

    // 🪵 6b. Gỗ Sơn Son Thếp Vàng Bàn Thờ Tam Bảo
    static createAltarWoodTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Gỗ mun / trắc đỏ sẫm sơn then
        ctx.fillStyle = '#2d0a06';
        ctx.fillRect(0, 0, 512, 512);

        // Thớ gỗ bóng mờ
        for (let i = 0; i < 200; i++) {
            const y = Math.random() * 512;
            ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(70, 15, 8, 0.4)' : 'rgba(15, 3, 2, 0.5)';
            ctx.lineWidth = Math.random() * 4 + 1;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.bezierCurveTo(150, y + 10, 350, y - 10, 512, y);
            ctx.stroke();
        }

        // Viền thếp vàng hoa văn triện cổ
        ctx.strokeStyle = 'rgba(218, 165, 32, 0.4)';
        ctx.lineWidth = 6;
        ctx.strokeRect(10, 10, 492, 492);

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 2);
        return tex;
    }

    // 🌊 7. Gợn Sóng Hồ Sen
    static createWaterRipple() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#0f3835';
        ctx.fillRect(0, 0, 512, 512);

        for (let i = 0; i < 40; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const r = Math.random() * 60 + 30;

            const grad = ctx.createRadialGradient(x, y, r * 0.4, x, y, r);
            grad.addColorStop(0, 'rgba(40, 150, 140, 0.25)');
            grad.addColorStop(0.7, 'rgba(20, 80, 75, 0.15)');
            grad.addColorStop(1, 'rgba(15, 56, 53, 0)');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        const tex = new THREE.CanvasTexture(canvas);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(3, 3);
        return tex;
    }

    // 😊 8. Khuôn Mặt Chibi Chú Tiểu Cân Đối Tuyệt Đối (Perfect Symmetric Chibi Face)
    static createChibiFace() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Nền da đặc để toàn bộ mặt dùng cùng một màu và ánh sáng với đầu.
        ctx.fillStyle = '#fcebe1';
        ctx.fillRect(0, 0, 512, 512);

        // Cute rosy blushing cheeks (Má hồng cân xứng 2 bên)
        const leftBlush = ctx.createRadialGradient(160, 300, 5, 160, 300, 55);
        leftBlush.addColorStop(0, 'rgba(255, 120, 130, 0.6)');
        leftBlush.addColorStop(1, 'rgba(255, 120, 130, 0)');
        ctx.fillStyle = leftBlush;
        ctx.beginPath();
        ctx.arc(160, 300, 55, 0, Math.PI * 2);
        ctx.fill();

        const rightBlush = ctx.createRadialGradient(352, 300, 5, 352, 300, 55);
        rightBlush.addColorStop(0, 'rgba(255, 120, 130, 0.6)');
        rightBlush.addColorStop(1, 'rgba(255, 120, 130, 0)');
        ctx.fillStyle = rightBlush;
        ctx.beginPath();
        ctx.arc(352, 300, 55, 0, Math.PI * 2);
        ctx.fill();

        // Big, peaceful cute chibi eyes (Mắt cười cong nhẹ thanh tịnh)
        ctx.strokeStyle = '#2d1810';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';

        // Left eye
        ctx.beginPath();
        ctx.arc(180, 245, 32, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();

        // Right eye
        ctx.beginPath();
        ctx.arc(332, 245, 32, Math.PI * 1.15, Math.PI * 1.85);
        ctx.stroke();

        // Eyebrows
        ctx.lineWidth = 5.5;
        ctx.beginPath();
        ctx.arc(180, 205, 36, Math.PI * 1.2, Math.PI * 1.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(332, 205, 36, Math.PI * 1.2, Math.PI * 1.8);
        ctx.stroke();

        // Sweet smiling mouth (Miệng cười mỉm từ bi chính giữa)
        ctx.strokeStyle = '#c94a38';
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(256, 335, 24, 0.15, Math.PI - 0.15);
        ctx.stroke();

        // Tiny cute nose dot
        ctx.fillStyle = '#d49b82';
        ctx.beginPath();
        ctx.arc(256, 285, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // 3 Chấm Giới Điệp Trán Chú Tiểu
        ctx.fillStyle = '#b91c1c';
        [-32, 0, 32].forEach(dx => {
            ctx.beginPath();
            ctx.arc(256 + dx, 125, 7, 0, Math.PI * 2);
            ctx.fill();
        });

        return new THREE.CanvasTexture(canvas);
    }

    // 📜 9. Hoành Phi Sơn Son Thếp Vàng Trang Nghiêm
    static createHoanhPhiTexture(hanzi = '大 雄 寶 殿', vietnamese = 'ĐẠI HÙNG BẢO ĐIỆN') {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Nền gỗ sơn son đỏ thẫm sơn then
        ctx.fillStyle = '#680e05';
        ctx.fillRect(0, 0, 1024, 256);

        // Khung kép thếp vàng hoa văn mây cuộn
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 10;
        ctx.strokeRect(12, 12, 1000, 232);
        ctx.lineWidth = 4;
        ctx.strokeRect(26, 26, 972, 204);

        // Góc hồi văn chữ Vạn ở 4 góc
        const corners = [[36, 36], [988, 36], [36, 220], [988, 220]];
        ctx.fillStyle = '#ffd700';
        corners.forEach(([cx, cy]) => {
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, Math.PI * 2);
            ctx.fill();
        });

        // Chữ đại tự thếp vàng
        ctx.font = 'bold 84px "Playfair Display", "Cinzel", serif';
        ctx.fillStyle = '#fff4a3';
        ctx.shadowColor = '#d4af37';
        ctx.shadowBlur = 16;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(hanzi, 512, 110);

        // Chữ quốc ngữ phụ đề trang nhã
        ctx.font = 'bold 34px "Quicksand", sans-serif';
        ctx.fillStyle = '#ffd700';
        ctx.shadowBlur = 0;
        ctx.fillText(vietnamese, 512, 192);

        return new THREE.CanvasTexture(canvas);
    }

    // 📜 10. Câu Đối Cột Chùa Sơn Son Thếp Vàng (Vertical Couplets)
    static createCauDoiTexture(text) {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 1280;
        const ctx = canvas.getContext('2d');

        // Nền gỗ sơn son đỏ thẫm
        ctx.fillStyle = '#520b04';
        ctx.fillRect(0, 0, 320, 1280);

        // Khung kép thếp vàng kim tuyến
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 8;
        ctx.strokeRect(14, 14, 292, 1252);
        ctx.lineWidth = 3;
        ctx.strokeRect(24, 24, 272, 1232);

        // Họa tiết hoa sen đầu bảng và đuôi bảng câu đối
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(160, 50, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(160, 1230, 10, 0, Math.PI * 2);
        ctx.fill();

        // Chữ thư pháp vàng rực rỡ
        ctx.font = 'bold 46px "Playfair Display", serif';
        ctx.fillStyle = '#fff089';
        ctx.shadowColor = '#c49a18';
        ctx.shadowBlur = 10;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const lines = text.split('\n');
        const count = lines.length;
        const availableHeight = 1100;
        const step = availableHeight / (count + 1);
        lines.forEach((char, idx) => {
            ctx.fillText(char, 160, 90 + (idx + 1) * step);
        });

        return new THREE.CanvasTexture(canvas);
    }
    // 🪷 11. Tải và Tách Nền Chuẩn Xác Cho Tượng Phật Dát Vàng (Flawless Cutout)
    static loadBuddhaCutoutTexture(url, callback) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imgData.data;

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                const colorDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
                const redDominance = r - b;

                // Tượng Phật có sắc vàng/cam/đồng nên Kênh Đỏ (Red) luôn vượt trội Kênh Lam (Blue) (r - b >= 28)
                // Nền ô cờ xám/trắng là màu trung tính (r ≈ g ≈ b, r - b rất nhỏ)
                if (redDominance < 20 || (colorDiff < 18 && r > 120)) {
                    data[i + 3] = 0; // Trong suốt 100%
                } else if (redDominance < 28) {
                    // Làm mềm viền cạnh (anti-aliased edge feathering)
                    data[i + 3] = Math.floor(((redDominance - 20) / 8) * 255);
                }
            }
            ctx.putImageData(imgData, 0, 0);

            const tex = new THREE.CanvasTexture(canvas);
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.needsUpdate = true;
            if (callback) callback(tex, img.width / img.height);
        };
        img.src = url;
    }
}

window.ProceduralTextures = ProceduralTextures;
