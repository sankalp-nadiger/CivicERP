from flask import Flask, request, jsonify
from PIL import Image, ExifTags
import numpy as np
import cv2
from io import BytesIO
import torch
from transformers import CLIPProcessor, CLIPModel

app = Flask(__name__)

# CLIP model for image classification
clip_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")
clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# Department categories for civic complaints
DEPARTMENT_CATEGORIES = [
    "electricity and power supply issues",
    "water supply and drainage problems",
    "road and transportation infrastructure",
    "garbage collection and sanitation",
    "street lighting issues",
    "sewage and drainage system",
    "public parks and gardens maintenance",
    "building and construction permits",
    "environmental pollution and noise",
    "public safety and security",
    "general infrastructure and maintenance"
]

def get_exif_data(image):
    try:
        exif_data = image._getexif()
        extracted = {}
        gps_data = {}

        if exif_data:
            for tag_id, value in exif_data.items():
                tag = ExifTags.TAGS.get(tag_id, tag_id)
                if tag == "GPSInfo":
                    for key in value:
                        gps_tag = ExifTags.GPSTAGS.get(key, key)
                        gps_data[gps_tag] = value[key]
                    extracted["GPSInfo"] = gps_data
                else:
                    extracted[tag] = value
        return extracted
    except Exception:
        return {}

def calculate_sharpness(image):
    try:
        img_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY)
        laplacian_var = cv2.Laplacian(img_cv, cv2.CV_64F).var()
        return laplacian_var
    except Exception:
        return 0

def calculate_compression_ratio(image, file_size):
    width, height = image.size
    resolution = width * height
    if resolution == 0:
        return 0
    ratio = file_size / resolution
    return ratio

def analyze_histogram(image):
    try:
        img = np.array(image)
        if len(img.shape) == 3:
            channels = img.shape[2]
        else:
            channels = 1

        histograms = []
        for i in range(channels):
            channel_data = img[:, :, i] if channels > 1 else img
            hist = np.histogram(channel_data, bins=256, range=(0, 256))[0]
            histograms.append(hist)

        variance = np.mean([np.var(h) for h in histograms])
        return variance
    except Exception:
        return 0

@app.route('/analyze', methods=['POST'])
def analyze_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files['image']
    claimed_problem = request.form.get('problem_category', '').lower().strip()
    
    try:
        image = Image.open(file)
    except Exception as e:
        return jsonify({"error": f"Error opening image: {e}"}), 500

    meta = get_exif_data(image)
    score = 0
    reasons = []

    analysis = {
        "Format": image.format,
        "Size": image.size,
        "ColorMode": image.mode
    }

    # Check EXIF metadata
    if image.format == 'JPEG':
        if not meta:
            score += 30
            reasons.append("No EXIF metadata found (JPEG likely edited or old).")
    elif image.format == 'PNG':
        if not image.info:
            score += 30
            reasons.append("No metadata chunks found in PNG (possibly edited or old).")

    # Software info detection
    software_info = None
    if "Software" in meta:
        software_info = meta["Software"]
    elif "software" in image.info:
        software_info = image.info['software']

    if software_info:
        analysis["Software"] = software_info
        software_name = str(software_info).lower()
        if any(tool in software_name for tool in ["photoshop", "snapseed", "editor", "fireworks", "gimp"]):
            score += 40
            reasons.append(f"Edited using {software_info} (high chance of editing).")
        else:
            score += 10
            reasons.append(f"Software tag found: {software_info} (possible edit).")
    else:
        reasons.append("No editing software tag found.")

    # GPS Info Check
    if "GPSInfo" in meta:
        reasons.append("GPS data found — likely from original camera.")
    else:
        score += 10
        reasons.append("No GPS info — often stripped in edited images.")

    # Resolution Heuristic
    width, height = image.size
    if width < 600 or height < 600:
        score += 20
        reasons.append("Low resolution image — possible compression or editing.")
    else:
        reasons.append("Resolution seems good — likely original.")

    # Sharpness Check
    sharpness = calculate_sharpness(image)
    analysis["SharpnessScore"] = sharpness
    if sharpness < 50:
        score += 10
        reasons.append("Low image sharpness — could be blurred or tampered.")
    else:
        reasons.append("Image appears sharp — clarity is good.")

    # Compression Ratio Check
    file.seek(0, 0)
    file_bytes = file.read()
    file_size = len(file_bytes)
    compression_ratio = calculate_compression_ratio(image, file_size)
    analysis["CompressionRatio"] = round(compression_ratio, 4)
    if compression_ratio > 0.5:
        score += 5
        reasons.append("High compression ratio — may indicate compression artifacts.")
    else:
        reasons.append("Compression level looks reasonable.")

    # Histogram Analysis
    hist_variance = analyze_histogram(image)
    analysis["HistogramVariance"] = round(hist_variance, 2)
    if hist_variance < 5000:
        score += 5
        reasons.append("Low histogram variance — limited color diversity (possible edit).")
    else:
        reasons.append("Color diversity appears normal.")

    # Final scoring
    score = min(score, 100)
    analysis["Score"] = score
    analysis["Reasons"] = reasons

    if score >= 70:
        analysis["Verdict"] = "HIGH chance of being EDITED or altered"
    elif score >= 40:
        analysis["Verdict"] = "MODERATE chance of being edited or low quality"
    else:
        analysis["Verdict"] = "Likely ORIGINAL or not significantly modified"

    # Fraud Detection: Verify image matches claimed problem category
    if claimed_problem:
        try:
            # Use CLIP to classify what the image actually shows
            inputs = clip_processor(
                text=DEPARTMENT_CATEGORIES,
                images=image,
                return_tensors="pt",
                padding=True
            )
            
            with torch.no_grad():
                outputs = clip_model(**inputs)
                logits_per_image = outputs.logits_per_image
                probs = logits_per_image.softmax(dim=1)
            
            # Get top prediction
            top_prob, top_idx = torch.max(probs[0], dim=0)
            detected_category = DEPARTMENT_CATEGORIES[top_idx.item()]
            confidence = float(top_prob.item())
            
            # Map common problem keywords to department categories
            problem_mapping = {
                "pothole": "road and transportation infrastructure",
                "road": "road and transportation infrastructure",
                "street": "road and transportation infrastructure",
                "water": "water supply and drainage problems",
                "drainage": "water supply and drainage problems",
                "leak": "water supply and drainage problems",
                "electricity": "electricity and power supply issues",
                "power": "electricity and power supply issues",
                "light": "street lighting issues",
                "streetlight": "street lighting issues",
                "garbage": "garbage collection and sanitation",
                "trash": "garbage collection and sanitation",
                "waste": "garbage collection and sanitation",
                "sanitation": "garbage collection and sanitation",
                "sewage": "sewage and drainage system",
                "sewer": "sewage and drainage system",
                "park": "public parks and gardens maintenance",
                "garden": "public parks and gardens maintenance",
                "pollution": "environmental pollution and noise",
                "noise": "environmental pollution and noise",
                "building": "building and construction permits",
                "construction": "building and construction permits",
                "safety": "public safety and security",
                "security": "public safety and security"
            }
            
            # Find expected category based on claimed problem
            expected_category = None
            for keyword, category in problem_mapping.items():
                if keyword in claimed_problem:
                    expected_category = category
                    break
            
            analysis["ImageClassification"] = {
                "detected_category": detected_category,
                "confidence": round(confidence, 3),
                "claimed_problem": claimed_problem
            }
            
            # Check for fraud/mismatch
            if expected_category and confidence > 0.25:
                if expected_category != detected_category:
                    analysis["FraudAlert"] = True
                    analysis["FraudReason"] = (
                        f"Image mismatch detected! You claimed the problem is related to '{claimed_problem}', "
                        f"but the uploaded image appears to show '{detected_category}' "
                        f"(confidence: {round(confidence * 100, 1)}%). "
                        f"Please upload the correct image that matches your complaint."
                    )
                    return jsonify(analysis), 400
                else:
                    analysis["FraudAlert"] = False
                    analysis["ImageVerification"] = "Image matches the claimed problem category"
            elif expected_category:
                # Low confidence, warn user
                analysis["FraudAlert"] = False
                analysis["ImageVerification"] = "Image classification has low confidence. Manual review recommended."
            else:
                analysis["FraudAlert"] = False
                analysis["ImageVerification"] = "Could not map claimed problem to category for verification"
                
        except Exception as e:
            analysis["FraudDetectionError"] = f"Could not verify image: {str(e)}"

    return jsonify(analysis)

