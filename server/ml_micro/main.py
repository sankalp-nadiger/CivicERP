from flask import Flask, jsonify, request
import torch
from transformers import AutoTokenizer, BartForConditionalGeneration, AutoModelForSequenceClassification

app = Flask(__name__)

summary_model = BartForConditionalGeneration.from_pretrained("facebook/bart-large-cnn")
summary_tokenizer = AutoTokenizer.from_pretrained("facebook/bart-large-cnn")

score_model = AutoModelForSequenceClassification.from_pretrained('nlptown/bert-base-multilingual-uncased-sentiment')
score_tokenizer = AutoTokenizer.from_pretrained('nlptown/bert-base-multilingual-uncased-sentiment')

tag_weights = {
    "public safety": 5, "crime": 5, "emergency": 5,
    "water supply": 4, "electricity": 4, "sanitation": 4,
    "roads": 4, "infrastructure": 4, "drainage": 4,
    "street lights": 3, "garbage": 3, "pollution": 3,
    "parks": 2, "building permits": 2, "noise": 2,
    "others": 1
}

@app.route('/getSummary', methods=["POST"])
def getSummary():
    data = request.get_json(force=True)
    
    if 'message' not in data or not isinstance(data['message'], str):
        return jsonify({"error": "Invalid or missing 'message'"}), 400
    
    inputs = summary_tokenizer.encode(data['message'], max_length=1024, return_tensors="pt", truncation=True)
    summary_ids = summary_model.generate(inputs, num_beams=2, min_length=0, max_length=100)
    summary_text = summary_tokenizer.decode(summary_ids[0], skip_special_tokens=True, clean_up_tokenization_spaces=False)

    return jsonify({"summary": summary_text})

@app.route('/getScore', methods=['POST'])
def getScore():
    data = request.get_json(force=True)

    if 'complaint' not in data or not isinstance(data['complaint'], str):
        return jsonify({"error": "Invalid or missing 'complaint'"}), 400

    tokens = score_tokenizer.encode(data['complaint'], return_tensors='pt', truncation=True)
    result = score_model(tokens)
    score = int(torch.argmax(result.logits)) + 1

    return jsonify({"index": 6 - score})

@app.route('/normalize', methods=['POST'])
def getOverallScore():
    data = request.get_json(force=True)
    print(data['categories'],data['score'])
    if 'categories' not in data or 'score' not in data:
        return jsonify({"error": "Missing 'categories' or 'score'"}), 400

    if not isinstance(data['categories'], list) or not isinstance(data['score'], (int, float)):
        return jsonify({"error" : [data['score'],data['categories']]}), 400

    final_score = sum(tag_weights.get(tag.lower(), 1) for tag in data['categories'])
    severity_score = (data['score'] * final_score)

    return jsonify({"complaint_severity_score": severity_score})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5002, debug=True)