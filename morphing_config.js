window.MORPH_CONFIG = {
  "$schema": "morphing-motion/v1",
  "meta": {
    "name": "Organic Gradient Morphing Motion",
    "description": "AI agent 모션 시스템 — 9개의 그라디언트 형태를 유기적으로 끊김 없이 몰핑(morph)하며 순환. 형태(form), 컬러(color), 컨트라스트(contrast)를 각 상태별로 정의하고, 부드러운 베지어/노이즈 기반 전이로 살아 움직이는 듯한 인상을 만든다.",
    "source": "IMG_9912.jpeg (9-grid gradient shape reference)",
    "author": "@danielsmile (reference) / generated config",
    "created": "2026-06-20",
    "units": { "space": "normalized 0..1 (viewbox)", "time": "ms", "angle": "deg" }
  },

  "canvas": {
    "viewBox": [0, 0, 1000, 1000],
    "aspectRatio": "1:1",
    "background": {
      "type": "solid",
      "color": "#0B0E14",
      "vignette": { "enabled": true, "color": "#05070B", "strength": 0.45, "radius": 0.85 }
    },
    "renderHints": {
      "colorSpace": "display-p3",
      "blendMode": "screen",
      "filmGrain": { "enabled": true, "opacity": 0.04, "scale": 1.2 },
      "globalBlur": { "min": 8, "max": 60, "unit": "px" }
    }
  },

  "globalMotion": {
    "loop": true,
    "direction": "forward",
    "playbackRate": 1.0,
    "morphDurationMs": 2600,
    "holdDurationMs": 1400,
    "easing": "cubic-bezier(0.65, 0.0, 0.35, 1.0)",
    "organicNoise": {
      "enabled": true,
      "type": "simplex",
      "amplitude": 0.06,
      "frequency": 0.45,
      "speed": 0.12,
      "seed": 9912,
      "comment": "정점(control point)을 미세하게 흔들어 액체/연기 같은 유기적 흐름 부여"
    },
    "breathing": {
      "enabled": true,
      "scaleRange": [0.96, 1.05],
      "rotationRange": [-6, 6],
      "periodMs": 5200
    },
    "colorDrift": {
      "enabled": true,
      "hueShiftRange": [-12, 12],
      "periodMs": 8000,
      "comment": "전이 중간에도 색상이 천천히 흘러 정적이지 않게 함"
    }
  },

  "shapes": [
    {
      "id": "01_gradient_blur",
      "label": "GRADIENT BLUR",
      "form": {
        "archetype": "swoosh-crescent",
        "topology": "open-stroke",
        "description": "초승달처럼 휘어진 붓터치/날개. 좌하단에서 우상단으로 쓸어 올린 곡선, 끝이 가늘어짐.",
        "blob": {
          "points": 6,
          "controlPoints": [
            [0.18, 0.62], [0.30, 0.40], [0.52, 0.30],
            [0.70, 0.34], [0.55, 0.50], [0.32, 0.66]
          ],
          "tension": 0.85,
          "elongation": 1.6,
          "rotation": -18
        }
      },
      "color": {
        "type": "linear-gradient",
        "angle": 35,
        "stops": [
          { "offset": 0.00, "color": "#2A0E3A" },
          { "offset": 0.35, "color": "#7A1E6E" },
          { "offset": 0.65, "color": "#D6489A" },
          { "offset": 0.88, "color": "#FBC8D8" },
          { "offset": 1.00, "color": "#FFFFFF" }
        ],
        "dominant": "#B0327F"
      },
      "contrast": {
        "level": "high",
        "ratio": 0.82,
        "highlight": "#FFFFFF",
        "shadow": "#1A0824",
        "edgeGlow": { "color": "#FFD9EC", "intensity": 0.7 }
      },
      "blur": 22,
      "opacity": 0.95
    },

    {
      "id": "02_modern_gradient_blob",
      "label": "MODERN GRADIENT BLOB",
      "form": {
        "archetype": "soft-orb",
        "topology": "closed-blob",
        "description": "둥근 유기체 방울. 약간 비대칭이며 상단이 더 채워진 형태.",
        "blob": {
          "points": 7,
          "controlPoints": [
            [0.50, 0.18], [0.74, 0.28], [0.80, 0.52],
            [0.70, 0.74], [0.46, 0.80], [0.26, 0.66], [0.24, 0.38]
          ],
          "tension": 0.92,
          "elongation": 1.05,
          "rotation": 4
        }
      },
      "color": {
        "type": "radial-gradient",
        "center": [0.58, 0.34],
        "stops": [
          { "offset": 0.00, "color": "#FF6A2C" },
          { "offset": 0.42, "color": "#F4823C" },
          { "offset": 0.75, "color": "#E9A878" },
          { "offset": 1.00, "color": "#D9C2A8" }
        ],
        "dominant": "#F1813A"
      },
      "contrast": {
        "level": "medium",
        "ratio": 0.48,
        "highlight": "#FFB07A",
        "shadow": "#8A3A14",
        "edgeGlow": { "color": "#FFC79A", "intensity": 0.4 }
      },
      "blur": 30,
      "opacity": 0.97
    },

    {
      "id": "03_modern_gradient_shapes_cloud",
      "label": "MODERN GRADIENT SHAPES",
      "form": {
        "archetype": "metaball-cluster",
        "topology": "multi-blob",
        "description": "구름처럼 뭉친 부드러운 덩어리들. 3~4개의 원이 metaball로 연결된 클러스터.",
        "metaballs": [
          { "center": [0.42, 0.30], "radius": 0.20 },
          { "center": [0.60, 0.42], "radius": 0.18 },
          { "center": [0.46, 0.58], "radius": 0.22 },
          { "center": [0.64, 0.68], "radius": 0.16 }
        ],
        "fieldThreshold": 0.55,
        "rotation": 0
      },
      "color": {
        "type": "radial-gradient",
        "center": [0.50, 0.45],
        "stops": [
          { "offset": 0.00, "color": "#9FB4D8" },
          { "offset": 0.40, "color": "#6E84A8" },
          { "offset": 0.70, "color": "#D89BB8" },
          { "offset": 1.00, "color": "#3E4A66" }
        ],
        "dominant": "#7C8FB2"
      },
      "contrast": {
        "level": "low",
        "ratio": 0.30,
        "highlight": "#C9D6EC",
        "shadow": "#2A3247",
        "edgeGlow": { "color": "#E6C2D6", "intensity": 0.25 }
      },
      "blur": 46,
      "opacity": 0.9
    },

    {
      "id": "04_gradient_shapes_15",
      "label": "GRADIENT SHAPES 15",
      "form": {
        "archetype": "comma-hook",
        "topology": "closed-blob",
        "description": "쉼표/갈고리 형태. 좌상단이 두껍고 우하단으로 가늘게 휘어 내려가는 꼬리.",
        "blob": {
          "points": 6,
          "controlPoints": [
            [0.28, 0.28], [0.46, 0.34], [0.50, 0.54],
            [0.62, 0.72], [0.40, 0.70], [0.24, 0.50]
          ],
          "tension": 0.8,
          "elongation": 1.35,
          "rotation": 12
        }
      },
      "color": {
        "type": "linear-gradient",
        "angle": 120,
        "stops": [
          { "offset": 0.00, "color": "#E8338C" },
          { "offset": 0.30, "color": "#C04AB4" },
          { "offset": 0.55, "color": "#F2B6C8" },
          { "offset": 0.80, "color": "#6A4EC8" },
          { "offset": 1.00, "color": "#2A36C0" }
        ],
        "dominant": "#C23FA0"
      },
      "contrast": {
        "level": "high",
        "ratio": 0.78,
        "highlight": "#FBD3E2",
        "shadow": "#1E1A55",
        "edgeGlow": { "color": "#FF9ECF", "intensity": 0.6 }
      },
      "blur": 26,
      "opacity": 0.96
    },

    {
      "id": "05_modern_gradient_shapes_pebble",
      "label": "MODERN GRADIENT SHAPES",
      "form": {
        "archetype": "rounded-triangle",
        "topology": "closed-blob",
        "description": "모서리가 둥근 삼각형/조약돌. 부피감 있는 넓은 형태.",
        "blob": {
          "points": 6,
          "controlPoints": [
            [0.50, 0.22], [0.74, 0.40], [0.72, 0.66],
            [0.50, 0.78], [0.28, 0.64], [0.28, 0.40]
          ],
          "tension": 0.9,
          "elongation": 1.1,
          "rotation": -6
        }
      },
      "color": {
        "type": "radial-gradient",
        "center": [0.58, 0.50],
        "stops": [
          { "offset": 0.00, "color": "#F79A3C" },
          { "offset": 0.35, "color": "#F0C06A" },
          { "offset": 0.65, "color": "#7FA0C8" },
          { "offset": 1.00, "color": "#4A6AA8" }
        ],
        "dominant": "#9A93A0"
      },
      "contrast": {
        "level": "medium",
        "ratio": 0.55,
        "highlight": "#FFD08A",
        "shadow": "#2E4068",
        "edgeGlow": { "color": "#FFC474", "intensity": 0.45 }
      },
      "blur": 38,
      "opacity": 0.95
    },

    {
      "id": "06_modern_gradient_shapes_wisp",
      "label": "MODERN GRADIENT SHAPES",
      "form": {
        "archetype": "flowing-ribbon",
        "topology": "open-stroke",
        "description": "수평으로 흐르는 물결 리본/연기. 가늘고 길며 우상단 끝이 살짝 솟음.",
        "blob": {
          "points": 8,
          "controlPoints": [
            [0.16, 0.56], [0.34, 0.48], [0.50, 0.54],
            [0.66, 0.46], [0.82, 0.40], [0.78, 0.52],
            [0.54, 0.60], [0.30, 0.62]
          ],
          "tension": 0.75,
          "elongation": 2.1,
          "rotation": -8
        }
      },
      "color": {
        "type": "linear-gradient",
        "angle": 10,
        "stops": [
          { "offset": 0.00, "color": "#3A4EA0" },
          { "offset": 0.45, "color": "#5C78C8" },
          { "offset": 0.78, "color": "#9AB0E0" },
          { "offset": 0.92, "color": "#F0A24A" },
          { "offset": 1.00, "color": "#FFC36A" }
        ],
        "dominant": "#5670BE"
      },
      "contrast": {
        "level": "medium-high",
        "ratio": 0.62,
        "highlight": "#FFD08A",
        "shadow": "#1E2A5C",
        "edgeGlow": { "color": "#B6C8F0", "intensity": 0.5 }
      },
      "blur": 28,
      "opacity": 0.92
    },

    {
      "id": "07_smart_gradient_sparkle",
      "label": "SMART GRADIENT SPARKLE",
      "form": {
        "archetype": "four-point-star",
        "topology": "radial-burst",
        "description": "4갈래 반짝임/별. 중심에서 상하좌우로 뻗는 빛살, 중앙이 가장 밝음.",
        "star": {
          "points": 4,
          "innerRadius": 0.06,
          "outerRadius": 0.40,
          "spikeSharpness": 0.92,
          "rotation": 0
        }
      },
      "color": {
        "type": "radial-gradient",
        "center": [0.50, 0.50],
        "stops": [
          { "offset": 0.00, "color": "#FFE9B0" },
          { "offset": 0.22, "color": "#FFB048" },
          { "offset": 0.55, "color": "#C85A6E" },
          { "offset": 1.00, "color": "#2A1640" }
        ],
        "dominant": "#FFB048"
      },
      "contrast": {
        "level": "very-high",
        "ratio": 0.9,
        "highlight": "#FFF4D0",
        "shadow": "#160A26",
        "edgeGlow": { "color": "#FFD27A", "intensity": 0.85 }
      },
      "blur": 18,
      "opacity": 1.0
    },

    {
      "id": "08_gradient_shapes_37",
      "label": "GRADIENT SHAPES 37",
      "form": {
        "archetype": "rounded-triangle-soft",
        "topology": "closed-blob",
        "description": "둥근 삼각 조약돌(05와 형태 유사). 표면이 더 말랑하고 굴곡이 많음.",
        "blob": {
          "points": 7,
          "controlPoints": [
            [0.52, 0.20], [0.70, 0.32], [0.74, 0.54],
            [0.62, 0.74], [0.42, 0.78], [0.28, 0.58], [0.32, 0.36]
          ],
          "tension": 0.86,
          "elongation": 1.15,
          "rotation": 8
        }
      },
      "color": {
        "type": "radial-gradient",
        "center": [0.48, 0.40],
        "stops": [
          { "offset": 0.00, "color": "#F4D7E6" },
          { "offset": 0.30, "color": "#E85FA8" },
          { "offset": 0.58, "color": "#B86AD0" },
          { "offset": 0.82, "color": "#6A7AD8" },
          { "offset": 1.00, "color": "#3A4AB8" }
        ],
        "dominant": "#D060B8"
      },
      "contrast": {
        "level": "medium",
        "ratio": 0.58,
        "highlight": "#FFF0F8",
        "shadow": "#26308C",
        "edgeGlow": { "color": "#F2A8D8", "intensity": 0.55 }
      },
      "blur": 34,
      "opacity": 0.95
    },

    {
      "id": "09_glowly_gradient_abstract",
      "label": "GLOWLY GRADIENT ABSTRACT",
      "form": {
        "archetype": "diagonal-flare",
        "topology": "open-stroke",
        "description": "대각선 추상 광채/불꽃. 좌하단에서 우상단으로 솟구치며 흩어지는 빛.",
        "blob": {
          "points": 6,
          "controlPoints": [
            [0.30, 0.72], [0.46, 0.54], [0.62, 0.40],
            [0.74, 0.26], [0.58, 0.48], [0.40, 0.64]
          ],
          "tension": 0.7,
          "elongation": 1.7,
          "rotation": -34
        }
      },
      "color": {
        "type": "linear-gradient",
        "angle": 55,
        "stops": [
          { "offset": 0.00, "color": "#4A5AB0" },
          { "offset": 0.35, "color": "#C98AA8" },
          { "offset": 0.62, "color": "#F4B486" },
          { "offset": 0.85, "color": "#F58A4A" },
          { "offset": 1.00, "color": "#FFD9A0" }
        ],
        "dominant": "#E59A78"
      },
      "contrast": {
        "level": "medium-high",
        "ratio": 0.65,
        "highlight": "#FFE6C2",
        "shadow": "#222C66",
        "edgeGlow": { "color": "#FFC79A", "intensity": 0.6 }
      },
      "blur": 40,
      "opacity": 0.93
    }
  ],

  "morphSequence": {
    "comment": "형태 간 전이 순서. 인접한 아키타입끼리 자연스럽게 변형되도록 정렬(스트로크↔블롭↔클러스터). 컬러도 웜↔쿨이 번갈아 흐르게 배치.",
    "order": [
      "01_gradient_blur",
      "04_gradient_shapes_15",
      "08_gradient_shapes_37",
      "05_modern_gradient_shapes_pebble",
      "02_modern_gradient_blob",
      "03_modern_gradient_shapes_cloud",
      "06_modern_gradient_shapes_wisp",
      "09_glowly_gradient_abstract",
      "07_smart_gradient_sparkle"
    ],
    "transitions": [
      { "from": "01_gradient_blur",        "to": "04_gradient_shapes_15",          "morphType": "elastic-flow",   "durationMs": 2600, "colorCrossfade": true,  "easing": "cubic-bezier(0.65,0,0.35,1)" },
      { "from": "04_gradient_shapes_15",   "to": "08_gradient_shapes_37",          "morphType": "blob-merge",     "durationMs": 2400, "colorCrossfade": true,  "easing": "ease-in-out" },
      { "from": "08_gradient_shapes_37",   "to": "05_modern_gradient_shapes_pebble","morphType": "vertex-lerp",   "durationMs": 2200, "colorCrossfade": true,  "easing": "ease-in-out" },
      { "from": "05_modern_gradient_shapes_pebble","to": "02_modern_gradient_blob","morphType": "vertex-lerp",    "durationMs": 2400, "colorCrossfade": true,  "easing": "ease-in-out" },
      { "from": "02_modern_gradient_blob", "to": "03_modern_gradient_shapes_cloud","morphType": "blob-split",     "durationMs": 2800, "colorCrossfade": true,  "easing": "cubic-bezier(0.5,0,0.2,1)" },
      { "from": "03_modern_gradient_shapes_cloud","to": "06_modern_gradient_shapes_wisp","morphType": "metaball-stretch","durationMs": 2800,"colorCrossfade": true,"easing": "ease-in-out" },
      { "from": "06_modern_gradient_shapes_wisp","to": "09_glowly_gradient_abstract","morphType": "elastic-flow", "durationMs": 2600, "colorCrossfade": true,  "easing": "cubic-bezier(0.65,0,0.35,1)" },
      { "from": "09_glowly_gradient_abstract","to": "07_smart_gradient_sparkle",    "morphType": "burst-converge", "durationMs": 2400, "colorCrossfade": true,  "easing": "cubic-bezier(0.3,0,0.1,1)" },
      { "from": "07_smart_gradient_sparkle","to": "01_gradient_blur",               "morphType": "burst-disperse", "durationMs": 2800, "colorCrossfade": true,  "easing": "cubic-bezier(0.6,0,0.4,1)", "loopback": true }
    ]
  },

  "agentBindings": {
    "comment": "AI agent 상태를 형태에 매핑 — 에이전트의 행동에 따라 모션이 반응하도록.",
    "states": {
      "idle":      { "shape": "02_modern_gradient_blob",        "playbackRate": 0.6, "breathing": true },
      "listening": { "shape": "03_modern_gradient_shapes_cloud","playbackRate": 0.8, "breathing": true },
      "thinking":  { "shape": "06_modern_gradient_shapes_wisp", "playbackRate": 1.2, "morphLoop": true },
      "responding":{ "shape": "01_gradient_blur",               "playbackRate": 1.4, "morphLoop": true },
      "success":   { "shape": "07_smart_gradient_sparkle",      "playbackRate": 1.0, "oneShot": true },
      "error":     { "shape": "04_gradient_shapes_15",          "playbackRate": 1.0, "hueShift": -30 }
    },
    "transitionOnStateChangeMs": 700
  }
}
;
