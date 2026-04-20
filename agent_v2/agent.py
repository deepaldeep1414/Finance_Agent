import sys
import json
from graph import run_agent

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments"}))
        sys.exit(1)
        
    action = sys.argv[1]
    payload_str = sys.argv[2]
    
    try:
        payload = json.loads(payload_str)
    except Exception as e:
        print(json.dumps({"error": "Invalid payload format"}))
        sys.exit(1)
        
    try:
        result = run_agent(action, payload)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
