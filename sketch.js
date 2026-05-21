const VIDEO_FILES = [
  "./video/movie1-2.mp4",
  "./video/movie2-2.mp4",
  "./video/movie3-2.mp4",
  "./video/movie4-2.mp4",
  "./video/movie5-2.mp4",
  "./video/movie6-2.mp4",
  "./video/movie7-2.mp4",
  "./video/movie8-2.mp4",
];

const MIDDLE_FILE = "./video/middle.mp4";

const GRID_TO_VIDEO = [
  0, 1, 2,
  3, -1, 4,
  5, 6, 7,
];

const VIDEO_ZOOM = [
  1, 1, 1,
  1, 1, 1,
  1, 2,
];

let inputVideo;
let hands;
let camera;
let clips = [];
let middleClip;
let activeCount = 0;
let lastTriggerAt = -9999;
let previousPalmX = null;
let anchorPalmX = null;
let allActiveAt = null;
let lastDelta = 0;
let lastVelocity = 0;
let middleBounds = null;

const swingThreshold = 0.08;
const velocityThreshold = 0.035;
const triggerCooldown = 3000;
const allActiveHoldTime = 10000;

function setup() {
  const side = min(windowWidth, windowHeight);
  const canvas = createCanvas(side, side);
  canvas.parent("app");
  textFont("Arial, sans-serif");

  inputVideo = createElement("video");
  inputVideo.attribute("playsinline", "");
  inputVideo.attribute("muted", "");
  inputVideo.hide();

  for (let i = 0; i < VIDEO_FILES.length; i += 1) {
    const clip = createVideo([VIDEO_FILES[i]]);
    clip.hide();
    clip.volume(0);
    clip.elt.muted = true;
    clip.elt.playsInline = true;
    clip.elt.loop = true;
    clip.elt.preload = "auto";
    clip.elt.onended = () => {
      clip.time(0);
      clip.elt.play();
    };

    clips.push(clip);
  }

  middleClip = createVideo([MIDDLE_FILE]);
  middleClip.hide();
  middleClip.volume(0);
  middleClip.elt.muted = true;
  middleClip.elt.playsInline = true;
  middleClip.elt.loop = true;
  middleClip.elt.preload = "auto";
  middleClip.elt.oncanplay = () => {
    playMiddle();
  };

  setupHands();
}

function setupHands() {
  hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
  });

  hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.55,
    minTrackingConfidence: 0.5,
  });

  hands.onResults(handleHandResults);

  camera = new Camera(inputVideo.elt, {
    width: 640,
    height: 480,
    onFrame: async () => {
      await hands.send({ image: inputVideo.elt });
    },
  });

  camera
    .start()
    .catch(() => {});
}

function handleHandResults(results) {
  const hand = results.multiHandLandmarks && results.multiHandLandmarks[0];
  if (!hand) {
    previousPalmX = null;
    anchorPalmX = null;
    return;
  }

  const palmX = averageX([hand[0], hand[5], hand[9], hand[13], hand[17]]);
  if (anchorPalmX === null) {
    anchorPalmX = palmX;
  }

  if (previousPalmX !== null) {
    lastDelta = palmX - anchorPalmX;
    lastVelocity = palmX - previousPalmX;
    const ready = millis() - lastTriggerAt > triggerCooldown;
    const movedFarEnough = abs(lastDelta) > swingThreshold;
    const movedFastEnough = abs(lastVelocity) > velocityThreshold;

    if ((movedFarEnough || movedFastEnough) && ready) {
      activateNextVideo();
      lastTriggerAt = millis();
      anchorPalmX = palmX;
    }
  }

  previousPalmX = palmX;
}

function activateNextVideo() {
  if (activeCount >= clips.length) {
    return;
  }

  const playIndex = activeCount;
  activeCount += 1;
  playLooping(playIndex, true);

  for (let i = 0; i < activeCount; i += 1) {
    ensurePlaying(i);
  }

  if (activeCount === clips.length) {
    allActiveAt = millis();
  }
}

function playLooping(index, restart) {
  const clip = clips[index];
  clip.elt.loop = true;
  if (restart) {
    clip.time(0);
  }

  const playPromise = clip.elt.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
  }
}

function playMiddle() {
  if (!middleClip) {
    return;
  }
  const playPromise = middleClip.elt.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
  }
}

function ensurePlaying(index) {
  const clip = clips[index];
  if (clip.elt.paused) {
    playLooping(index, false);
  }
}

function resetAllVideos() {
  for (let i = 0; i < clips.length; i += 1) {
    clips[i].pause();
    clips[i].time(0);
  }
  activeCount = 0;
  allActiveAt = null;
}

function draw() {
  background(0);
  updateAutoReset();
  drawGrid();
}

function updateAutoReset() {
  if (allActiveAt !== null) {
    const elapsed = millis() - allActiveAt;
    if (elapsed >= allActiveHoldTime) {
      resetAllVideos();
    }
  }
}

function drawGrid() {
  const gap = width * 0.012;
  const cellW = (width - gap * 2) / 3;
  const cellH = cellW;

  for (let gridIndex = 0; gridIndex < GRID_TO_VIDEO.length; gridIndex += 1) {
    const col = gridIndex % 3;
    const row = floor(gridIndex / 3);
    const x = col * (cellW + gap);
    const y = row * (cellH + gap);
    const videoIndex = GRID_TO_VIDEO[gridIndex];

    if (videoIndex === -1) {
      middleBounds = { x, y, w: cellW, h: cellH };
      drawMiddleCell(x, y, cellW, cellH);
    } else {
      drawVideoCell(x, y, cellW, cellH, videoIndex);
    }
  }
}

function drawVideoCell(x, y, w, h, videoIndex) {
  const isActive = videoIndex < activeCount;

  if (isActive) {
    imageContain(clips[videoIndex], x, y, w, h, VIDEO_ZOOM[videoIndex]);
  }
}

function drawMiddleCell(x, y, w, h) {
  if (middleClip) {
    imageContain(middleClip, x, y, w, h, 1);
  }
}

function imageContain(media, x, y, w, h, zoom) {
  const mediaW = media.elt.videoWidth || media.width || w;
  const mediaH = media.elt.videoHeight || media.height || h;
  const scale = min(w / mediaW, h / mediaH) * zoom;
  const drawW = mediaW * scale;
  const drawH = mediaH * scale;
  const drawX = x + (w - drawW) / 2;
  const drawY = y + (h - drawH) / 2;
  image(media, drawX, drawY, drawW, drawH);
}

function averageX(points) {
  let sum = 0;
  for (const point of points) {
    sum += point.x;
  }
  return sum / points.length;
}

function keyPressed() {
  if (key === " ") {
    activateNextVideo();
  }
}

function mousePressed() {
  if (isInsideMiddle(mouseX, mouseY)) {
    activateNextVideo();
  }
}

function isInsideMiddle(x, y) {
  return (
    middleBounds &&
    x >= middleBounds.x &&
    x <= middleBounds.x + middleBounds.w &&
    y >= middleBounds.y &&
    y <= middleBounds.y + middleBounds.h
  );
}

function windowResized() {
  const side = min(windowWidth, windowHeight);
  resizeCanvas(side, side);
}

