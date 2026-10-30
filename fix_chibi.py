# -*- coding: utf-8 -*-
import re

with open('public/app.js', 'r', encoding='utf-8') as f:
    app = f.read()

print('Initial length:', len(app))

# ==============================================================================
# 1. FIX FACE CAP: CĂN CHÍNH GIỮA MẶT TRƯỚC (+Z), NỀN TRONG SUỐT TIỆP DA ĐẦU 100%
# ==============================================================================
pos_face_start = app.find('const faceTex = ProceduralTextures.createChibiFace();')
pos_face_end = app.find('[-0.43, 0.43].forEach(x => {', pos_face_start)

new_face_code = '''const faceTex = ProceduralTextures.createChibiFace();
        // Khuôn mặt 3D căn chỉnh chuẩn xác tâm u=0.5 tại trục +Z (phi = PI/2)
        const phiLen = (140 / 180) * Math.PI;
        const phiSt = (Math.PI / 2) - 0.5 * phiLen;
        const faceCap = new THREE.Mesh(
            new THREE.SphereGeometry(0.423, 32, 24, phiSt, phiLen, Math.PI * 0.18, Math.PI * 0.60),
            new THREE.MeshStandardMaterial({ 
                map: faceTex, 
                transparent: true, 
                roughness: 0.45,
                metalness: 0.02,
                depthWrite: false,
                polygonOffset: true,
                polygonOffsetFactor: -1,
                polygonOffsetUnits: -1
            })
        );
        faceCap.position.set(0, 0.015, 0);
        headGroup.add(faceCap);
        const facePlane = faceCap;

        '''

if pos_face_start != -1 and pos_face_end != -1:
    app = app[:pos_face_start] + new_face_code + app[pos_face_end:]
    print('OK 1: Face cap centered on +Z')
else:
    print('FAIL 1: Face section not found')

# ==============================================================================
# 2. FIX INITIAL ARM ROTATION (Anjali Mudra)
# ==============================================================================
pattern_init = r'leftArm\.shoulder\.rotation\.set\(-0\.85,\s*0\.40,\s*-0\.45\);\s*\n\s*rightArm\.shoulder\.rotation\.set\(-0\.85,\s*-0\.40,\s*0\.45\);'
repl_init = 'leftArm.shoulder.rotation.set(-0.82, 0.0, 1.05);\n        rightArm.shoulder.rotation.set(-0.82, 0.0, -1.05);'

app, count = re.subn(pattern_init, repl_init, app, count=1)
print(f'OK 2: Initial arm rotation replaced ({count})')

# ==============================================================================
# 3. FIX PRAYER BOW ANIMATION
# ==============================================================================
pattern_bow = r'localPlayer\.leftArm\.shoulder\.rotation\.x\s*=\s*-0\.85\s*-\s*0\.25\s*\*\s*t;\s*\n\s*localPlayer\.rightArm\.shoulder\.rotation\.x\s*=\s*-0\.85\s*-\s*0\.25\s*\*\s*t;'
repl_bow = 'localPlayer.leftArm.shoulder.rotation.set(-0.82 - 0.20 * t, 0.0, 1.05);\n            localPlayer.rightArm.shoulder.rotation.set(-0.82 - 0.20 * t, 0.0, -1.05);'

app, count = re.subn(pattern_bow, repl_bow, app, count=1)
print(f'OK 3a: Bow arm animation replaced ({count})')

# ==============================================================================
# 4. FIX INCENSE OFFERING ANIMATION
# ==============================================================================
pattern_inc0 = r'localPlayer\.leftArm\.shoulder\.rotation\.x\s*=\s*-0\.85\s*-\s*0\.30\s*\*\s*t;\s*\n\s*localPlayer\.rightArm\.shoulder\.rotation\.x\s*=\s*-0\.85\s*-\s*0\.30\s*\*\s*t;'
repl_inc0 = 'localPlayer.leftArm.shoulder.rotation.set(-0.82 - 0.35 * t, 0.0, 1.05);\n                localPlayer.rightArm.shoulder.rotation.set(-0.82 - 0.35 * t, 0.0, -1.05);'
app, count = re.subn(pattern_inc0, repl_inc0, app, count=1)
print(f'OK 4a: Incense stage 0 replaced ({count})')