@app.route('/classifyImage', methods=['POST'])
def classifyImage():
    """
    Automatically classifies complaint images into department categories using CLIP.
    
    For custom training with YOLOv8 or other models:
    1. Collect 500-1000 images per category
    2. Organize in folders: dataset/train/{category_name}/images/
    3. Use YOLOv8 classification: 
       - Install: pip install ultralytics
       - Train: yolo classify train data=dataset model=yolov8n-cls.pt epochs=100
       - Replace this CLIP implementation with trained YOLOv8 model
    
    Training Dataset Sources:
    - Kaggle: Search for "civic issues", "infrastructure", "municipal complaints"
    - Google Open Images: https://storage.googleapis.com/openimages/web/index.html
    - COCO Dataset: Filter relevant categories
    - Create custom dataset by collecting real complaint images
    - Indian Government Open Data: https://data.gov.in/
    - Crowdsource from existing complaint platforms
    """
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    
    try:
        file = request.files['image']
        image = Image.open(file).convert('RGB')
        
        # Prepare inputs for CLIP
        inputs = clip_processor(
            text=DEPARTMENT_CATEGORIES,
            images=image,
            return_tensors="pt",
            padding=True
        )
        
        # Get predictions
        with torch.no_grad():
            outputs = clip_model(**inputs)
            logits_per_image = outputs.logits_per_image
            probs = logits_per_image.softmax(dim=1)
        
        # Get top 3 predictions
        top3_probs, top3_indices = torch.topk(probs[0], k=3)
        
        predictions = []
        for idx, prob in zip(top3_indices, top3_probs):
            category = DEPARTMENT_CATEGORIES[idx.item()]
            # Extract department name (before "and" or "issues")
            dept_name = category.split(' and ')[0].split(' issues')[0].split(' problems')[0].title()
            predictions.append({
                "department": dept_name,
                "full_category": category,
                "confidence": float(prob.item())
            })
        
        return jsonify({
            "primary_department": predictions[0]["department"],
            "confidence": predictions[0]["confidence"],
            "all_predictions": predictions,
            "model": "CLIP-ViT-Base"
        })
        
    except Exception as e:
        return jsonify({"error": f"Classification failed: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True,port=5001)