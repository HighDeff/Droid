#!/usr/bin/env python
"""
Screen capture service using multiple backup methods
"""
import json
import base64
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from automation import capture_screen_primary, capture_screen_backup1, capture_screen_backup2

def main():
    """Capture screen and return as base64-encoded image"""
    try:
        # Try primary method (pyautogui)
        image_data = None
        
        try:
            image_data = capture_screen_primary()
            method = "pyautogui"
        except Exception as e:
            print(f"Primary capture failed: {e}", file=sys.stderr)
            
            # Try backup method 1 (PIL/Pillow screenshot)
            try:
                image_data = capture_screen_backup1()
                method = "PIL"
            except Exception as e:
                print(f"Backup 1 capture failed: {e}", file=sys.stderr)
                
                # Try backup method 2 (xdotool on Linux, scrot, etc.)
                try:
                    image_data = capture_screen_backup2()
                    method = "subprocess"
                except Exception as e:
                    print(f"Backup 2 capture failed: {e}", file=sys.stderr)
                    raise Exception("All capture methods failed")
        
        if image_data:
            result = {
                "success": True,
                "imageData": image_data,
                "method": method,
            }
            print(json.dumps(result))
        else:
            raise Exception("No image data captured")
            
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