pattern_inc1 = r'localPlayer\.leftArm\.shoulder\.rotation\.x\s*=\s*-1\.15\s*-\s*0\.15\s*\*\s*bow;\s*\n\s*localPlayer\.rightArm\.shoulder\.rotation\.x\s*=\s*-1\.15\s*-\s*0\.15\s*\*\s*bow;'
repl_inc1 = 'localPlayer.leftArm.shoulder.rotation.set(-1.17 - 0.15 * bow, 0.0, 1.05);\n                localPlayer.rightArm.shoulder.rotation.set(-1.17 - 0.15 * bow, 0.0, -1.05);'
app, count = re.subn(pattern_inc1, repl_inc1, app, count=1)
print(f'OK 4b: Incense stage 1 replaced ({count})')

pattern_inc2 = r'localPlayer\.leftArm\.shoulder\.rotation\.x\s*=\s*-1\.15\s*\+\s*0\.30\s*\*\s*t;\s*\n\s*localPlayer\.rightArm\.shoulder\.rotation\.x\s*=\s*-1\.15\s*\+\s*0\.30\s*\*\s*t;'
repl_inc2 = 'localPlayer.leftArm.shoulder.rotation.set(-1.17 + 0.35 * t, 0.0, 1.05);\n                localPlayer.rightArm.shoulder.rotation.set(-1.17 + 0.35 * t, 0.0, -1.05);'
app, count = re.subn(pattern_inc2, repl_inc2, app, count=1)
print(f'OK 4c: Incense stage 2 replaced ({count})')

# ==============================================================================
# 5. ALL REMAINING reset rotation.set(-0.85, 0.40, -0.45)
# ==============================================================================
pattern_reset = r'localPlayer\.leftArm\.shoulder\.rotation\.set\(-0\.85,\s*0\.40,\s*-0\.45\);\s*\n(\s*)localPlayer\.rightArm\.shoulder\.rotation\.set\(-0\.85,\s*-0\.40,\s*0\.45\);'
repl_reset = r'localPlayer.leftArm.shoulder.rotation.set(-0.82, 0.0, 1.05);\n\1localPlayer.rightArm.shoulder.rotation.set(-0.82, 0.0, -1.05);'
app, count = re.subn(pattern_reset, repl_reset, app)
print(f'OK 5: All reset arm positions replaced ({count})')

# ==============================================================================
# 6. FIX SIT MEDITATION ANIMATION
# ==============================================================================
pattern_sit = r'localPlayer\.leftArm\.shoulder\.rotation\.set\(-0\.65,\s*0\.25,\s*-0\.20\);\s*\n(\s*)localPlayer\.rightArm\.shoulder\.rotation\.set\(-0\.65,\s*-0\.25,\s*0\.20\);'
repl_sit = r'localPlayer.leftArm.shoulder.rotation.set(-0.55, 0.0, 0.85);\n\1localPlayer.rightArm.shoulder.rotation.set(-0.55, 0.0, -0.85);'
app, count = re.subn(pattern_sit, repl_sit, app)
print(f'OK 6: Sit arm rotation replaced ({count})')

# ==============================================================================
# 7. MAKE SURE skinMat matches perfectly
# ==============================================================================
old_skin = 'color: 0xf7d9c4,'
new_skin = 'color: 0xfcebe1,'
if old_skin in app:
    app = app.replace(old_skin, new_skin)
    print('OK 7: skinMat color updated to 0xfcebe1')

with open('public/app.js', 'w', encoding='utf-8') as f:
    f.write(app)

print('Done! Verification: any remaining -0.85 in app.js?')
print(app.count('-0.85'))
