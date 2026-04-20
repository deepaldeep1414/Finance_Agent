import sys
from agent import get_finance_advice
from memory import MemoryManager

def main():
    print("=" * 50)
    print("Welcome to the Smart Finance AI Agent! (with Memory)")
    print("Type 'exit' to quit the application.")
    print("=" * 50)
    
    # Initialize MemoryManager
    memory = MemoryManager()
    
    while True:
        try:
            # Ask for user input
            user_input = input("\nYou: ")
            
            # Check for exit command
            if user_input.strip().lower() == "exit":
                print("\nGoodbye! Have a great day.")
                break
                
            # Skip empty inputs
            if not user_input.strip():
                continue
                
            print("\nAgent is thinking...\n")
            
            # Call the agent function, passing memory
            response = get_finance_advice(user_input, memory)
            
            # Debug Visibility: Print Memory State
            print("-" * 20 + " DEBUG " + "-" * 23)
            print(memory.get_memory_state_string())
            print("-" * 50)
            
            # Print response
            print("\n" + response)
            print("-" * 50)
            
        except KeyboardInterrupt:
            print("\nGoodbye! Have a great day.")
            break
        except Exception as e:
            print(f"\nAn unexpected error occurred: {e}")

if __name__ == "__main__":
    try:
        import config
        main()
    except ValueError as e:
        print(f"Configuration Error: {e}")
        sys.exit(1)
