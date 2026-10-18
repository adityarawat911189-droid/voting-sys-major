from fastapi import FastAPI, UploadFile, File
from deepface import DeepFace
import numpy as np
import cv2

app = FastAPI()

DETECTOR = "retinaface"
MODELS = {
    "ArcFace": 0.75,
}
MIN_SIDE = 300

def decode(data: bytes):
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        return None
    s = 1000 / max(img.shape[:2])
    if s < 1:
        img = cv2.resize(img, None, fx=s, fy=s, interpolation=cv2.INTER_AREA)
    return img

def crop_face(img):
    """Face dhundo (card ghuma ke bhi), aligned face BGR me deta hai."""
    for rot in (None, cv2.ROTATE_90_CLOCKWISE,
                cv2.ROTATE_90_COUNTERCLOCKWISE, cv2.ROTATE_180):
        im = img if rot is None else cv2.rotate(img, rot)
        try:
            faces = DeepFace.extract_faces(im, detector_backend=DETECTOR,
                                           enforce_detection=True, align=True)
        except Exception:
            continue
        if not faces:
            continue
        f = max(faces, key=lambda x: x["facial_area"]["w"] * x["facial_area"]["h"])
        face = f["face"]
        if face.dtype != np.uint8:
            face = (face * 255).clip(0, 255).astype(np.uint8)
        face = face[:, :, ::-1].copy()   # RGB -> BGR
        short = min(face.shape[:2])
        if short < MIN_SIDE:
            s = MIN_SIDE / short
            face = cv2.resize(face, None, fx=s, fy=s,
                              interpolation=cv2.INTER_LANCZOS4)
        return face
    return None

def variants(face):
    """2 versions: original aur CLAHE."""
    lab = cv2.cvtColor(face, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    l = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(l)
    return [face, cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)]

def embed(face, model):
    try:
        r = DeepFace.represent(face, model_name=model, detector_backend="skip",
                               align=False, enforce_detection=False)
        return np.array(r[0]["embedding"])
    except Exception:
        return None

def cos_dist(a, b):
    return 1 - float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

@app.post("/verify-face")
def verify_face(idImage: UploadFile = File(...), selfie: UploadFile = File(...)):
    id_img = decode(idImage.file.read())
    selfie_img = decode(selfie.file.read())
    if id_img is None or selfie_img is None:
        return {"status": "BAD_IMAGE"}

    id_face = crop_face(id_img)
    if id_face is None:
        return {"status": "NO_FACE_ID"}
    selfie_face = crop_face(selfie_img)
    if selfie_face is None:
        return {"status": "NO_FACE_SELFIE"}

    id_vars = variants(id_face)
    self_vars = variants(selfie_face)

    result = {}
    ok = True
    for model, thr in MODELS.items():
        id_embs = [embed(v, model) for v in id_vars]
        self_embs = [embed(v, model) for v in self_vars]
        dists = [cos_dist(i, s) for i, s in zip(id_embs, self_embs)
                 if i is not None and s is not None]
        if not dists:
            return {"status": "BAD_IMAGE"}
        d = min(dists)
        result[model] = round(d, 4)
        if d > thr:
            ok = False

    return {
        "status": "MATCH" if ok else "NO_MATCH",
        "distances": result,    # sirf testing
        "thresholds": MODELS,
    }