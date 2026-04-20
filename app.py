import sys
from config.settings import validate_settings
from agent.finance_agent import run_finance_agent

def main():
    print("Initializing Smart Finance AI Agent...")
    
    # 1. Validate API Key
    try:
        validate_settings()
        print("Status: GROQ_API_KEY successfully loaded.\n")
    except ValueError as e:
        print(f"❌ Configuration Error: {e}")
        print("Please add your Groq API key to the .env file and restart.")
        sys.exit(1)
        
    print("=" * 60)
    print("🤖 Welcome to the Smart Finance AI Agent (Phase 1)")
    print("Type 'exit' or 'quit' to close the application.")
    print("=" * 60)
    
    # 2. Main interactive loop
    while True:
        try:
            user_input = input("\n💬 Your Financial Question: ").strip()
            
            if user_input.lower() in ['exit', 'quit']:
                print("\nThank you for using the Smart Finance AI Agent. Goodbye! 👋")
                break
                
            if not user_input:
                print("⚠️ Please enter a valid question.")
                continue
                
            print("\n⏳ Thinking...")
            response = run_finance_agent(user_input)
            
            print("\n📊 Agent Response:")
            print("-" * 60)
            print(response)
            print("-" * 60)
            
        except KeyboardInterrupt:
            print("\n\nOperation cancelled by user. Exiting...")
            break
        except Exception as e:
            print(f"\n❌ An unexpected error occurred: {e}")

if __name__ == "__main__":
    main()
