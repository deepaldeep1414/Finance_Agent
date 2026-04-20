import os
from flask import Flask, request, jsonify, send_from_directory
from config.settings import validate_settings
from agent.finance_agent import run_finance_agent

app = Flask(__name__, static_folder="static")

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_input = data.get('message', '')
        
        if not user_input:
            return jsonify({"error": "Message cannot be empty."}), 400
            
        response = run_finance_agent(user_input)
        return jsonify({"response": response})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    try:
        validate_settings()
        print("Starting Smart Finance Web Agent on http://localhost:5000")
        app.run(debug=True, port=5000)
    except ValueError as e:
        print(f"Configuration Error: {e}")
