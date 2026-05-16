import cv2
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
import json
import threading
import time
import os

app = FastAPI()

# Path to the hand landmarker model
MODEL_PATH = 'hand_landmarker.task'

# Initialize MediaPipe Hand Landmarker
base_options = python.BaseOptions(model_asset_path=MODEL_PATH)
options = vision.HandLandmarkerOptions(
    base_options=base_options,
    running_mode=vision.RunningMode.VIDEO,
    num_hands=2,
    min_hand_detection_confidence=0.7,
    min_hand_presence_confidence=0.5,
    min_tracking_confidence=0.5
)
detector = vision.HandLandmarker.create_from_options(options)

# Shared state for tracking data
shared_state = {
    "hands": [],
    "last_update": time.time(),
    "is_running": True
}
lock = threading.Lock()

def process_camera():
    """Background thread to process camera frames using MediaPipe."""
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open camera.")
        return

    while shared_state["is_running"]:
        success, frame = cap.read()
        if not success:
            continue

        # Flip the frame horizontally for a later selfie-view display
        frame = cv2.flip(frame, 1)
        
        # Convert the BGR image to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
        
        # Process the frame and find hands
        # Using VIDEO mode requires timestamp in milliseconds
        timestamp_ms = int(time.time() * 1000)
        detection_result = detector.detect_for_video(mp_image, timestamp_ms)

        current_hands = []
        if detection_result.hand_landmarks:
            for hand_landmarks in detection_result.hand_landmarks:
                # Extract index finger tip (8) and thumb tip (4)
                index_tip = hand_landmarks[8]
                thumb_tip = hand_landmarks[4]
                
                # Calculate distance between index and thumb (pinch gesture)
                pinch_dist = ((index_tip.x - thumb_tip.x)**2 + (index_tip.y - thumb_tip.y)**2)**0.5
                
                current_hands.append({
                    "index": {"x": index_tip.x, "y": index_tip.y},
                    "thumb": {"x": thumb_tip.x, "y": thumb_tip.y},
                    "is_pinching": pinch_dist < 0.05
                })
        
        with lock:
            shared_state["hands"] = current_hands
            shared_state["last_update"] = time.time()

    cap.release()

# Start the camera processing thread
camera_thread = threading.Thread(target=process_camera, daemon=True)
camera_thread.start()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            # Send the latest tracking data to the client
            with lock:
                data = {
                    "hands": shared_state["hands"],
                    "timestamp": shared_state["last_update"]
                }
            await websocket.send_json(data)
            # Control update rate (approx 30fps)
            await asyncio.sleep(0.033)
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")

# Mount static files
app.mount("/", StaticFiles(directory="app/static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
